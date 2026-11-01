import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Activity,
  Droplets,
  Eye,
  EyeOff,
  Flame,
  Layers,
  Maximize2,
  Minimize2,
  Radio,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Thermometer,
} from 'lucide-react';
import {
  EngineTelemetry,
  StageId,
  TURBOFAN_STAGE_SPECS,
} from '../services/prognosticsEngine';
import { buildTrent1000CutawayModel } from './Trent1000ProceduralModel';

interface DigitalTwinViewportProps {
  engine: EngineTelemetry;
  onWaterWash: (engineId: string) => void;
  onToggleSensorFault: (engineId: string) => void;
  onNavigateToDossier: () => void;
  onNavigateToDiagnostics?: () => void;
  actionBanner: string | null;
  dataSource?: string;
  isDiagnosticsMode?: boolean;
  scrubbedCycle?: number;
}

const STAGE_ORDER: StageId[] = ['FAN', 'LPC', 'HPC', 'COMBUSTOR', 'HPT', 'LPT'];

// 7-station bar matching the reference image: FAN | IPC | HPC | COMB | HPT | IPT | LPT
const REFERENCE_STAGE_BAR: Array<{
  key: string;
  label: string;
  stageId: StageId;
}> = [
  { key: 'FAN', label: 'FAN', stageId: 'FAN' },
  { key: 'IPC', label: 'IPC', stageId: 'LPC' },
  { key: 'HPC', label: 'HPC', stageId: 'HPC' },
  { key: 'COMB', label: 'COMB', stageId: 'COMBUSTOR' },
  { key: 'HPT', label: 'HPT', stageId: 'HPT' },
  { key: 'IPT', label: 'IPT', stageId: 'LPT' },
  { key: 'LPT', label: 'LPT', stageId: 'LPT' },
];

// Reusable Three.js vectors & colors outside the render loop
const _worldPos = new THREE.Vector3();
const _ndcPos = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _pointerNdc = new THREE.Vector2();
const _highlightAmber = new THREE.Color('#D8B65E');
const _highlightCrimson = new THREE.Color('#D97865');
const _highlightSage = new THREE.Color('#B8CE82');
const _blueprintTint = new THREE.Color('#82A995');
const _blueprintStrokeSage = new THREE.Color('#B8CE82');
const _blueprintStrokeAmber = new THREE.Color('#D8B65E');
const _blueprintStrokeCrimson = new THREE.Color('#D97865');

export const DigitalTwinViewport: React.FC<DigitalTwinViewportProps> = ({
  engine,
  onWaterWash,
  onToggleSensorFault,
  onNavigateToDossier,
  actionBanner,
  dataSource = 'NASA_CMAPSS_BENCHMARK',
  isDiagnosticsMode = false,
  scrubbedCycle,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const pinOverlayRef = useRef<HTMLDivElement | null>(null);
  const leaderLineRef = useRef<SVGPolylineElement | null>(null);
  const stageRingRefs = useRef<Record<StageId, HTMLButtonElement | null>>({
    FAN: null,
    LPC: null,
    HPC: null,
    COMBUSTOR: null,
    HPT: null,
    LPT: null,
  });

  // Start in realistic metallic cutaway view (matching the reference photo) with FAN active pill
  const [selectedStage, setSelectedStage] = useState<StageId | null>(null);
  const [activeBarKey, setActiveBarKey] = useState<string>('FAN');
  const [cowlingOpen, setCowlingOpen] = useState<boolean>(false);
  const [explodedSlider, setExplodedSlider] = useState<number>(0.08);
  const [thermalHeatmap, setThermalHeatmap] = useState<boolean>(false);
  const [blueprintXray, setBlueprintXray] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);

  const stateRef = useRef({
    selectedStage: null as StageId | null,
    cowlingOpen: false,
    explodedSlider: 0.08,
    thermalHeatmap: false,
    blueprintXray: false,
    isSpinning: true,
    n1RpmPct: engine.n1RpmPct,
    n2RpmPct: engine.n2RpmPct,
    t24: engine.t24,
    t30: engine.t30,
    t50: engine.t50,
    cameraTransitionActive: true,
    desiredCamPos: new THREE.Vector3(11.6, 2.25, 11.1),
    desiredCamTarget: new THREE.Vector3(0.05, -0.25, 0.0),
    sensorFaultActive: engine.sensorFaultActive,
    scrubbedCycle: scrubbedCycle,
    isDiagnosticsMode: isDiagnosticsMode,
  });

  useEffect(() => {
    stateRef.current.selectedStage = selectedStage;
    stateRef.current.cowlingOpen = cowlingOpen;
    stateRef.current.explodedSlider = explodedSlider;
    stateRef.current.thermalHeatmap = thermalHeatmap;
    stateRef.current.blueprintXray = blueprintXray;
    stateRef.current.isSpinning = isSpinning;
    stateRef.current.n1RpmPct = engine.n1RpmPct;
    stateRef.current.n2RpmPct = engine.n2RpmPct;
    stateRef.current.t24 = engine.t24;
    stateRef.current.t30 = engine.t30;
    stateRef.current.t50 = engine.t50;
    stateRef.current.sensorFaultActive = engine.sensorFaultActive;
    stateRef.current.scrubbedCycle = scrubbedCycle;
    stateRef.current.isDiagnosticsMode = isDiagnosticsMode;
  }, [
    selectedStage,
    cowlingOpen,
    explodedSlider,
    thermalHeatmap,
    blueprintXray,
    isSpinning,
    engine.n1RpmPct,
    engine.n2RpmPct,
    engine.t24,
    engine.t30,
    engine.t50,
  ]);

  const handleSelectStage = (stage: StageId | null, barKey?: string) => {
    if (stage === null) {
      setSelectedStage(null);
      setActiveBarKey('FAN');
      setExplodedSlider(0.08);
      setCowlingOpen(false);
      setBlueprintXray(false);
      stateRef.current.desiredCamPos.set(11.6, 2.25, 11.1);
      stateRef.current.desiredCamTarget.set(0.05, -0.25, 0);
      stateRef.current.cameraTransitionActive = true;
      return;
    }

    setSelectedStage(stage);
    setActiveBarKey(barKey ?? stage);
    setCowlingOpen(true);
    setBlueprintXray(true);
    setExplodedSlider(0.55);

    const spec = TURBOFAN_STAGE_SPECS[stage];
    const rotY = -Math.PI * 0.36;
    const explodedZShift = spec.explodeMultipliers[stage] * 0.55 * 1.15;
    const localCam = new THREE.Vector3(
      spec.cameraPos[0],
      spec.cameraPos[1],
      spec.cameraPos[2] + explodedZShift
    );
    localCam.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);

    const localTarget = new THREE.Vector3(
      spec.cameraTarget[0],
      spec.cameraTarget[1] - 0.15,
      spec.cameraTarget[2] + explodedZShift
    );
    localTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);

    stateRef.current.desiredCamPos.copy(localCam);
    stateRef.current.desiredCamTarget.copy(localTarget);
    stateRef.current.cameraTransitionActive = true;
  };

  const handleResetCamera = () => {
    setSelectedStage(null);
    setActiveBarKey('FAN');
    setCowlingOpen(false);
    setBlueprintXray(false);
    setExplodedSlider(0.08);
    stateRef.current.desiredCamPos.set(11.6, 2.25, 11.1);
    stateRef.current.desiredCamTarget.set(0.05, -0.25, 0.0);
    stateRef.current.cameraTransitionActive = true;
  };

  // Automated Sensor Fault Camera Focus, Blinking Beacon & Cutaway
  const prevFaultRef = useRef<boolean>(engine.sensorFaultActive);
  useEffect(() => {
    if (engine.sensorFaultActive && !prevFaultRef.current) {
      setSelectedStage('HPC');
      setActiveBarKey('HPC');
      setCowlingOpen(true);
      setBlueprintXray(true);
      setExplodedSlider(0.48);
      const rotY = -Math.PI * 0.36;
      // Close-up zoomed camera position right on the HPC compressor blisks and T30 thermocouple
      const localCam = new THREE.Vector3(3.2, 1.8, 2.4);
      localCam.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
      const localTarget = new THREE.Vector3(0.0, 0.45, 0.2);
      localTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
      stateRef.current.desiredCamPos.copy(localCam);
      stateRef.current.desiredCamTarget.copy(localTarget);
      stateRef.current.cameraTransitionActive = true;
    } else if (!engine.sensorFaultActive && prevFaultRef.current) {
      handleResetCamera();
    }
    prevFaultRef.current = engine.sensorFaultActive;
  }, [engine.sensorFaultActive]);

  // Diagnostics Mode 3D Adaptation: Expose Core Stages, Activate Blueprint & Thermal Shader
  useEffect(() => {
    if (isDiagnosticsMode) {
      setCowlingOpen(true);
      setBlueprintXray(true);
      setThermalHeatmap(true);
      stateRef.current.desiredCamPos.set(9.8, 1.8, 8.5);
      stateRef.current.desiredCamTarget.set(0.0, -0.1, 0.0);
      stateRef.current.cameraTransitionActive = true;
    } else if (!engine.sensorFaultActive) {
      setCowlingOpen(false);
      setBlueprintXray(false);
      stateRef.current.desiredCamPos.set(11.6, 2.25, 11.1);
      stateRef.current.desiredCamTarget.set(0.05, -0.25, 0.0);
      stateRef.current.cameraTransitionActive = true;
    }
  }, [isDiagnosticsMode]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 1200;
    const height = container.clientHeight || 720;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 120);
    camera.position.set(11.6, 2.25, 11.1);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Warm Industrial Studio Lighting (leaves 3D engine geometry untouched)
    const keyLight = new THREE.DirectionalLight('#fff8eb', 2.9);
    keyLight.position.set(6, 10, 7);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#b8ce82', 1.65);
    rimLight.position.set(-8, 6, -5);
    scene.add(rimLight);

    const bounceLight = new THREE.DirectionalLight('#d8b65e', 0.95);
    bounceLight.position.set(0, -7, 3);
    scene.add(bounceLight);

    const hemiLight = new THREE.HemisphereLight('#e7ece7', '#181b19', 1.2);
    scene.add(hemiLight);

    // Subtle Contact Shadow Disc beneath Engine
    const floorGroup = new THREE.Group();
    floorGroup.position.y = -2.65;

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowDiscGeom = new THREE.PlaneGeometry(11, 7.5);
    shadowDiscGeom.rotateX(-Math.PI / 2);
    const shadowDiscMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowDisc = new THREE.Mesh(shadowDiscGeom, shadowDiscMat);
    floorGroup.add(shadowDisc);
    scene.add(floorGroup);

    // Build Procedural Rolls-Royce Trent 1000 Cutaway Model (Untouched)
    const assembly = buildTrent1000CutawayModel(renderer);
    assembly.rootGroup.position.y = 0.35;
    scene.add(assembly.rootGroup);

    // 3D Sensor Fault Blinking Beacon at HPC Station 30 (Z = +0.2, Y = +1.35)
    const sensorFaultBeacon = new THREE.Group();
    sensorFaultBeacon.position.set(0, 1.35, 0.2);

    const beaconCoreGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const beaconCoreMat = new THREE.MeshBasicMaterial({
      color: 0xff2222,
      transparent: true,
      opacity: 0.9,
    });
    const beaconCoreMesh = new THREE.Mesh(beaconCoreGeom, beaconCoreMat);
    sensorFaultBeacon.add(beaconCoreMesh);

    const beaconRingGeom = new THREE.RingGeometry(0.16, 0.32, 32);
    const beaconRingMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const beaconRingMesh = new THREE.Mesh(beaconRingGeom, beaconRingMat);
    beaconRingMesh.rotation.x = Math.PI / 2;
    sensorFaultBeacon.add(beaconRingMesh);

    sensorFaultBeacon.visible = Boolean(engine.sensorFaultActive);
    assembly.rootGroup.add(sensorFaultBeacon);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 2.6;
    controls.maxDistance = 18.0;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.target.set(0.05, -0.25, 0.0);

    const onControlStart = () => {
      stateRef.current.cameraTransitionActive = false;
    };
    controls.addEventListener('start', onControlStart);

    // Raycast Click Selection directly on 3D Turbofan Stages
    let pointerDownPos = { x: 0, y: 0 };
    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_pointerNdc, camera);
      const hits = _raycaster.intersectObjects(assembly.clickableProxies, false);
      if (hits.length > 0) {
        const hitStage = hits[0].object.userData.stageId as StageId | undefined;
        if (hitStage) {
          handleSelectStage(hitStage);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1200;
      const h = container.clientHeight || 720;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let isUnmounted = false;
    let frameId = 0;
    const clock = new THREE.Clock();
    const gl = renderer.getContext() as WebGL2RenderingContext;

    function afterDraw(cb: () => void) {
      if (typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isUnmounted) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        if (!sync) {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const status = gl.clientWaitSync(sync, 0, 0);
        if (status === gl.TIMEOUT_EXPIRED) {
          frameId = window.setTimeout(poll, 8);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 8);
    }

    function tick() {
      if (isUnmounted) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      const st = stateRef.current;

      if (st.cameraTransitionActive) {
        const camLambda = isSoftwareGl ? 18.0 : 9.0;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, st.desiredCamPos.x, camLambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, st.desiredCamPos.y, camLambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, st.desiredCamPos.z, camLambda, dt);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, st.desiredCamTarget.x, camLambda, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, st.desiredCamTarget.y, camLambda, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, st.desiredCamTarget.z, camLambda, dt);

        if (
          camera.position.distanceToSquared(st.desiredCamPos) < 0.002 &&
          controls.target.distanceToSquared(st.desiredCamTarget) < 0.002
        ) {
          st.cameraTransitionActive = false;
        }
      }

      controls.update();

      // Axial Exploded Split
      const splitDamp = isSoftwareGl ? 16.0 : 8.0;
      const activeStageSpec = st.selectedStage ? TURBOFAN_STAGE_SPECS[st.selectedStage] : null;
      STAGE_ORDER.forEach((stageId) => {
        const baseSpec = TURBOFAN_STAGE_SPECS[stageId];
        const stageSplitMultiplier = activeStageSpec
          ? activeStageSpec.explodeMultipliers[stageId]
          : (STAGE_ORDER.indexOf(stageId) - 2.5) * -0.55;

        const targetZ = baseSpec.axialZ + stageSplitMultiplier * st.explodedSlider * 1.15;
        const grp = assembly.stageGroups[stageId];
        grp.position.z = THREE.MathUtils.damp(grp.position.z, targetZ, splitDamp, dt);
      });

      // Outer Cowling Radial Separation
      const targetCowlingUpperY = st.cowlingOpen ? 1.15 + st.explodedSlider * 0.45 : 0.0;
      const targetCowlingLowerY = st.cowlingOpen ? -0.95 - st.explodedSlider * 0.35 : 0.0;
      assembly.cowlingUpper.position.y = THREE.MathUtils.damp(
        assembly.cowlingUpper.position.y,
        targetCowlingUpperY,
        splitDamp,
        dt
      );
      assembly.cowlingLower.position.y = THREE.MathUtils.damp(
        assembly.cowlingLower.position.y,
        targetCowlingLowerY,
        splitDamp,
        dt
      );

      // Spool Rotation
      if (st.isSpinning) {
        const n1Speed = (st.n1RpmPct / 100) * 2.2;
        const n2Speed = (st.n2RpmPct / 100) * 3.8;
        assembly.spools.n1.forEach((s) => {
          s.rotation.z += n1Speed * dt;
        });
        assembly.spools.n2.forEach((s) => {
          s.rotation.z -= n2Speed * dt;
        });
      }

      const isZoomedOrBlueprint = st.blueprintXray || st.selectedStage !== null;
      const elapsed = clock.elapsedTime;
      const normT24 = Math.max(0.0, Math.min(1.0, (st.t24 - 615) / 65));
      const normT30 = Math.max(0.0, Math.min(1.0, (st.t30 - 1540) / 75));
      const normT50 = Math.max(0.0, Math.min(1.0, (st.t50 - 1350) / 100));

      // Animate 3D Sensor Fault Beacon
      const isFault = Boolean(st.sensorFaultActive);
      sensorFaultBeacon.visible = isFault;
      if (isFault) {
        const pulse = Math.sin(clock.elapsedTime * 6.0) * 0.5 + 0.5;
        beaconRingMesh.scale.setScalar(1.0 + 0.9 * pulse);
        beaconRingMat.opacity = 0.8 * (1.0 - pulse);
        beaconCoreMat.opacity = 0.4 + 0.6 * Math.abs(Math.sin(clock.elapsedTime * 10.0));
      }

      // Thermal Heatmap & Diagnostics Cycle Progression Gradient
      const activeCyc = st.scrubbedCycle ?? (st.isDiagnosticsMode ? 142 : engine.flightCycles);
      const degradRatio = Math.max(0.0, Math.min(1.0, activeCyc / 142));

      assembly.thermalMaterials.forEach((item) => {
        const isSelectedInner =
          st.selectedStage !== null && item.stageId === st.selectedStage && !item.isOuterShell;
        const isSelectedShroud =
          st.selectedStage !== null && item.stageId === st.selectedStage && item.isOuterShell;

        const isCoreStage = item.stageId === 'HPC' || item.stageId === 'COMBUSTOR' || item.stageId === 'HPT';
        const stageFactor = isCoreStage ? degradRatio : degradRatio * 0.4;

        if (st.isDiagnosticsMode) {
          item.shaderUniforms.uThermalActive.value = 1.0;
          item.shaderUniforms.uT30Norm.value = 0.2 + 0.75 * Math.pow(stageFactor, 1.4);
          item.shaderUniforms.uT50Norm.value = 0.2 + 0.7 * Math.pow(stageFactor, 1.4);
          item.shaderUniforms.uStageHeatWeight.value = 0.2 + 0.8 * stageFactor;
        } else {
          item.shaderUniforms.uThermalActive.value = THREE.MathUtils.lerp(
            item.shaderUniforms.uThermalActive.value,
            st.thermalHeatmap ? 1.0 : 0.0,
            0.25
          );
        }
        item.shaderUniforms.uT24Norm.value = normT24;
        item.shaderUniforms.uT30Norm.value = normT30;
        item.shaderUniforms.uT50Norm.value = normT50;
        item.shaderUniforms.uTime.value = elapsed;

        if (st.thermalHeatmap) {
          item.mat.color.lerp(item.thermalColor, 0.22);
          item.mat.emissive.lerp(item.thermalEmissive, 0.22);
          item.mat.emissiveIntensity = isSelectedInner
            ? 0.9
            : 0.4 + item.thermalIntensity * 0.48;
        } else if (isSelectedInner && st.selectedStage) {
          const spec = TURBOFAN_STAGE_SPECS[st.selectedStage];
          const highlightColor =
            spec.severity === 'CRITICAL'
              ? _highlightCrimson
              : spec.severity === 'WARNING'
                ? _highlightAmber
                : _highlightSage;
          item.mat.color.lerp(item.baseColor, 0.2);
          item.mat.emissive.lerp(highlightColor, 0.25);
          item.mat.emissiveIntensity = 0.55;
        } else if (isZoomedOrBlueprint && (item.isOuterShell || st.selectedStage !== null)) {
          item.mat.color.lerp(_blueprintTint, 0.16);
          item.mat.emissive.lerp(_blueprintStrokeSage, 0.16);
          item.mat.emissiveIntensity = 0.18;
        } else {
          item.mat.color.lerp(item.baseColor, 0.2);
          item.mat.emissive.lerp(item.baseEmissive, 0.2);
          item.mat.emissiveIntensity = item.baseEmissiveIntensity;
        }

        let targetOpacity = 1.0;
        if (st.thermalHeatmap) {
          if (item.stageId === 'COWLING' || item.isOuterShell) {
            targetOpacity = 0.08;
          } else if (st.selectedStage !== null && item.stageId !== st.selectedStage) {
            targetOpacity = 0.35;
          } else {
            targetOpacity = 1.0;
          }
        } else if (isZoomedOrBlueprint) {
          if (item.stageId === 'COWLING') {
            targetOpacity = 0.06;
          } else if (isSelectedInner) {
            targetOpacity = 1.0;
          } else if (isSelectedShroud) {
            targetOpacity = 0.08;
          } else if (st.selectedStage !== null) {
            targetOpacity = item.isOuterShell ? 0.06 : 0.16;
          } else {
            targetOpacity = item.isOuterShell ? 0.09 : 0.92;
          }
        } else {
          if (item.stageId === 'COWLING') {
            targetOpacity = 0.05;
          } else if (item.isOuterShell) {
            targetOpacity = item.stageId === 'FAN' ? 0.28 : 0.07;
          } else {
            targetOpacity = 1.0;
          }
        }

        const opLerp = isSoftwareGl ? 0.85 : 0.24;
        item.mat.opacity = THREE.MathUtils.lerp(item.mat.opacity, targetOpacity, opLerp);
        item.mat.depthWrite = item.mat.opacity > 0.65;
      });

      assembly.blueprintStrokes.forEach((stroke) => {
        const isSelectedStageStroke =
          st.selectedStage !== null && stroke.stageId === st.selectedStage;

        if (isZoomedOrBlueprint) {
          stroke.line.visible = true;
          if (isSelectedStageStroke) {
            const spec = TURBOFAN_STAGE_SPECS[st.selectedStage!];
            const activeStrokeCol =
              spec.severity === 'CRITICAL'
                ? _blueprintStrokeCrimson
                : spec.severity === 'WARNING'
                  ? _blueprintStrokeAmber
                  : _blueprintStrokeSage;
            stroke.mat.color.lerp(activeStrokeCol, 0.25);
            stroke.mat.opacity = stroke.isOuterShell ? 0.92 : 0.65;
          } else {
            stroke.mat.color.lerp(_blueprintStrokeSage, 0.2);
            stroke.mat.opacity = stroke.stageId === 'COWLING' ? 0.72 : 0.58;
          }
        } else {
          stroke.line.visible = true;
          stroke.mat.color.lerp(_blueprintStrokeSage, 0.2);
          stroke.mat.opacity = stroke.isOuterShell ? 0.38 : 0.14;
        }
      });

      const cWidth = container.clientWidth || 1200;
      const cHeight = container.clientHeight || 720;

      STAGE_ORDER.forEach((stageId) => {
        const anchor = assembly.stagePinAnchors[stageId];
        anchor.getWorldPosition(_worldPos);
        _ndcPos.copy(_worldPos).project(camera);

        const rawSx = ((_ndcPos.x + 1) * 0.5) * cWidth;
        const rawSy = ((-_ndcPos.y + 1) * 0.5) * cHeight;
        const sx = Math.max(335, Math.min(cWidth - 335, rawSx));
        const sy = Math.max(60, Math.min(cHeight - 250, rawSy));

        const btn = stageRingRefs.current[stageId];
        if (btn) {
          const inSafeCenter =
            rawSx >= 325 && rawSx <= cWidth - 325 && rawSy >= 40 && rawSy <= cHeight - 230;
          btn.style.opacity = inSafeCenter || st.selectedStage === stageId ? '1' : '0';
          btn.style.pointerEvents = inSafeCenter || st.selectedStage === stageId ? 'auto' : 'none';
          btn.style.transform = `translate3d(${(sx - 12).toFixed(1)}px, ${(sy - 12).toFixed(1)}px, 0)`;
        }

        if (st.selectedStage === stageId && pinOverlayRef.current && leaderLineRef.current) {
          const cardWidth = 324;
          const minCardX = 335;
          const maxCardX = Math.max(minCardX, cWidth - 315 - cardWidth - 16);
          const preferredX = sx > cWidth * 0.52 ? sx - cardWidth - 46 : sx + 46;
          const cardX = Math.max(minCardX, Math.min(maxCardX, preferredX));
          const cardY = Math.max(24, Math.min(cHeight - 400, sy - 95));

          const attachX = sx > cardX + cardWidth * 0.5 ? cardX + cardWidth : cardX;
          const elbowX = sx + (attachX - sx) * 0.38;
          const elbowY = cardY + 28;

          pinOverlayRef.current.style.transform = `translate3d(${cardX.toFixed(1)}px, ${cardY.toFixed(1)}px, 0)`;
          leaderLineRef.current.setAttribute(
            'points',
            `${sx.toFixed(1)},${sy.toFixed(1)} ${elbowX.toFixed(1)},${elbowY.toFixed(1)} ${attachX.toFixed(1)},${elbowY.toFixed(1)}`
          );
        }
      });

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

  return () => {
      isUnmounted = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      shadowDiscGeom.dispose();
      shadowDiscMat.dispose();
      shadowTex.dispose();
      assembly.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 60);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Dynamic Flight Cycle Trend Graph (Updates dynamically per active dataset & engine cycles)
  const trendData = useMemo(() => {
    if (dataSource === 'NASA_NCMAPSS_TRANSIENT') {
      return {
        title: 'Mission Flight Spool Profile',
        badge: '+4.2% Takeoff Surge',
        badgeColor: '#B8CE82',
        badgeBg: 'bg-[#B8CE82]/20 border border-[#B8CE82]/30',
        yMax: '100% N1',
        yMid: '90%',
        yMin: '80%',
        xLabels: ['Taxi', 'Takeoff', 'Climb', 'FL370', 'Reverse'],
        pathD: 'M 40 82 C 60 78, 80 18, 105 18 C 130 20, 155 42, 190 44 C 215 45, 225 75, 236 80',
        areaD: 'M 40 82 C 60 78, 80 18, 105 18 C 130 20, 155 42, 190 44 C 215 45, 225 75, 236 80 L 236 92 L 40 92 Z',
        endPoint: { cx: 236, cy: 80 },
        strokeColor: '#B8CE82',
        gradientId: 'cycleTrendFillNCMAPSS',
      };
    }
    if (dataSource === 'ARINC_429_ACARS_EHM') {
      return {
        title: 'ACARS EGT Margin Trend',
        badge: '+14.2°C Margin',
        badgeColor: '#82A995',
        badgeBg: 'bg-[#82A995]/20 border border-[#82A995]/30',
        yMax: '+25°C',
        yMid: '+15°C',
        yMin: '+5°C',
        xLabels: ['Leg -4', 'Leg -3', 'Leg -2', 'Leg -1', 'Live'],
        pathD: 'M 40 32 C 75 35, 110 38, 145 42 C 180 46, 210 50, 236 52',
        areaD: 'M 40 32 C 75 35, 110 38, 145 42 C 180 46, 210 50, 236 52 L 236 92 L 40 92 Z',
        endPoint: { cx: 236, cy: 52 },
        strokeColor: '#82A995',
        gradientId: 'cycleTrendFillACARS',
      };
    }
    if (dataSource === 'FAA_PHYSICAL_MAINTENANCE') {
      const rem = engine.llpLimitCycles - engine.llpAccumulatedCycles;
      return {
        title: 'FAA § 33.70 LLP Disk Clock',
        badge: `${rem}c Scrap Margin`,
        badgeColor: '#D97865',
        badgeBg: 'bg-[#D97865]/20 border border-[#D97865]/30',
        yMax: '15,000c Cap',
        yMid: '14,500c',
        yMin: '14,000c',
        xLabels: ['Insp-A', 'Insp-B', 'Insp-C', 'Insp-D', 'Current'],
        pathD: 'M 40 88 C 75 80, 110 65, 150 48 C 185 34, 215 24, 236 20',
        areaD: 'M 40 88 C 75 80, 110 65, 150 48 C 185 34, 215 24, 236 20 L 236 92 L 40 92 Z',
        endPoint: { cx: 236, cy: 20 },
        strokeColor: '#D97865',
        gradientId: 'cycleTrendFillFAA',
      };
    }
    // Default: NASA C-MAPSS Benchmark Degradation Progression
    const cyc = engine.flightCycles;
    const rul = engine.conformalRul;
    const rate = ((125 - rul) / Math.max(1, cyc) * 10).toFixed(1);
    return {
      title: 'Flight Cycle Degradation Trend',
      badge: `-${rate}% / 10c`,
      badgeColor: rul < 20 ? '#D97865' : '#B8CE82',
      badgeBg: rul < 20 ? 'bg-[#D97865]/20 border border-[#D97865]/30' : 'bg-[#B8CE82]/20 border border-[#B8CE82]/30',
      yMax: '125c RUL',
      yMid: '60c',
      yMin: '0c',
      xLabels: ['0c', `c${Math.round(cyc * 0.33)}`, `c${Math.round(cyc * 0.66)}`, `c${cyc}`, `+${rul.toFixed(0)}c`],
      pathD: 'M 40 24 C 80 28, 120 45, 160 62 C 190 74, 215 82, 236 86',
      areaD: 'M 40 24 C 80 28, 120 45, 160 62 C 190 74, 215 82, 236 86 L 236 92 L 40 92 Z',
      endPoint: { cx: 236, cy: 86 },
      strokeColor: rul < 20 ? '#D97865' : '#B8CE82',
      gradientId: 'cycleTrendFillCMAPSS',
    };
  }, [dataSource, engine.flightCycles, engine.conformalRul, engine.llpAccumulatedCycles, engine.llpLimitCycles]);

  const activeStageSpec = selectedStage ? TURBOFAN_STAGE_SPECS[selectedStage] : null;
  const stageCalloutMetrics = activeStageSpec ? activeStageSpec.getMetrics(engine) : null;

  // 16-bar HPC Efficiency progress segments matching reference image
  const totalEffSegments = 16;
  const activeEffSegments = Math.round((engine.hpcEfficiencyPct / 100) * totalEffSegments);

  // Horizontal temperature/pressure bars matching reference image
  const tempRows = [
    {
      label: 'T30',
      value: `${Math.round(engine.t30).toLocaleString()} °R`,
      pct: Math.max(25, Math.min(92, ((engine.t30 - 1500) / 140) * 100)),
    },
    {
      label: 'T50',
      value: `${Math.round(engine.t50).toLocaleString()} °R`,
      pct: Math.max(30, Math.min(95, ((engine.t50 - 1300) / 160) * 100)),
    },
    {
      label: 'P30',
      value: `${engine.p30.toFixed(1)} psia`,
      pct: Math.max(25, Math.min(88, ((engine.p30 - 480) / 100) * 100)),
    },
  ];

  return (
    <section
      aria-label="3D Digital Twin Command Viewport"
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#181B19] overflow-hidden'
          : 'relative w-full h-[calc(100vh-76px)] min-h-[730px] bg-transparent overflow-hidden select-none'
      }
    >
      {/* Subtle Technical Leader Lines Behind/Above the 3D Engine (Matching Reference Image) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 820"
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-65"
      >
        {/* Top technical bracket callout lines above the turbofan */}
        <polyline
          points="560,190 615,155 715,155 735,235"
          fill="none"
          stroke="#B8CE82"
          strokeWidth="1"
          strokeOpacity="0.55"
        />
        <circle cx="560" cy="190" r="2.5" fill="#B8CE82" />
        <polyline
          points="665,195 705,170 795,170 815,245"
          fill="none"
          stroke="#949C96"
          strokeWidth="0.9"
          strokeOpacity="0.45"
        />
        <polyline
          points="795,215 835,165 925,165 945,250"
          fill="none"
          stroke="#949C96"
          strokeWidth="0.9"
          strokeOpacity="0.45"
        />
      </svg>

      {/* Dedicated WebGL Mount Container */}
      <div
        ref={canvasMountRef}
        data-testid="digital-twin-canvas"
        className="absolute inset-0 z-10 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating Sensor Drift Fault Warning Banner */}
      {engine.sensorFaultActive && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto backdrop-blur-2xl bg-[#D97865]/95 border border-[#D97865] rounded-2xl px-5 py-2.5 shadow-[0_12px_40px_rgba(217,120,101,0.5)] flex items-center gap-3 text-[#181B19] animate-bounce">
          <ShieldAlert className="w-5 h-5 shrink-0 text-[#181B19]" />
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider">
              SENSOR DRIFT FAULT DETECTED: HPC T30 THERMOCOUPLE (+45°R BIAS)
            </div>
            <div className="text-[10px] font-mono opacity-90">
              DO-178C SENSOR_FAULT_ABSTAIN · 3D Cutaway Focus Active · Inner Blades Exposed
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleSensorFault(engine.id)}
            className="ml-2 px-3 py-1 rounded-xl bg-[#181B19] text-[#EAECE9] hover:bg-black font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer"
          >
            Clear Fault
          </button>
        </div>
      )}

      {/* Action Notification Pill */}
      {actionBanner && (
        <div
          role="status"
          className="absolute top-2 left-1/2 -translate-x-1/2 z-30 backdrop-blur-2xl bg-[#252927]/95 border border-white/15 text-[#EAECE9] px-4 py-2 rounded-full shadow-2xl text-xs flex items-center gap-2.5"
        >
          <span className="px-2.5 py-0.5 rounded-full bg-[#B8CE82] text-[#181B19] font-bold text-[10px] uppercase tracking-wider">
            AMM 72-00-00
          </span>
          <span>{actionBanner}</span>
        </div>
      )}

      {/* Dedicated Dynamic Stream Ribbons */}
      {dataSource === 'FAA_PHYSICAL_MAINTENANCE' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto px-5 py-2 rounded-full bg-[#D97865]/25 border border-[#D97865]/60 backdrop-blur-xl text-xs flex items-center gap-3 shadow-[0_8px_32px_rgba(217,120,101,0.4)] animate-in fade-in">
          <ShieldAlert className="w-4 h-4 text-[#D97865] shrink-0 animate-pulse" />
          <span className="font-bold text-[#EAECE9] tracking-wide uppercase text-[11px]">
            FAA § 33.70 Governing Limit: <span className="text-[#D97865] font-mono">{engine.llpLimitCycles - engine.llpAccumulatedCycles} Cycles</span> Left on HPT Disk (15,000c Cap)
          </span>
          <span className="text-white/20">|</span>
          <span className="font-mono text-[11px] text-[#B8CE82]">
            SOAP: Fe {engine.soapOilPpm.fe}ppm · Ti {engine.soapOilPpm.ti}ppm
          </span>
          <button
            type="button"
            onClick={onNavigateToDossier}
            className="px-2.5 py-0.5 rounded-full bg-[#D97865] text-[#181B19] font-bold text-[10px] hover:bg-[#e28a78] cursor-pointer transition-colors"
          >
            Form 8130-3 →
          </button>
        </div>
      )}

      {dataSource === 'NASA_NCMAPSS_TRANSIENT' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto px-5 py-2 rounded-full bg-[#82A995]/20 border border-[#B8CE82]/50 backdrop-blur-xl text-xs flex items-center gap-3 shadow-[0_8px_32px_rgba(184,206,130,0.25)] animate-in fade-in">
          <Activity className="w-4 h-4 text-[#B8CE82] animate-pulse shrink-0" />
          <span className="font-bold text-[#EAECE9] tracking-wide uppercase text-[11px]">
            N-CMAPSS 1 Hz Transient: <span className="text-[#B8CE82] font-mono">Takeoff Spool (98.4% N1 · 1625°R T30)</span>
          </span>
          <span className="text-white/20">|</span>
          <span className="font-mono text-[11px] text-[#EAECE9]">
            FL025 · M0.28 · 98° TRA · Dynamic Density Altitude
          </span>
        </div>
      )}

      {dataSource === 'ARINC_429_ACARS_EHM' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto px-5 py-2 rounded-full bg-[#82A995]/15 border border-[#82A995]/40 backdrop-blur-xl text-xs flex items-center gap-3 shadow-[0_8px_32px_rgba(130,169,149,0.2)] animate-in fade-in">
          <Radio className="w-4 h-4 text-[#82A995] shrink-0" />
          <span className="font-bold text-[#EAECE9] tracking-wide uppercase text-[11px]">
            ARINC 429 ACARS Broadcast: <span className="text-[#B8CE82] font-mono">131.550 MHz SATCOM EHM</span>
          </span>
          <span className="text-white/20">|</span>
          <span className="font-mono text-[11px] text-[#EAECE9]">
            Cruise FL370 · EGT Margin +14.2°C · ETOPS-330 OK
          </span>
        </div>
      )}

      {/* Custom GLSL Thermal Shader Gradient Legend Pill (Visible when Thermal Mode is active) */}
      {thermalHeatmap && !actionBanner && (
        <div
          data-testid="thermal-shader-legend"
          className="absolute top-3 left-1/2 -translate-x-1/2 z-30 backdrop-blur-2xl bg-[#232725]/90 border border-white/15 rounded-full px-4 py-1.5 shadow-2xl flex items-center gap-3 text-[11px] font-mono text-[#EAECE9]"
        >
          <span className="text-[#B8CE82] font-bold">GLSL FLIR SHADER</span>
          <span className="text-[#949C96]">
            T24: <strong className="text-[#82A995]">{engine.t24.toFixed(1)}°R</strong>
          </span>
          <div
            className="w-24 h-2 rounded-full border border-white/15"
            style={{
              background:
                'linear-gradient(90deg, #1752eb 0%, #00e5ff 25%, #82A995 50%, #D8B65E 75%, #D97865 100%)',
            }}
          />
          <span className="text-[#949C96]">
            T30: <strong className="text-[#D8B65E]">{engine.t30.toFixed(1)}°R</strong>
          </span>
          <span className="text-[#949C96]">
            T50: <strong className="text-[#D97865]">{engine.t50.toFixed(1)}°R</strong>
          </span>
        </div>
      )}

      {/* Subtle Target Rings Projected on the 3D Engine */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {STAGE_ORDER.map((stageId) => {
          const isSelected = selectedStage === stageId;
          const spec = TURBOFAN_STAGE_SPECS[stageId];
          return (
            <button
              key={stageId}
              ref={(el) => {
                stageRingRefs.current[stageId] = el;
              }}
              type="button"
              onClick={() => handleSelectStage(stageId, stageId)}
              aria-label={`Inspect ${spec.shortName}`}
              className={`pointer-events-auto absolute top-0 left-0 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'border-2 border-[#B8CE82] bg-[#252927]/90 shadow-[0_0_14px_rgba(184,206,130,0.65)]'
                  : 'border border-white/25 bg-[#1E2220]/60 hover:border-[#B8CE82]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSelected ? 'bg-[#B8CE82]' : 'bg-[#EAECE9]/75'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* SVG Leader Line & Floating Callout Card when a specific 3D stage is clicked */}
      {selectedStage && activeStageSpec && stageCalloutMetrics && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <svg className="w-full h-full">
            <polyline
              ref={leaderLineRef}
              fill="none"
              stroke={
                activeStageSpec.severity === 'CRITICAL'
                  ? '#D97865'
                  : activeStageSpec.severity === 'WARNING'
                    ? '#D8B65E'
                    : '#B8CE82'
              }
              strokeWidth="1.5"
              points="0,0 0,0 0,0"
            />
          </svg>

          <div
            ref={pinOverlayRef}
            data-testid="stage-pin-callout"
            className="pointer-events-auto absolute top-0 left-0 w-[324px] backdrop-blur-2xl bg-[#232725]/95 border border-white/15 rounded-[24px] p-4 shadow-[0_16px_44px_rgba(0,0,0,0.75)] text-[#EAECE9]"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    activeStageSpec.severity === 'NOMINAL'
                      ? 'bg-[#B8CE82]/20 border-[#B8CE82]/50 text-[#B8CE82]'
                      : activeStageSpec.severity === 'WARNING'
                        ? 'bg-[#D8B65E]/20 border-[#D8B65E]/50 text-[#D8B65E]'
                        : 'bg-[#D97865]/20 border-[#D97865]/50 text-[#D97865]'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#B8CE82]">
                      {activeStageSpec.shortName} · {activeStageSpec.severity}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#2E3330] border border-white/10 text-[9px] font-mono uppercase tracking-wider text-[#EAECE9]">
                      X-RAY STROKE
                    </span>
                  </div>
                  <div className="text-xs font-mono font-semibold text-[#EAECE9] mt-0.5">
                    {stageCalloutMetrics.primaryReadout}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectStage(null)}
                aria-label="Close Stage Callout"
                className="text-[#949C96] hover:text-[#EAECE9] text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-white/10 text-[11px] text-[#EAECE9] space-y-1.5">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-[#949C96]">{stageCalloutMetrics.secondaryReadout}</span>
                <span className="font-bold text-[#B8CE82]">
                  {stageCalloutMetrics.efficiencyOrMargin}
                </span>
              </div>
              <p className="leading-relaxed text-[#949C96] text-[11px]">
                {stageCalloutMetrics.borescopeLog}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2">
              {stageCalloutMetrics.actionType === 'WATER_WASH' ? (
                <button
                  type="button"
                  onClick={() => onWaterWash(engine.id)}
                  disabled={engine.waterWashApplied}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                    engine.waterWashApplied
                      ? 'bg-[#82A995]/20 text-[#82A995] border border-[#82A995]/40 cursor-not-allowed'
                      : 'bg-[#B8CE82] hover:bg-[#B8CE82]/90 text-[#181B19]'
                  }`}
                >
                  {engine.waterWashApplied ? 'Water Wash Completed' : stageCalloutMetrics.actionLabel}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateToDossier}
                  className="flex-1 py-1.5 px-3 rounded-xl text-[11px] font-semibold bg-[#B8CE82] hover:bg-[#B8CE82]/90 text-[#181B19] transition-all cursor-pointer"
                >
                  {stageCalloutMetrics.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={onNavigateToDossier}
                className="py-1.5 px-2.5 rounded-xl text-[11px] font-medium bg-[#2E3330] hover:bg-[#383E3A] text-[#EAECE9] border border-white/10 cursor-pointer"
              >
                Form 8130-3
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          LEFT COLUMN (ACTUAL ENGINE TELEMETRY + DYNAMIC FLIGHT CYCLE TREND)
         ===================================================================== */}
      {!hudCollapsed && (
        <aside
          aria-label="Active Engine Prognostics HUD"
          className={`absolute top-4 left-6 lg:left-8 z-20 w-[308px] space-y-4 pointer-events-none transition-all duration-700 ease-in-out ${
            isDiagnosticsMode ? '-translate-x-[160%] opacity-0' : 'translate-x-0 opacity-100'
          }`}
        >
          {/* Top-Left Editorial Hero Block with Actual Engine Data */}
          <div className="pointer-events-auto space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#EAECE9] tracking-wider bg-[#2B302D] px-2.5 py-0.5 rounded-lg border border-white/10">
                {engine.id}
              </span>
              <span className="text-[11px] font-mono text-[#949C96]">
                {engine.tailId} · {engine.wingPosition === 'ENG-L' ? 'Port Wing' : 'Starboard Wing'}
              </span>
            </div>

            {dataSource === 'FAA_PHYSICAL_MAINTENANCE' ? (
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#D97865]/20 border border-[#D97865]/40 text-xs text-[#F2D5CF]">
                <span className="w-2 h-2 rounded-full bg-[#D97865] animate-pulse" />
                <span>FAA § 33.70 Physical Dossier</span>
              </div>
            ) : dataSource === 'NASA_NCMAPSS_TRANSIENT' ? (
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#82A995]/20 border border-[#B8CE82]/40 text-xs text-[#EAECE9]">
                <span className="w-2 h-2 rounded-full bg-[#B8CE82] animate-pulse" />
                <span>N-CMAPSS · 1 Hz Flight Mission</span>
              </div>
            ) : dataSource === 'ARINC_429_ACARS_EHM' ? (
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#82A995]/20 border border-[#82A995]/40 text-xs text-[#EAECE9]">
                <span className="w-2 h-2 rounded-full bg-[#82A995]" />
                <span>ARINC 429 · ACARS SATCOM</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#232725]/90 border border-white/15 text-xs text-[#EAECE9]">
                <span className="w-2 h-2 rounded-full bg-[#B8CE82]" />
                <span>Trent 1000 · C-MAPSS Baseline</span>
              </div>
            )}

            <h2 className="text-[34px] leading-[1.08] font-normal tracking-tight text-[#EAECE9]">
              {engine.flightCycles}
              <span className="text-lg text-[#949C96] ml-2 font-light">Spool Cycles</span>
            </h2>

            <p className="text-[12px] text-[#949C96]">
              Conformal RUL: <strong className="text-[#B8CE82] font-mono">{engine.conformalRul.toFixed(1)}c</strong>{' '}
              <span className="font-mono text-[11px]">[{engine.conformalLower90.toFixed(1)}, {engine.conformalUpper90.toFixed(1)}]c</span>
            </p>
          </div>

          {/* Middle-Left Card: Dynamic Flight Cycle Trend */}
          <div className="pointer-events-auto backdrop-blur-2xl bg-[#232725]/85 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-normal text-[#EAECE9]">{trendData.title}</h3>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${trendData.badgeBg} tabular-nums`} style={{ color: trendData.badgeColor }}>
                {trendData.badge}
              </span>
            </div>

            {/* Smooth Dynamic Spline Area Chart */}
            <div className="pt-1">
              <svg
                viewBox="0 0 250 120"
                className="w-full h-[116px] overflow-visible"
                aria-label={trendData.title}
              >
                <defs>
                  <linearGradient id={trendData.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={trendData.strokeColor} stopOpacity="0.32" />
                    <stop offset="100%" stopColor={trendData.strokeColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines & Y-Axis Labels */}
                <line x1="34" y1="16" x2="242" y2="16" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x="0" y="20" fontSize="9" fill="#949C96" className="font-mono">
                  {trendData.yMax}
                </text>

                <line x1="34" y1="54" x2="242" y2="54" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x="0" y="58" fontSize="9" fill="#949C96" className="font-mono">
                  {trendData.yMid}
                </text>

                <line x1="34" y1="92" x2="242" y2="92" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <text x="0" y="96" fontSize="9" fill="#949C96" className="font-mono">
                  {trendData.yMin}
                </text>

                {/* Left Vertical Axis Line */}
                <line x1="34" y1="12" x2="34" y2="92" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                {/* Area under curve */}
                <path
                  d={trendData.areaD}
                  fill={`url(#${trendData.gradientId})`}
                />

                {/* Smooth Trend Curve */}
                <path
                  d={trendData.pathD}
                  fill="none"
                  stroke={trendData.strokeColor}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />

                {/* Glowing End Point */}
                <circle
                  cx={trendData.endPoint.cx}
                  cy={trendData.endPoint.cy}
                  r="4.5"
                  fill={trendData.strokeColor}
                  className="animate-pulse"
                />

                {/* X-Axis Cycle / Phase Labels */}
                {trendData.xLabels.map((lbl, idx) => {
                  const xPos = 36 + idx * 46;
                  return (
                    <text key={lbl} x={xPos} y="112" fontSize="9" fill="#949C96" className="font-mono">
                      {lbl}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
        </aside>
      )}

      {/* =====================================================================
          RIGHT COLUMN (MATCHES REFERENCE: "Operational Status" + "HPC Efficiency")
         ===================================================================== */}
      {!hudCollapsed && (
        <aside
          aria-label="Spool and Gas-Path Gauges HUD"
          className={`absolute top-4 right-6 lg:right-8 z-20 w-[308px] space-y-4 pointer-events-none transition-all duration-700 ease-in-out ${
            isDiagnosticsMode ? 'translate-x-[160%] opacity-0' : 'translate-x-0 opacity-100'
          }`}
        >
          {/* Top-Right Card: Operational Status (Adapts dynamically to active data stream) */}
          <div className="pointer-events-auto backdrop-blur-2xl bg-[#232725]/85 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-normal text-[#EAECE9]">
                {dataSource === 'FAA_PHYSICAL_MAINTENANCE'
                  ? 'FAA Airworthiness Status'
                  : dataSource === 'NASA_NCMAPSS_TRANSIENT'
                    ? '1 Hz Spool Telemetry'
                    : dataSource === 'ARINC_429_ACARS_EHM'
                      ? 'ACARS Telemetry Frame'
                      : 'Operational Status'}
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  engine.sensorFaultActive
                    ? 'bg-[#D97865] text-[#181B19]'
                    : dataSource === 'FAA_PHYSICAL_MAINTENANCE'
                      ? 'bg-[#D97865] text-[#181B19]'
                      : 'bg-[#B8CE82] text-[#181B19]'
                }`}
              >
                {engine.sensorFaultActive
                  ? 'FAULT_ABSTAIN'
                  : dataSource === 'FAA_PHYSICAL_MAINTENANCE'
                    ? '§ 33.70 BINDING'
                    : dataSource === 'NASA_NCMAPSS_TRANSIENT'
                      ? 'TRANSIENT'
                      : dataSource === 'ARINC_429_ACARS_EHM'
                        ? 'CRUISE EHM'
                        : 'ACTIVE'}
              </span>
            </div>

            <div className="flex items-end justify-between pt-1">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[38px] leading-none font-normal tracking-tight text-[#EAECE9] tabular-nums">
                    {engine.sensorFaultActive
                      ? 'ABSTAIN'
                      : dataSource === 'FAA_PHYSICAL_MAINTENANCE'
                        ? (engine.llpLimitCycles - engine.llpAccumulatedCycles).toFixed(0)
                        : dataSource === 'NASA_NCMAPSS_TRANSIENT'
                          ? engine.n1RpmPct.toFixed(1)
                          : engine.conformalRul.toFixed(1)}
                  </span>
                  {!engine.sensorFaultActive && (
                    <span className="text-[15px] text-[#EAECE9]">
                      {dataSource === 'FAA_PHYSICAL_MAINTENANCE'
                        ? 'LLP cycles'
                        : dataSource === 'NASA_NCMAPSS_TRANSIENT'
                          ? '% N1'
                          : 'cycles'}
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-[#949C96] mt-1.5">
                  {dataSource === 'FAA_PHYSICAL_MAINTENANCE'
                    ? 'HPT Disk Limit (FAA Part 33.70)'
                    : dataSource === 'NASA_NCMAPSS_TRANSIENT'
                      ? 'Takeoff Spool Thrust'
                      : 'RUL (90% PI)'}
                </div>
              </div>

              {/* Bracketed Prediction Interval [ 5.1 - 12.9 ] OR [ 14,892 / 15,000c ] */}
              <div className="text-[13px] font-mono text-[#EAECE9] tabular-nums flex items-center gap-1 pb-1">
                <span className="text-[#949C96] text-base leading-none">[</span>
                <span>
                  {dataSource === 'FAA_PHYSICAL_MAINTENANCE'
                    ? `${engine.llpAccumulatedCycles.toLocaleString()} / ${engine.llpLimitCycles.toLocaleString()}c`
                    : dataSource === 'NASA_NCMAPSS_TRANSIENT'
                      ? 'FL025 · 98° TRA'
                      : `${engine.conformalLower90.toFixed(1)} – ${engine.conformalUpper90.toFixed(1)}`}
                </span>
                <span className="text-[#949C96] text-base leading-none">]</span>
              </div>
            </div>

            {/* Dynamic Metric Row */}
            <div className="pt-2 border-t border-white/[0.07] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#949C96]">
                {dataSource === 'FAA_PHYSICAL_MAINTENANCE'
                  ? 'SOAP Wear Metal Index:'
                  : dataSource === 'NASA_NCMAPSS_TRANSIENT'
                    ? 'Combustor Thermal Peak:'
                    : dataSource === 'ARINC_429_ACARS_EHM'
                      ? 'Takeoff EGT Margin:'
                      : 'Kinematic Wear V_k:'}
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  engine.sensorFaultActive || dataSource === 'FAA_PHYSICAL_MAINTENANCE'
                    ? 'text-[#D97865]'
                    : 'text-[#B8CE82]'
                }`}
              >
                {engine.sensorFaultActive
                  ? 'FAULT_ABSTAIN'
                  : dataSource === 'FAA_PHYSICAL_MAINTENANCE'
                    ? `Fe: ${engine.soapOilPpm.fe} ppm (Elevated)`
                    : dataSource === 'NASA_NCMAPSS_TRANSIENT'
                      ? `T30: ${engine.t30}°R`
                      : dataSource === 'ARINC_429_ACARS_EHM'
                        ? '+14.2°C (Healthy)'
                        : `-0.042 %/c`}
              </span>
            </div>

            {/* Subtle Quick Interactive Actions Row (Preserves Water Wash & Sensor Fault Testing) */}
            <div className="pt-2 border-t border-white/[0.07] flex items-center gap-2">
              <button
                type="button"
                onClick={() => onWaterWash(engine.id)}
                disabled={engine.waterWashApplied}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  engine.waterWashApplied
                    ? 'bg-[#82A995]/20 text-[#82A995] border border-[#82A995]/40 cursor-not-allowed'
                    : 'bg-[#2E3330] hover:bg-[#B8CE82] text-[#EAECE9] hover:text-[#181B19] border border-white/10'
                }`}
              >
                <Droplets className="w-3 h-3 shrink-0" />
                <span>{engine.waterWashApplied ? 'Washed (+32c)' : 'Perform Water Wash'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleSensorFault(engine.id)}
                className={`py-1.5 px-2.5 rounded-xl text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                  engine.sensorFaultActive
                    ? 'bg-[#D97865] text-[#181B19] border-[#D97865]'
                    : 'bg-[#2E3330] hover:bg-[#383E3A] text-[#949C96] hover:text-[#EAECE9] border border-white/10'
                }`}
              >
                <ShieldAlert className="w-3 h-3 shrink-0" />
                <span>{engine.sensorFaultActive ? 'Clear Fault' : 'Simulate Sensor Fault'}</span>
              </button>
            </div>
          </div>

          {/* Middle-Right Card: HPC Efficiency */}
          <div className="pointer-events-auto backdrop-blur-2xl bg-[#232725]/85 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] space-y-3.5">
            <div className="text-[14px] font-normal text-[#EAECE9]">HPC Efficiency</div>

            <div className="text-[32px] leading-none font-normal tracking-tight text-[#EAECE9] tabular-nums">
              {engine.hpcEfficiencyPct.toFixed(1)}{' '}
              <span className="text-[20px] text-[#EAECE9]">%</span>
            </div>

            {/* 16-Block Segmented Horizontal Bar */}
            <div className="grid grid-cols-16 gap-1.5 pt-1" aria-label="HPC Efficiency Segmented Bar">
              {Array.from({ length: totalEffSegments }, (_, idx) => {
                const isFilled = idx < activeEffSegments;
                return (
                  <div
                    key={idx}
                    className={`h-5 rounded-[2px] transition-colors ${
                      isFilled ? 'bg-[#B8CE82]' : 'bg-[#353B37]'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </aside>
      )}

      {/* =====================================================================
          CENTER-BOTTOM STAGE BAR + BOTTOM 3-CARD DOCK (MATCHES REFERENCE)
         ===================================================================== */}
      <div className="absolute bottom-4 left-6 right-6 lg:left-8 lg:right-8 z-20 flex flex-col items-center gap-3.5 pointer-events-none">
        {/* Center 7-Stage Selector Strip with Angled Bracket Lines (FAN | IPC | HPC | COMB | HPT | IPT | LPT) */}
        {!hudCollapsed && (
          <div className={`pointer-events-auto flex flex-col items-center gap-2 transition-all duration-700 ease-in-out ${
            isDiagnosticsMode ? '-translate-y-[160%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          }`}>
            {/* Bracket Line Row & Pill Buttons */}
            <div
              role="group"
              aria-label="Engine Stage Auto-Zoom"
              className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 rounded-full bg-[#1E2220]/75 backdrop-blur-xl border border-white/[0.07]"
            >
              {REFERENCE_STAGE_BAR.map((item) => {
                const isSelected = activeBarKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelectStage(item.stageId, item.key)}
                    className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#B8CE82] text-[#181B19] font-semibold shadow-[0_0_16px_rgba(184,206,130,0.35)]'
                        : 'text-[#949C96] hover:text-[#EAECE9]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              <span className="text-white/15 px-1">|</span>

              {/* Compact 3D Viewport Mode Toggles (Blueprint, Cowling, Thermal, Spin, Reset, Fullscreen) */}
              <button
                type="button"
                onClick={() => setBlueprintXray((v) => !v)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                  blueprintXray || selectedStage !== null
                    ? 'bg-[#B8CE82]/25 text-[#B8CE82] border border-[#B8CE82]/50 font-semibold'
                    : 'text-[#949C96] hover:text-[#EAECE9]'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Blueprint</span>
              </button>

              <button
                type="button"
                onClick={() => setCowlingOpen((v) => !v)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                  cowlingOpen
                    ? 'text-[#EAECE9]'
                    : 'text-[#949C96] hover:text-[#EAECE9]'
                }`}
              >
                {cowlingOpen ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>Cowling</span>
              </button>

              <button
                type="button"
                onClick={() => setThermalHeatmap((v) => !v)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                  thermalHeatmap
                    ? 'bg-[#D97865] text-[#181B19] font-semibold'
                    : 'text-[#949C96] hover:text-[#EAECE9]'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>Thermal</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSpinning((v) => !v)}
                aria-label={isSpinning ? 'Pause Spool Rotation' : 'Play Spool Rotation'}
                className="p-1 text-[#949C96] hover:text-[#EAECE9] cursor-pointer"
              >
                {isSpinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleResetCamera}
                aria-label="Reset 3D Camera"
                className="p-1 text-[#949C96] hover:text-[#EAECE9] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen((v) => !v)}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                className="p-1 text-[#949C96] hover:text-[#EAECE9] cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setHudCollapsed(true)}
                title="Hide HUD (Cinema Inspection Mode)"
                className="p-1 text-[#949C96] hover:text-[#EAECE9] cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {hudCollapsed && (
          <button
            type="button"
            onClick={() => setHudCollapsed(false)}
            className="pointer-events-auto px-4 py-1.5 rounded-full backdrop-blur-2xl bg-[#232725]/90 border border-white/15 text-xs font-mono uppercase tracking-wider text-[#EAECE9] flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5 text-[#B8CE82]" />
            <span>Restore Telemetry HUD</span>
          </button>
        )}

        {/* Bottom 3-Card Row (Matches Reference: Rolls-Royce Trent 1000 | Temperatures | High-Risk Alarms) */}
        {!hudCollapsed && (
          <div className={`pointer-events-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch transition-all duration-700 ease-in-out ${
            isDiagnosticsMode ? 'translate-y-[160%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          }`}>
            {/* Bottom-Left Card: Rolls-Royce Trent 1000 Specs */}
            <div className="lg:col-span-5 backdrop-blur-2xl bg-[#232725]/85 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex items-center justify-between gap-5">
              {/* Left RR Monogram & Engine Model Title */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-12 h-14 rounded-xl bg-[#1D211F] border border-white/15 flex items-center justify-center select-none shadow-inner">
                  <span className="font-serif text-2xl font-bold tracking-tighter text-[#EAECE9]">
                    RR
                  </span>
                </div>
                <div>
                  <div className="text-xs text-[#949C96]">Rolls-Royce</div>
                  <div className="text-xl font-medium text-[#EAECE9] tracking-tight mt-0.5">
                    Trent 1000
                  </div>
                </div>
              </div>

              <div className="w-px h-16 bg-white/[0.08] shrink-0" />

              {/* Right 3 Spec Rows */}
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                  <span className="text-[#949C96]">Thrust</span>
                  <span className="font-mono text-[#EAECE9] tabular-nums">68,000 – 78,000 lbf</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                  <span className="text-[#949C96]">Bypass Ratio</span>
                  <span className="font-mono text-[#EAECE9] tabular-nums">10.0 : 1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#949C96]">Overall PR</span>
                  <span className="font-mono text-[#EAECE9] tabular-nums">
                    ~ {engine.overallPressureRatio.toFixed(0)} : 1
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom-Center Card: Temperatures OR SOAP Oil Spectrometry if in FAA Physical Dossier mode */}
            <div className="lg:col-span-4 backdrop-blur-2xl bg-[#232725]/85 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between space-y-3">
              {dataSource === 'FAA_PHYSICAL_MAINTENANCE' ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#D97865]" />
                      <h3 className="text-[14px] font-normal text-[#EAECE9]">SOAP Oil Spectrometry (ASTM D5185)</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#D97865]/20 text-[#D97865] border border-[#D97865]/30">
                      METALLURGICAL WEAR
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-12 items-center gap-2 text-xs">
                      <span className="col-span-3 text-[#EAECE9] font-mono font-semibold">Fe (Iron)</span>
                      <span className="col-span-4 text-[#D97865] font-mono tabular-nums font-bold">
                        {engine.soapOilPpm.fe.toFixed(1)} ppm
                      </span>
                      <div className="col-span-5 h-2 rounded-full bg-[#323734] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#D97865] shadow-[0_0_8px_rgba(217,120,101,0.6)]"
                          style={{ width: `${Math.min(100, (engine.soapOilPpm.fe / 20) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 items-center gap-2 text-xs">
                      <span className="col-span-3 text-[#EAECE9] font-mono font-semibold">Ti (Titanium)</span>
                      <span className="col-span-4 text-[#B8CE82] font-mono tabular-nums font-bold">
                        {engine.soapOilPpm.ti.toFixed(1)} ppm
                      </span>
                      <div className="col-span-5 h-2 rounded-full bg-[#323734] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#B8CE82] shadow-[0_0_8px_rgba(184,206,130,0.6)]"
                          style={{ width: `${Math.min(100, (engine.soapOilPpm.ti / 10) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 items-center gap-2 text-xs">
                      <span className="col-span-3 text-[#949C96] font-mono">Ag (Silver)</span>
                      <span className="col-span-4 text-[#EAECE9] font-mono tabular-nums">
                        {engine.soapOilPpm.ag.toFixed(2)} ppm
                      </span>
                      <div className="col-span-5 h-2 rounded-full bg-[#323734] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#82A995]"
                          style={{ width: `${Math.min(100, (engine.soapOilPpm.ag / 1.5) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 items-center gap-2 text-xs">
                      <span className="col-span-3 text-[#949C96] font-mono">Si (Silicon)</span>
                      <span className="col-span-4 text-[#EAECE9] font-mono tabular-nums">
                        {engine.soapOilPpm.si.toFixed(1)} ppm
                      </span>
                      <div className="col-span-5 h-2 rounded-full bg-[#323734] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#949C96]"
                          style={{ width: `${Math.min(100, (engine.soapOilPpm.si / 15) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-[#949C96]" />
                    <h3 className="text-[14px] font-normal text-[#EAECE9]">Temperatures</h3>
                  </div>

                  <div className="space-y-2.5">
                    {tempRows.map((row) => (
                      <div key={row.label} className="grid grid-cols-12 items-center gap-2 text-xs">
                        <span className="col-span-2 text-[#949C96] font-mono">{row.label}</span>
                        <span className="col-span-4 text-[#EAECE9] font-mono tabular-nums">
                          {row.value}
                        </span>
                        <div className="col-span-6 h-2 rounded-full bg-[#323734] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#B8CE82] shadow-[0_0_10px_rgba(184,206,130,0.45)] transition-all duration-300"
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Bottom-Right Card: High-Risk Alarms OR FAA Part 33.70 Limit */}
            <div className="lg:col-span-3 backdrop-blur-2xl bg-[#232725]/85 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D97865]" />
                  <h3 className="text-[14px] font-normal text-[#EAECE9]">
                    {dataSource === 'FAA_PHYSICAL_MAINTENANCE' ? 'FAA Regulatory Ceiling' : 'High-Risk Alarms'}
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#4A322E] text-[#F2D5CF] text-xs font-mono font-semibold">
                  {dataSource === 'FAA_PHYSICAL_MAINTENANCE' ? '§ 33.70' : (engine.urgency === 'NOMINAL' ? '0' : '1')}
                </span>
              </div>

              <button
                type="button"
                onClick={onNavigateToDossier}
                className="w-full text-left bg-[#352624]/85 hover:bg-[#3F2D2A] border border-[#5C3B36] rounded-2xl px-3.5 py-3 flex items-center justify-between gap-2.5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-[#D97865] shrink-0" />
                  <div className="text-xs leading-snug text-[#EAECE9]">
                    {dataSource === 'FAA_PHYSICAL_MAINTENANCE' ? (
                      <>
                        <div className="font-semibold text-[#D97865]">HPT Disk Retirement Near</div>
                        <div className="text-[#949C96] font-mono tabular-nums mt-0.5">
                          {engine.llpLimitCycles - engine.llpAccumulatedCycles} cycles left (15,000c cap)
                        </div>
                      </>
                    ) : (
                      <>
                        <div>HPC T30 exceeds threshold</div>
                        <div className="text-[#949C96] font-mono tabular-nums mt-0.5">
                          ({engine.t30.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} °R)
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#949C96] group-hover:text-[#EAECE9] shrink-0" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
