import os
import re

import cv2
import pytesseract

from app.ai.vehicle_detector import VehicleDetector
from app.ai.plate_detector import PlateDetector


if os.getenv("TESSERACT_CMD"):
    pytesseract.pytesseract.tesseract_cmd = os.getenv(
        "TESSERACT_CMD"
    )


class ANPREngine:

    def __init__(self):

        self.vehicle_detector = VehicleDetector()
        self.plate_detector = PlateDetector()
        self.easy_reader = None

    def _read_with_easyocr(self, plate_image):
        if self.easy_reader is None:
            import easyocr
            self.easy_reader = easyocr.Reader(["en"], gpu=False, verbose=False)

        results = self.easy_reader.readtext(
            plate_image,
            detail=1,
            paragraph=False,
            allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        )
        candidates = []
        for _, text, confidence in results:
            plate = self.clean_plate(text)
            if len(plate) >= 4:
                candidates.append((plate, float(confidence)))
        if not candidates:
            return None
        plate, confidence = max(candidates, key=lambda item: item[1])
        return {"plate_number": plate, "ocr_confidence": confidence}

    def clean_plate(self, text):

        text = text.upper()

        text = re.sub(
            r"[^A-Z0-9]",
            "",
            text
        )

        return text

    def read_plate(self, plate_image, fallback=False):

        if plate_image is None:
            return None

        if plate_image.size == 0:
            return None

        gray = cv2.cvtColor(plate_image, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
        gray = cv2.bilateralFilter(gray, 5, 25, 25)
        variants = [cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]]

        best_plate = None
        best_score = 0.0

        def read_variant(variant):
            psm = 11 if fallback else 7
            data = pytesseract.image_to_data(
                variant,
                config=f"--psm {psm} -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                output_type=pytesseract.Output.DICT,
            )
            text = "".join(data["text"])
            plate = self.clean_plate(text)
            if len(plate) < 4:
                return None, 0.0
            scores = []
            for value in data["conf"]:
                try:
                    parsed_score = float(value)
                except (TypeError, ValueError):
                    continue
                if parsed_score >= 0:
                    scores.append(parsed_score)
            return plate, (sum(scores) / len(scores) / 100) if scores else 0.4

        try:
            for variant in variants:
                plate, score = read_variant(variant)
                if not plate:
                    continue

                if score > best_score:
                    best_plate = plate
                    best_score = score

            if best_score < 0.65:
                fallback = cv2.adaptiveThreshold(
                    gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                    cv2.THRESH_BINARY, 31, 5
                )
                plate, score = read_variant(fallback)
                if plate and score > best_score:
                    best_plate = plate
                    best_score = score
        except (pytesseract.TesseractNotFoundError, RuntimeError, ValueError):
            pass

        try:
            return self._read_with_easyocr(plate_image)
        except (ImportError, RuntimeError, OSError):
            return None

        return {"plate_number": best_plate, "ocr_confidence": best_score} if best_plate else None

    def process_frame(self, frame):
        plate_detections = (
            self.plate_detector.detect(frame)
        )

        if not plate_detections:
            vehicle_detections = self.vehicle_detector.detect(frame)
            plate_detections = []
            for vehicle in vehicle_detections:
                vx1, vy1, vx2, vy2 = vehicle["bbox"]
                vehicle_width = vx2 - vx1
                vehicle_height = vy2 - vy1
                if vehicle_width < 50 or vehicle_height < 30:
                    continue
                for x_start, x_end in ((0.2, 0.82), (0.32, 0.94), (0.42, 1.0)):
                    for y_start, y_end in ((0.62, 0.82), (0.72, 0.94)):
                        plate_detections.append({
                            "bbox": [
                                int(vx1 + vehicle_width * x_start),
                                int(vy1 + vehicle_height * y_start),
                                int(vx1 + vehicle_width * x_end),
                                int(vy1 + vehicle_height * y_end),
                            ],
                            "confidence": 0.25,
                            "fallback": True,
                        })
        else:
            vehicle_detections = self.vehicle_detector.detect(frame)

        if not plate_detections:
            return []

        results = []

        for plate_detection in plate_detections:

            x1, y1, x2, y2 = (
                plate_detection["bbox"]
            )

            height, width = frame.shape[:2]

            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(width, x2)
            y2 = min(height, y2)

            plate_crop = frame[
                y1:y2,
                x1:x2
            ]

            ocr_result = self.read_plate(
                plate_crop,
                fallback=plate_detection.get("fallback", False),
            )

            if not ocr_result:
                continue

            vehicle_type = "vehicle"

            # Find vehicle containing the plate
            for vehicle in vehicle_detections:

                vx1, vy1, vx2, vy2 = (
                    vehicle["bbox"]
                )

                plate_center_x = (x1 + x2) / 2
                plate_center_y = (y1 + y2) / 2

                if (
                    vx1 <= plate_center_x <= vx2
                    and
                    vy1 <= plate_center_y <= vy2
                ):
                    vehicle_type = vehicle[
                        "vehicle_type"
                    ]
                    break

            results.append({
                "plate_number": ocr_result["plate_number"],
                "vehicle_type": vehicle_type,
                "confidence": plate_detection[
                    "confidence"
                ],
                "ocr_confidence": ocr_result["ocr_confidence"],
                "plate_crop": plate_crop.copy(),
                "bbox": [
                    x1,
                    y1,
                    x2,
                    y2
                ]
            })

        return results