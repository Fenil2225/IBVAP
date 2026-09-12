from fastapi import APIRouter, Depends, HTTPException, status

from app.routes.users import require_roles
from app.schemas.zone import ZoneCreate, ZoneResponse, ZoneUpdate
from app.services.zone_service import (
    create_zone,
    delete_zone,
    get_all_zones,
    get_zone_by_id,
    update_zone,
)

router = APIRouter(prefix="/api/zones", tags=["Restricted Areas"])


@router.get("/", response_model=list[ZoneResponse])
def list_zones(current_user=Depends(require_roles("admin"))):
    return get_all_zones()


@router.post("/", response_model=ZoneResponse, status_code=status.HTTP_201_CREATED)
def add_zone(zone: ZoneCreate, current_user=Depends(require_roles("admin"))):
    try:
        return create_zone(zone)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.put("/{zone_id}", response_model=ZoneResponse)
def change_zone(zone_id: int, zone: ZoneUpdate, current_user=Depends(require_roles("admin"))):
    try:
        result = update_zone(zone_id, zone)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    if result is None:
        raise HTTPException(status_code=404, detail="Restricted area not found")
    return result


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_zone(zone_id: int, current_user=Depends(require_roles("admin"))):
    if not delete_zone(zone_id):
        raise HTTPException(status_code=404, detail="Restricted area not found")
    return None
