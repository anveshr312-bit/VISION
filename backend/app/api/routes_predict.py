"""
VISION: RUL Prognostics & Conformal Prediction Route Controllers
Vital Intelligence for System Integrity, Observation & Nostics
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.schemas.prediction import RULPredictionRequest, RULPredictionResponse
from backend.app.services.inference_service import inference_service

router = APIRouter(prefix="/predict", tags=["Prediction"])


@router.post("/rul", response_model=RULPredictionResponse)
async def predict_rul(
    payload: RULPredictionRequest,
) -> RULPredictionResponse:
    """
    Compute Remaining Useful Life (RUL) point estimate, 80%/90%/95% Mondrian conformal
    uncertainty bounds, and risk probability within the 15-cycle logistics lead time.
    """
    prediction = inference_service.predict_rul(
        unit_id=payload.unit_id,
        subset=payload.subset,
        telemetry_history=payload.telemetry_history,
    )
    if prediction is None:
        raise HTTPException(
            status_code=404,
            detail=f"Engine unit {payload.unit_id} not found in subset {payload.subset.upper()}.",
        )
    return prediction

