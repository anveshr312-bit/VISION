"""
VISION: RUL Prognostics & Conformal Prediction Schemas
Vital Intelligence for System Integrity, Observation & Nostics
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class RULPredictionRequest(BaseModel):
    """Payload to trigger an RUL prognostic inference on an engine."""

    model_config = ConfigDict(extra="ignore")

    unit_id: int = Field(default=1, description="Engine unit identifier")
    subset: str = Field(default="FD001", description="C-MAPSS dataset subset")
    telemetry_history: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Optional custom sequence of sensor records for ad-hoc inference",
    )


class RULPredictionResponse(BaseModel):
    """Calibrated remaining useful life estimate with finite-sample conformal bounds."""

    model_config = ConfigDict(extra="ignore")

    unit_id: int = Field(..., description="Engine unit ID")
    subset: str = Field(default="FD001", description="C-MAPSS subset")
    current_cycle: int = Field(..., description="Current operational inspection cycle")
    rul_point_estimate: float = Field(..., description="Point estimate of remaining cycles, capped at 125")
    conformal_interval_80: List[float] = Field(..., description="[lower, upper] cycles at 80% confidence")
    conformal_interval_90: List[float] = Field(..., description="[lower, upper] cycles at 90% confidence")
    conformal_interval_95: List[float] = Field(..., description="[lower, upper] cycles at 95% confidence")
    lower_bound_90: float = Field(..., description="Certified 90% one-sided safety lower bound (cycles)")
    failure_probability_lead_time: float = Field(..., description="Estimated probability of failure within 15-cycle lead time")
    health_index: float = Field(..., ge=0.0, le=100.0, description="Normalized engine health percentage (0-100%)")
    urgency_level: str = Field(default="HEALTHY", description="HEALTHY, MONITOR, or CRITICAL")
    condition_bin: int = Field(default=0, description="Mondrian heteroscedasticity condition bin index (0-6)")
    condition_description: str = Field(default="", description="Human-readable physical regime description")
    meta: Optional[Dict[str, Any]] = Field(default=None, description="Demarcation metadata (data_mode, provenance)")

    @property
    def predicted_rul(self) -> float:
        """Alias for rul_point_estimate."""
        return self.rul_point_estimate

    @property
    def conformal_lower_90(self) -> float:
        """Alias for lower_bound_90."""
        return self.lower_bound_90

