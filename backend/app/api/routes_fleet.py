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


@router.get("/etops")
async def get_fleet_etops(
    subset: str = Query("FD001", description="C-MAPSS operational subset"),
):
    """
    Aircraft Twin-Engine ETOPS Pairing Board:
    Pairs 100 fleet engines into 50 twin-engine aircraft wings (Left vs Right)
    and computes regulatory ETOPS wing RUL asymmetry metrics.
    """
    try:
        overview = inference_service.get_fleet_overview(subset=subset)
        engines_by_id = {e.unit_id: e for e in overview.engines}
        
        aircraft_list = []
        asymmetric_count = 0
        critical_count = 0
        
        # Pair engines (1,2), (3,4), ..., (99,100)
        for i in range(1, 101, 2):
            ac_idx = (i + 1) // 2
            ac_id = f"AC-{100 + ac_idx}"
            tail_number = f"N787-{ac_idx:02d}"
            
            left = engines_by_id.get(i)
            right = engines_by_id.get(i + 1)
            
            if not left or not right:
                continue
                
            rul_left = left.predicted_rul
            rul_right = right.predicted_rul
            delta = abs(rul_left - rul_right)
            
            # Determine regulatory ETOPS status
            is_critical = left.urgency_level == "CRITICAL" or right.urgency_level == "CRITICAL" or min(rul_left, rul_right) <= 15
            is_asymmetric = delta >= 40.0
            
            if is_critical:
                status = "CRITICAL_GROUND"
                critical_count += 1
            elif is_asymmetric:
                status = "ASYMMETRY_WARNING"
                asymmetric_count += 1
            else:
                status = "COMPLIANT"
                
            aircraft_list.append({
                "aircraft_id": ac_id,
                "tail_number": tail_number,
                "left_engine": {
                    "unit_id": left.unit_id,
                    "predicted_rul": round(rul_left, 1),
                    "lower_bound_90": round(left.lower_bound_90, 1),
                    "urgency": left.urgency_level,
                },
                "right_engine": {
                    "unit_id": right.unit_id,
                    "predicted_rul": round(rul_right, 1),
                    "lower_bound_90": round(right.lower_bound_90, 1),
                    "urgency": right.urgency_level,
                },
                "wing_rul_delta": round(delta, 1),
                "etops_status": status,
                "dispatch_directive": (
                    "CRITICAL: Ground aircraft for immediate engine overhaul"
                    if is_critical
                    else (
                        "ADVISORY: Stagger overhauls to prevent dual-engine removal"
                        if is_asymmetric
                        else "NOMINAL: Twin-engine RUL balance within ETOPS envelope"
                    )
                ),
            })
            
        return {
            "subset": subset.upper(),
            "total_aircraft": len(aircraft_list),
            "critical_aircraft_count": critical_count,
            "asymmetric_risk_count": asymmetric_count,
            "compliant_count": len(aircraft_list) - critical_count - asymmetric_count,
            "aircraft": aircraft_list,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate ETOPS pairings: {str(e)}")


