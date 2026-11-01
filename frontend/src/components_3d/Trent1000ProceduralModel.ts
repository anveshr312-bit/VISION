import * as THREE from 'three';
import { StageId, TURBOFAN_STAGE_SPECS } from '../services/prognosticsEngine';

export interface ThermalShaderUniforms {
  uThermalActive: { value: number };
  uT24Norm: { value: number };
  uT30Norm: { value: number };
  uT50Norm: { value: number };
  uStageHeatWeight: { value: number };
  uTime: { value: number };
}

export interface Trent1000MaterialEntry {
  stageId: StageId | 'COWLING';
  isOuterShell: boolean;
  mat: THREE.MeshPhysicalMaterial;
  baseColor: THREE.Color;
  baseEmissive: THREE.Color;
  baseEmissiveIntensity: number;
  thermalColor: THREE.Color;
  thermalEmissive: THREE.Color;
  thermalIntensity: number;
  shaderUniforms: ThermalShaderUniforms;
}

export interface Trent1000BlueprintStrokeEntry {
  stageId: StageId | 'COWLING';
  isOuterShell: boolean;
  line: THREE.LineSegments;
  mat: THREE.LineBasicMaterial;
  baseColor: THREE.Color;
}

export interface Trent1000AssemblyHandles {
  rootGroup: THREE.Group;
  stageGroups: Record<StageId, THREE.Group>;
  stagePinAnchors: Record<StageId, THREE.Object3D>;
  stageMaterials: Record<StageId, THREE.MeshPhysicalMaterial>;
  cowlingUpper: THREE.Group;
  cowlingLower: THREE.Group;
  spools: {
    n1: THREE.Object3D[];
    n2: THREE.Object3D[];
  };
  clickableProxies: THREE.Mesh[];
  thermalMaterials: Trent1000MaterialEntry[];
  blueprintStrokes: Trent1000BlueprintStrokeEntry[];
  dispose: () => void;
}

/**
 * Injects a custom GLSL thermal heatmap shader into MeshPhysicalMaterial via onBeforeCompile.
 * Maps live engine sensor data (T24, T30, T50) and 3D vertex coordinates (radial tip + axial gas-path)
 * onto a 5-stop aerospace FLIR gradient from deep blue (#1d4ed8) -> cyan (#00e5ff) -> emerald (#10b981)
 * -> vibrant amber (#facc15) -> bright crimson (#ff1e42).
 */
function attachCustomThermalShader(
  mat: THREE.MeshPhysicalMaterial,
  stageHeatWeight: number
): ThermalShaderUniforms {
  const uniforms: ThermalShaderUniforms = {
    uThermalActive: { value: 0.0 },
    uT24Norm: { value: 0.65 },
    uT30Norm: { value: 0.85 },
    uT50Norm: { value: 0.78 },
    uStageHeatWeight: { value: stageHeatWeight },
    uTime: { value: 0.0 },
  };

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uThermalActive = uniforms.uThermalActive;
    shader.uniforms.uT24Norm = uniforms.uT24Norm;
    shader.uniforms.uT30Norm = uniforms.uT30Norm;
    shader.uniforms.uT50Norm = uniforms.uT50Norm;
    shader.uniforms.uStageHeatWeight = uniforms.uStageHeatWeight;
    shader.uniforms.uTime = uniforms.uTime;

    shader.vertexShader =
      `
      varying vec3 vThermalLocalPos;
      ` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vThermalLocalPos = position;
        `
      );

    shader.fragmentShader =
      `
      uniform float uThermalActive;
      uniform float uT24Norm;
      uniform float uT30Norm;
      uniform float uT50Norm;
      uniform float uStageHeatWeight;
      uniform float uTime;
      varying vec3 vThermalLocalPos;

      vec3 sampleAerospaceThermalGradient(float t) {
        float c = clamp(t, 0.0, 1.0);
        vec3 colBlue    = vec3(0.09, 0.32, 0.92); // Cool Intake Blue (#1752eb)
        vec3 colCyan    = vec3(0.00, 0.90, 1.00); // LPC Cryo Cyan (#00e5ff)
        vec3 colEmerald = vec3(0.06, 0.73, 0.51); // Mid-Compressor Emerald (#10b981)
        vec3 colAmber   = vec3(0.98, 0.80, 0.08); // HPC Thermal Warning Amber (#facc15)
        vec3 colCrimson = vec3(1.00, 0.12, 0.26); // Hot-Section Bright Crimson (#ff1f42)

        if (c < 0.25) {
          return mix(colBlue, colCyan, c / 0.25);
        } else if (c < 0.50) {
          return mix(colCyan, colEmerald, (c - 0.25) / 0.25);
        } else if (c < 0.75) {
          return mix(colEmerald, colAmber, (c - 0.50) / 0.25);
        } else {
          return mix(colAmber, colCrimson, (c - 0.75) / 0.25);
        }
      }
      ` +
      shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>
        if (uThermalActive > 0.01) {
          float radialDist = clamp(length(vThermalLocalPos.xy) / 2.1, 0.0, 1.0);
          float axialWave = 0.06 * sin(vThermalLocalPos.z * 3.5 + uTime * 2.2);

          // Blend live T24 (LPC), T30 (HPC), and T50 (EGT) normalized sensor readings
          float sensorDrive = mix(
            uT24Norm * 0.45,
            mix(uT30Norm, uT50Norm, smoothstep(0.55, 0.95, uStageHeatWeight)),
            smoothstep(0.15, 0.85, uStageHeatWeight)
          );

          // Blade tip rubbing and core gas-path hotspot intensification
          float tipHotspot = radialDist * 0.18 * smoothstep(0.35, 1.0, uStageHeatWeight);
          float heatIndex = clamp(uStageHeatWeight * 0.68 + sensorDrive * 0.34 + tipHotspot + axialWave, 0.0, 1.0);

          vec3 flirColor = sampleAerospaceThermalGradient(heatIndex);
          // Add incandescent core bloom on high-temperature crimson zones
          vec3 hotGlow = flirColor * (0.72 + 0.55 * smoothstep(0.65, 1.0, heatIndex));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, hotGlow, uThermalActive * 0.88);
        }
        `
      );
  };

  mat.needsUpdate = true;
  return uniforms;
}

/**
 * Creates a fine machined satin aluminum / titanium micro-texture
 */
function createSatinMachinedTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 2) {
      const v = 148 + Math.floor(Math.sin(y * 0.4) * 10 + (y % 4) * 2);
      ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
      ctx.fillRect(0, y, 256, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function createRotorBladeRing(
  bladeCount: number,
  innerRadius: number,
  outerRadius: number,
  chordZ: number,
  twistRad: number,
  material: THREE.Material
): THREE.InstancedMesh {
  const bladeHeight = Math.max(0.15, outerRadius - innerRadius);
  const bladeWidth = Math.max(0.06, (2 * Math.PI * innerRadius) / (bladeCount * 1.45));
  const geom = new THREE.BoxGeometry(bladeWidth, bladeHeight, chordZ);
  geom.translate(0, innerRadius + bladeHeight * 0.5, 0);

  const instanced = new THREE.InstancedMesh(geom, material, bladeCount);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < bladeCount; i++) {
    const angle = (i / bladeCount) * Math.PI * 2;
    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, 0, angle);
    dummy.rotateY(twistRad);
    dummy.updateMatrix();
    instanced.setMatrixAt(i, dummy.matrix);
  }
  instanced.instanceMatrix.needsUpdate = true;
  instanced.computeBoundingSphere();
  return instanced;
}

/**
 * Builds a circular blueprint wireframe ring + radial spokes for CAD X-Ray view
 */
function createBlueprintRingGeometry(
  radiusInner: number,
  radiusOuter: number,
  zPos: number,
  spokes = 16
): THREE.BufferGeometry {
  const points: number[] = [];
  const segs = 48;
  for (let i = 0; i < segs; i++) {
    const a1 = (i / segs) * Math.PI * 2;
    const a2 = ((i + 1) / segs) * Math.PI * 2;
    points.push(
      Math.cos(a1) * radiusOuter,
      Math.sin(a1) * radiusOuter,
      zPos,
      Math.cos(a2) * radiusOuter,
      Math.sin(a2) * radiusOuter,
      zPos
    );
    points.push(
      Math.cos(a1) * radiusInner,
      Math.sin(a1) * radiusInner,
      zPos,
      Math.cos(a2) * radiusInner,
      Math.sin(a2) * radiusInner,
      zPos
    );
  }
  for (let s = 0; s < spokes; s++) {
    const a = (s / spokes) * Math.PI * 2;
    points.push(
      Math.cos(a) * radiusInner,
      Math.sin(a) * radiusInner,
      zPos,
      Math.cos(a) * radiusOuter,
      Math.sin(a) * radiusOuter,
      zPos
    );
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geom;
}

/**
 * Builds the procedural Rolls-Royce Trent 1000 High-Bypass Turbofan Cutaway 3D Model
 * Features:
 * 1. Custom GLSL Thermal Shader driven by live T24, T30, T50 sensor data (blue -> cyan -> amber -> bright crimson).
 * 2. Blueprint Stroke & X-Ray Transparency: outer casings and adjacent stages become transparent
 *    with glowing CAD blueprint edge strokes while the zoomed inner stage stays solid & crisp.
 */
export function buildTrent1000CutawayModel(renderer: THREE.WebGLRenderer): Trent1000AssemblyHandles {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Trent1000_DigitalTwin';

  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];
  const texturesToDispose: THREE.Texture[] = [];

  const machinedTex = createSatinMachinedTexture(renderer);
  texturesToDispose.push(machinedTex);

  const thermalMaterials: Trent1000MaterialEntry[] = [];
  const blueprintStrokes: Trent1000BlueprintStrokeEntry[] = [];

  const registerMat = (
    stageId: StageId | 'COWLING',
    isOuterShell: boolean,
    params: THREE.MeshPhysicalMaterialParameters,
    thermalColorHex: string,
    thermalEmissiveHex: string,
    thermalIntensity: number
  ): THREE.MeshPhysicalMaterial => {
    const mat = new THREE.MeshPhysicalMaterial({
      bumpMap: machinedTex,
      bumpScale: 0.004,
      transparent: true,
      opacity: 1.0,
      ...params,
    });
    const shaderUniforms = attachCustomThermalShader(mat, thermalIntensity);
    materialsToDispose.push(mat);
    thermalMaterials.push({
      stageId,
      isOuterShell,
      mat,
      baseColor: mat.color.clone(),
      baseEmissive: mat.emissive.clone(),
      baseEmissiveIntensity: mat.emissiveIntensity ?? 0.1,
      thermalColor: new THREE.Color(thermalColorHex),
      thermalEmissive: new THREE.Color(thermalEmissiveHex),
      thermalIntensity,
      shaderUniforms,
    });
    return mat;
  };

  const attachBlueprintEdges = (
    parent: THREE.Object3D,
    sourceGeom: THREE.BufferGeometry,
    stageId: StageId | 'COWLING',
    isOuterShell: boolean,
    strokeHex: string,
    thresholdAngle = 18
  ): THREE.LineSegments => {
    const edgeGeom = new THREE.EdgesGeometry(sourceGeom, thresholdAngle);
    geometriesToDispose.push(edgeGeom);
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(strokeHex),
      transparent: true,
      opacity: isOuterShell ? 0.28 : 0.18,
      depthWrite: false,
    });
    materialsToDispose.push(lineMat);
    const lines = new THREE.LineSegments(edgeGeom, lineMat);
    parent.add(lines);
    blueprintStrokes.push({
      stageId,
      isOuterShell,
      line: lines,
      mat: lineMat,
      baseColor: new THREE.Color(strokeHex),
    });
    return lines;
  };

  const attachBlueprintCustomLines = (
    parent: THREE.Object3D,
    lineGeom: THREE.BufferGeometry,
    stageId: StageId | 'COWLING',
    isOuterShell: boolean,
    strokeHex: string
  ): THREE.LineSegments => {
    geometriesToDispose.push(lineGeom);
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(strokeHex),
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    materialsToDispose.push(lineMat);
    const lines = new THREE.LineSegments(lineGeom, lineMat);
    parent.add(lines);
    blueprintStrokes.push({
      stageId,
      isOuterShell,
      line: lines,
      mat: lineMat,
      baseColor: new THREE.Color(strokeHex),
    });
    return lines;
  };

  // ============================================================================
  // ENHANCED MULTI-ALLOY AEROSPACE NORMAL & CUSTOM SHADER THERMAL MATERIALS
  // ============================================================================
  // 1. FAN: Cryo-Blue intake (thermalIntensity = 0.08)
  const fanMat = registerMat(
    'FAN',
    false,
    {
      color: new THREE.Color('#7dd3fc'),
      metalness: 0.72,
      roughness: 0.22,
      clearcoat: 0.45,
      emissive: new THREE.Color('#0284c7'),
      emissiveIntensity: 0.18,
    },
    '#1d4ed8',
    '#00e5ff',
    0.08
  );

  // 2. LPC: Cool Cyan-Blue driven by T24 (thermalIntensity = 0.32)
  const lpcMat = registerMat(
    'LPC',
    false,
    {
      color: new THREE.Color('#38bdf8'),
      metalness: 0.74,
      roughness: 0.24,
      emissive: new THREE.Color('#0369a1'),
      emissiveIntensity: 0.22,
    },
    '#00e5ff',
    '#0284c7',
    0.32
  );

  // 3. HPC: Golden-Amber to Crimson hotspot driven by T30 (thermalIntensity = 0.72)
  const hpcMat = registerMat(
    'HPC',
    false,
    {
      color: new THREE.Color('#fbbf24'),
      metalness: 0.70,
      roughness: 0.22,
      emissive: new THREE.Color('#d97706'),
      emissiveIntensity: 0.30,
    },
    '#facc15',
    '#ef4444',
    0.72
  );

  // 4. COMBUSTOR: Bright Crimson Core (thermalIntensity = 0.98)
  const combustorMat = registerMat(
    'COMBUSTOR',
    false,
    {
      color: new THREE.Color('#fb923c'),
      metalness: 0.58,
      roughness: 0.24,
      emissive: new THREE.Color('#ea580c'),
      emissiveIntensity: 0.48,
    },
    '#ff1e42',
    '#ef4444',
    0.98
  );

  // 5. HPT: Bright Crimson Turbine driven by T50 & T30 (thermalIntensity = 0.94)
  const hptMat = registerMat(
    'HPT',
    false,
    {
      color: new THREE.Color('#f43f5e'),
      metalness: 0.65,
      roughness: 0.22,
      emissive: new THREE.Color('#e11d48'),
      emissiveIntensity: 0.44,
    },
    '#ff1e42',
    '#e11d48',
    0.94
  );

  // 6. IPT: Intermediate-Pressure Turbine driven by T50 & N2 spool (thermalIntensity = 0.78)
  const iptMat = registerMat(
    'IPT',
    false,
    {
      color: new THREE.Color('#fb923c'),
      metalness: 0.68,
      roughness: 0.22,
      emissive: new THREE.Color('#d97706'),
      emissiveIntensity: 0.35,
    },
    '#f97316',
    '#ea580c',
    0.78
  );

  // 7. LPT: Exhaust Plume Amber-Crimson driven by T50 (thermalIntensity = 0.62)
  const lptMat = registerMat(
    'LPT',
    false,
    {
      color: new THREE.Color('#c084fc'),
      metalness: 0.72,
      roughness: 0.26,
      emissive: new THREE.Color('#7c3aed'),
      emissiveIntensity: 0.22,
    },
    '#f97316',
    '#ef4444',
    0.62
  );

  const spinnerConeMat = registerMat(
    'FAN',
    false,
    {
      color: new THREE.Color('#e2e8f0'),
      metalness: 0.55,
      roughness: 0.25,
      clearcoat: 0.6,
      emissive: new THREE.Color('#0ea5e9'),
      emissiveIntensity: 0.1,
    },
    '#1d4ed8',
    '#0284c7',
    0.02
  );

  const cowlingOuterMat = registerMat(
    'COWLING',
    true,
    {
      color: new THREE.Color('#94a3b8'),
      metalness: 0.48,
      roughness: 0.32,
      clearcoat: 0.35,
      side: THREE.DoubleSide,
    },
    '#1e3a8a',
    '#0ea5e9',
    0.15
  );

  const yellowAccentRingMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#facc15'),
  });
  materialsToDispose.push(yellowAccentRingMat);

  const stageMaterials: Record<StageId, THREE.MeshPhysicalMaterial> = {
    FAN: fanMat,
    LPC: lpcMat,
    HPC: hpcMat,
    COMBUSTOR: combustorMat,
    HPT: hptMat,
    IPT: iptMat,
    LPT: lptMat,
  };

  const createStageShroudMat = (stageId: StageId, thermalHex: string, weight: number) =>
    registerMat(
      stageId,
      true,
      {
        color: new THREE.Color('#64748b'),
        metalness: 0.55,
        roughness: 0.35,
        side: THREE.DoubleSide,
      },
      thermalHex,
      thermalHex,
      weight
    );

  const stageGroups: Record<StageId, THREE.Group> = {
    FAN: new THREE.Group(),
    LPC: new THREE.Group(),
    HPC: new THREE.Group(),
    COMBUSTOR: new THREE.Group(),
    HPT: new THREE.Group(),
    IPT: new THREE.Group(),
    LPT: new THREE.Group(),
  };

  const stagePinAnchors: Record<StageId, THREE.Object3D> = {
    FAN: new THREE.Object3D(),
    LPC: new THREE.Object3D(),
    HPC: new THREE.Object3D(),
    COMBUSTOR: new THREE.Object3D(),
    HPT: new THREE.Object3D(),
    IPT: new THREE.Object3D(),
    LPT: new THREE.Object3D(),
  };

  const spools = {
    n1: [] as THREE.Object3D[],
    n2: [] as THREE.Object3D[],
  };

  const clickableProxies: THREE.Mesh[] = [];

  (Object.keys(TURBOFAN_STAGE_SPECS) as StageId[]).forEach((stageId) => {
    const spec = TURBOFAN_STAGE_SPECS[stageId];
    const grp = stageGroups[stageId];
    grp.name = `STAGE_${stageId}`;
    grp.position.set(0, 0, spec.axialZ);
    rootGroup.add(grp);

    const anchor = stagePinAnchors[stageId];
    anchor.position.set(0, spec.radialY * 0.72, 0);
    grp.add(anchor);
  });

  // 1. STAGE: FAN (Z = +4.2)
  {
    const fanGroup = stageGroups.FAN;
    const fanRotor = new THREE.Group();

    const spinnerGeom = new THREE.ConeGeometry(0.68, 1.45, 32);
    geometriesToDispose.push(spinnerGeom);
    spinnerGeom.rotateX(Math.PI / 2);
    const spinnerMesh = new THREE.Mesh(spinnerGeom, spinnerConeMat);
    spinnerMesh.position.z = 0.85;
    fanRotor.add(spinnerMesh);

    const hubGeom = new THREE.CylinderGeometry(0.68, 0.72, 0.85, 32);
    geometriesToDispose.push(hubGeom);
    hubGeom.rotateX(Math.PI / 2);
    fanRotor.add(new THREE.Mesh(hubGeom, fanMat));

    const fanBlades = createRotorBladeRing(20, 0.68, 2.22, 0.46, 0.42, fanMat);
    geometriesToDispose.push(fanBlades.geometry);
    fanRotor.add(fanBlades);

    spools.n1.push(fanRotor);
    fanGroup.add(fanRotor);

    const shroudGeom = new THREE.CylinderGeometry(2.28, 2.24, 1.35, 40, 1, true, Math.PI * 0.25, Math.PI * 1.45);
    geometriesToDispose.push(shroudGeom);
    shroudGeom.rotateX(Math.PI / 2);
    const fanShroudMat = createStageShroudMat('FAN', '#1d4ed8', 0.08);
    const shroudMesh = new THREE.Mesh(shroudGeom, fanShroudMat);
    fanGroup.add(shroudMesh);
    attachBlueprintEdges(shroudMesh, shroudGeom, 'FAN', true, '#00e5ff', 12);
    attachBlueprintCustomLines(
      fanGroup,
      createBlueprintRingGeometry(0.7, 2.26, 0.35, 20),
      'FAN',
      false,
      '#00e5ff'
    );

    const lipGeom = new THREE.TorusGeometry(2.28, 0.035, 16, 64);
    geometriesToDispose.push(lipGeom);
    const lipMesh = new THREE.Mesh(lipGeom, yellowAccentRingMat);
    lipMesh.position.z = 0.66;
    fanGroup.add(lipMesh);
  }

  // 2. STAGE: LPC BOOSTER (Z = +2.1)
  {
    const lpcGroup = stageGroups.LPC;
    const lpcRotor = new THREE.Group();

    const drumGeom = new THREE.CylinderGeometry(0.82, 0.92, 1.85, 32);
    geometriesToDispose.push(drumGeom);
    drumGeom.rotateX(Math.PI / 2);
    lpcRotor.add(new THREE.Mesh(drumGeom, lpcMat));

    for (let row = 0; row < 4; row++) {
      const zOff = 0.65 - row * 0.42;
      const rOut = 1.56 - row * 0.05;
      const ring = createRotorBladeRing(28, 0.84, rOut, 0.16, 0.32, lpcMat);
      geometriesToDispose.push(ring.geometry);
      ring.position.z = zOff;
      lpcRotor.add(ring);
    }

    spools.n1.push(lpcRotor);
    lpcGroup.add(lpcRotor);

    const shroudGeom = new THREE.CylinderGeometry(1.62, 1.48, 1.9, 36, 1, true, Math.PI * 0.35, Math.PI * 1.3);
    geometriesToDispose.push(shroudGeom);
    shroudGeom.rotateX(Math.PI / 2);
    const lpcShroudMat = createStageShroudMat('LPC', '#00e5ff', 0.32);
    const shroudMesh = new THREE.Mesh(shroudGeom, lpcShroudMat);
    lpcGroup.add(shroudMesh);
    attachBlueprintEdges(shroudMesh, shroudGeom, 'LPC', true, '#38bdf8', 12);
    attachBlueprintCustomLines(
      lpcGroup,
      createBlueprintRingGeometry(0.84, 1.58, 0.0, 16),
      'LPC',
      false,
      '#38bdf8'
    );
  }

  // 3. STAGE: HPC CORE (Z = +0.2)
  {
    const hpcGroup = stageGroups.HPC;
    const hpcRotor = new THREE.Group();

    const coreGeom = new THREE.CylinderGeometry(0.78, 0.72, 1.75, 32);
    geometriesToDispose.push(coreGeom);
    coreGeom.rotateX(Math.PI / 2);
    hpcRotor.add(new THREE.Mesh(coreGeom, hpcMat));

    for (let row = 0; row < 6; row++) {
      const zOff = 0.68 - row * 0.27;
      const rOut = 1.32 - row * 0.03;
      const ring = createRotorBladeRing(34, 0.74, rOut, 0.12, 0.28, hpcMat);
      geometriesToDispose.push(ring.geometry);
      ring.position.z = zOff;
      hpcRotor.add(ring);
    }

    spools.n2.push(hpcRotor);
    hpcGroup.add(hpcRotor);

    const shroudGeom = new THREE.CylinderGeometry(1.38, 1.26, 1.8, 36, 1, true, Math.PI * 0.4, Math.PI * 1.25);
    geometriesToDispose.push(shroudGeom);
    shroudGeom.rotateX(Math.PI / 2);
    const hpcShroudMat = createStageShroudMat('HPC', '#facc15', 0.72);
    const shroudMesh = new THREE.Mesh(shroudGeom, hpcShroudMat);
    hpcGroup.add(shroudMesh);
    attachBlueprintEdges(shroudMesh, shroudGeom, 'HPC', true, '#facc15', 12);
    attachBlueprintCustomLines(
      hpcGroup,
      createBlueprintRingGeometry(0.74, 1.34, 0.0, 18),
      'HPC',
      false,
      '#facc15'
    );
  }

  // 4. STAGE: ANNULAR COMBUSTOR (Z = -1.3)
  {
    const combGroup = stageGroups.COMBUSTOR;

    const linerGeom = new THREE.CylinderGeometry(1.18, 1.22, 1.15, 36, 1, false, Math.PI * 0.25, Math.PI * 1.55);
    geometriesToDispose.push(linerGeom);
    linerGeom.rotateX(Math.PI / 2);
    const linerMesh = new THREE.Mesh(linerGeom, combustorMat);
    combGroup.add(linerMesh);
    attachBlueprintEdges(linerMesh, linerGeom, 'COMBUSTOR', false, '#f97316', 15);

    const nozzleGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.36, 12);
    geometriesToDispose.push(nozzleGeom);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const nMesh = new THREE.Mesh(nozzleGeom, yellowAccentRingMat);
      nMesh.position.set(Math.cos(a) * 1.22, Math.sin(a) * 1.22, 0.2);
      nMesh.rotation.z = a;
      combGroup.add(nMesh);
    }

    attachBlueprintCustomLines(
      combGroup,
      createBlueprintRingGeometry(0.68, 1.25, 0.0, 18),
      'COMBUSTOR',
      true,
      '#f97316'
    );
  }

  // 5. STAGE: HPT (Z = -2.6)
  {
    const hptGroup = stageGroups.HPT;
    const hptRotor = new THREE.Group();

    const diskGeom = new THREE.CylinderGeometry(0.74, 0.78, 0.95, 32);
    geometriesToDispose.push(diskGeom);
    diskGeom.rotateX(Math.PI / 2);
    hptRotor.add(new THREE.Mesh(diskGeom, hptMat));

    for (let row = 0; row < 2; row++) {
      const zOff = 0.24 - row * 0.45;
      const ring = createRotorBladeRing(32, 0.74, 1.28 + row * 0.06, 0.18, -0.38, hptMat);
      geometriesToDispose.push(ring.geometry);
      ring.position.z = zOff;
      hptRotor.add(ring);
    }

    spools.n2.push(hptRotor);
    hptGroup.add(hptRotor);

    const shroudGeom = new THREE.CylinderGeometry(1.34, 1.42, 1.05, 36, 1, true, Math.PI * 0.4, Math.PI * 1.25);
    geometriesToDispose.push(shroudGeom);
    shroudGeom.rotateX(Math.PI / 2);
    const hptShroudMat = createStageShroudMat('HPT', '#ff1e42', 0.94);
    const shroudMesh = new THREE.Mesh(shroudGeom, hptShroudMat);
    hptGroup.add(shroudMesh);
    attachBlueprintEdges(shroudMesh, shroudGeom, 'HPT', true, '#ef4444', 12);
    attachBlueprintCustomLines(
      hptGroup,
      createBlueprintRingGeometry(0.74, 1.38, 0.0, 16),
      'HPT',
      false,
      '#ef4444'
    );
  }

  // 6. STAGE: IPT (Z = -3.4) - Rolls-Royce Trent 1000 Single-Stage IP Turbine (drives IPC on N2 spool)
  {
    const iptGroup = stageGroups.IPT;
    const iptRotor = new THREE.Group();

    const iptHubGeom = new THREE.CylinderGeometry(0.70, 0.68, 0.45, 32);
    geometriesToDispose.push(iptHubGeom);
    iptHubGeom.rotateX(Math.PI / 2);
    iptRotor.add(new THREE.Mesh(iptHubGeom, iptMat));

    // Single-stage high-efficiency IP turbine blisk (34 aerofoil blades)
    const iptBladeRing = createRotorBladeRing(34, 0.70, 1.40, 0.16, -0.38, iptMat);
    geometriesToDispose.push(iptBladeRing.geometry);
    iptBladeRing.position.z = 0.0;
    iptRotor.add(iptBladeRing);

    spools.n2.push(iptRotor); // IPT is keyed to N2 spool!
    iptGroup.add(iptRotor);

    const iptShroudGeom = new THREE.CylinderGeometry(1.40, 1.46, 0.65, 36, 1, true, Math.PI * 0.38, Math.PI * 1.25);
    geometriesToDispose.push(iptShroudGeom);
    iptShroudGeom.rotateX(Math.PI / 2);
    const iptShroudMat = createStageShroudMat('IPT', '#f97316', 0.78);
    const iptShroudMesh = new THREE.Mesh(iptShroudGeom, iptShroudMat);
    iptGroup.add(iptShroudMesh);
    attachBlueprintEdges(iptShroudMesh, iptShroudGeom, 'IPT', true, '#f97316', 12);
    attachBlueprintCustomLines(
      iptGroup,
      createBlueprintRingGeometry(0.70, 1.44, 0.0, 16),
      'IPT',
      false,
      '#f97316'
    );
  }

  // 7. STAGE: LPT (Z = -4.4)
  {
    const lptGroup = stageGroups.LPT;
    const lptRotor = new THREE.Group();

    const shaftGeom = new THREE.CylinderGeometry(0.72, 0.48, 1.9, 32);
    geometriesToDispose.push(shaftGeom);
    shaftGeom.rotateX(Math.PI / 2);
    lptRotor.add(new THREE.Mesh(shaftGeom, lptMat));

    for (let row = 0; row < 5; row++) {
      const zOff = 0.72 - row * 0.34;
      const outerR = 1.38 + row * 0.08;
      const ring = createRotorBladeRing(30, 0.68, outerR, 0.14, -0.32, lptMat);
      geometriesToDispose.push(ring.geometry);
      ring.position.z = zOff;
      lptRotor.add(ring);
    }

    const coneGeom = new THREE.ConeGeometry(0.58, 1.35, 32);
    geometriesToDispose.push(coneGeom);
    coneGeom.rotateX(-Math.PI / 2);
    const coneMesh = new THREE.Mesh(coneGeom, spinnerConeMat);
    coneMesh.position.z = -1.45;
    lptRotor.add(coneMesh);

    spools.n1.push(lptRotor);
    lptGroup.add(lptRotor);

    const nozzleGeom = new THREE.CylinderGeometry(1.48, 1.62, 1.95, 36, 1, true, Math.PI * 0.35, Math.PI * 1.3);
    geometriesToDispose.push(nozzleGeom);
    nozzleGeom.rotateX(Math.PI / 2);
    const lptShroudMat = createStageShroudMat('LPT', '#f97316', 0.62);
    const nozzleMesh = new THREE.Mesh(nozzleGeom, lptShroudMat);
    lptGroup.add(nozzleMesh);
    attachBlueprintEdges(nozzleMesh, nozzleGeom, 'LPT', true, '#c084fc', 12);
    attachBlueprintCustomLines(
      lptGroup,
      createBlueprintRingGeometry(0.68, 1.56, 0.0, 16),
      'LPT',
      false,
      '#c084fc'
    );
  }

  // Central Coaxial Shaft
  const mainShaftGeom = new THREE.CylinderGeometry(0.32, 0.32, 9.6, 24);
  geometriesToDispose.push(mainShaftGeom);
  mainShaftGeom.rotateX(Math.PI / 2);
  const mainShaftMesh = new THREE.Mesh(mainShaftGeom, fanMat);
  mainShaftMesh.position.z = -0.2;
  rootGroup.add(mainShaftMesh);

  // Split Outer Nacelle Cowling with CAD Blueprint Wireframe Stroke Overlays
  const cowlingUpper = new THREE.Group();
  const cowlingLower = new THREE.Group();

  const nacelleProfile = [
    new THREE.Vector2(1.85, -3.6),
    new THREE.Vector2(2.25, -1.5),
    new THREE.Vector2(2.42, 1.2),
    new THREE.Vector2(2.45, 3.6),
    new THREE.Vector2(2.32, 4.9),
    new THREE.Vector2(2.24, 4.9),
  ];

  const upperLatheGeom = new THREE.LatheGeometry(nacelleProfile, 32, Math.PI * 0.72, Math.PI * 0.65);
  geometriesToDispose.push(upperLatheGeom);
  upperLatheGeom.rotateX(Math.PI / 2);
  const upperCowlingMesh = new THREE.Mesh(upperLatheGeom, cowlingOuterMat);
  cowlingUpper.add(upperCowlingMesh);
  attachBlueprintEdges(upperCowlingMesh, upperLatheGeom, 'COWLING', true, '#00e5ff', 8);

  const pylonGeom = new THREE.BoxGeometry(0.36, 0.85, 4.2);
  geometriesToDispose.push(pylonGeom);
  const pylonMesh = new THREE.Mesh(pylonGeom, cowlingOuterMat);
  pylonMesh.position.set(0, 2.65, 0.4);
  cowlingUpper.add(pylonMesh);
  attachBlueprintEdges(pylonMesh, pylonGeom, 'COWLING', true, '#00e5ff', 15);

  const lowerLatheGeom = new THREE.LatheGeometry(nacelleProfile, 32, Math.PI * 1.45, Math.PI * 0.85);
  geometriesToDispose.push(lowerLatheGeom);
  lowerLatheGeom.rotateX(Math.PI / 2);
  const lowerCowlingMesh = new THREE.Mesh(lowerLatheGeom, cowlingOuterMat);
  cowlingLower.add(lowerCowlingMesh);
  attachBlueprintEdges(lowerCowlingMesh, lowerLatheGeom, 'COWLING', true, '#00e5ff', 8);

  rootGroup.add(cowlingUpper);
  rootGroup.add(cowlingLower);

  // Invisible Raycast Collision Proxies
  const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
  materialsToDispose.push(proxyMat);

  (Object.keys(TURBOFAN_STAGE_SPECS) as StageId[]).forEach((stageId) => {
    const radius = stageId === 'FAN' ? 2.3 : stageId === 'LPC' || stageId === 'LPT' || stageId === 'IPT' ? 1.65 : 1.38;
    const length = stageId === 'FAN' ? 1.4 : 1.55;
    const proxyGeom = new THREE.CylinderGeometry(radius, radius, length, 16);
    geometriesToDispose.push(proxyGeom);
    proxyGeom.rotateX(Math.PI / 2);
    const proxyMesh = new THREE.Mesh(proxyGeom, proxyMat);
    proxyMesh.userData.stageId = stageId;
    stageGroups[stageId].add(proxyMesh);
    clickableProxies.push(proxyMesh);
  });

  rootGroup.rotation.y = -Math.PI * 0.36;

  return {
    rootGroup,
    stageGroups,
    stagePinAnchors,
    stageMaterials,
    cowlingUpper,
    cowlingLower,
    spools,
    clickableProxies,
    thermalMaterials,
    blueprintStrokes,
    dispose: () => {
      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
      texturesToDispose.forEach((t) => t.dispose());
    },
  };
}
