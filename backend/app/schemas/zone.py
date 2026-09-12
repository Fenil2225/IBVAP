from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime


class ZoneGeometry(BaseModel):
    x1: int = Field(ge=0)
    y1: int = Field(ge=0)
    x2: int = Field(ge=0)
    y2: int = Field(ge=0)

    @model_validator(mode="after")
    def validate_rectangle(self):
        if self.x2 <= self.x1 or self.y2 <= self.y1:
            raise ValueError("x2 must be greater than x1 and y2 must be greater than y1")
        return self


class ZoneCreate(ZoneGeometry):
    camera_id: int = Field(gt=0)
    zone_name: str = Field(min_length=1, max_length=100)
    is_active: bool = True


class ZoneUpdate(ZoneGeometry):
    camera_id: int = Field(gt=0)
    zone_name: str = Field(min_length=1, max_length=100)
    is_active: bool = True


class ZoneResponse(ZoneCreate):
    id: int
    camera_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
