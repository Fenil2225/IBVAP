from fastapi import APIRouter, Depends, HTTPException, Query

from app.routes.users import get_current_user
from app.schemas.anpr import ANPRDetectionResponse
from app.services.anpr_service import (
    get_all_anpr_detections,
    get_anpr_detection_by_id,
    search_anpr_detections,
)


router = APIRouter(
    prefix="/api/anpr",
    tags=["ANPR"],
)


@router.get("/", response_model=list[ANPRDetectionResponse])
def get_anpr_detections(
    video_id: int | None = Query(default=None),
    current_user=Depends(get_current_user)
):
    return get_all_anpr_detections(video_id=video_id)


@router.get("/search/{plate_number}", response_model=list[ANPRDetectionResponse])
def search_plate(plate_number: str, current_user=Depends(get_current_user)):
    return search_anpr_detections(plate_number)


@router.get("/{detection_id}", response_model=ANPRDetectionResponse)
def get_anpr(detection_id: int, current_user=Depends(get_current_user)):
    result = get_anpr_detection_by_id(detection_id)
    if not result:
        raise HTTPException(status_code=404, detail="ANPR detection not found")
    return result
