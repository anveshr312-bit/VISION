"""
VISION: Multi-Dataset Aviation Ingestion & Mission Profile Routes
Vital Intelligence for System Integrity, Observation & Nostics

Endpoints:
----------
- GET  /api/data-sources/catalog         -> Lists all 4 certified aviation data streams
- GET  /api/data-sources/mission-profile -> 1 Hz N-CMAPSS transient flight profile
- POST /api/data-sources/ingest          -> Universal ingestion endpoint (ARINC 429/ACARS)
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field

from backend.app.services.telemetry_adapter import (
    DataSourceType,
    DataSourceMetadata,
    MissionPoint,
    UniversalEngineFrame,
    aviation_data_adapter,
)

router = APIRouter(prefix="/data-sources", tags=["Multi-Dataset Aviation Telemetry"])


class CatalogResponse(BaseModel):
    total_sources: int
    active_default: DataSourceType = DataSourceType.NASA_CMAPSS_BENCHMARK
    sources: List[DataSourceMetadata]
    architecture_standard: str = "ARINC 429 / ICAO Annex 6 / FAA AC 20-193 Decoupled Telemetry Ingestion"


class IngestRequest(BaseModel):
    source_type: DataSourceType = Field(
        default=DataSourceType.ARINC_429_ACARS_EHM,
        description="Aviation data protocol type",
    )
    unit_id: int = Field(default=34, description="Engine unit serial identifier")
    payload: Dict[str, Any] = Field(..., description="Raw telemetry frame / ACARS message")


class IngestResponse(BaseModel):
    status: str = "INGESTED_AND_NORMALIZED"
    source: DataSourceType
    normalized_frame: UniversalEngineFrame
    phm_engine_status: str = "PROGNOSTICS_SYNCHRONIZED"


@router.get("/catalog", response_model=CatalogResponse)
async def get_data_sources_catalog():
    """
    Catalog of all 4 certified aviation data streams supported by VISION:
    1. NASA C-MAPSS Run-to-Failure Fleet Benchmark (FD001–FD004)
    2. NASA N-CMAPSS High-Fidelity 1 Hz Transient Flight Mission (LHR→JFK)
    3. Commercial Airline ARINC 429 / ACARS Engine Health Monitoring (EHM)
    4. FAA 14 CFR § 33.70 / Form 8130-3 Physical Airworthiness Dossier
    """
    sources = aviation_data_adapter.get_catalog()
    return CatalogResponse(
        total_sources=len(sources),
        active_default=DataSourceType.NASA_CMAPSS_BENCHMARK,
        sources=sources,
    )


@router.get("/mission-profile", response_model=List[MissionPoint])
async def get_ncmapss_mission_profile(
    duration_seconds: int = Query(
        240,
        ge=60,
        le=600,
        description="Duration in seconds of 1 Hz transient flight profile",
    ),
):
    """
    High-Fidelity 1 Hz Transient Commercial Flight Mission (N-CMAPSS Specification):
    Simulates Boeing 787-9 Trent 1000 operational phases:
      - Taxi-out & Pushback
      - Full Takeoff Roll (98.4% N1, peak thermal strain)
      - Dynamic Climb to FL240
      - High-Altitude Transatlantic Cruise (FL370)
      - Top of Descent & Reverse Thrust Deceleration
    """
    return aviation_data_adapter.generate_ncmapss_mission(duration_seconds=duration_seconds)


@router.post("/ingest", response_model=IngestResponse)
async def ingest_aviation_telemetry(request: IngestRequest = Body(...)):
    """
    Universal Aviation Telemetry Ingestion Gate:
    Normalizes arbitrary external aerospace frames (ARINC 429 words, ACARS packets,
    or N-CMAPSS frames), executes immediate Extended Kalman Filter (EKF) thermodynamic
    state estimation, and fuses into the Trent 1000 Digital Twin state.
    """
    try:
        payload = request.payload
        payload["unit_id"] = request.unit_id
        normalized = aviation_data_adapter.normalize_external_frame(
            raw_payload=payload,
            source_type=request.source_type,
        )
        return IngestResponse(
            status="INGESTED_AND_NORMALIZED",
            source=request.source_type,
            normalized_frame=normalized,
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to normalize {request.source_type} frame: {str(e)}",
        )
