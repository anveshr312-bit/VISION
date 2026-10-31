"""
VISION: Telemetry & Sensor Schemas
Vital Intelligence for System Integrity, Observation & Nostics
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SensorReading(BaseModel):
    """Single-cycle telemetry snapshot."""

    model_config = ConfigDict(extra="ignore")

    cycle: int = Field(..., description="Operating flight cycle number")
    sensors: Dict[str, float] = Field(..., description="Sensor measurements mapped by channel or physical name")
    operational_settings: Dict[str, float] = Field(default_factory=dict, description="Flight condition variables op1, op2, op3")
    regime: int = Field(default=0, description="Identified operational regime cluster")


class EngineTelemetryResponse(BaseModel):
    """Complete time-series telemetry packet and condition indicators for a turbofan unit."""

    model_config = ConfigDict(extra="ignore")

    unit_id: int = Field(..., description="Engine serial identification number")
    subset: str = Field(default="FD001", description="C-MAPSS operational subset")
    current_cycle: int = Field(..., description="Latest recorded cycle")
    total_cycles: int = Field(..., description="Total cycles in trajectory")
    operational_settings: Dict[str, float] = Field(default_factory=dict)
    latest_sensors: Dict[str, float] = Field(default_factory=dict)
    sensor_history: List[SensorReading] = Field(default_factory=list)
    alerts: List[str] = Field(default_factory=list, description="Active condition alerts or warnings")
    meta: Optional[Dict[str, Any]] = Field(default=None, description="Demarcation metadata (data_mode, provenance)")

