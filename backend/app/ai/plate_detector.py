import os

import cv2
from ultralytics import YOLO


class PlateDetector:

    def __init__(self, model_path=None):

        if model_path is None:
            model_path = os.getenv(
                "PLATE_MODEL",
                "models/plate.pt"
            )

        self.model = YOLO(model_path) if os.path.exists(model_path) else None

    def detect(self, frame):

        if self.model is None:
            return self._detect_plate_regions(frame)

        results = self.model(
            frame,
            verbose=False
        )

        detections = []

        for result in results:

            if result.boxes is None:
                continue

            for box in result.boxes:

                x1, y1, x2, y2 = (
                    box.xyxy[0].cpu().tolist()
                )

                confidence = float(
                    box.conf[0].cpu().item()
                )

                detections.append({
                    "bbox": [
                        int(x1),
                        int(y1),
                        int(x2),
                        int(y2)
                    ],
                    "confidence": confidence
                })

        return detections

    def _detect_plate_regions(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 100, 200)
        contours, _ = cv2.findContours(
            edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        detections = []
        frame_area = frame.shape[0] * frame.shape[1]
        for contour in contours:
            x, y, width, height = cv2.boundingRect(contour)
            area = width * height
            aspect_ratio = width / max(height, 1)
            if (
                2.0 <= aspect_ratio <= 6.5
                and frame_area * 0.0002 <= area <= frame_area * 0.2
                and width >= 40
                and height >= 10
            ):
                detections.append({
                    "bbox": [x, y, x + width, y + height],
                    "confidence": 0.35,
                })

        return detections