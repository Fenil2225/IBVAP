import os

from ultralytics import YOLO


class PlateDetector:

    def __init__(self, model_path=None):

        if model_path is None:
            model_path = os.getenv(
                "PLATE_MODEL",
                "models/plate.pt"
            )

        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Plate model not found: {model_path}"
            )

        self.model = YOLO(model_path)

    def detect(self, frame):

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