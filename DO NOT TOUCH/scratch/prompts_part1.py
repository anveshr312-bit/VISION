# Prompts Part 1: Header, Autonomous Tooling Guide, and Prompts 01 - 05

def get_part1():
    return """================================================================================
VISION: COMPLETE ANTIGRAVITY IDE SEQUENTIAL PROMPT PACK
Vital Intelligence for System Integrity, Observation & Nostics
Intelligent Predictive Maintenance, Remaining Useful Life (RUL) Estimator & 
Interactive 3D Turbofan Digital Twin for Aero-Engines
================================================================================
Target Working Directory: C:\\Users\\anves\\Downloads\\VISION
Target Platform: Windows 11 / PowerShell / Google Antigravity IDE
Dataset: NASA C-MAPSS Turbofan Jet Engine Degradation Simulation Dataset
Execution Mode: Sequential (Prompt 01 through Prompt 20)
Autonomous Tools: Graphify (Knowledge Graph) & Ponytail (Pragmatic Simplicity)
Scientific Integrity: Strict Dual-Mode (Empirical C-MAPSS vs Demonstration/Simulation)
================================================================================

TABLE OF CONTENTS
--------------------------------------------------------------------------------
1. MASTER ARCHITECTURAL BLUEPRINT & MODULAR DIRECTORY LAYOUT
2. AUTONOMOUS TOOLING INTEGRATION PROTOCOL (PONYTAIL & GRAPHIFY)
3. SEQUENTIAL DEVELOPMENT PROMPTS (PROMPT 01 - PROMPT 20)
   - Prompt 01: Project Architecture, Monorepo Layout & Tooling Setup
   - Prompt 02: Python & Node.js Environment & Dependency Configuration
   - Prompt 03: NASA C-MAPSS Dataset Ingestion & Automated Verification
   - Prompt 04: Data Preprocessing, Regime Normalization & Leakage-Free Protocol
   - Prompt 05: Baseline RUL Model & Cross-Validation Benchmarking
   - Prompt 06: Deep Sequence & Heterogeneous Prognostics Core
   - Prompt 07: Conformal Prediction, Calibration & Uncertainty Bands
   - Prompt 08: Economic Maintenance Optimization & Risk-Controlled Decision Engine
   - Prompt 09: Backend API Architecture & Pydantic Data Contracts
   - Prompt 10: Procedural 3D Turbofan Engine Architecture (Three.js)
   - Prompt 11: Interactive 3D Component Inspection & Telemetry Visualizer
   - Prompt 12: Dual-Mode Telemetry & Scientific Integrity Architecture
   - Prompt 13: Modern Frontend Dashboard Layout & Fleet Risk Board
   - Prompt 14: Engine Detail View, Sensor Telemetry Charts & RUL Fan Chart
   - Prompt 15: What-If Maintenance Scheduling & Economic Simulation UI
   - Prompt 16: Telemetry Streaming Replay Engine & Live Re-ranking
   - Prompt 17: Comprehensive Automated Testing Suite
   - Prompt 18: End-to-End System Integration, Error Handling & Logging
   - Prompt 19: Hackathon Demonstration Mode, Pitch Script & Visual Polish
   - Prompt 20: Final Structural Verification, Codebase Cleanliness & Architecture Audit
4. EXTERNAL REQUIREMENTS CHECKLIST & MANUAL SETUP RUNBOOK
5. LOCAL EXECUTION & OFFLINE VERIFICATION GUIDE
================================================================================


================================================================================
1. MASTER ARCHITECTURAL BLUEPRINT & MODULAR DIRECTORY LAYOUT
================================================================================
The project uses a clean, decoupled monorepo architecture:
- Python (FastAPI + Scikit-Learn/PyTorch) for the high-performance ML & Decision engine.
- Node.js (React + Vite + TailwindCSS + Three.js) for the interactive 3D digital twin & dashboard.

DIRECTORY TREE:
VISION/
├── .env.example                     # Template environment variables (local ports, debug flags)
├── .gitignore                       # Git exclusions (venv, node_modules, weights, dataset zips)
├── README.md                        # Project overview, architecture documentation, quickstart
├── VISION_PHM_ANTIGRAVITY_PROMPTS.txt # Master prompt sequence (this file)
│
├── backend/                         # FastAPI Application & Business Logic
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # API entry point, CORS, lifecycle hooks
│   │   ├── config.py                # Pydantic Settings (paths, thresholds, cost params)
│   │   ├── api/                     # REST API Route Controllers
│   │   │   ├── __init__.py
│   │   │   ├── routes_fleet.py      # Fleet overview, health indices, risk ranking
│   │   │   ├── routes_engine.py     # Engine telemetry, sensor trajectories, component maps
│   │   │   ├── routes_predict.py    # RUL prediction, conformal bands, hazard rates
│   │   │   ├── routes_decision.py   # Cost model, optimal stopping, maintenance scheduling
│   │   │   └── routes_stream.py     # Real-time telemetry replay stream (SSE/WebSocket)
│   │   ├── schemas/                 # Pydantic Schemas & DTO Contracts
│   │   │   ├── __init__.py
│   │   │   ├── telemetry.py         # Sensor readings, operating settings
│   │   │   ├── prediction.py        # RUL, confidence intervals, conformal lower bounds
│   │   │   └── maintenance.py       # Interventions, cost tradeoffs, hangar slot assignments
│   │   └── services/                # Business & Orchestration Services
│   │       ├── __init__.py
│   │       ├── inference_service.py # Model loading, cached inference, ensemble dispatch
│   │       ├── decision_service.py  # Risk-controlled triggers & cost optimization
│   │       └── stream_service.py    # Simulated flight-cycle telemetry playback
│   ├── tests/                       # Backend Unit & Integration Tests
│   │   ├── test_api_routes.py       # FastAPI endpoint tests
│   │   ├── test_schemas.py          # Validation & serialization tests
│   │   └── test_decision_logic.py   # Optimal stopping & Clopper-Pearson unit tests
│   └── requirements.txt             # Python dependencies
│
├── ml/                              # Machine Learning & Prognostics Pipeline
│   ├── config.py                    # ML constants (RUL_CAP=125, SENSORS_KEEP, REGIMES=6)
│   ├── data_loader.py               # Space-separated C-MAPSS parser & validation
│   ├── preprocessor.py              # K-Means regime clustering, train-only normalization
│   ├── feature_engineering.py       # Rolling stats (mean_5, delta_5_30, std_10), cycle index
│   ├── models/                      # Model Implementations
│   │   ├── __init__.py
│   │   ├── baseline_gbm.py          # HistGradientBoosting / LightGBM regressor
│   │   ├── deep_sequence.py         # 1D-CNN / Temporal Convolutional Network (TCN) / BiGRU
│   │   └── quantile_heads.py        # Pinball loss & multi-quantile regressors
│   ├── uncertainty/                 # Calibrated Uncertainty Quantification
│   │   ├── __init__.py
│   │   ├── conformal_mondrian.py    # Split-conformal Mondrian intervals (bucketed by RUL)
│   │   └── clopper_pearson.py       # Binomial confidence bounds for risk-controlled triggers
│   ├── evaluation.py                # RMSE, NASA Asymmetric Score, Coverage (PICP), Width (MPIW)
│   ├── train.py                     # CLI pipeline: preprocessing -> training -> calibration -> export
│   └── tests/                       # ML Unit Tests
│       ├── test_no_leakage.py       # Verifies train-only statistics on test sets
│       ├── test_conformal.py        # Verifies interval coverage logic
│       └── test_metrics.py          # Verifies NASA asymmetric loss & RMSE
│
├── frontend/                        # React + Vite + TailwindCSS Dashboard & 3D Twin
│   ├── package.json                 # Node dependencies (Three.js, Lucide-react, Tailwind, Recharts)
│   ├── vite.config.js               # Vite configuration with proxy to backend
│   ├── index.html                   # HTML template
│   ├── src/
│   │   ├── main.jsx                 # React root
│   │   ├── App.jsx                  # Main dashboard layout, tabs, state management
│   │   ├── index.css                # Tailwind styling & dark aero-theme variables
│   │   ├── components/              # UI Components
│   │   │   ├── Header.jsx           # App title, mode badge, connection status
│   │   │   ├── FleetTable.jsx       # Ranked fleet risk board with search/sort
│   │   │   ├── EngineDetail.jsx     # Selected engine summary, health status, warnings
│   │   │   ├── SensorChart.jsx      # Multi-sensor telemetry line charts with zoom
│   │   │   ├── RulFanChart.jsx      # RUL point estimate with 80%/90%/95% confidence fan
│   │   │   ├── DecisionSliders.jsx  # Interactive cost-ratio (Cf/cw) & risk-tolerance sliders
│   │   │   └── ModeToggle.jsx       # Empirical C-MAPSS vs Demonstration/Simulation switch
│   │   ├── components_3d/           # Three.js Turbofan Digital Twin
│   │   │   ├── TurbofanCanvas.jsx   # Three.js canvas, OrbitControls, camera rigs
│   │   │   ├── TurbofanModel.jsx    # Procedural 3D engine meshes (Fan, LPC, HPC, Combustor, HPT, LPT)
│   │   │   ├── ComponentGlow.jsx    # Component selection highlighter & thermal heatmap shader
│   │   │   └── ComponentTooltip.jsx # Overlay showing selected component sensors & health
│   │   ├── services/                # API Client
│   │   │   ├── api.js               # Axios / Fetch client with backend endpoints
│   │   │   └── streamClient.js      # SSE / WebSocket subscriber for streaming updates
│   │   └── utils/
│   │       ├── formatters.js        # Cycles, hours, percentage formatting
│   │       └── sensorNames.js       # Aerospace labels (T24, T30, P30, Nf, Nc, BPR, etc.)
│   └── tests/                       # Frontend Component & Smoke Tests
│       └── DashboardSmoke.test.jsx
│
├── data/                            # Dataset & Model Artifacts (Ignored in Git)
│   ├── raw/                         # Raw NASA C-MAPSS text files (FD001 - FD004)
│   ├── processed/                   # Processed cached CSV/Parquet & normalizers
│   └── artifacts/                   # Trained model weights, conformal tables, metrics.json
│
└── scripts/                         # Operational & Automation Shell/Python Scripts
    ├── setup_env.bat                # Windows setup script (Python venv + npm install)
    ├── download_cmapss.py           # Automated C-MAPSS downloader with checksums
    ├── run_pipeline.py              # End-to-end ML train & calibrate command
    ├── start_backend.bat            # Uvicorn FastAPI startup
    ├── start_frontend.bat           # Vite dev server startup
    └── start_all.bat                # Unified launcher for demo


================================================================================
2. AUTONOMOUS TOOLING INTEGRATION PROTOCOL (PONYTAIL & GRAPHIFY)
================================================================================
The Antigravity development environment includes specialized capabilities:
1. PONYTAIL SKILL: Enforces pragmatic, YAGNI-driven, minimal senior-developer engineering.
   - Use standard library and built-ins before custom code.
   - No speculative abstractions (no interfaces with single implementations, no unneeded boilerplate).
   - "Deletion over addition. Boring over clever."
   - Keep the hackathon prototype functional, testable, and lean.

2. GRAPHIFY SKILL / MCP: Builds and queries codebase architecture knowledge graphs.
   - Graphify turns files into an AST knowledge graph in `graphify-out/`.
   - Run `graphify update .` after significant structural updates to map cross-module relationships.
   - Query dependencies using `graphify query "<question>"` when navigating complex interfaces.
   - Neither tool is a runtime dependency for the user; they are agent-internal development accelerators.

INSTRUCTION FOR ANTIGRAVITY AGENT:
Throughout execution of this prompt pack:
- Keep implementations compact and robust according to Ponytail principles.
- Avoid introducing heavyweight databases (e.g., PostgreSQL/Redis) when SQLite/in-memory caches serve the hackathon scope cleanly.
- After creating core modules (Prompts 01, 09, 13, 20), trigger Graphify indexing to verify module boundaries.


================================================================================
3. SEQUENTIAL DEVELOPMENT PROMPTS
================================================================================

--------------------------------------------------------------------------------
PROMPT 01: Project Architecture, Monorepo Layout & Tooling Setup
--------------------------------------------------------------------------------
OBJECTIVE:
Initialize the empty workspace `C:\\Users\\anves\\Downloads\\VISION` into a clean, modular monorepo structure. Establish root documentation, environment templates, Git ignore rules, and initial development configs.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `VISION/README.md`
- `VISION/.env.example`
- `VISION/.gitignore`
- Monorepo folder hierarchy: `backend/app/api`, `backend/app/schemas`, `backend/app/services`, `backend/tests`, `ml/models`, `ml/uncertainty`, `ml/tests`, `frontend/src/components`, `frontend/src/components_3d`, `data/raw`, `data/processed`, `data/artifacts`, `scripts/`

IMPLEMENTATION REQUIREMENTS:
1. Create all directory trees specified in the Master Architecture Blueprint.
2. Create `.gitignore` ignoring:
   - Python: `__pycache__/`, `*.pyc`, `.venv/`, `env/`, `*.egg-info/`, `.pytest_cache/`
   - Node: `node_modules/`, `dist/`, `.vite/`
   - Data & Artifacts: `data/raw/*.txt`, `data/raw/*.zip`, `data/processed/*.parquet`, `data/artifacts/*.joblib`, `data/artifacts/*.pt` (preserve `.gitkeep` files)
   - System & Secrets: `.env`, `.DS_Store`, `Thumbs.db`
3. Create `.env.example`:
   ```env
   # VISION: Vital Intelligence for System Integrity, Observation & Nostics
# Configuration
   API_HOST=127.0.0.1
   API_PORT=8000
   VITE_API_URL=http://127.0.0.1:8000
   DEBUG=True
   CMAPSS_DIR=data/raw
   DEFAULT_SUBSET=FD001
   RUL_CAP=125
   ```
4. Create `README.md` detailing:
   - Project Name: VISION (Vital Intelligence for System Integrity, Observation & Nostics)
   - High-level architecture: FastAPI ML Engine + React/Vite 3D Turbofan Digital Twin
   - Problem Statement: PS 12 - Aero-Engine RUL & Predictive Maintenance
   - Setup instructions and execution roadmap.

TECHNICAL CONSTRAINTS:
- Do not create unnecessary subfolders. Follow the Ponytail ladder: minimal files that establish clear module boundaries.
- Ensure PowerShell path compatibility (use forward slashes or escaped backslashes).

ACCEPTANCE CRITERIA:
- Running `tree /F` or PowerShell `Get-ChildItem -Recurse` displays the complete expected layout.
- `.gitignore` properly excludes virtual environments and dataset files.
- `.env.example` contains all default parameters.

TESTS / VERIFICATION STEPS:
Execute in PowerShell:
```powershell
Get-ChildItem -Path . -Recurse -Directory | Select-Object FullName
Test-Path ".env.example", ".gitignore", "README.md"
```
Verify that all folders exist and root files return `True`.

WHAT TO DO IF IMPLEMENTATION FAILS:
If folder creation fails due to permissions, verify that PowerShell is running in `C:\\Users\\anves\\Downloads\\VISION`. If `.gitignore` doesn't hide test files, verify root placement.

--------------------------------------------------------------------------------
PROMPT 02: Python & Node.js Environment & Dependency Configuration
--------------------------------------------------------------------------------
OBJECTIVE:
Configure the development environments for both Python (backend + ML) and Node.js (frontend). Create lock-free, clean dependency files that install reliably on Windows 11.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `backend/requirements.txt`
- `frontend/package.json`
- `frontend/vite.config.js`
- `frontend/tailwind.config.js`
- `frontend/postcss.config.js`
- `scripts/setup_env.bat`

IMPLEMENTATION REQUIREMENTS:
1. Create `backend/requirements.txt` with tested compatible versions:
   ```txt
   fastapi>=0.110.0,<0.120.0
   uvicorn[standard]>=0.28.0,<0.35.0
   pydantic>=2.6.0,<3.0.0
   pydantic-settings>=2.2.0
   numpy>=1.26.0,<2.3.0
   pandas>=2.2.0,<3.0.0
   scipy>=1.12.0,<2.0.0
   scikit-learn>=1.4.0,<2.0.0
   joblib>=1.3.2
   torch>=2.2.0,<2.6.0 --index-url https://download.pytorch.org/whl/cpu; sys_platform == 'win32'
   pytest>=8.0.0
   requests>=2.31.0
   python-multipart>=0.0.9
   ```
   Note: PyTorch is specified for CPU to keep installation fast and free of CUDA bloat. If torch installation fails, pure scikit-learn/numpy fallbacks must be supported.

2. Create `frontend/package.json`:
   ```json
   {
     "name": "vision-phm-frontend",
     "private": true,
     "version": "1.0.0",
     "type": "module",
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview"
     },
     "dependencies": {
       "react": "^18.3.1",
       "react-dom": "^18.3.1",
       "three": "^0.164.1",
       "lucide-react": "^0.378.0",
       "clsx": "^2.1.1",
       "tailwind-merge": "^2.3.0"
     },
     "devDependencies": {
       "@vitejs/plugin-react": "^4.2.1",
       "autoprefixer": "^10.4.19",
       "postcss": "^8.4.38",
       "tailwindcss": "^3.4.3",
       "vite": "^5.2.11"
     }
   }
   ```

3. Create `frontend/vite.config.js` with API proxy:
   ```javascript
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     server: {
       port: 5173,
       proxy: {
         '/api': {
           target: 'http://127.0.0.1:8000',
           changeOrigin: true,
         },
         '/stream': {
           target: 'http://127.0.0.1:8000',
           changeOrigin: true,
         }
       }
     }
   });
   ```

4. Create `frontend/tailwind.config.js` configured with aviation dark theme palette (`#0f172a`, `#1e293b`, `#38bdf8`, `#22c55e`, `#f59e0b`, `#ef4444`).

5. Create `scripts/setup_env.bat` that automates:
   - Creating Python venv: `python -m venv .venv`
   - Activating venv and upgrading pip: `call .venv\\Scripts\\activate.bat && pip install --upgrade pip`
   - Installing requirements: `pip install -r backend/requirements.txt`
   - Installing frontend dependencies: `cd frontend && npm install && cd ..`

TECHNICAL CONSTRAINTS:
- Windows PowerShell and cmd compatible scripts.
- Zero external paid packages.
- Ensure Vite proxies both REST API and streaming endpoints to prevent CORS issues.

ACCEPTANCE CRITERIA:
- Running `scripts/setup_env.bat` completes without fatal errors.
- Python environment has `fastapi`, `numpy`, `pandas`, `sklearn`, `scipy` importable.
- Node environment has `three`, `react`, `lucide-react` in `frontend/node_modules`.

TESTS / VERIFICATION STEPS:
In PowerShell:
```powershell
# Test Python imports
& .venv/Scripts/python -c "import fastapi, numpy, pandas, sklearn, scipy; print('Python dependencies: OK')"
# Test Node modules
cd frontend; node -e "require('three'); console.log('Node dependencies: OK')"; cd ..
```

WHAT TO DO IF IMPLEMENTATION FAILS:
If `torch` download times out, replace the torch requirement in `backend/requirements.txt` with standard PyTorch CPU index or proceed with the standard scikit-learn + numpy architecture which is 100% self-sufficient.

--------------------------------------------------------------------------------
PROMPT 03: NASA C-MAPSS Dataset Ingestion & Automated Verification
--------------------------------------------------------------------------------
OBJECTIVE:
Implement an automated, idempotent dataset acquisition script that downloads the official NASA C-MAPSS turbofan engine degradation dataset, extracts all 12 core files into `data/raw/`, and runs strict schema and integrity verification.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `scripts/download_cmapss.py`
- `ml/data_loader.py`
- `data/raw/` (destination for txt files)

IMPLEMENTATION REQUIREMENTS:
1. Implement `scripts/download_cmapss.py`:
   - Primary download source: Direct NASA Open Data archive (`https://data.nasa.gov/docs/legacy/CMAPSSData.zip`).
   - Backup mirror source: PHM Society AWS S3 mirror (`https://phm-datasets.s3.amazonaws.com/NASA/6.+Turbofan+Engine+Degradation+Simulation+Data+Set.zip`).
   - If offline or air-gapped, check if files already exist in `data/raw/` or `C:\\Users\\anves\\Downloads\\VISION\\output\\cmapss\\` (or allow manual copy).
   - Unpack ZIP and verify the presence of all 12 files:
     - `train_FD001.txt`, `train_FD002.txt`, `train_FD003.txt`, `train_FD004.txt`
     - `test_FD001.txt`, `test_FD002.txt`, `test_FD003.txt`, `test_FD004.txt`
     - `RUL_FD001.txt`, `RUL_FD002.txt`, `RUL_FD003.txt`, `RUL_FD004.txt`
   - Print clean summary table of file sizes and line counts.

2. Implement `ml/data_loader.py`:
   - Provide standard schema column names:
     `COLS = ["unit", "cycle", "op1", "op2", "op3"] + [f"s{i}" for i in range(1, 22)]`
   - Define informative sensors list:
     `SENSORS_KEEP = ["s2", "s3", "s4", "s7", "s8", "s9", "s11", "s12", "s13", "s14", "s15", "s17", "s20", "s21"]`
   - Sensor names dictionary mapping C-MAPSS sensor codes to true physical aerospace names:
     - `s2`: "T24 - LPC Outlet Temp (°R)"
     - `s3`: "T30 - HPC Outlet Temp (°R)"
     - `s4`: "T50 - LPT Outlet Temp (°R)"
     - `s7`: "P30 - HPC Outlet Pressure (psia)"
     - `s8`: "Nf - Physical Fan Speed (rpm)"
     - `s9`: "Nc - Physical Core Speed (rpm)"
     - `s11`: "Ps30 - Static HPC Outlet Pressure (psia)"
     - `s12`: "phi - Fuel Flow Ratio to Ps30 (pps/psi)"
     - `s13`: "NRf - Corrected Fan Speed (rpm)"
     - `s14`: "NRc - Corrected Core Speed (rpm)"
     - `s15`: "BPR - Bypass Ratio"
     - `s17`: "htBleed - Bleed Enthalpy"
     - `s20`: "W31 - HPT Coolant Bleed (lbm/s)"
     - `s21`: "W32 - LPT Coolant Bleed (lbm/s)"
   - Function `load_subset(subset_name: str, data_dir: str = "data/raw") -> tuple[pd.DataFrame, pd.DataFrame, np.ndarray]`:
     - Reads space-delimited text (`sep=r"\\s+"`).
     - Calculates actual training RUL: `max_cycle_per_unit - current_cycle`.
     - Returns `(train_df, test_df, ground_truth_rul)`.
   - Function `verify_dataset_integrity(data_dir: str = "data/raw") -> dict`:
     - Validates engine counts:
       - FD001: 100 train, 100 test
       - FD002: 260 train, 259 test
       - FD003: 100 train, 100 test
       - FD004: 248 train, 249 test

TECHNICAL CONSTRAINTS:
- Handle potential trailing whitespace or multiple spaces in raw text files.
- Zero data leakage: Ground-truth test RUL must never be merged into `test_df` during loading.
- Scientific integrity: Document clearly that C-MAPSS does not contain vibration or oil pressure channels.

ACCEPTANCE CRITERIA:
- Running `python scripts/download_cmapss.py` results in 12 non-empty `.txt` files in `data/raw/`.
- Calling `data_loader.load_subset("FD001")` returns valid dataframes with correct dimensions.

TESTS / VERIFICATION STEPS:
In PowerShell:
```powershell
& .venv/Scripts/python scripts/download_cmapss.py
& .venv/Scripts/python -c "from ml.data_loader import verify_dataset_integrity; res = verify_dataset_integrity(); print(res)"
```
Output must show `{'status': 'PASSED', 'FD001': 'OK', 'FD002': 'OK', 'FD003': 'OK', 'FD004': 'OK'}`.

WHAT TO DO IF IMPLEMENTATION FAILS:
If the download URL is unreachable, have `download_cmapss.py` prompt the user or search local paths (e.g. `output/` or `cmapss/`) to copy existing C-MAPSS files into `data/raw/`.

--------------------------------------------------------------------------------
PROMPT 04: Data Preprocessing, Regime Normalization & Leakage-Free Protocol
--------------------------------------------------------------------------------
OBJECTIVE:
Build a mathematically rigorous, leakage-safe preprocessing and feature engineering pipeline. Implement K-Means operational regime clustering for multi-regime subsets (FD002, FD004), train-only normalization, rolling statistical windowing, and piecewise-linear RUL capping at 125 cycles.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `ml/config.py`
- `ml/preprocessor.py`
- `ml/feature_engineering.py`
- `ml/tests/test_no_leakage.py`

IMPLEMENTATION REQUIREMENTS:
1. Implement `ml/config.py`:
   - `RUL_CAP = 125` (Standard industrial threshold capping flat healthy phase).
   - `N_REGIMES = { 'FD001': 1, 'FD002': 6, 'FD003': 1, 'FD004': 6 }`
   - `ROLLING_WINDOWS = [5, 10, 30]`

2. Implement `ml/preprocessor.py`:
   - Class `CmapssPreprocessor`:
     - `fit(train_df: pd.DataFrame)`:
       - If `n_regimes > 1`: Fit `sklearn.cluster.KMeans(n_clusters=6, n_init=10, random_state=42)` on operational settings `['op1', 'op2', 'op3']`.
       - Compute per-regime mean and standard deviation for each informative sensor on training engines only. If std is 0, replace with 1.
       - If `n_regimes == 1`: Compute global mean and std on training engines only.
     - `transform(df: pd.DataFrame) -> pd.DataFrame`:
       - Assign regime clusters using fitted KMeans.
       - Standardize sensors using training-derived regime statistics: `(sensor - mu_train) / sd_train`.
       - Never fit or update statistics on test data.
     - `save(path: str)` / `load(path: str)` using joblib.

3. Implement `ml/feature_engineering.py`:
   - Function `extract_causal_features(df: pd.DataFrame) -> pd.DataFrame`:
     - Group strictly by engine `unit`.
     - For each of the 14 sensors, compute strictly backward-looking causal rolling features:
       - `mean_5`: 5-cycle rolling mean (`rolling(5, min_periods=1).mean()`).
       - `mean_30`: 30-cycle rolling mean (`rolling(30, min_periods=1).mean()`).
       - `delta_5_30`: Gradient feature (`mean_5 - mean_30`) indicating acceleration of degradation.
       - `std_10`: 10-cycle rolling standard deviation (`rolling(10, min_periods=2).std().fillna(0)`).
       - Raw sensor value at cycle `t`.
     - Retain `cycle` as an explicit feature.
     - Total feature count: 14 sensors * 4 features + 1 cycle = 57 causal features.

4. Implement `ml/tests/test_no_leakage.py`:
   - Verifies that shuffling or altering future cycles of a test engine does NOT change earlier features.
   - Verifies that test set sensor values do not influence normalization means or standard deviations.

TECHNICAL CONSTRAINTS:
- Absolute causality: No centered rolling windows (`center=False` mandatory).
- Never fit normalizers on test engines.

ACCEPTANCE CRITERIA:
- Preprocessor achieves the measured -2.3 RMSE reduction on FD002 and -3.2 on FD004 when per-regime normalization is active vs global.
- Leakage unit test passes with zero failures.

TESTS / VERIFICATION STEPS:
In PowerShell:
```powershell
& .venv/Scripts/python -m pytest ml/tests/test_no_leakage.py -v
& .venv/Scripts/python -c "from ml.data_loader import load_subset; from ml.preprocessor import CmapssPreprocessor; tr, te, _ = load_subset('FD002'); p = CmapssPreprocessor(n_regimes=6).fit(tr); tr_n = p.transform(tr); te_n = p.transform(te); print('Preprocess FD002: SUCCESS', tr_n.shape, te_n.shape)"
```

WHAT TO DO IF IMPLEMENTATION FAILS:
If `KMeans` raises warning about memory leaks on Windows, ensure explicit `n_init=10` is set. If unit tests report future leakage, verify that pandas rolling windows do not have `closed='left'` or negative indexing.

--------------------------------------------------------------------------------
PROMPT 05: Baseline RUL Model & Cross-Validation Benchmarking
--------------------------------------------------------------------------------
OBJECTIVE:
Build, evaluate, and benchmark a high-performance Tabular/Gradient-Boosting RUL regressor. Implement 5-fold Engine-Grouped Cross-Validation (`GroupKFold`), asymmetric NASA scoring, and bootstrap confidence intervals.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `ml/models/baseline_gbm.py`
- `ml/evaluation.py`
- `ml/train_baseline.py`
- `data/artifacts/baseline_FD001.joblib`

IMPLEMENTATION REQUIREMENTS:
1. Implement `ml/models/baseline_gbm.py`:
   - `HistGradientBoostingRegressor` (or LightGBM) configured with:
     - `max_iter=300`, `learning_rate=0.06`, `max_leaf_nodes=31`, `min_samples_leaf=40`, `l2_regularization=1.0`, `random_state=42`.
   - Native handling of non-linear interactions across the 57 causal features.

2. Implement `ml/evaluation.py`:
   - `compute_rmse(y_true, y_pred) -> float`: Root Mean Squared Error.
   - `compute_nasa_score(y_true, y_pred) -> float`:
     - Asymmetric penalty: $s = \\sum \\exp(-d/13) - 1$ if $d < 0$ (early warning), else $\\exp(d/10) - 1$ (late warning). Penalizes late predictions exponentially harder.
   - `compute_bootstrap_ci(y_true, y_pred, n_bootstraps=2000, ci=95) -> tuple[float, float]`:
     - Resamples test engines with replacement to report true sampling uncertainty.

3. Implement `ml/train_baseline.py`:
   - CLI script: `python -m ml.train_baseline --subset FD001`
   - Applies 5-fold `GroupKFold(n_splits=5)` grouping on engine `unit`.
   - Records out-of-fold (OOF) cross-validation predictions for all training cycles.
   - Fits model on full training set, evaluates on official last-cycle test windows.
   - Saves model artifact to `data/artifacts/baseline_{subset}.joblib` and metrics to `data/artifacts/metrics_{subset}.json`.

TECHNICAL CONSTRAINTS:
- Capping rule: Labels must be capped at $y = \\min(\\text{RUL}, 125)$ both during training and evaluation.
- Test evaluation must use strictly the last available cycle per test unit to match the NASA official test protocol.

ACCEPTANCE CRITERIA:
- Achieves benchmark accuracy on official test sets:
  - FD001 Test RMSE: 13.5 - 14.5 cycles (NASA score ~300)
  - FD002 Test RMSE: 13.8 - 14.8 cycles (per-regime)
  - FD003 Test RMSE: 12.8 - 13.8 cycles
  - FD004 Test RMSE: 15.0 - 16.0 cycles (per-regime)
- Model artifacts successfully saved and reloadable.

TESTS / VERIFICATION STEPS:
In PowerShell:
```powershell
& .venv/Scripts/python -m ml.train_baseline --subset FD001
& .venv/Scripts/python -c "import joblib, json; m = joblib.load('data/artifacts/baseline_FD001.joblib'); metrics = json.load(open('data/artifacts/metrics_FD001.json')); print('Baseline FD001 test RMSE:', metrics['test_rmse'], 'NASA score:', metrics['test_nasa_score'])"
```

WHAT TO DO IF IMPLEMENTATION FAILS:
If test RMSE exceeds 16 on FD001, verify that only the 14 informative sensors are used and that the target RUL is capped at 125. Verify that `GroupKFold` splits engines rather than individual rows.
"""

if __name__ == "__main__":
    print("Part 1 defined.")

