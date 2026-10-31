"""
VISION: Engine Telemetry & Digital Twin Replay Route Controllers
Vital Intelligence for System Integrity, Observation & Nostics
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Path as FPath, Query

from backend.app.schemas.telemetry import EngineTelemetryResponse
from backend.app.services.inference_service import inference_service

router = APIRouter(prefix="/engine", tags=["Engine"])


@router.get("/{unit_id}", response_model=EngineTelemetryResponse)
async def get_engine_telemetry(
    unit_id: int = FPath(..., description="Engine serial ID (e.g. 1..100)"),
    subset: str = Query("FD001", description="C-MAPSS subset identifier"),
) -> EngineTelemetryResponse:
    """
    Retrieve full multi-cycle sensor history, latest physical measurements,
    and active degradation alerts for an individual engine.
    """
    telemetry = inference_service.get_engine_telemetry(unit_id=unit_id, subset=subset)
    if telemetry is None:
        raise HTTPException(
            status_code=404,
            detail=f"Engine unit {unit_id} not found in subset {subset.upper()}.",
        )
    return telemetry


@router.get("/{unit_id}/replay")
async def get_engine_replay_trajectory(
    unit_id: int = FPath(..., description="Engine unit ID"),
    subset: str = Query("FD001", description="C-MAPSS subset"),
):
    """
    Retrieve structured sequence trajectory for 3D digital twin animation replay.
    """
    telemetry = inference_service.get_engine_telemetry(unit_id=unit_id, subset=subset)
    if telemetry is None:
        raise HTTPException(
            status_code=404,
            detail=f"Engine unit {unit_id} not found in subset {subset.upper()}.",
        )

    frames = []
    for r in telemetry.sensor_history:
        frames.append({
            "cycle": r.cycle,
            "fan_speed": r.sensors.get("s8", 0.0),
            "core_speed": r.sensors.get("s9", 0.0),
            "hpc_temp_T30": r.sensors.get("s3", 0.0),
            "lpt_temp_T50": r.sensors.get("s4", 0.0),
            "hpc_pressure_P30": r.sensors.get("s7", 0.0),
            "fuel_flow_ratio": r.sensors.get("s12", 0.0),
            "bypass_ratio": r.sensors.get("s15", 0.0),
            "coolant_bleed_W31": r.sensors.get("s20", 0.0),
        })

    return {
        "unit_id": unit_id,
        "subset": subset.upper(),
        "total_cycles": telemetry.total_cycles,
        "current_cycle": telemetry.current_cycle,
        "frames": frames,
    }

