# VISION Project Map & Repository Navigation

## Overview
VISION (**Vital Intelligence for System Integrity, Observation & Nostics**) is an aerospace prognostic health management (PHM) system and interactive 3D digital twin engineered for turbofan jet engines using NASA C-MAPSS datasets (FD001–FD004).

---

## Directory Hierarchy

```
VISION/
├── AGENTS.md                          # Global codebase rules & agent operating manual
├── ARCHITECTURE.md                    # System architecture, mathematics & data flow
├── PROJECT_MAP.md                     # File directory layout & module map (this file)
├── IMPLEMENTATION_STATUS.md           # Completed, in-progress, and planned roadmap
├── API_DOCUMENTATION.md               # REST & SSE endpoint contracts
├── DEMO_WALKTHROUGH_SCRIPT.md         # Step-by-step hackathon/evaluator presentation script
├── README.md                          # Project documentation, quickstart & benchmarks
├── pytest.ini                         # Pytest configuration
├── .env / .env.example                # Environment variables (CORS, HOST, PORT, etc.)
│
├── backend/                           # FastAPI REST & SSE Streaming Backend
│   ├── app/
│   │   ├── main.py                    # Entrypoint, CORS, exception handlers, lifecycle warmup
│   │   ├── config.py                  # Pydantic v2 application settings
│   │   ├── logging_config.py          # Structured JSON logging
│   │   ├── api/                       # API route controllers
│   │   │   ├── routes_fleet.py        # /api/fleet (overview, ETOPS risk ranking)
│   │   │   ├── routes_engine.py       # /api/engine (unit telemetry, replay, physical dossier, water-wash)
│   │   │   ├── routes_predict.py      # /api/predict (RUL inference with conformal bounds)
│   │   │   ├── routes_decision.py     # /api/decision (optimal stopping & hangar scheduling)
│   │   │   └── routes_stream.py       # /api/stream (real-time SSE streaming)
│   │   ├── schemas/                   # Pydantic data schemas
│   │   │   ├── telemetry.py           # Sensor, unit, operational regime schemas
│   │   │   ├── prediction.py          # Conformal prediction & confidence interval schemas
│   │   │   └── maintenance.py         # Cost optimization & hangar dispatch schemas
│   │   └── services/                  # Business logic & algorithms
│   │       ├── inference_service.py   # Pre-warmed model inference singleton & artifact loader
│   │       ├── decision_service.py    # Hazard rate optimal stopping & maintenance dispatch
│   │       ├── stream_service.py      # Real-time SSE flight replay generator
│   │       ├── fault_tolerance.py     # Sensor dropout handling & OOD detection
│   │       ├── telemetry_demarcation.py # Empirical NASA data vs Demo simulation separation
│   │       ├── kalman_filter.py       # Extended Kalman Filter (EKF) tracking true unobservable health states
│   │       └── narrative_engine.py    # Deterministic FAA AC 20-193 compliant Operational Incident Brief generator
│   └── tests/                         # Pytest integration & endpoint tests
│       ├── test_api_routes.py         # 16 tests covering all REST/SSE routes
│       ├── test_decision_logic.py     # 5 tests covering stopping rules and cost optimization
│       └── test_kalman_filter.py      # 4 tests covering EKF initialization, tracking & anomaly rejection
│
├── frontend/                          # React 18 + Vite + TailwindCSS + Three.js
│   ├── index.html                     # HTML root template with aerospace styling
│   ├── package.json                   # Dependencies: React 18, Three.js, Lucide, Tailwind
│   ├── vite.config.js                 # Vite bundler configuration & proxy settings
│   ├── tailwind.config.js             # Tailwind CSS tokens & dark theme palette
│   └── src/
│       ├── main.jsx                   # React DOM entrypoint
│       ├── App.tsx                    # Google AI Studio Trent 1000 Digital Twin command center
│       ├── AppOld.jsx                 # Legacy dashboard orchestrator (archived)
│       ├── index.css                  # Global styles, fonts, scrollbars
│       ├── components_3d/             # Procedural Three.js 3D Turbofan Digital Twin
│       │   ├── TurbofanCanvas.jsx     # WebGL canvas container with OrbitControls
│       │   ├── TurbofanModel.jsx      # Dual-spool rotational animator (N1/N2 shafts & blades)
│       │   ├── engineGeometries.js    # Procedural 3D geometries (Fan, LPC, HPC, Combustor, HPT, LPT)
│       │   ├── materials.js           # Physical shaders (Titanium, Nickel-Alloy, Heat Thermal)
│       │   ├── ComponentGlow.jsx      # Thermal degradation overlay / mesh glow
│       │   ├── ComponentSelector.js   # Camera focus & lerp animation controllers
│       │   └── ComponentTooltip.jsx   # Interactive 3D HUD inspection overlay
│       ├── components/                # Analytical UI components
│       │   ├── Header.jsx             # Aerospace top navigation & dataset switcher
│       │   ├── FleetStatCards.jsx     # Fleet summary KPIs (Critical, Advisory, Savings)
│       │   ├── FleetTable.jsx         # Risk-ranked interactive engine fleet table
│       │   ├── EngineDetail.jsx       # Single engine inspection panel
│       │   ├── RulFanChart.jsx        # Conformal RUL prediction band visualization
│       │   ├── SensorChart.jsx        # Multi-sensor telemetry line graphs
│       │   ├── SensorImportanceBar.jsx# Feature importance and causal drivers
│       │   ├── DecisionSliders.jsx    # Cost matrix ratio controls (Cr / Cw)
│       │   ├── EconomicSandbox.jsx    # Interactive maintenance savings what-if simulation
│       │   ├── HangarScheduler.jsx    # 60-cycle forward maintenance bay planner
│       │   ├── PhysicalDossierCard.jsx# Thermal margin, soot accumulation & wash effect
│       │   ├── ScientificIntegrityCard.jsx # Conformal calibration metrics (LB90%, coverage)
│       │   ├── PolicyComparisonTable.jsx # Run-to-failure vs Fixed Interval vs VISION
│       │   ├── LiveReplayControls.jsx # Play, pause, scrub flight cycle simulation
│       │   ├── ModeToggle.jsx         # Ground Truth vs Real-Time Streaming mode
│       │   └── DemoTourModal.jsx      # Guided walkthrough modal for evaluators
│       ├── services/                  # Network & API clients
│       │   ├── api.js                 # Axios/Fetch client connecting to FastAPI backend
│       │   ├── apiFallback.js         # Offline standalone demo fallback cache
│       │   └── streamClient.js        # SSE EventSource listener for streaming telemetry
│       ├── utils/
│       │   ├── componentSensorMap.js  # Mapping between 21 engine sensors and 3D subcomponents
│       │   ├── demoPresets.js         # Presentation presets (Engine 34, Engine 49, etc.)
│       │   └── telemetryModes.js      # Mode flags and sensor labels
│       └── tests/
│           ├── smoke.test.js          # Node.js component & physics smoke test suite
│           └── DashboardSmoke.test.jsx# React UI smoke test
│
├── ml/                                # Machine Learning & Prognostics Engine
│   ├── config.py                      # Dataset hyperparameters, regime clusters, RUL caps
│   ├── data_loader.py                 # NASA C-MAPSS raw reader & train/test splits
│   ├── preprocessor.py                # Leakage-safe regime-aware StandardScaler
│   ├── feature_engineering.py         # 57 causal rolling, lag & delta features
│   ├── evaluation.py                  # NASA score, RMSE, MAE, bootstrap metrics
│   ├── train_baseline.py              # HistGradientBoosting / LightGBM 5-fold CV training
│   ├── train_deep.py                  # AeroTCN & BiGRU deep sequence training
│   ├── decision_simulation.py         # Policy backtester across full fleet
│   ├── models/
│   │   ├── baseline_gbm.py            # HistGradientBoosting tabular regressor
│   │   ├── deep_sequence.py           # 1D-CNN TCN & BiGRU temporal attention
│   │   └── quantile_heads.py          # Quantile pinball loss regressors
│   ├── uncertainty/
│   │   ├── conformal_mondrian.py      # Mondrian split-conformal calibrator
│   │   ├── evaluate_calibration.py    # Out-of-fold calibration & coverage evaluator
│   │   └── clopper_pearson.py         # Clopper-Pearson exact confidence intervals
│   └── tests/
│       ├── test_no_leakage.py         # 5 tests verifying zero lookahead/test leakage
│       ├── test_metrics.py            # 3 tests verifying NASA score & metric math
│       └── test_conformal.py          # 3 tests verifying conformal coverage bounds
│
├── data/                              # Data artifacts & datasets
│   ├── raw/                           # Raw C-MAPSS text files (FD001–FD004)
│   ├── processed/                     # Preprocessed numpy/parquet feature arrays
│   └── artifacts/                     # Serialized model weights, conformal quantiles, scalers
│
└── scripts/                           # Automation & execution scripts
    ├── download_cmapss.py             # Automatic fetcher for NASA C-MAPSS dataset
    ├── run_pipeline.py                # End-to-end data processing and model training
    ├── setup_env.bat                  # One-click Windows virtualenv & dependency setup
    ├── start_all.bat / start_all.sh   # Launch both backend and frontend servers
    ├── start_backend.bat / .sh        # Launch FastAPI backend on port 8000
    ├── start_frontend.bat / .sh       # Launch Vite frontend on port 5173
    └── run_all_tests.bat / .sh        # Complete test runner (pytest + node smoke + build)
```
