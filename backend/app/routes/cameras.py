from fastapi import APIRouter, HTTPException, Depends, status

from app.routes.users import get_current_user, require_roles

from app.schemas.camera import (
    CameraCreate,
    CameraResponse,
    CameraStatusUpdate,
    CameraStatusResponse
)

from app.services.camera_service import (
    create_camera,
    get_all_cameras,
    get_camera_by_id,
    update_camera_status,
    get_camera_status
)


router = APIRouter(
    prefix="/api/cameras",
    tags=["Camera Management"]
)


# =========================================================
# ADD CAMERA
# =========================================================

@router.post(
    "/",
    response_model=CameraResponse,
    status_code=status.HTTP_201_CREATED
)
def add_camera(
    camera: CameraCreate,
    current_user=Depends(require_roles("admin"))
):

    try:

        result = create_camera(
            camera_id=camera.camera_id,
            name=camera.name,
            location=camera.location,
            rtsp_url=camera.rtsp_url,
            ai_enabled=camera.ai_enabled,
            fps=camera.fps
        )

        return result

    except Exception as error:

        error_message = str(error)

        if "already exists" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Camera ID already exists"
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create camera: {error_message}"
        )


# =========================================================
# GET ALL CAMERAS
# =========================================================

@router.get(
    "/",
    response_model=list[CameraResponse]
)
def get_all_cameras_route(
    current_user=Depends(get_current_user)
):

    return get_all_cameras()


# =========================================================
# GET CAMERA BY ID
# =========================================================

@router.get(
    "/{camera_id}",
    response_model=CameraResponse
)
def get_camera(
    camera_id: int,
    current_user=Depends(get_current_user)
):

    camera = get_camera_by_id(
        camera_id
    )

    if camera is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found"
        )

    return camera


# =========================================================
# UPDATE CAMERA STATUS
# =========================================================

@router.patch(
    "/{camera_id}/status",
    response_model=CameraResponse
)
def change_camera_status(
    camera_id: int,
    camera_status: CameraStatusUpdate,
    current_user=Depends(require_roles("admin", "security_officer"))
):

    allowed_statuses = [
        "online",
        "offline"
    ]

    if camera_status.status not in allowed_statuses:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be either online or offline"
        )

    camera = update_camera_status(
        camera_id=camera_id,
        camera_status=camera_status.status
    )

    if camera is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found"
        )

    return camera


# =========================================================
# GET CAMERA STATUS
# =========================================================

@router.get(
    "/{camera_id}/status",
    response_model=CameraStatusResponse
)
def camera_status(
    camera_id: int,
    current_user=Depends(get_current_user)
):

    camera = get_camera_status(
        camera_id
    )

    if camera is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found"
        )

    return camera
