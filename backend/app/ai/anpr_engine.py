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

    def clean_plate(self, text):

        text = text.upper()

        text = re.sub(
            r"[^A-Z0-9]",
            "",
            text
        )

        return text

    def read_plate(self, plate_image):

        if plate_image is None:
            return None

        if plate_image.size == 0:
            return None

        gray = cv2.cvtColor(
            plate_image,
            cv2.COLOR_BGR2GRAY
        )

        gray = cv2.resize(
            gray,
            None,
            fx=3,
            fy=3,
            interpolation=cv2.INTER_CUBIC
        )

        gray = cv2.bilateralFilter(
            gray,
            11,
            17,
            17
        )

        threshold = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31,
            5
        )

        try:
            text = pytesseract.image_to_string(
                threshold,
                config="--psm 7"
            )
        except (pytesseract.TesseractNotFoundError, RuntimeError):
            return None

        plate = self.clean_plate(text)

        if len(plate) < 4:
            return None

        return plate

    def process_frame(self, frame):

        vehicle_detections = (
            self.vehicle_detector.detect(frame)
        )

        plate_detections = (
            self.plate_detector.detect(frame)
        )

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

            plate_number = self.read_plate(
                plate_crop
            )

            if not plate_number:
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
                "plate_number": plate_number,
                "vehicle_type": vehicle_type,
                "confidence": plate_detection[
                    "confidence"
                ],
                "bbox": [
                    x1,
                    y1,
                    x2,
                    y2
                ]
            })

        return results