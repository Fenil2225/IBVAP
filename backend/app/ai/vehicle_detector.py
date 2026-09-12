import os

from ultralytics import YOLO


class VehicleDetector:

    def __init__(self, model_path=None):

        if model_path is None:
            model_path = os.getenv(
                "VEHICLE_MODEL",
                "models/vehicle.pt"
            )

        if not os.path.exists(model_path):
            bundled_model = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "..", "yolo11n.pt")
            )
            if not os.path.exists(bundled_model):
                raise FileNotFoundError(f"Vehicle model not found: {model_path}")
            model_path = bundled_model

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

                class_id = int(
                    box.cls[0].cpu().item()
                )

                class_name = result.names.get(
                    class_id,
                    "vehicle"
                )

                detections.append({
                    "bbox": [
                        int(x1),
                        int(y1),
                        int(x2),
                        int(y2)
                    ],
                    "confidence": confidence,
                    "vehicle_type": class_name
                })

        return detections