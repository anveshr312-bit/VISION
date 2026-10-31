/**
 * VISION: Procedural 3D Turbofan Jet Engine Geometry Generator
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Mechanical Architecture (High-Bypass Twin-Spool Turbofan):
 * ------------------------------------------------------------
 * 1. N1 Low-Pressure Spool (Spins at rate proportional to sensor Nf / NRf):
 *    - Fan: 24 Aerodynamic titanium blades + aerodynamic spinner nose cone
 *    - LPC (Low-Pressure Compressor): 3 rotor-stator compression stages
 *    - LPT (Low-Pressure Turbine): 4 expanding turbine stages driving N1 shaft
 *
 * 2. N2 High-Pressure Spool (Spins at higher rate proportional to sensor Nc / NRc):
 *    - HPC (High-Pressure Compressor): 5 high-density titanium stages tapering down
 *    - HPT (High-Pressure Turbine): High-temp nickel alloy disc driving N2 spool
 *
 * 3. Static Structures:
 *    - Combustor: Annular burner casing, fuel nozzles, flame liner
 *    - Outer Nacelle: Transparent aerodynamic casing and bypass duct struts
 *
 * Coordinate Convention:
 * Central engine shaft along the Z-axis. Front intake at +Z, Aft exhaust at -Z.
 */

import * as THREE from 'three';
import { materials } from './materials.js';

/**
 * Creates 24 aerodynamic wide-chord fan blades arranged radially around the hub.
 */
function createFanBlades(bladeCount = 24, innerRadius = 0.95, outerRadius = 3.2, bladeWidth = 0.45) {
  const fanGroup = new THREE.Group();
  fanGroup.name = 'FanBlades';

  // Pitch angle for turbofan blades (28 degrees in radians)
  const pitchRad = (28 * Math.PI) / 180;
  const bladeLength = outerRadius - innerRadius;

  // Single blade geometry: tapered airfoil prism
  const bladeGeo = new THREE.BoxGeometry(bladeWidth, bladeLength, 0.08);
  // Shift origin to bottom of blade for radial positioning
  bladeGeo.translate(0, bladeLength / 2, 0);

  for (let i = 0; i < bladeCount; i++) {
    const angle = (i / bladeCount) * Math.PI * 2;
    const bladeMesh = new THREE.Mesh(bladeGeo, materials.titanium);

    // Position blade around circumference of inner hub
    bladeMesh.position.set(
      Math.cos(angle) * innerRadius,
      Math.sin(angle) * innerRadius,
      0
    );

    // Rotate blade to point outward and twist by 28-degree pitch
    bladeMesh.rotation.z = angle - Math.PI / 2;
    bladeMesh.rotation.y = pitchRad;

    fanGroup.add(bladeMesh);
  }

  return fanGroup;
}

/**
 * Builds a multi-stage compressor or turbine rotor-disc stack.
 */
function createBladedDiscStage(discRadius, bladeHeight, bladeCount, thickness, mat = materials.titanium) {
  const stageGroup = new THREE.Group();

  // Central Hub Disc (cylinder along Z-axis)
  const discGeo = new THREE.CylinderGeometry(discRadius, discRadius, thickness, 32);
  discGeo.rotateX(Math.PI / 2);
  const discMesh = new THREE.Mesh(discGeo, materials.shaftAlloy);
  stageGroup.add(discMesh);

  // Radial micro-blades along outer rim
  const bladeGeo = new THREE.BoxGeometry(thickness * 0.7, bladeHeight, 0.04);
  bladeGeo.translate(0, bladeHeight / 2, 0);

  for (let i = 0; i < bladeCount; i++) {
    const angle = (i / bladeCount) * Math.PI * 2;
    const blade = new THREE.Mesh(bladeGeo, mat);
    blade.position.set(
      Math.cos(angle) * discRadius,
      Math.sin(angle) * discRadius,
      0
    );
    blade.rotation.z = angle - Math.PI / 2;
    blade.rotation.y = (18 * Math.PI) / 180;
    stageGroup.add(blade);
  }

  return stageGroup;
}

/**
 * Procedural assembly of all 6 aerospace components + transparent cowling.
 */
export function buildProceduralTurbofan() {
  const engineRoot = new THREE.Group();
  engineRoot.name = 'TurbofanEngineRoot';

  // Hierarchical Spool Groups for Dual Rotational Physics
  const n1Group = new THREE.Group();
  n1Group.name = 'N1_LowPressureSpool';

  const n2Group = new THREE.Group();
  n2Group.name = 'N2_HighPressureSpool';

  const staticGroup = new THREE.Group();
  staticGroup.name = 'StaticStructures';

  engineRoot.add(n1Group);
  engineRoot.add(n2Group);
  engineRoot.add(staticGroup);

  const components = {};

  // =========================================================================
  // 1. FAN MODULE (Z ~ +5.5 to +7.2) - Belongs to N1 Spool
  // =========================================================================
  const fanGroup = new THREE.Group();
  fanGroup.name = 'Component_FAN';
  fanGroup.userData = { componentId: 'fan', componentName: 'Fan Rotor', spool: 'N1' };

  // Central Spinner Nose Cone (pointed along +Z)
  const noseGeo = new THREE.ConeGeometry(0.95, 1.8, 32);
  noseGeo.rotateX(Math.PI / 2);
  const noseMesh = new THREE.Mesh(noseGeo, materials.spinnerNose);
  noseMesh.position.set(0, 0, 6.7);
  fanGroup.add(noseMesh);

  // Front Hub Ring
  const fanHubGeo = new THREE.CylinderGeometry(0.98, 0.98, 0.65, 32);
  fanHubGeo.rotateX(Math.PI / 2);
  const fanHubMesh = new THREE.Mesh(fanHubGeo, materials.titanium);
  fanHubMesh.position.set(0, 0, 5.7);
  fanGroup.add(fanHubMesh);

  // 24 Wide-Chord Aerodynamic Fan Blades
  const fanBlades = createFanBlades(24, 0.95, 3.2, 0.45);
  fanBlades.position.set(0, 0, 5.7);
  fanGroup.add(fanBlades);

  n1Group.add(fanGroup);
  components.fan = fanGroup;

  // =========================================================================
  // 2. LPC MODULE (Low-Pressure Compressor) (Z ~ +3.5 to +5.1) - Belongs to N1
  // =========================================================================
  const lpcGroup = new THREE.Group();
  lpcGroup.name = 'Component_LPC';
  lpcGroup.userData = { componentId: 'lpc', componentName: 'Low-Pressure Compressor (LPC)', spool: 'N1' };

  // Central LPC Drum
  const lpcDrumGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.6, 32);
  lpcDrumGeo.rotateX(Math.PI / 2);
  const lpcDrum = new THREE.Mesh(lpcDrumGeo, materials.shaftAlloy);
  lpcDrum.position.set(0, 0, 4.3);
  lpcGroup.add(lpcDrum);

  // 3 Diminishing Compressor Stages
  const lpcRadii = [2.05, 1.82, 1.62];
  const lpcZOffsets = [4.8, 4.3, 3.8];
  for (let i = 0; i < 3; i++) {
    const stage = createBladedDiscStage(0.9, lpcRadii[i] - 0.9, 28 + i * 4, 0.16, materials.titanium);
    stage.position.set(0, 0, lpcZOffsets[i]);
    lpcGroup.add(stage);
  }

  n1Group.add(lpcGroup);
  components.lpc = lpcGroup;

  // =========================================================================
  // 3. HPC MODULE (High-Pressure Compressor) (Z ~ +0.5 to +3.0) - Belongs to N2
  // =========================================================================
  const hpcGroup = new THREE.Group();
  hpcGroup.name = 'Component_HPC';
  hpcGroup.userData = { componentId: 'hpc', componentName: 'High-Pressure Compressor (HPC)', spool: 'N2' };

  // Tapered HPC Rotor Hub Core
  const hpcHubGeo = new THREE.CylinderGeometry(0.95, 0.85, 2.6, 32);
  hpcHubGeo.rotateX(Math.PI / 2);
  const hpcHub = new THREE.Mesh(hpcHubGeo, materials.shaftAlloy);
  hpcHub.position.set(0, 0, 1.8);
  hpcGroup.add(hpcHub);

  // 5 High-Density Compressor Rotor Stages
  const hpcRadii = [1.5, 1.4, 1.3, 1.2, 1.1];
  const hpcZOffsets = [2.8, 2.3, 1.8, 1.3, 0.8];
  for (let i = 0; i < 5; i++) {
    const stage = createBladedDiscStage(0.85, hpcRadii[i] - 0.85, 34 + i * 4, 0.12, materials.titanium);
    stage.position.set(0, 0, hpcZOffsets[i]);
    hpcGroup.add(stage);
  }

  n2Group.add(hpcGroup);
  components.hpc = hpcGroup;

  // =========================================================================
  // 4. COMBUSTOR MODULE (Z ~ -1.5 to +0.3) - Static (Non-rotating)
  // =========================================================================
  const combustorGroup = new THREE.Group();
  combustorGroup.name = 'Component_COMBUSTOR';
  combustorGroup.userData = { componentId: 'combustor', componentName: 'Combustion Chamber', spool: 'STATIC' };

  // Annular Burner Outer Casing
  const combOuterGeo = new THREE.CylinderGeometry(1.22, 1.18, 1.7, 32, 1, true);
  combOuterGeo.rotateX(Math.PI / 2);
  const combOuter = new THREE.Mesh(combOuterGeo, materials.combustorAlloy);
  combOuter.position.set(0, 0, -0.6);
  combustorGroup.add(combOuter);

  // Inner Flame Liner with Thermal Glow
  const combInnerGeo = new THREE.CylinderGeometry(1.12, 1.08, 1.5, 32, 1, true);
  combInnerGeo.rotateX(Math.PI / 2);
  const combInner = new THREE.Mesh(combInnerGeo, materials.flameCore);
  combInner.position.set(0, 0, -0.6);
  combustorGroup.add(combInner);

  // 16 Radially Distributed Fuel Nozzle Injectors
  const nozzleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 12);
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const nozzle = new THREE.Mesh(nozzleGeo, materials.accentGold);
    nozzle.position.set(
      Math.cos(angle) * 1.25,
      Math.sin(angle) * 1.25,
      -0.6
    );
    nozzle.rotation.z = angle + Math.PI / 2;
    combustorGroup.add(nozzle);
  }

  staticGroup.add(combustorGroup);
  components.combustor = combustorGroup;

  // =========================================================================
  // 5. HPT MODULE (High-Pressure Turbine) (Z ~ -2.7 to -1.7) - Belongs to N2
  // =========================================================================
  const hptGroup = new THREE.Group();
  hptGroup.name = 'Component_HPT';
  hptGroup.userData = { componentId: 'hpt', componentName: 'High-Pressure Turbine (HPT)', spool: 'N2' };

  // 2-Stage High-Temp Nickel Turbine Disc
  const hptStage1 = createBladedDiscStage(0.85, 0.42, 36, 0.16, materials.turbineAlloy);
  hptStage1.position.set(0, 0, -1.9);
  hptGroup.add(hptStage1);

  const hptStage2 = createBladedDiscStage(0.85, 0.44, 38, 0.16, materials.turbineAlloy);
  hptStage2.position.set(0, 0, -2.3);
  hptGroup.add(hptStage2);

  n2Group.add(hptGroup);
  components.hpt = hptGroup;

  // =========================================================================
  // 6. LPT MODULE (Low-Pressure Turbine) (Z ~ -5.5 to -2.9) - Belongs to N1
  // =========================================================================
  const lptGroup = new THREE.Group();
  lptGroup.name = 'Component_LPT';
  lptGroup.userData = { componentId: 'lpt', componentName: 'Low-Pressure Turbine (LPT)', spool: 'N1' };

  // Central Low-Pressure Shaft extending through engine core
  const shaftGeo = new THREE.CylinderGeometry(0.35, 0.35, 12.0, 24);
  shaftGeo.rotateX(Math.PI / 2);
  const shaft = new THREE.Mesh(shaftGeo, materials.shaftAlloy);
  shaft.position.set(0, 0, 0.5);
  n1Group.add(shaft);

  // 4 Expanding Low-Pressure Turbine Stages
  const lptRadii = [1.32, 1.45, 1.62, 1.82];
  const lptZOffsets = [-3.1, -3.7, -4.3, -4.9];
  for (let i = 0; i < 4; i++) {
    const stage = createBladedDiscStage(0.75, lptRadii[i] - 0.75, 40 + i * 4, 0.18, materials.turbineAlloy);
    stage.position.set(0, 0, lptZOffsets[i]);
    lptGroup.add(stage);
  }

  // Exhaust Tail Cone
  const tailGeo = new THREE.ConeGeometry(0.7, 1.6, 24);
  tailGeo.rotateX(-Math.PI / 2);
  const tailCone = new THREE.Mesh(tailGeo, materials.turbineAlloy);
  tailCone.position.set(0, 0, -5.9);
  lptGroup.add(tailCone);

  n1Group.add(lptGroup);
  components.lpt = lptGroup;

  // =========================================================================
  // 7. COWLING & NACELLE MODULE (Transparent Outer Aerodynamic Casing)
  // =========================================================================
  const casingGroup = new THREE.Group();
  casingGroup.name = 'Component_CASING';
  casingGroup.userData = { componentId: 'casing', componentName: 'Outer Nacelle Cowling', spool: 'STATIC' };

  // Outer Fan Nacelle (Cylinder with open front intake and tapered bypass exit)
  const nacelleGeo = new THREE.CylinderGeometry(3.3, 3.1, 7.5, 48, 1, true);
  nacelleGeo.rotateX(Math.PI / 2);
  const nacelleMesh = new THREE.Mesh(nacelleGeo, materials.glassCasing);
  nacelleMesh.position.set(0, 0, 3.2);
  casingGroup.add(nacelleMesh);

  // Core Engine Cowl
  const coreCowlGeo = new THREE.CylinderGeometry(1.65, 1.45, 6.0, 36, 1, true);
  coreCowlGeo.rotateX(Math.PI / 2);
  const coreCowlMesh = new THREE.Mesh(coreCowlGeo, materials.glassCasing);
  coreCowlMesh.position.set(0, 0, -0.5);
  casingGroup.add(coreCowlMesh);

  // 6 Structural Bypass Stator Struts
  const strutGeo = new THREE.BoxGeometry(0.08, 1.65, 0.45);
  strutGeo.translate(0, 2.45, 0);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const strut = new THREE.Mesh(strutGeo, materials.titanium);
    strut.position.set(0, 0, 5.0);
    strut.rotation.z = angle;
    casingGroup.add(strut);
  }

  // Exhaust Mixer Nozzle
  const mixerGeo = new THREE.CylinderGeometry(1.4, 1.15, 1.8, 36, 1, true);
  mixerGeo.rotateX(Math.PI / 2);
  const mixerMesh = new THREE.Mesh(mixerGeo, materials.combustorAlloy);
  mixerMesh.position.set(0, 0, -4.5);
  casingGroup.add(mixerMesh);

  staticGroup.add(casingGroup);
  components.casing = casingGroup;

  // Tag every mesh with its componentId for raycast selection
  for (const [compId, compGroup] of Object.entries(components)) {
    compGroup.traverse((child) => {
      if (child.isMesh) {
        child.userData.componentId = compId;
        child.userData.componentName = compGroup.userData.componentName;
        child.userData.spool = compGroup.userData.spool;
      }
    });
  }

  return {
    engineRoot,
    n1Group,
    n2Group,
    staticGroup,
    components,
  };
}

