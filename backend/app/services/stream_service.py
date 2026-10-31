"""
VISION: Telemetry Streaming Replay Engine
Vital Intelligence for System Integrity, Observation & Nostics

Simulates live in-flight ACARS / QAR telemetry streaming for cohorts of test engines.
Advances cycle-by-cycle, continuously re-evaluates conformal RUL, and emits
Server-Sent Events (SSE) payloads for live dynamic UI re-ranking.
"""

from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator, Dict, List, Optional

import numpy as np

from backend.app.services.inference_service import InferenceService


class TelemetryReplayProducer:
    """
    Simulates real-time multi-engine telemetry feeds with asynchronous cycle stepping.
    """

    def __init__(
        self,
        cohort_units: Optional[List[int]] = None,
        subset: str = "FD001",
        speed: float = 1.0,
        loop: bool = True,
    ) -> None:
        self.subset = subset.upper()
        self.speed = max(0.1, min(10.0, speed))
        self.loop = loop

        # Default cohort: healthy, advisory, and critical engines (e.g., Unit 1, 10, 24, 34, 45)
        self.units = cohort_units or [1, 10, 24, 34, 45]
        self.inference_service = InferenceService()

        # Pre-cache raw engine trajectories
        self.engine_trajectories: Dict[int, List[Dict[str, float]]] = {}
        self._load_cohort_trajectories()

    def _load_cohort_trajectories(self) -> None:
        """Cache test set trajectories for each cohort unit."""
        self.inference_service.warmup_subset(self.subset)
        if self.subset not in self.inference_service._datasets:
            return

        _, test_df, _ = self.inference_service._datasets[self.subset]

        for unit_id in self.units:
            grp = test_df[test_df["unit"] == unit_id].sort_values("cycle")
            if len(grp) == 0:
                continue

            records = []
            for _, row in grp.iterrows():
                sensors = {
                    s: float(row[s])
                    for s in [
                        "s2", "s3", "s4", "s7", "s8", "s9", "s11", "s12",
                        "s13", "s14", "s15", "s17", "s20", "s21"
                    ]
                    if s in row
                }
                ops = {
                    op: float(row[op])
                    for op in ["op1", "op2", "op3"]
                    if op in row
                }
                records.append({
                    "unit": unit_id,
                    "cycle": int(row["cycle"]),
                    "sensors": sensors,
                    "operational_settings": ops,
                })

            if records:
                self.engine_trajectories[unit_id] = records

    async def stream_cycles(self) -> AsyncGenerator[str, None]:
        """
        Yields Server-Sent Event formatted chunks: `data: { ... }\n\n`
        Advances all cohort units simultaneously through their cycles.
        """
        if not self.engine_trajectories:
            yield f"data: {json.dumps({'event': 'error', 'message': 'No engine trajectories available'})}\n\n"
            return

        # Base sleep delay per cycle step: 0.5s divided by speed multiplier
        step_interval = max(0.05, 0.5 / self.speed)

        # Track playback index per engine
        max_lens = {u: len(recs) for u, recs in self.engine_trajectories.items()}
        # Start replay from cycle (len - 30) or from cycle 0 to showcase degradation
        pointers = {u: max(0, max_lens[u] - 35) for u in self.engine_trajectories}

        while True:
            all_done = True

            for unit_id in self.units:
                recs = self.engine_trajectories.get(unit_id)
                if not recs:
                    continue

                curr_idx = pointers[unit_id]
                if curr_idx < len(recs):
                    all_done = False
                    point = recs[curr_idx]
                    pointers[unit_id] += 1

                    # Run fast inference using trajectory up to current cycle
                    sub_traj = recs[:curr_idx + 1]
                    hist_for_inference = [
                        {**p["sensors"], **p["operational_settings"], "cycle": p["cycle"], "unit": unit_id}
                        for p in sub_traj
                    ]

                    # Predict RUL
                    pred_res = self.inference_service.predict_rul(
                        unit_id=unit_id,
                        subset=self.subset,
                        telemetry_history=hist_for_inference,
                    )

                    rul_pred = pred_res.rul_point_estimate if pred_res else max(0.0, 125.0 - point["cycle"])
                    lb_90 = pred_res.lower_bound_90 if pred_res else max(0.0, rul_pred - 12.0)
                    ub_90 = pred_res.conformal_interval_90[1] if (pred_res and pred_res.conformal_interval_90) else rul_pred + 15.0

                    urgency = "HEALTHY"
                    if lb_90 <= 15.0 or rul_pred < 20.0:
                        urgency = "CRITICAL"
                    elif rul_pred < 50.0:
                        urgency = "ADVISORY"

                    event_payload = {
                        "event": "cycle_update",
                        "unit_id": unit_id,
                        "cycle": point["cycle"],
                        "sensors": point["sensors"],
                        "operational_settings": point["operational_settings"],
                        "rul_prediction": round(rul_pred, 1),
                        "conformal_lower_90": round(lb_90, 1),
                        "conformal_upper_90": round(ub_90, 1),
                        "urgency": urgency,
                        "trigger_fired": lb_90 <= 15.0,
                    }

                    yield f"data: {json.dumps(event_payload)}\n\n"

            if all_done:
                if self.loop:
                    # Reset pointers and continue looping
                    pointers = {u: max(0, max_lens[u] - 35) for u in self.engine_trajectories}
                    yield f"data: {json.dumps({'event': 'stream_loop_reset', 'status': 'Replaying cohort'})}\n\n"
                else:
                    yield f"data: {json.dumps({'event': 'stream_complete', 'status': 'All cycles replayed'})}\n\n"
                    break

            await asyncio.sleep(step_interval)

