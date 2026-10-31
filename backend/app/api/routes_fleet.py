"""
VISION: Fleet Status & Overview Route Controllers
Vital Intelligence for System Integrity, Observation & Nostics
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas.maintenance import FleetOverviewResponse
from backend.app.services.inference_service import inference_service

router = APIRouter(prefix="/fleet", tags=["Fleet"])


@router.get("/overview", response_model=FleetOverviewResponse)
async def get_fleet_overview(
    subset: str = Query("FD001", description="C-MAPSS operational subset (FD001..FD004)"),
) -> FleetOverviewResponse:
    """
    Retrieve fleet-wide prognostics overview, risk-ranked engine listings,
    and assigned hangar maintenance bays.
    """
    try:
        overview = inference_service.get_fleet_overview(subset=subset)
        return overview
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate fleet overview for subset {subset}: {str(e)}",
        )

