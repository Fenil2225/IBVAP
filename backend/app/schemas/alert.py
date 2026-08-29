from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# =========================================================
# ALERT RESPONSE
# =========================================================

class AlertResponse(BaseModel):
    id: int
    camera_id: int
    detection_id: Optional[int] = None

    alert_type: str
    severity: str
    description: Optional[str] = None

    status: str

    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
