import os
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status

from app.routes.users import get_current_user
from app.schemas.video import VideoResponse
from app.services.video_service import create_video_record, get_video_by_id, process_video

router = APIRouter(
    prefix="/api/videos",
    tags=["Video Surveillance"],
)

UPLOAD_DIR = "uploads/videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv"}


@router.get("/", response_model=list[dict])
def list_videos(current_user=Depends(get_current_user)):
    from app.database.connection import get_db_connection

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT
            id,
            camera_id,
            file_name,
            file_path,
            file_size,
            status,
            uploaded_at
        FROM videos
        ORDER BY uploaded_at DESC
        """
    )
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    return results


@router.get("/{video_id}", response_model=dict)
def get_video(video_id: int, current_user=Depends(get_current_user)):
    video = get_video_by_id(video_id)
    if video is None:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@router.post("/upload", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    camera_id: int,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    extension = os.path.splitext(file.filename or "")[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported video format",
        )

    unique_filename = f"{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as video_file:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                video_file.write(chunk)
    except Exception as error:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video upload failed: {str(error)}",
        )

    file_size = os.path.getsize(file_path)

    try:
        video = create_video_record(
            camera_id=camera_id,
            file_name=file.filename,
            file_path=file_path,
            file_size=file_size,
        )
        return video
    except Exception as error:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(error)}",
        )


@router.post("/{video_id}/process")
def process_uploaded_video(
    video_id: int,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    video = get_video_by_id(video_id)
    if video is None:
        raise HTTPException(status_code=404, detail="Video not found")

    background_tasks.add_task(process_video, video_id)
    return {
        "success": True,
        "message": "Video processing started",
        "video_id": video_id,
    }
