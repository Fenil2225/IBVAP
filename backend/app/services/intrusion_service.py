def is_inside_zone(
    x,
    y,
    zone
):
    return (
        zone["x1"] <= x <= zone["x2"]
        and
        zone["y1"] <= y <= zone["y2"]
    )


def check_intrusion(
    detections,
    zones
):

    intrusion_detections = []

    for detection in detections:

        # Only persons for now
        if detection["detection_type"] != "person":
            continue

        center_x = detection.get("center_x")
        center_y = detection.get("center_y")

        if center_x is None or center_y is None:
            continue

        for zone in zones:

            if is_inside_zone(
                center_x,
                center_y,
                zone
            ):

                intrusion_detections.append({
                    "detection_type": "intrusion",
                    "confidence": detection["confidence"],
                    "tracking_id": detection.get(
                        "tracking_id"
                    ),
                    "zone_id": zone["id"],
                    "zone_name": zone["zone_name"]
                })

    return intrusion_detections