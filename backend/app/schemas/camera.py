from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# =========================================================
# CREATE CAMERA REQUEST
# =========================================================

class CameraCreate(BaseModel):

    camera_id: str
    name: str
    location: str

    rtsp_url: Optional[str] = None

    ai_enabled: bool = True

    fps: int = 25


# =========================================================
# CAMERA RESPONSE
# =========================================================

class CameraResponse(BaseModel):

    id: int

    camera_id: str

    name: str

    location: str

    rtsp_url: Optional[str] = None

    status: str

    ai_enabled: bool

    fps: int

    last_seen: Optional[datetime] = None

    created_at: datetime


# =========================================================
# CAMERA STATUS UPDATE
# =========================================================

class CameraStatusUpdate(BaseModel):

    status: str


# =========================================================
# CAMERA STATUS RESPONSE
# =========================================================

class CameraStatusResponse(BaseModel):

    id: int

    camera_id: str

    name: str

    status: str

    last_seen: Optional[datetime] = None

