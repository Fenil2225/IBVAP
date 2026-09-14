from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_cameras: int
    online_cameras: int
    offline_cameras: int

    total_videos: int
    processed_videos: int
    processing_videos: int
    failed_videos: int

    total_detections: int
    person_detections: int
    vehicle_detections: int
    intrusion_detections: int
    other_detections: int = 0

    total_alerts: int
    unacknowledged_alerts: int
    acknowledged_alerts: int = 0
    resolved_alerts: int = 0
    critical_alerts: int = 0
    high_alerts: int = 0
    medium_alerts: int = 0
    low_alerts: int = 0