"""
VISION: Decision Optimization & Maintenance Schemas
Vital Intelligence for System Integrity, Observation & Nostics
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class MaintenanceOptimizationRequest(BaseModel):
    """Parameters to customize economic cost trade-offs and safety targets."""

    model_config = ConfigDict(extra="ignore")

    subset: str = Field(default="FD001", description="Target fleet subset")
    cost_failure: float = Field(default=100_000.0, description="Cost of an in-service failure ($)")
    cost_waste_per_cycle: float = Field(default=100.0, description="Cost of 1 wasted cycle of engine life ($/cycle)")
    lead_time: int = Field(default=15, description="Logistics hangar lead time (cycles)")
    risk_budget_eps: float = Field(default=0.05, description="Maximum tolerable failure rate ceiling")


class MaintenanceRecommendation(BaseModel):
    """Specific maintenance directive for an individual engine."""

    model_config = ConfigDict(extra="ignore")

    unit_id: int = Field(..., description="Engine serial number")
    urgency_level: str = Field(..., description="HEALTHY, MONITOR, or CRITICAL")
    recommended_cycle_action: str = Field(..., description="Actionable recommendation message")
    target_service_cycle: Optional[int] = Field(default=None, description="Recommended cycle for scheduled maintenance")
    expected_wasted_life: float = Field(..., description="Estimated prematurely discarded life (cycles)")
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Normalized risk index [0, 1]")
    cost_analysis: Dict[str, float] = Field(..., description="Breakdown of failure and waste cost risk")


class FleetEngineSummary(BaseModel):
    """High-level condition and prognostic summary for fleet overview dashboard."""

    model_config = ConfigDict(extra="ignore")

    unit_id: int
    current_cycle: int
    predicted_rul: float
    lower_bound_90: float
    upper_bound_90: float
    health_index: float
    risk_score: float
    urgency_level: str
    assigned_bay: Optional[str] = None


class FleetOverviewResponse(BaseModel):
    """Aggregated status of entire aircraft engine fleet."""

    model_config = ConfigDict(extra="ignore")

    subset: str
    total_engines: int
    critical_count: int
    monitor_count: int
    healthy_count: int
    engines: List[FleetEngineSummary]
    allocated_bays: List[Dict[str, Any]] = Field(default_factory=list)
    meta: Optional[Dict[str, Any]] = Field(default=None, description="Demarcation metadata (data_mode, provenance)")


class MaintenanceOptimizationResponse(BaseModel):
    """Full fleet decision optimization schedule and back-tested policy parameters."""

    model_config = ConfigDict(extra="ignore")

    subset: str
    lead_time_cycles: int
    cost_parameters: Dict[str, float]
    optimal_policy: Dict[str, Any]
    summary: Dict[str, int]
    allocated_bays: List[Dict[str, Any]]
    recommendations: List[MaintenanceRecommendation]
    meta: Optional[Dict[str, Any]] = Field(default=None, description="Demarcation metadata (data_mode, provenance)")

