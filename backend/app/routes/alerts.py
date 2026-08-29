from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.schemas.alert import AlertResponse
from app.services.alert_service import (
    create_alert,
    get_all_alerts,
    get_alert_by_id,
    acknowledge_alert,
    resolve_alert
)
from app.routes.users import get_current_user


# =========================================================
# ALERT ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/alerts",
    tags=["Alert Management"]
)


# =========================================================
# CREATE ALERT REQUEST
# =========================================================

class AlertCreate(BaseModel):
    camera_id: int
    detection_id: Optional[int] = None
    alert_type: str
    severity: str = "medium"
    description: Optional[str] = None


# =========================================================
# POST /api/alerts
# CREATE ALERT
# =========================================================

@router.post(
    "/",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED
)
def add_alert(
    alert: AlertCreate,
    current_user=Depends(get_current_user)
):

    allowed_severities = [
        "low",
        "medium",
        "high",
        "critical"
    ]

    if alert.severity not in allowed_severities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid severity"
        )

    try:
        result = create_alert(
            camera_id=alert.camera_id,
            detection_id=alert.detection_id,
            alert_type=alert.alert_type,
            severity=alert.severity,
            description=alert.description
        )

        return result

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


# =========================================================
# GET /api/alerts
# GET ALL ALERTS
# =========================================================

@router.get(
    "/",
    response_model=list[AlertResponse]
)
def get_alerts(
    current_user=Depends(get_current_user)
):

    return get_all_alerts()


# =========================================================
# GET /api/alerts/{id}
# GET ALERT BY ID
# =========================================================

@router.get(
    "/{alert_id}",
    response_model=AlertResponse
)
def get_alert(
    alert_id: int,
    current_user=Depends(get_current_user)
):

    alert = get_alert_by_id(alert_id)

    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )

    return alert


# =========================================================
# PATCH /api/alerts/{id}/acknowledge
# ACKNOWLEDGE ALERT
# =========================================================

@router.patch(
    "/{alert_id}/acknowledge",
    response_model=AlertResponse
)
def acknowledge(
    alert_id: int,
    current_user=Depends(get_current_user)
):

    alert = acknowledge_alert(alert_id)

    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found or already acknowledged/resolved"
        )

    return alert


# =========================================================
# PATCH /api/alerts/{id}/resolve
# RESOLVE ALERT
# =========================================================

@router.patch(
    "/{alert_id}/resolve",
    response_model=AlertResponse
)
def resolve(
    alert_id: int,
    current_user=Depends(get_current_user)
):

    alert = resolve_alert(alert_id)

    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found or already resolved"
        )

    return alert
