from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VideoResponse(BaseModel):
    id: int
    camera_id: Optional[int]
    file_name: str
    file_path: str
    file_size: Optional[int]
    status: str
    uploaded_at: datetime