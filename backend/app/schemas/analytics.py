from pydantic import BaseModel
from typing import Optional


# =========================================================
# DETECTION ANALYTICS
# =========================================================

class DetectionAnalytics(BaseModel):
    total_detections: int
    person_detections: int
    vehicle_detections: int
    face_detections: int
    number_plate_detections: int
    intrusion_detections: int
    loitering_detections: int
    night_movement_detections: int
    suspicious_activity_detections: int


# =========================================================
# CAMERA ANALYTICS
# =========================================================

class CameraAnalytics(BaseModel):
    camera_id: int
    camera_name: str
    total_detections: int
    person_detections: int
    vehicle_detections: int
    intrusion_detections: int


# =========================================================
# ALERT ANALYTICS
# =========================================================

class AlertAnalytics(BaseModel):
    total_alerts: int
    unacknowledged_alerts: int
    acknowledged_alerts: int
    resolved_alerts: int
    low_alerts: int
    medium_alerts: int
    high_alerts: int
    critical_alerts: int


# =========================================================
# TIMELINE ANALYTICS
# =========================================================

class TimelineAnalytics(BaseModel):
    date: str
    detections: int
    alerts: int