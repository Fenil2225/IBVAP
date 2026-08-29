from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from fastapi.responses import StreamingResponse

from app.routes.users import get_current_user

from app.services.camera_stream_service import (
    generate_camera_frames
)


router = APIRouter(
    prefix="/api/live",
    tags=["Live Camera Feed"]
)


# =========================================================
# LIVE CAMERA STREAM
# =========================================================

@router.get(
    "/cameras/{camera_id}/stream"
)
def live_camera_stream(
    camera_id: int,
    current_user=Depends(get_current_user)
):

    try:

        return StreamingResponse(
            generate_camera_frames(
                camera_id
            ),
            media_type=(
                "multipart/x-mixed-replace; "
                "boundary=frame"
            )
        )

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Camera stream failed: {str(error)}"
        )
