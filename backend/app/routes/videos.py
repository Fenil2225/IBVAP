import os
import uuid

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException,
    status
)

from app.routes.users import get_current_user

from app.schemas.video import VideoResponse

from app.services.video_service import (
    create_video_record,
    get_video_by_id,
    process_video
)


router = APIRouter(
    prefix="/api/videos",
    tags=["Video Surveillance"]
)


UPLOAD_DIR = "uploads/videos"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


ALLOWED_EXTENSIONS = {
    ".mp4",
    ".avi",
    ".mov",
    ".mkv"
}


# =========================================================
# VIDEO UPLOAD
# =========================================================

@router.post(
    "/upload",
    response_model=VideoResponse,
    status_code=status.HTTP_201_CREATED
)
async def upload_video(
    camera_id: int,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):

    # Check file extension
    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported video format"
        )

    # Generate unique filename
    unique_filename = (
        f"{uuid.uuid4().hex}{extension}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        unique_filename
    )

    # Save video
    try:

        with open(
            file_path,
            "wb"
        ) as video_file:

            while True:

                chunk = await file.read(
                    1024 * 1024
                )

                if not chunk:
                    break

                video_file.write(chunk)

    except Exception as error:

        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video upload failed: {str(error)}"
        )

    # Get file size
    file_size = os.path.getsize(
        file_path
    )

    # Save database record
    try:

        video = create_video_record(
            camera_id=camera_id,
            file_name=file.filename,
            file_path=file_path,
            file_size=file_size
        )

        return video

    except Exception as error:

        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(error)}"
        )


# =========================================================
# VIDEO FRAME PROCESSING
# =========================================================

@router.post(
    "/{video_id}/process"
)
def process_uploaded_video(
    video_id: int,
    current_user=Depends(get_current_user)
):

    result = process_video(
        video_id
    )

    if result is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found or could not be processed"
        )

    return {
        "success": True,
        "message": "Video processed successfully",
        **result
    }
    
@router.post("/{video_id}/process")
def process_uploaded_video(
    video_id: int,
    current_user=Depends(get_current_user)
):
    result = process_video(video_id)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found or processing failed"
        )

    return {
        "success": True,
        "message": "Video processed successfully",
        "data": result
    }