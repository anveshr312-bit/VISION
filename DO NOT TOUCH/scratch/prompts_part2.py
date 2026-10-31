# Prompts Part 2: Prompts 06 - 10

def get_part2():
    return """
--------------------------------------------------------------------------------
PROMPT 06: Deep Sequence & Heterogeneous Prognostics Core
--------------------------------------------------------------------------------
OBJECTIVE:
Implement deep time-series sequence models (Temporal Convolutional Network / 1D-CNN and Bidirectional GRU with Attention) and quantile regression heads. This provides heterogeneous modeling capability alongside the baseline gradient-boosted trees.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `ml/models/deep_sequence.py`
- `ml/models/quantile_heads.py`
- `ml/train_deep.py`
- `data/artifacts/deep_tcn_FD001.pt` or fallback joblib ensemble

IMPLEMENTATION REQUIREMENTS:
1. Implement sequence generator in `ml/models/deep_sequence.py`:
   - Slides a temporal window of $W = 30$ or $50$ cycles over the normalized 14 sensor channels.
   - Padded with edge replication if sequence length < $W$ for early cycles.
   - PyTorch architecture (with automatic graceful fallback to a multi-quantile gradient boosting ensemble if PyTorch is absent):
     - `AeroTCN`: 1D Dilated Causal Convolutions with residual connections (dilations: 1, 2, 4, 8), kernel size 3, dropout 0.2.
     - `AeroBiGRU`: 2-layer Bidirectional GRU (hidden dim 64) with temporal additive attention pooling.
     - Loss: Huber loss + asymmetric late penalty $\\lambda \\cdot \\max(\\hat{y} - y, 0)^2$.

2. Implement `ml/models/quantile_heads.py`:
   - Multi-quantile pinball loss:
     $$\\mathcal{L}_q(y, \\hat{y}) = \\max(q(y - \\hat{y}), (1 - q)(\\hat{y} - y))$$
   - Trains quantile estimators for $\\tau \\in [0.05, 0.10, 0.50, 0.90, 0.95]$.
   - Yields empirical predictive distribution without making rigid Gaussian assumptions.

3. Implement `ml/train_deep.py`:
   - Supports training both TCN/BiGRU and quantile ensemble on engine-grouped splits.
   - Saves model weights and inference metadata into `data/artifacts/`.

TECHNICAL CONSTRAINTS:
- Windows CPU execution must train within 3-5 minutes.
- Causal temporal padding only (no future cycle visibility).
- If PyTorch is unavailable in the environment, implement multi-quantile gradient boosting (`GradientBoostingRegressor(loss='quantile', alpha=q)`) as a zero-dependency drop-in.

ACCEPTANCE CRITERIA:
- Running `train_deep.py` produces trained weights for FD001.
- Inference function produces point RUL prediction plus 10th and 90th percentile bounds.
- Model adheres to the 125 RUL cap.

TESTS / VERIFICATION STEPS:
In PowerShell:
```powershell
& .venv/Scripts/python -m ml.train_deep --subset FD001 --epochs 15
& .venv/Scripts/python -c "from ml.models.quantile_heads import predict_quantiles; print('Quantile inference: READY')"
```

WHAT TO DO IF IMPLEMENTATION FAILS:
If PyTorch tensor operations fail or take too long on CPU, switch to the scikit-learn quantile gradient boosting fallback (`QuantileEnsemble` class), which trains in under 20 seconds on CPU.

--------------------------------------------------------------------------------
PROMPT 07: Conformal Prediction, Calibration & Uncertainty Bands
--------------------------------------------------------------------------------
OBJECTIVE:
Build a mathematically proven uncertainty calibration engine using Mondrian Split-Conformal Prediction. Provide finite-sample, distribution-free coverage guarantees for RUL estimates with lower-bound safety certificates.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `ml/uncertainty/conformal_mondrian.py`
- `ml/uncertainty/evaluate_calibration.py`
- `data/artifacts/conformal_tables_FD001.json`

IMPLEMENTATION REQUIREMENTS:
1. Implement `ml/uncertainty/conformal_mondrian.py`:
   - Class `MondrianConformalCalibrator`:
     - Discretize predicted RUL into bins to account for heteroscedasticity (larger error at high RUL, tighter error near failure):
       `EDGES = [15, 30, 50, 75, 100, 115]` cycles.
     - Calibrate on Out-Of-Fold (OOF) cross-validation residuals:
       $$r_i = |\\hat{y}_i - y_i| \\quad \\text{(two-sided)}, \\quad r_i^{lb} = \\hat{y}_i - y_i \\quad \\text{(one-sided lower bound)}$$
     - For each bin $b$ and nominal miscoverage level $\\alpha$ (e.g., $0.10$ for $90\\%$ confidence):
       Compute conformal quantile:
       $$q_b = \\text{Quantile}\\left(r; \\frac{\\lceil(n_b + 1)(1 - \\alpha)\\rceil}{n_b}\\right)$$
     - Handle sparse bins with global quantile fallback if sample count $< 30$.
     - Inference function:
       $$\\text{Interval}(\\hat{y}) = [\\max(0, \\hat{y} - q_b), \\hat{y} + q_b]$$
       $$\\text{LowerBound}_{1-\\alpha}(\\hat{y}) = \\max(0, \\hat{y} - q_b^{lb})$$
       Guarantees: $\\mathbb{P}(Y \\ge \\text{LowerBound}_{1-\\alpha}) \\ge 1 - \\alpha$.

2. Implement `ml/uncertainty/evaluate_calibration.py`:
   - Evaluates empirical coverage (PICP) and mean interval width (MPIW) across test engines.
   - Evaluates one-sided lower-bound safety fraction on test engines.
   - Exports conformal calibration lookup tables to `data/artifacts/conformal_tables_{subset}.json`.

TECHNICAL CONSTRAINTS:
- Calibration must be derived strictly from OOF training residuals to avoid optimistic bias.
- Respect exchangeability: State clearly in output that conformal guarantees are marginal over engines.

ACCEPTANCE CRITERIA:
- Conformal tables generated for nominal levels 80%, 90%, 95%.
- Empirical test coverage evaluated and logged:
  - 90% nominal yields 83% - 90% empirical coverage on official test sets.
  - One-sided 90% lower bound safely covers true RUL for >= 86% of test engines.

TESTS / VERIFICATION STEPS:
In PowerShell:
```powershell
& .venv/Scripts/python -m ml.uncertainty.evaluate_calibration --subset FD001
& .venv/Scripts/python -c "import json; d=json.load(open('data/artifacts/conformal_tables_FD001.json')); print('Conformal tables loaded:', list(d.keys()))"
```

WHAT TO DO IF IMPLEMENTATION FAILS:
If empirical coverage under-covers severely (< 75% for 90% nominal), check that residuals are calibrated against capped ground truth `np.minimum(y, 125)` and that bucket indexing uses `np.digitize`.

--------------------------------------------------------------------------------
PROMPT 08: Economic Maintenance Optimization & Risk-Controlled Decision Engine
--------------------------------------------------------------------------------
OBJECTIVE:
Bridge the gap between raw ML predictions and actionable maintenance decisions. Implement an economic cost model, a closed-form optimal stopping hazard rule, Clopper-Pearson risk-controlled trigger selection, and back-tested policy evaluation against fixed-interval maintenance.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `backend/app/services/decision_service.py`
- `ml/uncertainty/clopper_pearson.py`
- `ml/decision_simulation.py`
- `data/artifacts/decision_policy_FD001.json`

IMPLEMENTATION REQUIREMENTS:
1. Implement `ml/uncertainty/clopper_pearson.py`:
   - Function `clopper_pearson_upper_bound(k_failures: int, n_trials: int, confidence: float = 0.90) -> float`:
     - Calculates exact one-sided binomial upper bound using Beta distribution:
       $$UB = \\text{Beta}^{-1}(\\text{conf}; k+1, n-k) \\quad \\text{if } k < n \\text{ else } 1.0$$
   - Function `select_risk_controlled_threshold(failures_matrix, waste_matrix, grid, eps=0.05, conf=0.90)`:
     - Selects the trigger threshold $\\theta^*$ that minimizes wasted life while strictly guaranteeing $UB \\le \\epsilon$.
     - Prevents the 42% risk-target violation seen in naive threshold tuning.

2. Implement `backend/app/services/decision_service.py`:
   - Economic cost model:
     - $C_f$: Cost of an in-service catastrophic failure (default: $100,000 / normalized 1000).
     - $c_w$: Cost of one wasted cycle of useful engine life (default: $100 / normalized 1).
     - Cost ratio: $\\gamma = c_w / C_f \\approx 10^{-3}$.
   - Optimal stopping decision rule:
     - Compute predictive hazard: $h(s) = \\frac{f(s)}{1 - F(s)}$.
     - Optimal maintenance trigger condition: Trigger intervention at the earliest cycle $s^*$ where $h(s^*) \\ge \\frac{c_w}{C_f}$.
   - Hangar slot & priority scheduling:
     - Sort fleet engines into: `CRITICAL` (trigger hit, schedule in next 15 cycles), `MONITOR` (RUL < 40 cycles), `HEALTHY` (RUL >= 40 cycles).

3. Implement `ml/decision_simulation.py`:
   - Simulates 4 maintenance policies on held-out engines with a 15-cycle logistics lead time:
     1. Fixed-interval (calendar-based) maintenance
     2. Naive point-RUL threshold trigger
     3. Conformal 90% lower-bound trigger
     4. Conformal lower-bound + 3-cycle persistence trigger
   - Generates Pareto frontier of In-Service Failure Rate vs Mean Wasted Cycles.
   - Proves 5-8x reduction in wasted engine life compared to fixed intervals at equal risk budget.
   - Saves results to `data/artifacts/decision_policy_FD001.json`.

TECHNICAL CONSTRAINTS:
- 15-cycle logistics lead time must be factored into all decisions: if trigger fires at cycle $t$, physical maintenance occurs at $t + 15$. If engine true life $T \\le t + 15$, it counts as an in-service failure.

ACCEPTANCE CRITERIA:
- Optimal stopping rule mathematically validates the economic trade-off.
- Decision simulation verifies that risk-controlled thresholds reduce violation rate to $\\le 4\\%$.
- Policy comparison table exported for frontend dashboard consumption.

TESTS / VERIFICATION STEPS:
In PowerShell:
```powershell
& .venv/Scripts/python -m ml.decision_simulation --subset FD001
& .venv/Scripts/python -c "import json; pol = json.load(open('data/artifacts/decision_policy_FD001.json')); print('Decision simulation: SUCCESS, Pareto points:', len(pol['curves']['lower90']))"
```

WHAT TO DO IF IMPLEMENTATION FAILS:
If the Clopper-Pearson upper bound is too conservative and rejects all thresholds, ensure the candidate grid spans thresholds from 0 to 125 cycles and that $n_\\text{trials}$ represents the full held-out engine cohort.

--------------------------------------------------------------------------------
PROMPT 09: Backend API Architecture & Pydantic Data Contracts
--------------------------------------------------------------------------------
OBJECTIVE:
Build a modular, asynchronous FastAPI backend application. Implement strict Pydantic schemas, REST API route controllers for fleet status, engine telemetry, RUL predictions, decision optimization, and a streaming replay endpoint.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `backend/app/main.py`
- `backend/app/config.py`
- `backend/app/schemas/telemetry.py`
- `backend/app/schemas/prediction.py`
- `backend/app/schemas/maintenance.py`
- `backend/app/api/routes_fleet.py`
- `backend/app/api/routes_engine.py`
- `backend/app/api/routes_predict.py`
- `backend/app/api/routes_decision.py`
- `backend/app/services/inference_service.py`
- `backend/tests/test_api_routes.py`

IMPLEMENTATION REQUIREMENTS:
1. Implement Pydantic Schemas:
   - `schemas/telemetry.py`:
     - `SensorReading`: timestamp/cycle, sensor key-value dictionary (T24, T30, P30, Nf, etc.), operating regime.
     - `EngineTelemetryResponse`: unit_id, current_cycle, total_cycles, operational_settings, sensor_history.
   - `schemas/prediction.py`:
     - `RULPredictionResponse`: unit_id, current_cycle, rul_point_estimate, conformal_interval_80, conformal_interval_90, conformal_interval_95, lower_bound_90, failure_probability_lead_time, health_index.
   - `schemas/maintenance.py`:
     - `MaintenanceRecommendation`: unit_id, urgency_level (`HEALTHY`, `ADVISORY`, `CRITICAL`), recommended_cycle_action, expected_wasted_life, risk_score, cost_analysis.

2. Implement Route Controllers:
   - `GET /api/fleet/overview`: Returns summary of all engines in selected subset, sorted by risk score.
   - `GET /api/engine/{unit_id}`: Returns full cycle history, current telemetry, and active alerts.
   - `POST /api/predict/rul`: Accepts engine telemetry payload, returns calibrated RUL and conformal bounds.
   - `POST /api/decision/optimize`: Accepts custom $C_f, c_w$, returns optimal maintenance trigger and fleet schedule.
   - `GET /api/health`: System health and model readiness check.

3. Implement `backend/app/services/inference_service.py`:
   - Singleton service that pre-loads trained model artifacts, preprocessors, and conformal tables.
   - Caches predictions in-memory for instant sub-10ms response times.

4. Implement `backend/app/main.py`:
   - Configures CORS middleware allowing `http://localhost:5173`.
   - Mounts API routers under `/api`.
   - Global exception handling returning JSON error payloads.

TECHNICAL CONSTRAINTS:
- Stateless, fast REST endpoints (p95 response time < 50ms).
- Gracefully handle requests for non-existent engine unit IDs (return 404 with descriptive detail).

ACCEPTANCE CRITERIA:
- Server starts cleanly using `uvicorn app.main:app`.
- All routes documented automatically in `/docs` (Swagger UI).
- `test_api_routes.py` passes all endpoint assertions.

TESTS / VERIFICATION STEPS:
In PowerShell:
```powershell
& .venv/Scripts/python -m pytest backend/tests/test_api_routes.py -v
# Smoke test server startup
$proc = Start-Process -FilePath ".venv/Scripts/uvicorn" -ArgumentList "backend.app.main:app --port 8000" -PassThru
Start-Sleep -Seconds 3
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health"
Stop-Process -Id $proc.Id
```

WHAT TO DO IF IMPLEMENTATION FAILS:
If port 8000 is occupied, configure `API_PORT=8001` in `backend/app/config.py` and mirror in `frontend/vite.config.js`. If Pydantic v2 migration warnings appear, ensure `model_config = ConfigDict(...)` syntax is used.

--------------------------------------------------------------------------------
PROMPT 10: Procedural 3D Turbofan Engine Architecture (Three.js)
--------------------------------------------------------------------------------
OBJECTIVE:
Build a zero-external-dependency, recognizable 3D turbofan jet engine using procedural Three.js geometry. Implement distinct, logically separated, and hierarchically organized meshes for all 6 required aerospace components: Fan, LPC, HPC, Combustor, HPT, and LPT.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `frontend/src/components_3d/TurbofanCanvas.jsx`
- `frontend/src/components_3d/TurbofanModel.jsx`
- `frontend/src/components_3d/engineGeometries.js`
- `frontend/src/components_3d/materials.js`

IMPLEMENTATION REQUIREMENTS:
1. Implement `frontend/src/components_3d/engineGeometries.js`:
   - Build recognizable, dimensionally proportional components arranged along the central engine Z-axis:
     1. `FAN`: Central spinner nose cone (`ConeGeometry`), front hub ring, and 24 individual aerodynamic fan blades (`BoxGeometry` / curved prism angled at $28^\\circ$).
     2. `LPC` (Low-Pressure Compressor): Central cylindrical shaft with 3 diminishing rotor-stator disc stages (`CylinderGeometry`).
     3. `HPC` (High-Pressure Compressor): Heavy compressed hub with 5 high-density titanium rotor stages tapering down toward the combustor.
     4. `COMBUSTOR` (Combustion Chamber): Annular chamber casing (`TorusGeometry` / `CylinderGeometry`) with fuel nozzle injectors and perforated flame liner details.
     5. `HPT` (High-Pressure Turbine): Single/two-stage high-temp nickel alloy turbine disc positioned immediately aft of the combustor.
     6. `LPT` (Low-Pressure Turbine): 4-stage larger diameter turbine section driving the low-pressure spool.
     7. `CASING`: Transparent outer nacelle cowling (`CylinderGeometry` with `opacity: 0.2`, `transparent: true`) and exhaust mixer nozzle.

2. Implement `frontend/src/components_3d/materials.js`:
   - Realistic PBR materials using `MeshStandardMaterial`:
     - Titanium blades (`roughness: 0.3`, `metalness: 0.8`, `color: #94a3b8`).
     - Combustor alloy (`roughness: 0.5`, `metalness: 0.6`, `color: #64748b`).
     - Thermal glow shader material for highlighting degraded/hot components (`emissive: #ef4444`, `emissiveIntensity: 0.0`).
     - Transparent aerodynamic glass casing (`color: #38bdf8`, `opacity: 0.15`, `roughness: 0.1`, `transparent: true`).

3. Implement `frontend/src/components_3d/TurbofanCanvas.jsx`:
   - Embeds Three.js WebGLRenderer in a responsive container.
   - Implements `OrbitControls` with damping, pan, rotate, and zoom.
   - Dual rotational spools:
     - N1 (Low-pressure spool: Fan + LPC + LPT) rotates at variable speed proportional to sensor `Nf` / `NRf`.
     - N2 (High-pressure spool: HPC + HPT) rotates at higher speed proportional to sensor `Nc` / `NRc`.
   - Studio lighting: Key directional light, fill rim light, ambient environment light.

4. Optional 3D asset support:
   - Provide an optional `useGltf` prop in `TurbofanCanvas.jsx` to load a `.glb`/`.gltf` asset from `frontend/public/models/turbofan.glb` if the user drops an external model in, seamlessly falling back to the procedural engine if absent.

TECHNICAL CONSTRAINTS:
- Zero external 3D file requirements: Must render immediately and flawlessly out-of-the-box.
- 60 FPS performance: Total triangle count < 50,000 for smooth browser execution.
- Every component must have a unique `userData.componentId` matching `["fan", "lpc", "hpc", "combustor", "hpt", "lpt"]`.

ACCEPTANCE CRITERIA:
- The 3D engine renders on an HTML5 canvas.
- All 6 components are visually distinct and accurately ordered from front to back.
- Spools animate smoothly with rotation.
- Cowling transparency allows seeing inside the core engine.

TESTS / VERIFICATION STEPS:
In PowerShell:
```powershell
# Verify files exist and contain no syntax errors
cd frontend
node -e "import('./src/components_3d/engineGeometries.js').then(() => console.log('3D Geometries: OK'))"
cd ..
```

WHAT TO DO IF IMPLEMENTATION FAILS:
If WebGL context errors occur in headless tests, ensure Three.js is initialized inside React `useEffect` with proper window resize listeners and cleanup handlers.
"""

if __name__ == "__main__":
    print("Part 2 defined.")

