"""
VISION: Real-Time Telemetry Streaming Endpoint (SSE)
Vital Intelligence for System Integrity, Observation & Nostics
"""

from typing import Optional
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from backend.app.services.stream_service import TelemetryReplayProducer

router = APIRouter(prefix="/stream", tags=["Telemetry Streaming"])


@router.get("/telemetry")
async def stream_telemetry(
    units: Optional[str] = Query(
        "1,10,24,34,45",
        description="Comma-separated engine unit IDs to stream"
    ),
    subset: str = Query("FD001", description="C-MAPSS dataset subset (FD001 - FD004)"),
    speed: float = Query(1.0, ge=0.1, le=10.0, description="Playback speed multiplier"),
    loop: bool = Query(True, description="Whether to loop the stream upon reaching end of history"),
):
    """
    Server-Sent Events (SSE) stream emitting real-time engine telemetry cycles.
    """
    try:
        cohort = [int(u.strip()) for u in units.split(",") if u.strip().isdigit()]
    except Exception:
        cohort = [1, 10, 24, 34, 45]

    producer = TelemetryReplayProducer(
        cohort_units=cohort,
        subset=subset,
        speed=speed,
        loop=loop,
    )

    return StreamingResponse(
        producer.stream_cycles(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )

