"""
VISION: Decision Service & Optimal Stopping Hazard Engine
Vital Intelligence for System Integrity, Observation & Nostics

Economic Trade-off & Mathematical Formulation:
----------------------------------------------
Preventive replacement balances two competing economic costs:
1. C_f: Catastrophic in-service engine failure ($100,000 / normalized 1000).
2. c_w: Cost of one prematurely discarded cycle of remaining life ($100 / normalized 1).
Cost Ratio: gamma = c_w / C_f = 10^{-3}.

Optimal Stopping Rule:
----------------------
Let f(s) be the predictive failure density at cycle horizon s, and S(s) = 1 - F(s)
be the survival function. The predictive hazard rate is:
    h(s) = f(s) / S(s)

The optimal decision policy triggers maintenance intervention at the earliest cycle s* where:
    h(s*) >= c_w / C_f

At this inflection point, the expected marginal hazard loss of operating one more cycle
strictly exceeds the marginal cost of discarding the cycle.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from scipy.stats import norm

from ml.config import DATA_ARTIFACTS_DIR

# Default Economic Cost Parameters
DEFAULT_COST_FAILURE: float = 100_000.0       # C_f ($)
DEFAULT_COST_WASTE_PER_CYCLE: float = 100.0   # c_w ($/cycle)
DEFAULT_LEAD_TIME_CYCLES: int = 15            # Logistics hangar mobilization lead time


def compute_predictive_hazard(
    predicted_rul: float,
    uncertainty_sigma: float,
    cycle_offset: float = 0.0,
) -> float:
    """
    Compute instantaneous predictive hazard rate h(s) under normal predictive uncertainty.

    h(s) = f(s) / (1 - F(s))
    where s is the elapsed cycle offset from current state.
    """
    mu = max(0.1, float(predicted_rul))
    sigma = max(1.0, float(uncertainty_sigma))
    s = float(cycle_offset)

    # Standardized score
    z = (s - mu) / sigma
    pdf_val = norm.pdf(z) / sigma
    survival_val = max(1e-9, 1.0 - norm.cdf(z))

    return float(pdf_val / survival_val)


class DecisionService:
    """
    Fleet Decision Service & Maintenance Policy Engine.
    Combines economic cost modeling, optimal hazard stopping, and hangar slot scheduling.
    """

    def __init__(
        self,
        cost_failure: float = DEFAULT_COST_FAILURE,
        cost_waste_per_cycle: float = DEFAULT_COST_WASTE_PER_CYCLE,
        lead_time_cycles: int = DEFAULT_LEAD_TIME_CYCLES,
        artifacts_dir: Union[str, Path] = DATA_ARTIFACTS_DIR,
    ) -> None:
        self.cost_failure = float(cost_failure)
        self.cost_waste_per_cycle = float(cost_waste_per_cycle)
        self.cost_ratio = self.cost_waste_per_cycle / self.cost_failure  # gamma = c_w / C_f
        self.lead_time_cycles = int(lead_time_cycles)
        self.artifacts_dir = Path(artifacts_dir)
        self.cached_policies: Dict[str, Any] = {}

    def load_policy(self, subset: str = "FD001") -> Dict[str, Any]:
        """Load calibrated decision policy artifact for specified C-MAPSS subset."""
        subset_upper = subset.upper()
        if subset_upper in self.cached_policies:
            return self.cached_policies[subset_upper]

        policy_file = self.artifacts_dir / f"decision_policy_{subset_upper}.json"
        if policy_file.exists():
            with open(policy_file, "r", encoding="utf-8") as f:
                policy_data = json.load(f)
                self.cached_policies[subset_upper] = policy_data
                return policy_data
        return {}

    def evaluate_engine_decision(
        self,
        predicted_rul: float,
        lower_bound: float,
        upper_bound: Optional[float] = None,
        current_cycle: int = 100,
        policy_threshold: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Evaluate optimal stopping and condition-based intervention for a single engine.

        Returns
        -------
        dict
            Decision recommendations, hazard rates, economic costs, and dispatch urgency.
        """
        rul_val = float(predicted_rul)
        lb_val = float(lower_bound)
        ub_val = float(upper_bound) if upper_bound is not None else rul_val + 15.0

        # Estimate effective predictive uncertainty sigma
        sigma = max(1.0, (ub_val - lb_val) / (2.0 * 1.645))

        # 1. Compute predictive hazard rate at the end of the logistics lead time (s = lead_time)
        hazard_at_lead = compute_predictive_hazard(
            predicted_rul=rul_val,
            uncertainty_sigma=sigma,
            cycle_offset=float(self.lead_time_cycles),
        )

        hazard_trigger = bool(hazard_at_lead >= self.cost_ratio)

        # 2. Conformal lower-bound threshold check
        threshold_val = float(policy_threshold) if policy_threshold is not None else float(self.lead_time_cycles + 5)
        conformal_trigger = bool(lb_val <= threshold_val)

        # 3. Combined intervention trigger
        trigger_active = bool(hazard_trigger or conformal_trigger)

        # 4. Engine Health Priority Categorization
        priority = self.categorize_priority(
            predicted_rul=rul_val,
            lower_bound=lb_val,
            trigger_active=trigger_active,
        )

        # 5. Expected Cost Breakdown
        prob_failure_within_lead = float(norm.cdf((self.lead_time_cycles - rul_val) / sigma))
        expected_failure_cost = prob_failure_within_lead * self.cost_failure
        expected_wasted_cycles = max(0.0, rul_val - self.lead_time_cycles) if trigger_active else 0.0
        expected_waste_cost = expected_wasted_cycles * self.cost_waste_per_cycle
        total_risk_cost = expected_failure_cost + expected_waste_cost

        return {
            "current_cycle": current_cycle,
            "predicted_rul": round(rul_val, 1),
            "lower_bound_cert": round(lb_val, 1),
            "upper_bound": round(ub_val, 1),
            "uncertainty_sigma": round(sigma, 2),
            "hazard_rate": round(hazard_at_lead, 6),
            "economic_cost_ratio_gamma": self.cost_ratio,
            "hazard_trigger_active": hazard_trigger,
            "conformal_trigger_active": conformal_trigger,
            "trigger_active": trigger_active,
            "priority": priority,
            "recommended_action": (
                "SCHEDULE_MAINTENANCE_IMMEDIATE" if priority == "CRITICAL"
                else "INSPECT_SENSOR_TELEMETRY" if priority == "MONITOR"
                else "CONTINUE_NORMAL_OPERATION"
            ),
            "target_service_cycle": current_cycle + self.lead_time_cycles if trigger_active else None,
            "prob_failure_within_lead": round(prob_failure_within_lead, 4),
            "expected_failure_cost": round(expected_failure_cost, 2),
            "expected_waste_cost": round(expected_waste_cost, 2),
            "total_risk_cost": round(total_risk_cost, 2),
        }

    def categorize_priority(
        self,
        predicted_rul: float,
        lower_bound: float,
        trigger_active: bool = False,
    ) -> str:
        """
        Classify engine status into operational priority buckets:
        - CRITICAL: Intervention triggered or lower bound <= lead time (15 cycles)
        - MONITOR: Lower bound <= 40 cycles or predicted RUL < 40 cycles
        - HEALTHY: Normal operation, healthy margin
        """
        if trigger_active or lower_bound <= self.lead_time_cycles:
            return "CRITICAL"
        elif lower_bound <= 40.0 or predicted_rul < 40.0:
            return "MONITOR"
        return "HEALTHY"

    def schedule_fleet_priorities(
        self,
        engine_evaluations: List[Dict[str, Any]],
        max_hangar_bays: int = 3,
    ) -> Dict[str, Any]:
        """
        Sort fleet engines by urgency and allocate available hangar maintenance slots.
        """
        # Sort key: CRITICAL (0), MONITOR (1), HEALTHY (2), then ascending lower_bound_cert
        priority_rank = {"CRITICAL": 0, "MONITOR": 1, "HEALTHY": 2}

        sorted_engines = sorted(
            engine_evaluations,
            key=lambda e: (
                priority_rank.get(e.get("priority", "HEALTHY"), 2),
                e.get("lower_bound_cert", float("inf")),
                e.get("predicted_rul", float("inf")),
            ),
        )

        bay_allocations: List[Dict[str, Any]] = []
        for i in range(min(max_hangar_bays, len(sorted_engines))):
            engine = sorted_engines[i]
            if engine.get("priority") in ("CRITICAL", "MONITOR"):
                bay_allocations.append({
                    "bay_id": f"Bay-{i+1}",
                    "assigned_unit": engine.get("unit_id"),
                    "priority": engine.get("priority"),
                    "predicted_rul": engine.get("predicted_rul"),
                    "target_service_cycle": engine.get("target_service_cycle"),
                })

        counts = {
            "CRITICAL": sum(1 for e in sorted_engines if e.get("priority") == "CRITICAL"),
            "MONITOR": sum(1 for e in sorted_engines if e.get("priority") == "MONITOR"),
            "HEALTHY": sum(1 for e in sorted_engines if e.get("priority") == "HEALTHY"),
            "total_engines": len(sorted_engines),
        }

        return {
            "summary": counts,
            "allocated_bays": bay_allocations,
            "sorted_fleet": sorted_engines,
        }

