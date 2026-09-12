from ultralytics import YOLO


# Load YOLO model
model = YOLO("yolo11n.pt")


PERSON_CLASS = 0

VEHICLE_CLASSES = {
    2: "vehicle",      # car
    3: "vehicle",      # motorcycle
    5: "vehicle",      # bus
    7: "vehicle"       # truck
}


def detect_objects(frame):

    results = model.track(
        source=frame,
        persist=True,
        verbose=False,
        imgsz=640,
        conf=0.50,
    )

    detections = []

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            # =========================================
            # CLASS ID
            # =========================================

            class_id = int(
                box.cls[0]
            )

            # =========================================
            # CONFIDENCE
            # =========================================

            confidence = float(
                box.conf[0]
            )

            if confidence < 0.50:
                continue

            # =========================================
            # TRACKING ID
            # =========================================

            tracking_id = None

            if box.id is not None:

                tracking_id = str(
                    int(box.id[0])
                )

            # =========================================
            # BOUNDING BOX COORDINATES
            # =========================================

            x1, y1, x2, y2 = (
                box.xyxy[0].tolist()
            )

            # Calculate center point
            center_x = int(
                (x1 + x2) / 2
            )

            center_y = int(
                (y1 + y2) / 2
            )

            # =========================================
            # PERSON
            # =========================================

            if class_id == PERSON_CLASS:

                detections.append({

                    "detection_type": "person",

                    "confidence": confidence,

                    "tracking_id": tracking_id,

                    "center_x": center_x,

                    "center_y": center_y

                })

            # =========================================
            # VEHICLE
            # =========================================

            elif class_id in VEHICLE_CLASSES:

                detections.append({

                    "detection_type": "vehicle",

                    "confidence": confidence,

                    "tracking_id": tracking_id,

                    "center_x": center_x,

                    "center_y": center_y

                })

    return detections