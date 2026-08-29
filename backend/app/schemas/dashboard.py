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

    total_alerts: int
    unacknowledged_alerts: int
    high_alerts: int
    critical_alerts: int