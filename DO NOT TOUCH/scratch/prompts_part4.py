# Prompts Part 4: Prompts 16 - 20, External Checklist, and Execution Guide

def get_part4():
    return """
--------------------------------------------------------------------------------
PROMPT 16: Telemetry Streaming Replay Engine & Live Re-ranking
--------------------------------------------------------------------------------
OBJECTIVE:
Build a real-time streaming replay engine that simulates live in-flight telemetry downloads. Provide a Server-Sent Events (SSE) or WebSocket stream that emits new cycle telemetry, continuously re-evaluates RUL, dynamically re-ranks fleet risk, and pushes updates to the 3D twin.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `backend/app/api/routes_stream.py`
- `backend/app/services/stream_service.py`
- `frontend/src/services/streamClient.js`
- `frontend/src/components/LiveReplayControls.jsx`

IMPLEMENTATION REQUIREMENTS:
1. Implement `backend/app/services/stream_service.py`:
   - Class `TelemetryReplayProducer`:
     - Selects a cohort of 5-20 test engines.
     - Advances simulated flight cycles synchronously at a configurable interval (e.g., 1 cycle per 500ms).
     - At each cycle tick, packages new sensor telemetry, runs fast inference via `InferenceService`, and evaluates maintenance triggers.
     - Emits structured JSON events:
       ```json
       {
         "event": "cycle_update",
         "unit_id": 34,
         "cycle": 142,
         "sensors": { "s2": 642.1, "s3": 1589.4, "s4": 1402.1, "s7": 553.2, "s8": 2388.1, "s9": 9054.2 },
         "rul_prediction": 18.2,
         "conformal_lower_90": 11.5,
         "urgency": "CRITICAL",
         "trigger_fired": true
       }
       ```

2. Implement `backend/app/api/routes_stream.py`:
   - Fast SSE endpoint: `GET /api/stream/telemetry`
   - Yields formatted SSE chunks: `data: {"event": ...}\\n\\n`
   - Supports query params: `speed=1.0`, `units=1,5,10,34`, `loop=true`.

3. Implement `frontend/src/services/streamClient.js`:
   - Connects to `/api/stream/telemetry` via native `EventSource`.
   - On event: Dispatches updates to active engine telemetry state and fleet risk list.

4. Implement `frontend/src/components/LiveReplayControls.jsx`:
   - Floating transport controls: "Play / Stream", "Pause", "Step Next Cycle", "Speed (0.5x, 1x, 2x, 5x)", "Reset".
   - As cycles advance:
     - The Fleet Table dynamically re-sorts, pushing engines with declining RUL to the top.
     - The 3D Turbofan spools spin at real-time speeds corresponding to streamed `Nf`/`Nc`.
     - When an engine crosses the 90% lower-bound trigger, an alert banner flashes: "CRITICAL TRIGGER: Unit #34 Scheduled for Overhaul".

TECHNICAL CONSTRAINTS:
- Low overhead: Native Python `asyncio.sleep` in SSE generator; zero third-party message broker (Kafka/RabbitMQ) needed for local execution.
- Auto-reconnect: Frontend `EventSource` automatically reconnects if stream drops.

ACCEPTANCE CRITERIA:
- Clicking "Play" in the UI starts continuous cycle updates.
- The Fleet Table re-ranks rows live without page reloads.
- The 3D engine responds to streaming speed parameters in real time.

TESTS / VERIFICATION STEPS:
In PowerShell:
```powershell
# Test SSE stream using curl / Invoke-WebRequest
curl -N "http://127.0.0.1:8000/api/stream/telemetry?units=1&speed=5" -m 3
```
Verify terminal receives streamed `data:` events with incrementing cycle counts.

WHAT TO DO IF IMPLEMENTATION FAILS:
If browser buffers SSE events, ensure backend response headers include: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, and `X-Accel-Buffering: no`.

--------------------------------------------------------------------------------
PROMPT 17: Comprehensive Automated Testing Suite
--------------------------------------------------------------------------------
OBJECTIVE:
Build an automated, regression-proof testing suite covering the complete development stack: ML data integrity and mathematical formulas, backend API endpoints, and frontend smoke tests.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `backend/tests/test_api_routes.py`
- `backend/tests/test_decision_logic.py`
- `ml/tests/test_no_leakage.py`
- `ml/tests/test_conformal.py`
- `ml/tests/test_metrics.py`
- `frontend/src/tests/DashboardSmoke.test.jsx` (or standalone Node smoke script)
- `scripts/run_all_tests.bat`

IMPLEMENTATION REQUIREMENTS:
1. Implement `ml/tests/test_conformal.py`:
   - Unit tests for Mondrian split-conformal calibration:
     - Verifies that bucketed intervals maintain validity: $\\text{Coverage} \\ge 1 - \\alpha - O(1/n)$.
     - Verifies one-sided lower bounds: $\\text{LowerBound} \\le \\hat{y}$.
     - Verifies fallback logic for under-populated buckets.

2. Implement `ml/tests/test_metrics.py`:
   - Validates NASA asymmetric scoring calculation against reference test cases:
     - Early prediction ($d = -5$ cycles): verify penalty is low.
     - Late prediction ($d = +5$ cycles): verify penalty is significantly higher.
     - Zero error ($d = 0$): verify score is exactly 0.0.
   - Validates RMSE calculation.

3. Implement `backend/tests/test_decision_logic.py`:
   - Validates the optimal stopping rule against known cost ratios.
   - Validates Clopper-Pearson exact binomial confidence intervals against `scipy.stats.beta.ppf`.

4. Implement `backend/tests/test_api_routes.py`:
   - FastAPI `TestClient` tests:
     - `test_health_check`: status 200, system healthy.
     - `test_fleet_overview`: returns non-empty list with valid schemas.
     - `test_engine_detail`: returns correct unit metadata.
     - `test_predict_rul`: valid RUL returned with 80%, 90%, 95% confidence bands.
     - `test_unknown_engine_404`: invalid unit ID returns HTTP 404.

5. Implement `scripts/run_all_tests.bat`:
   - Runs backend & ML test suite: `pytest ml/tests backend/tests -v`
   - Reports summary pass/fail count.

TECHNICAL CONSTRAINTS:
- Fast test execution: Full suite must execute in under 15 seconds.
- No network access required: All tests run self-contained offline.

ACCEPTANCE CRITERIA:
- Running `scripts/run_all_tests.bat` reports 100% test pass rate.
- All edge cases (zero error, empty inputs, extreme sensor values) handled gracefully.

TESTS / VERIFICATION STEPS:
In PowerShell:
```powershell
& .venv/Scripts/python -m pytest ml/tests backend/tests -v
```
All test suites must return green passes.

WHAT TO DO IF IMPLEMENTATION FAILS:
If `pytest` fails to locate modules, ensure the project root is in `PYTHONPATH` (`$env:PYTHONPATH = "."`).

--------------------------------------------------------------------------------
PROMPT 18: End-to-End System Integration, Error Handling & Logging
--------------------------------------------------------------------------------
OBJECTIVE:
Harden the entire application for hackathon demonstration reliability. Implement structured JSON logging, sensor fault and missing channel dropout recovery, graceful API offline fallbacks, and unified launcher scripts.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `backend/app/services/fault_tolerance.py`
- `backend/app/logging_config.py`
- `frontend/src/services/apiFallback.js`
- `scripts/start_backend.bat`
- `scripts/start_frontend.bat`
- `scripts/start_all.bat`

IMPLEMENTATION REQUIREMENTS:
1. Implement `backend/app/services/fault_tolerance.py`:
   - Handles corrupted or dropped sensor channels:
     - If non-critical sensors (e.g. s17, s20) drop or read `NaN`: impute with healthy-baseline mean and set warning flag.
     - If critical sensors (e.g. T30, P30) drop: flag engine as `SENSOR_FAULT_ABSTAIN`, expand uncertainty bands to 100%, and escalate to manual inspection.
   - Out-Of-Distribution (OOD) detector:
     - Computes Mahalanobis distance or bounds check on operating settings.
     - If setting falls outside training envelope: mark prediction confidence as `OOD_UNCERTAIN`.

2. Implement `backend/app/logging_config.py`:
   - Structured JSON logging:
     - Logs: timestamp, module, endpoint, latency_ms, engine_id, predicted_rul, status_code.
     - Excludes sensitive environment details.

3. Implement `frontend/src/services/apiFallback.js`:
   - In-memory offline cache of pre-calculated predictions for FD001.
   - If backend server is momentarily restarting or unreachable, frontend seamlessly falls back to cached data with a yellow toast notification: "Using Offline Telemetry Cache".

4. Implement Unified Launchers:
   - `scripts/start_backend.bat`:
     - Activates `.venv` and starts Uvicorn on `http://127.0.0.1:8000`.
   - `scripts/start_frontend.bat`:
     - Starts Vite dev server on `http://127.0.0.1:5173`.
   - `scripts/start_all.bat`:
     - Launches both backend and frontend in separate clean terminal windows and opens the default browser to `http://localhost:5173`.

TECHNICAL CONSTRAINTS:
- Seamless Windows batch execution without path truncation or environment variable collisions.

ACCEPTANCE CRITERIA:
- Running `scripts/start_all.bat` launches the complete application with one command.
- Injecting corrupted sensor inputs into the API does not crash the server; it returns graceful fallback responses.

TESTS / VERIFICATION STEPS:
In PowerShell:
```powershell
# Test sensor dropout handling
& .venv/Scripts/python -c "from backend.app.services.fault_tolerance import sanitize_telemetry; res = sanitize_telemetry({'s2': 640.0, 's3': None}); print('Fault tolerance sanitized:', res['status'])"
```

WHAT TO DO IF IMPLEMENTATION FAILS:
If `start_all.bat` terminates unexpectedly, check for proper `start "Window Title" cmd /k` syntax to prevent child process termination.

--------------------------------------------------------------------------------
PROMPT 19: Hackathon Demonstration Mode, Pitch Script & Visual Polish
--------------------------------------------------------------------------------
OBJECTIVE:
Add high-impact presentation features, demo presets, a 5-minute judge walkthrough mode, and UI polish to maximize hackathon scoring and impact.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `frontend/src/components/DemoTourModal.jsx`
- `frontend/src/components/JudgePresenterBar.jsx`
- `frontend/src/utils/demoPresets.js`
- `DEMO_WALKTHROUGH_SCRIPT.md`

IMPLEMENTATION REQUIREMENTS:
1. Implement `frontend/src/utils/demoPresets.js`:
   - 4 curated presentation scenarios accessible via 1-click buttons:
     1. `SCENARIO 1: Nominal Fleet Baseline` (Unit #10 - Healthy engine, RUL 95 cycles, normal spools).
     2. `SCENARIO 2: Imminent HPC Failure` (Unit #34 - Degraded HPC, T30 thermal surge, RUL 12 cycles, red glowing 3D compressor, trigger fired).
     3. `SCENARIO 3: Multi-Regime Challenge` (FD002 Unit #18 - 6 operational altitude/Mach regimes, proves per-regime normalization advantage).
     4. `SCENARIO 4: Economic Optimization Win` (Side-by-side comparison showing $1.4M saved vs fixed-interval calendar overhaul).

2. Implement `frontend/src/components/JudgePresenterBar.jsx`:
   - Top or bottom floating quick-access ribbon:
     - Scenario 1, 2, 3, 4 preset buttons.
     - "Reset Demo" button.
     - "Integrity Card" toggle.
     - Keyboard shortcuts: `1`, `2`, `3`, `4` to switch scenarios instantly.

3. Implement `frontend/src/components/DemoTourModal.jsx`:
   - Guided 4-step modal highlighting key innovations:
     - Step 1: Decision-First Architecture (Why RUL alone is not enough).
     - Step 2: 3D Digital Twin with real-time spool synchronization.
     - Step 3: Conformal Prediction intervals (rigorous math, no hand-waving).
     - Step 4: 5-8x reduction in wasted engine life.

4. Create `DEMO_WALKTHROUGH_SCRIPT.md`:
   - Exact 5-minute timed script for the team presentation:
     - 0:00 - 0:30: The Hook ("Every team predicts RUL numbers. VISION delivers provably safe maintenance decisions.")
     - 0:30 - 1:30: The 3D Digital Twin & Sensor Telemetry Mapping.
     - 1:30 - 2:30: Scientific Integrity & Conformal Calibration (The 42% -> 4% risk breakthrough).
     - 2:30 - 3:45: Economic Optimizer & Hangar Slot Assignment.
     - 3:45 - 4:30: Live Streaming Replay demonstration.
     - 4:30 - 5:00: Q&A readiness (pre-prepared answers for judge questions).

TECHNICAL CONSTRAINTS:
- Zero lag during live demonstration. All preset scenarios must switch in < 100ms.

ACCEPTANCE CRITERIA:
- Clicking preset buttons immediately loads corresponding engine telemetry and 3D states.
- Demo walkthrough script is clear, structured, and aligned with hackathon judging criteria.

TESTS / VERIFICATION STEPS:
- Open `http://localhost:5173`.
- Press key `2`: Verify engine Unit #34 loads, 3D compressor glows red, and alert sounds/flashes.
- Press key `4`: Verify Economic Sandbox opens with calculated fleet savings.

WHAT TO DO IF IMPLEMENTATION FAILS:
Ensure global keyboard event listeners in `JudgePresenterBar.jsx` check that the user is not actively typing into a text input before triggering preset hotkeys.

--------------------------------------------------------------------------------
PROMPT 20: Final Structural Verification, Codebase Cleanliness & Architecture Audit
--------------------------------------------------------------------------------
OBJECTIVE:
Perform a comprehensive codebase audit to ensure clean module boundaries, eliminate dead code, verify that all responsibilities reside in their appropriate folders, update documentation, and confirm that the entire system installs, tests, and runs from a clean state.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `README.md` (Update with complete command reference and final architecture)
- `ARCHITECTURE.md` (Modular structure, API contracts, mathematical references)
- Codebase cleanup across `backend/`, `frontend/`, `ml/`, `scripts/`

IMPLEMENTATION REQUIREMENTS:
1. Architectural & Modularity Verification:
   - Verify strict separation of concerns:
     - `frontend/`: UI, 3D Canvas, charts, dashboard components.
     - `backend/`: API routers, schemas, services.
     - `ml/`: Model training, preprocessing, conformal calibration, metrics.
     - `data/`: Raw and processed data only (excluded from git).
     - `scripts/`: Clean operational scripts.
   - Verify zero circular dependencies across Python modules.
   - Verify consistent naming conventions (`snake_case` for Python, `camelCase` for JS/JSX).

2. Ponytail Simplicity & YAGNI Audit:
   - Scan for over-engineered patterns:
     - Remove unused imports, abandoned test scripts, and dead code.
     - Ensure no mock/placeholder data leaks into the real C-MAPSS empirical pipeline.
     - Verify minimal, efficient standard library usage.

3. Graphify Knowledge Graph Refresh (if Graphify is available):
   - Run `graphify update .` to generate a fresh knowledge graph of the finalized codebase.
   - Verify that all module interfaces and call paths are captured cleanly.

4. Documentation Finalization:
   - Ensure `README.md` contains:
     - 1-step installation and startup instructions.
     - Tested baseline benchmark results (RMSE and NASA scores).
     - API endpoint reference table.
     - Explanation of the dual telemetry modes.

TECHNICAL CONSTRAINTS:
- Do not break working tests or APIs during refactoring.
- Maintain full offline operability.

ACCEPTANCE CRITERIA:
- Automated test suite passes 100% (`scripts/run_all_tests.bat`).
- Monorepo directory tree matches the clean architectural blueprint exactly.
- Both backend and frontend launch cleanly without warnings or errors.

TESTS / VERIFICATION STEPS:
In PowerShell:
```powershell
# 1. Run full test suite
& .venv/Scripts/python -m pytest ml/tests backend/tests -v
# 2. Check for unexpected stray files
Get-ChildItem -Path . -Recurse -File | Where-Object { $_.FullName -notmatch "node_modules|\.venv|\.git|data[\\\/]raw" } | Select-Object FullName
```
Verify all tests pass and no temporary or misplaced files exist in root.

WHAT TO DO IF IMPLEMENTATION FAILS:
If refactoring introduces a regression, use Git diff (`git status`, `git diff`) to pinpoint the broken import or modified interface and restore compatibility.


================================================================================
4. EXTERNAL REQUIREMENTS CHECKLIST & MANUAL SETUP RUNBOOK
================================================================================
The following checklist outlines all prerequisites and manual configuration steps. All core features run 100% locally and free of cost.

MANDATORY PREREQUISITES:
[ ] 1. Python Environment:
    - Version: Python 3.10, 3.11, 3.12, 3.13, or 3.14 (64-bit).
    - Verification: Run `python --version` in terminal.
[ ] 2. Node.js & npm:
    - Version: Node.js v18.0.0+ (Tested on v22.x), npm v9.0.0+ (Tested on v10.x).
    - Verification: Run `node --version` and `npm --version`.
[ ] 3. NASA C-MAPSS Dataset:
    - Files: 12 text files (`train_FD001.txt` - `FD004`, `test_FD001.txt` - `FD004`, `RUL_FD001.txt` - `FD004`).
    - Source: Automatically downloaded via `scripts/download_cmapss.py` from NASA Open Data Portal (`https://data.nasa.gov/docs/legacy/CMAPSSData.zip`).
    - Manual fallback: If offline, manually copy the 12 text files into `data/raw/`.
[ ] 4. Hardware Requirements:
    - CPU: Standard multi-core x86_64 CPU (Intel i5/i7 or AMD Ryzen).
    - RAM: 8 GB minimum (16 GB recommended).
    - GPU: None required. All models and Three.js 3D renderings run smoothly on CPU / integrated graphics.

OPTIONAL ENHANCEMENTS:
[ ] 1. External 3D Turbofan Model (glTF / GLB):
    - Default: The project includes a procedural Three.js turbofan engine out-of-the-box (zero download required).
    - Optional: If you possess a licensed turbofan `.glb` model (e.g. from Sketchfab / NASA 3D Resources), place it at `frontend/public/models/turbofan.glb` to enable the external mesh loader.
[ ] 2. PyTorch (Deep Sequence Models):
    - Default: Scikit-learn tabular gradient boosting and multi-quantile estimators run natively out-of-the-box.
    - Optional: Installing `torch` (CPU wheel) enables the experimental 1D-TCN and BiGRU sequence architectures.

API KEYS & COST:
- Zero Paid API Keys Required.
- Zero Cloud Subscriptions Required.
- 100% local, private, and deterministic execution.


================================================================================
5. LOCAL EXECUTION & OFFLINE VERIFICATION GUIDE
================================================================================
To build, run, and test VISION locally from scratch, execute the following sequence:

STEP 1: INITIAL ENVIRONMENT SETUP
Open PowerShell in `C:\\Users\\anves\\Downloads\\VISION`:
```powershell
# Run automated setup script
.\\scripts\\setup_env.bat
```
This creates the Python `.venv`, installs backend requirements, and runs `npm install` in `frontend/`.

STEP 2: DATASET INGESTION
```powershell
& .venv\\Scripts\\python scripts\\download_cmapss.py
```
Verifies and extracts the 12 C-MAPSS files into `data/raw/`.

STEP 3: RUN THE ML PIPELINE & GENERATE ARTIFACTS
```powershell
& .venv\\Scripts\\python scripts\\run_pipeline.py --subset FD001
```
Executes preprocessing, regime clustering, model training, conformal calibration, and decision policy simulation. Generates all model weights and lookup tables in `data/artifacts/`.

STEP 4: RUN AUTOMATED TESTS
```powershell
& .venv\\Scripts\\python -m pytest ml/tests backend/tests -v
```
Verifies that all 100% of unit, integration, and leakage tests pass.

STEP 5: LAUNCH APPLICATION FOR DEMONSTRATION
```powershell
.\\scripts\\start_all.bat
```
Launches:
- Backend REST API at `http://127.0.0.1:8000` (Swagger docs at `http://127.0.0.1:8000/docs`)
- Frontend Dashboard & 3D Twin at `http://localhost:5173`
================================================================================
"""

if __name__ == "__main__":
    print("Part 4 defined.")

