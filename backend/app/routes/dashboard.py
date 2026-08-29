from fastapi import APIRouter, Depends

from app.schemas.dashboard import DashboardSummary
from app.services.dashboard_service import (
    get_dashboard_summary
)
from app.routes.users import get_current_user


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


# =========================================================
# GET DASHBOARD SUMMARY
# =========================================================

@router.get(
    "/summary",
    response_model=DashboardSummary
)
def dashboard_summary(
    current_user=Depends(get_current_user)
):
    return get_dashboard_summary()