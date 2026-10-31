"""
VISION: Decision Optimization & Fleet Maintenance Scheduling Route Controllers
Vital Intelligence for System Integrity, Observation & Nostics
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas.maintenance import (
    MaintenanceOptimizationRequest,
    MaintenanceOptimizationResponse,
)
from backend.app.services.inference_service import inference_service

router = APIRouter(prefix="/decision", tags=["Decision"])


@router.post("/optimize", response_model=MaintenanceOptimizationResponse)
async def optimize_fleet_maintenance(
    payload: MaintenanceOptimizationRequest,
) -> MaintenanceOptimizationResponse:
    """
    Execute economic maintenance optimization given custom failure and wasted cycle costs.
    Applies the closed-form optimal stopping rule and Clopper-Pearson risk controls.
    """
    try:
        response = inference_service.optimize_decision(
            subset=payload.subset,
            cost_failure=payload.cost_failure,
            cost_waste_per_cycle=payload.cost_waste_per_cycle,
            lead_time=payload.lead_time,
            risk_budget_eps=payload.risk_budget_eps,
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to optimize fleet maintenance decisions: {str(e)}",
        )


@router.get("/policy")
async def get_decision_policy(
    subset: str = Query("FD001", description="C-MAPSS subset identifier"),
):
    """
    Retrieve precomputed Pareto frontiers, Clopper-Pearson risk curves,
    and policy comparison benchmarks.
    """
    policy = inference_service.decision_service.load_policy(subset=subset)
    if not policy:
        raise HTTPException(
            status_code=404,
            detail=f"Decision policy artifact for subset {subset.upper()} not found.",
        )
    return policy

