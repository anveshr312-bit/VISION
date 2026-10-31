# Script to generate VISION_PHM_ANTIGRAVITY_PROMPTS.txt
import os

OUT_PATH = r"C:\Users\anves\Downloads\VISION\VISION_PHM_ANTIGRAVITY_PROMPTS.txt"

def build_prompt_pack():
    sections = []
    
    # --------------------------------------------------------------------------
    # HEADER & SYSTEM ARCHITECTURE
    # --------------------------------------------------------------------------
    sections.append("""================================================================================
VISION-PHM: COMPLETE ANTIGRAVITY IDE SEQUENTIAL PROMPT PACK
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
2. AUTONOMOUS TOOLING INTEGRATION (PONYTAIL & GRAPHIFY PROTOCOL)
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
""")

    print("Header built.")
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("".join(sections))
    print(f"Initial file written to {OUT_PATH}")

if __name__ == "__main__":
    build_prompt_pack()

