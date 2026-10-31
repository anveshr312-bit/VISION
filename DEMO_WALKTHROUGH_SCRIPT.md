# VISION: 5-Minute Hackathon Demonstration & Pitch Script
**Vital Intelligence for System Integrity, Observation & Nostics (PS 12)**

---

## Presentation Overview & Timings

| Time Window | Section | Key Visual / Trigger | Primary Talking Point |
|---|---|---|---|
| **0:00 – 0:30** | **The Hook** | Dashboard Header & Fleet Board | Bare RUL vs. Provably Safe Maintenance Decisions |
| **0:30 – 1:30** | **The 3D Digital Twin** | Press `2` (Unit #34), Exploded view | Procedural Three.js, Telemetry Spool Sync & Thermal Heatmap |
| **1:30 – 2:30** | **Scientific Integrity & Conformal Calibration** | Conformal Fan Chart & Integrity Card | Mondrian Split-Conformal: 42% risk to ≤3.83% guarantee |
| **2:30 – 3:45** | **Economic Sandbox & Hangar Scheduler** | Press `4` (Economic Sandbox), Cost Sliders | 7.76x less wasted engine life; $1.42M annual fleet savings |
| **3:45 – 4:30** | **Live Streaming Telemetry Replay** | Live Replay Tab (`Play` at 2x) | Server-Sent Events (SSE) live cycle streaming & instant re-ranking |
| **4:30 – 5:00** | **Closing & Q&A Readiness** | Judge Presenter Bar & Docs | Offline resilience, zero paid API keys, production readiness |

---

## Detailed Word-for-Word Script

### [0:00 - 0:30] — The Hook
> *"Judges and engineers, welcome to **VISION**.*
>
> *In commercial aviation and defense logistics, **predicting a raw Remaining Useful Life number is not enough**.*
> *If an algorithm tells an airline that an engine has 18 cycles left—but the prediction has an error margin of ±12 cycles—that engine could fail in flight in 6 cycles.*
>
> *Every other team predicts naked numbers. **VISION delivers provably safe, risk-controlled maintenance decisions**.*
> *We combine physics-driven 3D digital twins, Mondrian split-conformal prediction intervals with finite-sample mathematical guarantees, and optimal stopping economic hazard rules.*
> *Let us show you how."*

---

### [0:30 - 1:30] — The 3D Digital Twin & Sensor Telemetry
> *(Action: Press keyboard key `2` or click preset "2: Imminent Failure")*
>
> *"Here on screen is **Turbofan Unit #34**.*
> *Notice that this entire 3D jet engine has **zero external CAD or download dependencies**. It is procedurally generated in Three.js and runs at a locked 60 FPS on any laptop.*
>
> *Notice how the engine is responding live to authentic C-MAPSS telemetry:*
> - *The **N1 spool** (fan, low-pressure compressor, and low-pressure turbine) spins at 2,388 RPM driven by sensor `Nf`.*
> - *The **N2 core spool** (high-pressure compressor and turbine) rotates at 9,050 RPM driven by sensor `Nc`.*
> - *Notice the **red pulsing thermal glow on the High-Pressure Compressor**.*
>
> *(Action: Click on the HPC in the 3D model or toggle Exploded View)*
>
> *When we inspect the High-Pressure Compressor, our raycaster immediately surfaces the thermodynamic cause: sensor `T30` has surged past 1,600° Rankine, and `P30` has dropped by 8.5 psia. Our system accurately identifies aerodynamic stall margin loss and rotor blade tip clearance wear."*

---

### [1:30 - 2:30] — Scientific Integrity & Conformal Calibration
> *(Action: Point to the Mondrian Conformal RUL Fan Chart)*
>
> *"Now look at the right pane. This is our **Mondrian Split-Conformal RUL Fan Chart**.*
>
> *Unlike naive models that assume uniform Gaussian error, our uncertainty calibration is **heteroscedastic**:*
> - *When an engine is young and healthy, the uncertainty band is wide because healthy engines look similar across regimes.*
> - *As the engine degrades towards end-of-life, the conformal prediction interval narrows dramatically.*
>
> *(Action: Point to the red dashed line at 15 cycles)*
>
> *The red dashed line represents the 15-cycle **Logistics Lead Time** needed to mobilize spare spools and reserve hangar bays.*
> *Instead of waiting for the point RUL to hit 15, VISION triggers an overhaul the moment the **90% Lower Bound (LB90%)** touches 15 cycles.*
> *Using the Clopper-Pearson exact binomial distribution, we mathematically prove that in-service failure risk is capped under 3.83%, whereas standard threshold rules fail 42% of the time."*

---

### [2:30 - 3:45] — Economic Optimization & Hangar Scheduler
> *(Action: Press keyboard key `4` or switch to the Economic Sandbox tab)*
>
> *"Now let's examine the bottom-line financial impact in our **Predictive Maintenance Economic Sandbox**.*
>
> *Preventive maintenance is always a balancing act:*
> 1. *If you overhaul too late, you suffer an unscheduled In-Flight Shutdown costing **$100,000 to $500,000** in AOG fees.*
> 2. *If you overhaul too early, you throw away usable life at **$100 per cycle**.*
>
> *Our closed-form optimal stopping rule computes the exact hazard threshold:*
> $$\theta^* = \frac{\gamma}{1 + \gamma} \quad \text{where } \gamma = \frac{c_w}{C_f}$$
>
> *(Action: Show the Policy Comparison Table)*
>
> *Look at our measured empirical benchmark on 100 NASA engines:*
> - *Legacy Fixed-Interval calendar maintenance prematurely discards **71.8 cycles** per engine.*
> - *VISION reduces wasted life to **9.25 cycles**—a **7.76x efficiency gain**.*
> - *For a 100-engine fleet, this saves **$1.42 Million annually**.*
>
> *Below, our **60-Cycle Hangar Bay Scheduler** automatically assigns high-risk units into three hangar bays, completely eliminating slot contention."*

---

### [3:45 - 4:30] — Live Streaming Telemetry Replay
> *(Action: Switch to "Live Replay Stream" tab, click "Start Live Stream", toggle 2x speed)*
>
> *"Finally, we demonstrate VISION operating in real-time flight conditions.*
>
> *Using **Server-Sent Events (SSE)** from our FastAPI backend, simulated flight cycles are streamed directly to the browser.*
> *Watch the fleet risk table dynamically re-rank:*
> - *As flight cycles advance, engines accumulating thermodynamic stress rise to the top of the queue.*
> - *The 3D turbofan spool rotation speeds accelerate and decelerate live.*
> - *When Unit #34 hits its lower-bound threshold, the critical overhaul dispatch banner flashes instantly without a single page reload."*

---

### [4:30 - 5:00] — Closing & Q&A Readiness
> *"To summarize:*
> - *100% offline and deterministic execution.*
> - *Zero paid API keys or cloud dependencies.*
> - *Strict scientific demarcation between authentic NASA C-MAPSS data and educational simulation.*
> - *Mathematically proven risk guarantees that protect flight safety while saving millions.*
>
> *Thank you, and we welcome your questions."*

---

## Anticipated Judge Q&A & Rebuttals

### Question 1: *"Why doesn't your model show the exact millimeter crack on blade #7?"*
> **Answer:**
> *"That is an intentional scientific design choice. C-MAPSS is an aerodynamic and thermodynamic gas-path simulation (pressures, temperatures, speeds). It does not contain structural finite element mesh coordinates.*
> *Fabricating sub-millimeter crack locations would be an ungrounded hallucination.*
> *In our **Scientific Integrity Card**, we explain how our masked modality sequence encoder is architected to ingest high-frequency vibration and eddy-current scans when deploying to physical aircraft or N-CMAPSS."*

### Question 2: *"Why did you use Mondrian Conformal Prediction instead of simple Gaussian standard deviations?"*
> **Answer:**
> *"Gaussian standard deviations assume symmetric errors and asymptotic sample sizes. Aerospace degradation error is heavily asymmetric and heteroscedastic (variance collapses near failure).*
> *Mondrian conformal prediction groups predictions into condition bins and uses distribution-free order statistics.*
> *It guarantees $1 - \alpha$ coverage regardless of the underlying data distribution, even on small test sets."*

### Question 3: *"How does the economic optimization handle changing airline cost ratios?"*
> **Answer:**
> *"Our closed-form optimal stopping rule $\theta^* = \gamma / (1 + \gamma)$ dynamically updates in real time.*
> *If fuel prices rise or supply chain constraints make spare parts more expensive, planners simply drag the slider in our Economic Sandbox, and all maintenance triggers and hangar schedules recalculate instantly."*

