from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ANPRDetectionResponse(BaseModel):
    id: int
    camera_id: Optional[int] = None
    video_id: Optional[int] = None
    plate_number: str
    vehicle_type: Optional[str] = None
    confidence: Optional[float] = None
    detected_at: datetime
    image_path: Optional[str] = None