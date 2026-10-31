# Prompts Part 3: Prompts 11 - 15

def get_part3():
    return """
--------------------------------------------------------------------------------
PROMPT 11: Interactive 3D Component Inspection & Telemetry Visualizer
--------------------------------------------------------------------------------
OBJECTIVE:
Connect the 3D turbofan engine to the telemetry and health monitoring system. Implement interactive mouse raycasting, component hover and click selection, dynamic thermal heatmaps, and a telemetry inspection overlay.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `frontend/src/components_3d/ComponentSelector.js`
- `frontend/src/components_3d/ComponentGlow.jsx`
- `frontend/src/components_3d/ComponentTooltip.jsx`
- `frontend/src/components_3d/TurbofanCanvas.jsx`
- `frontend/src/utils/componentSensorMap.js`

IMPLEMENTATION REQUIREMENTS:
1. Implement `frontend/src/utils/componentSensorMap.js`:
   - Map physical turbofan components to their corresponding C-MAPSS sensors and thermodynamic functions:
     - `FAN`: Sensors `s8 (Nf)`, `s13 (NRf)`. (Thrust generation, bypass ratio `s15 BPR`).
     - `LPC`: Sensor `s2 (T24 - LPC Outlet Temp)`. (Initial compression stage).
     - `HPC`: Sensors `s3 (T30 - HPC Outlet Temp)`, `s7 (P30 - HPC Outlet Pressure)`, `s11 (Ps30 - Static Pressure)`, `s9 (Nc)`, `s14 (NRc)`. (Primary degradation driver in C-MAPSS).
     - `COMBUSTOR`: Sensor `s12 (phi - Fuel Ratio)`, `s16 (farB - Fuel-Air Ratio)`. (Combustion & thermal energy release).
     - `HPT`: Sensor `s20 (W31 - HPT Coolant Bleed)`. (Drives HPC spool under high thermal stress).
     - `LPT`: Sensors `s4 (T50 - LPT Outlet Temp / Exhaust Gas Temp analogue)`, `s21 (W32 - LPT Coolant Bleed)`. (Drives fan/LPC spool).

2. Implement `frontend/src/components_3d/ComponentSelector.js`:
   - Three.js `Raycaster` tracking mouse pointer movements over canvas.
   - On hover: Highlight mesh with an outline glow or subtle emissive pulse (`#38bdf8`), change cursor to pointer.
   - On click: Focus camera smoothly (interpolate camera lookAt) onto the selected component, trigger React state update `setSelectedComponent(componentId)`.

3. Implement `frontend/src/components_3d/ComponentGlow.jsx`:
   - Dynamic thermal color ramp:
     - Component mesh material color dynamically interpolates based on telemetry:
       - `NORMAL` (Safe thermal/pressure margin): Clean metallic steel/titanium.
       - `ELEVATED` (Approaching maintenance threshold): Amber/orange thermal glow (`#f59e0b`).
       - `DEGRADED / CRITICAL` (Severe thermal degradation): Pulsing red/infrared glow (`#ef4444`).
     - In HPC component: T30/P30 temperature and pressure rise triggers real-time visual heat coloration.

4. Implement `frontend/src/components_3d/ComponentTooltip.jsx`:
   - Floating HUD overlay anchored to the 3D canvas or floating sidebar panel:
     - Displays: Selected Component Name (e.g., "High-Pressure Compressor (HPC)").
     - Subsystem Health Score: (0% - 100%).
     - Real-Time Associated Sensor Telemetry with physical units (e.g., "T30: 1598.4 °R", "P30: 554.2 psia").
     - Operational Status: "Nominal", "Thermal Degradation Observed", or "Scheduled for Borescope Inspection".

TECHNICAL CONSTRAINTS:
- Smooth camera transitions without jerky jumps (use spherical linear interpolation / lerp in requestAnimationFrame).
- Clean event listener cleanup to prevent memory leaks on component unmount.

ACCEPTANCE CRITERIA:
- Clicking each of the 6 engine sections (Fan, LPC, HPC, Combustor, HPT, LPT) selects it and highlights the mesh.
- The inspection panel immediately reflects the selected component's specific telemetry.
- Rotating the 3D model maintains accurate raycasting hits.

TESTS / VERIFICATION STEPS:
In browser / test script:
- Open dashboard at `http://localhost:5173`.
- Click on the HPC mesh in the 3D canvas.
- Verify HUD displays "High-Pressure Compressor", sensor readings for T30/P30, and health indicator.

WHAT TO DO IF IMPLEMENTATION FAILS:
If raycasting fails to hit the component, ensure bounding boxes are computed (`geometry.computeBoundingBox()`) and that recursive raycasting is enabled (`raycaster.intersectObjects(scene.children, true)`).

--------------------------------------------------------------------------------
PROMPT 12: Dual-Mode Telemetry & Scientific Integrity Architecture
--------------------------------------------------------------------------------
OBJECTIVE:
Enforce uncompromising scientific integrity by implementing a strict architectural demarcation between Empirical C-MAPSS Telemetry (the genuine NASA run-to-failure dataset) and Demonstration & Component Simulation Mode (subsystem-level localization).

FILES/COMPONENTS TO CREATE OR MODIFY:
- `frontend/src/components/ModeToggle.jsx`
- `frontend/src/components/ScientificIntegrityCard.jsx`
- `backend/app/services/telemetry_demarcation.py`
- `frontend/src/utils/telemetryModes.js`

IMPLEMENTATION REQUIREMENTS:
1. Implement Telemetry Mode Definitions in `frontend/src/utils/telemetryModes.js`:
   - `MODE_EMPIRICAL` ("Empirical C-MAPSS Mode - Rigorous Benchmark"):
     - Consumes strictly authentic NASA C-MAPSS dataset telemetry.
     - Predicts engine-level Remaining Useful Life (RUL) with conformal uncertainty bounds.
     - Displays overall engine health trajectory.
     - 3D turbofan behaves as an operational state indicator (spool speeds match Nf/Nc telemetry, exhaust thermal glow matches T50).
     - Component inspection displays actual sensor readings mapped to physical locations without fabricating unverified micro-crack diagnoses.
     - Prominently displays: "CERTIFIED EMPIRICAL DATA (NASA PCoE)".
   - `MODE_DEMO_SIMULATION` ("Demonstration & Component Simulation Mode"):
     - Clearly labeled synthetic mode created specifically to showcase multi-fault localized physics-informed maintenance.
     - Simulates synthetic localized degradation: HPC blade tip clearance wear, LPT thermal barrier coating erosion, combustor nozzle clogging.
     - 3D engine components display synthetic localized damage visualizers (fault heatmaps).
     - Prominently displays an amber banner: "SIMULATED DEMONSTRATION MODE - SYNTHETIC COMPONENT-LEVEL LOCALIZATION".

2. Implement `frontend/src/components/ModeToggle.jsx`:
   - Prominent toggle switch in the dashboard header.
   - Shows badge with clear color coding: Emerald Green for Empirical, Amber/Orange for Demonstration.
   - Persists state across views.

3. Implement `frontend/src/components/ScientificIntegrityCard.jsx`:
   - Transparent, engineer-facing technical note popup/drawer explaining:
     1. Why C-MAPSS does not localize component faults to individual physical blades (it models thermodynamic gas-path state variables).
     2. Why C-MAPSS does not contain vibration and oil pressure channels (and how VISION's masked modality architecture is designed to accommodate them when deploying to N-CMAPSS or physical aircraft).
     3. Why RUL is evaluated with confidence intervals rather than a bare point estimate.

4. Implement `backend/app/services/telemetry_demarcation.py`:
   - Annotates all API responses with `meta.data_mode`: `"EMPIRICAL_CMAPSS"` or `"SYNTHETIC_SIMULATION"`.
   - Never allows synthetic telemetry to be mixed into empirical cross-validation metrics.

TECHNICAL CONSTRAINTS:
- Absolute transparency: Judges must immediately see that the team understands the boundaries of the NASA dataset and has intentionally segregated real ML from simulated capabilities.

ACCEPTANCE CRITERIA:
- Toggling the mode updates the entire UI immediately.
- Empirical mode shows real C-MAPSS data with zero synthetic hallucinations.
- Demonstration mode clearly states its synthetic educational purpose.

TESTS / VERIFICATION STEPS:
- Load the dashboard in browser.
- Switch to Empirical Mode: Verify green badge and presence of C-MAPSS engine IDs (e.g. Unit #1 - FD001).
- Switch to Demonstration Mode: Verify amber warning banner appears and synthetic diagnostic options become accessible.

WHAT TO DO IF IMPLEMENTATION FAILS:
If state does not propagate to the 3D model, ensure mode state is managed via React Context or top-level `App.jsx` props passed to `TurbofanCanvas`.

--------------------------------------------------------------------------------
PROMPT 13: Modern Frontend Dashboard Layout & Fleet Risk Board
--------------------------------------------------------------------------------
OBJECTIVE:
Build a responsive, modern aerospace command center dashboard in React and TailwindCSS. Implement a Fleet Status Board that ranks engines by failure risk, displays operational statuses, and enables instant engine filtering and inspection.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `frontend/src/App.jsx`
- `frontend/src/components/Header.jsx`
- `frontend/src/components/FleetTable.jsx`
- `frontend/src/components/FleetStatCards.jsx`
- `frontend/src/services/api.js`

IMPLEMENTATION REQUIREMENTS:
1. Implement `frontend/src/services/api.js`:
   - Wrapper around `fetch` or `axios` with base URL `/api`.
   - Methods:
     - `getFleetOverview(subset = "FD001")`
     - `getEngineDetail(unitId, subset = "FD001")`
     - `predictRul(telemetryData)`
     - `getDecisionPolicy(subset = "FD001")`
     - `optimizeMaintenance(params)`

2. Implement `frontend/src/components/Header.jsx`:
   - Dark aerospace theme styling (`bg-slate-900 border-b border-slate-800`).
   - App branding: "VISION | Vital Intelligence for System Integrity, Observation & Nostics".
   - Dataset subset selector dropdown: `FD001 (1 Regime)`, `FD002 (6 Regimes)`, `FD003 (2 Faults)`, `FD004 (Complex)`.
   - Telemetry mode toggle badge (Empirical vs Demonstration).
   - System health indicator (Green pulse: Backend API connected).

3. Implement `frontend/src/components/FleetStatCards.jsx`:
   - Fleet KPIs:
     - Total Monitored Engines (e.g., 100).
     - Engines in Critical Status (RUL < 20 cycles or lower bound trigger hit).
     - Engines in Advisory Status (RUL 20-50 cycles).
     - Mean Fleet Health Index (e.g., 84.2%).
     - Estimated Saved Unscheduled Costs (e.g., $1.42M).

4. Implement `frontend/src/components/FleetTable.jsx`:
   - Sortable, searchable table displaying all engines:
     - Columns: Unit ID, Current Cycle, Predicted RUL (cycles), 90% Conformal Range (`[LB - UB]`), Risk Score / Failure Prob within 15 Cycles, Action Required.
     - Visual urgency badges:
       - `CRITICAL` (Red): Immediate intervention required within lead time.
       - `ADVISORY` (Amber): Maintenance window approaching.
       - `HEALTHY` (Green): Nominal operation.
     - Quick filter buttons: "Show All", "Critical Only", "Advisory".
     - Row click event selects active engine and updates the 3D twin and detail panels.

TECHNICAL CONSTRAINTS:
- Fast rendering: Support table of 260 engines (FD002) with zero lag or jank.
- Responsive layout: Adapts cleanly from laptop screens (1366x768) to multi-monitor displays (1920x1080+).

ACCEPTANCE CRITERIA:
- Fleet overview loads data from backend and populates the table.
- Selecting an engine updates the global `selectedUnitId` state.
- Filtering for "Critical" shows only engines requiring urgent action.

TESTS / VERIFICATION STEPS:
In browser:
- Start backend and frontend.
- Open `http://localhost:5173`.
- Verify Fleet Status Board renders with all test engines.
- Click on Engine Unit #34: Verify row highlights and selection state triggers.

WHAT TO DO IF IMPLEMENTATION FAILS:
If the table is empty, verify in the browser Developer Tools Network tab that `GET /api/fleet/overview` returns HTTP 200 with an array of engine objects.

--------------------------------------------------------------------------------
PROMPT 14: Engine Detail View, Sensor Telemetry Charts & RUL Fan Chart
--------------------------------------------------------------------------------
OBJECTIVE:
Build high-density analytical visualizations for the selected engine. Implement interactive multi-sensor time-series telemetry charts and an uncertainty-calibrated RUL "fan chart" showing 80%, 90%, and 95% conformal prediction intervals across cycle history.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `frontend/src/components/EngineDetail.jsx`
- `frontend/src/components/SensorChart.jsx`
- `frontend/src/components/RulFanChart.jsx`
- `frontend/src/components/SensorImportanceBar.jsx`

IMPLEMENTATION REQUIREMENTS:
1. Implement `frontend/src/components/SensorChart.jsx`:
   - Canvas-based or SVG charting (using custom lightweight SVG, Recharts, or Chart.js).
   - Plots selected sensor trajectories against cycle history:
     - Primary key channels: `T24` (LPC Temp), `T30` (HPC Temp), `T50` (LPT Temp), `P30` (HPC Pressure), `Nf` (Fan Speed), `Nc` (Core Speed).
   - Regime normalization toggle:
     - "Raw Sensor Values" (shows operational regime jumps).
     - "Condition-Corrected Deltas" (shows true underlying degradation trend cleanly).
   - Interactive crosshair cursor showing exact values at any hovered cycle.

2. Implement `frontend/src/components/RulFanChart.jsx`:
   - Visualizes RUL trajectory from cycle 1 to current cycle, and forecasts degradation forward to failure:
     - Bold line: Point estimate $\\hat{y}_t$.
     - Shaded inner band: 80% Conformal Prediction Interval (Dark cyan).
     - Shaded middle band: 90% Conformal Prediction Interval (Medium cyan).
     - Shaded outer band: 95% Conformal Prediction Interval (Light cyan/slate).
     - Bold red dashed line: Critical Logistics Lead Time threshold (15 cycles).
     - Lower Bound safety line: $\\text{LB}_{90\\%}$ trigger line.
   - As engine degrades, visually demonstrate how the conformal uncertainty band narrows near end-of-life (heteroscedastic calibration).

3. Implement `frontend/src/components/SensorImportanceBar.jsx`:
   - Displays horizontal bar chart of the top sensors driving the current degradation prediction:
     - E.g., `T30 (+34%)`, `P30 (-22%)`, `T50 (+18%)`.
     - Provides explainability for the maintenance crew.

4. Implement `frontend/src/components/EngineDetail.jsx`:
   - Assembles the 3D twin (left pane) and analytical charts (right pane) into a unified workspace.

TECHNICAL CONSTRAINTS:
- Smooth rendering when switching engines without chart flicker.
- Handle engines with varying trajectory lengths (from 31 to 300+ cycles).

ACCEPTANCE CRITERIA:
- The fan chart displays point estimate and expanding/narrowing confidence bands.
- Toggling sensors in `SensorChart` updates the line plots cleanly.
- Hovering over a cycle shows accurate sensor telemetry values.

TESTS / VERIFICATION STEPS:
- In browser, select Engine Unit #1.
- Verify `SensorChart` displays T30 and P30 trends.
- Verify `RulFanChart` plots current cycle (e.g. cycle 192) and projects forward to 0 RUL with shaded confidence intervals.

WHAT TO DO IF IMPLEMENTATION FAILS:
If SVG/canvas paths fail to render, verify that input coordinate arrays are sorted by `cycle` and contain no `NaN` or `null` values.

--------------------------------------------------------------------------------
PROMPT 15: What-If Maintenance Scheduling & Economic Simulation UI
--------------------------------------------------------------------------------
OBJECTIVE:
Build an interactive economic decision sandbox that allows maintenance planners to adjust cost parameters, simulate the trade-off between in-service failure risk and wasted engine life, and view optimal hangar maintenance schedules.

FILES/COMPONENTS TO CREATE OR MODIFY:
- `frontend/src/components/DecisionSliders.jsx`
- `frontend/src/components/PolicyComparisonTable.jsx`
- `frontend/src/components/HangarScheduler.jsx`
- `frontend/src/components/EconomicSandbox.jsx`

IMPLEMENTATION REQUIREMENTS:
1. Implement `frontend/src/components/DecisionSliders.jsx`:
   - Interactive sliders:
     - In-Service Failure Cost ($C_f$): $10,000 to $500,000 (Default: $100,000).
     - Wasted Life Cost ($c_w$ per cycle): $10 to $1,000 (Default: $100).
     - Risk Budget (Target Max Failure Rate $\\epsilon$): 0.5% to 5.0% (Default: 2.0%).
     - Logistics Lead Time: 5 to 30 cycles (Default: 15 cycles).
   - Real-time recalculation of the economic cost ratio $\\gamma = c_w / C_f$.

2. Implement `frontend/src/components/PolicyComparisonTable.jsx`:
   - Dynamic comparison table based on the measured empirical findings:
     - Policy 1: Fixed-Interval Calendar Maintenance
     - Policy 2: Naive Point-RUL Threshold
     - Policy 3: VISION Risk-Controlled Conformal Trigger
   - Shows:
     - Expected In-Service Failures per 1000 engines.
     - Mean Wasted Life per engine (e.g., 71.8 cycles for Fixed vs 7.8 cycles for VISION).
     - Net Annual Fleet Cost Savings (e.g., $1.28M saved per 100 engines).

3. Implement `frontend/src/components/HangarScheduler.jsx`:
   - Visual Gantt/Timeline chart assigning engines to 3 maintenance hangar bays over the next 60 cycles:
     - Prevents hangar slot contention.
     - Prioritizes engines where $\\text{LowerBound}_{90\\%} \\le \\text{LeadTime}$.

TECHNICAL CONSTRAINTS:
- Slider adjustments must trigger smooth, client-side re-computation or debounced backend calls without freezing the UI.

ACCEPTANCE CRITERIA:
- Moving the cost sliders dynamically updates the optimal trigger cycle and economic savings readout.
- Policy comparison table clearly shows the 5-8x reduction in wasted engine life.
- Hangar schedule updates prioritized slots based on selected engines.

TESTS / VERIFICATION STEPS:
- Open Economic Sandbox tab.
- Drag $C_f$ slider to $250,000.
- Verify trigger threshold adjusts to earlier cycles to protect against higher failure costs.

WHAT TO DO IF IMPLEMENTATION FAILS:
If scheduler calculations lock the UI, ensure policy calculation is debounced (200ms) or computed using the closed-form hazard formulas pre-calculated in Prompt 08.
"""

if __name__ == "__main__":
    print("Part 3 defined.")

