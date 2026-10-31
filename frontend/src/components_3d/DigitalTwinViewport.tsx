import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Droplets,
  Eye,
  EyeOff,
  FileCheck2,
  Flame,
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import {
  EngineTelemetry,
  StageId,
  TURBOFAN_STAGE_SPECS,
} from '../services/prognosticsEngine';
import { buildTrent1000CutawayModel } from './Trent1000ProceduralModel';
import {
  CircularCompassSpoolDial,
  DottedArcEqualizerWidget,
  VerticalHatchedTempColumns,
} from '../components/TelemetryWidgets';
import { ShootingStars } from '@/src/components/ui/shooting-stars';
import { StarsBackground } from '@/src/components/ui/stars-background';

interface DigitalTwinViewportProps {
  engine: EngineTelemetry;
  onWaterWash: (engineId: string) => void;
  onToggleSensorFault: (engineId: string) => void;
  onNavigateToDossier: () => void;
  actionBanner: string | null;
}

const STAGE_ORDER: StageId[] = ['FAN', 'LPC', 'HPC', 'COMBUSTOR', 'HPT', 'LPT'];

// Reusable Three.js vectors & colors outside the render loop
const _worldPos = new THREE.Vector3();
const _ndcPos = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _pointerNdc = new THREE.Vector2();
const _highlightAmber = new THREE.Color('#facc15');
const _highlightCrimson = new THREE.Color('#ef4444');
const _highlightCyan = new THREE.Color('#00e5ff');
const _blueprintTint = new THREE.Color('#0ea5e9');
const _blueprintStrokeCyan = new THREE.Color('#00e5ff');
const _blueprintStrokeAmber = new THREE.Color('#facc15');
const _blueprintStrokeCrimson = new THREE.Color('#ef4444');

export const DigitalTwinViewport: React.FC<DigitalTwinViewportProps> = ({
  engine,
  onWaterWash,
  onToggleSensorFault,
  onNavigateToDossier,
  actionBanner,
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

  const [selectedStage, setSelectedStage] = useState<StageId | null>('HPC');
  const [cowlingOpen, setCowlingOpen] = useState<boolean>(true);
  const [explodedSlider, setExplodedSlider] = useState<number>(0.42);
  const [thermalHeatmap, setThermalHeatmap] = useState<boolean>(false);
  const [blueprintXray, setBlueprintXray] = useState<boolean>(true);
  const [isSpinning, setIsSpinning] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);

  const stateRef = useRef({
    selectedStage: 'HPC' as StageId | null,
    cowlingOpen: true,
    explodedSlider: 0.42,
    thermalHeatmap: false,
    blueprintXray: true,
    isSpinning: true,
    n1RpmPct: engine.n1RpmPct,
    n2RpmPct: engine.n2RpmPct,
    t24: engine.t24,
    t30: engine.t30,
    t50: engine.t50,
    cameraTransitionActive: true,
    desiredCamPos: new THREE.Vector3(5.0, 2.05, 4.5),
    desiredCamTarget: new THREE.Vector3(0, -0.2, 0.2),
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

  const handleSelectStage = (stage: StageId | null) => {
    if (stage === null) {
      setSelectedStage(null);
      setExplodedSlider(0.0);
      setCowlingOpen(false);
      setBlueprintXray(false);
      stateRef.current.desiredCamPos.set(6.8, 2.5, 6.2);
      stateRef.current.desiredCamTarget.set(0, -0.2, 0);
      stateRef.current.cameraTransitionActive = true;
      return;
    }

    setSelectedStage(stage);
    setCowlingOpen(true);
    setBlueprintXray(true);
    setExplodedSlider(0.62);

    const spec = TURBOFAN_STAGE_SPECS[stage];
    const rotY = -Math.PI * 0.36;
    const explodedZShift = spec.explodeMultipliers[stage] * 0.62 * 1.15;
    const localCam = new THREE.Vector3(
      spec.cameraPos[0],
      spec.cameraPos[1],
      spec.cameraPos[2] + explodedZShift
    );
    localCam.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);

    const localTarget = new THREE.Vector3(
      spec.cameraTarget[0],
      spec.cameraTarget[1] - 0.25,
      spec.cameraTarget[2] + explodedZShift
    );
    localTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);

    stateRef.current.desiredCamPos.copy(localCam);
    stateRef.current.desiredCamTarget.copy(localTarget);
    stateRef.current.cameraTransitionActive = true;
  };

  const handleResetCamera = () => {
    setSelectedStage(null);
    setCowlingOpen(true);
    setBlueprintXray(false);
    setExplodedSlider(0.28);
    stateRef.current.desiredCamPos.set(6.2, 2.35, 5.6);
    stateRef.current.desiredCamTarget.set(0, -0.2, 0.0);
    stateRef.current.cameraTransitionActive = true;
  };

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

    // Transparent WebGL backdrop so ShootingStars & StarsBackground shine behind the 3D engine
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 120);
    camera.position.set(5.0, 2.05, 4.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3-Point Aerospace Studio Lighting
    const keyLight = new THREE.DirectionalLight('#ffffff', 2.8);
    keyLight.position.set(6, 10, 7);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#38bdf8', 1.85);
    rimLight.position.set(-8, 6, -5);
    scene.add(rimLight);

    const bounceLight = new THREE.DirectionalLight('#facc15', 0.85);
    bounceLight.position.set(0, -7, 3);
    scene.add(bounceLight);

    const hemiLight = new THREE.HemisphereLight('#e2e8f0', '#0f172a', 1.15);
    scene.add(hemiLight);

    // Subtle Blueprint Radial Floor Grid & Contact Shadow Disc beneath Engine
    const floorGroup = new THREE.Group();
    floorGroup.position.y = -2.85;

    const gridHelper = new THREE.PolarGridHelper(6.5, 16, 6, 64, '#1e293b', '#0ea5e9');
    const gridMat = gridHelper.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.24;
    floorGroup.add(gridHelper);

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

    // Build Procedural Rolls-Royce Trent 1000 Cutaway Model
    const assembly = buildTrent1000CutawayModel(renderer);
    assembly.rootGroup.position.y = -0.25;
    scene.add(assembly.rootGroup);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 2.6;
    controls.maxDistance = 15.0;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.target.set(0, -0.2, 0.2);

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

    // Frame pacing loop with software GL fenceSync support
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

      // =========================================================================
      // ENHANCED NORMAL COLORS, CUSTOM GLSL THERMAL SHADER & BLUEPRINT X-RAY
      // =========================================================================
      const isZoomedOrBlueprint = st.blueprintXray || st.selectedStage !== null;
      const elapsed = clock.elapsedTime;
      const normT24 = Math.max(0.0, Math.min(1.0, (st.t24 - 615) / 65));
      const normT30 = Math.max(0.0, Math.min(1.0, (st.t30 - 1540) / 75));
      const normT50 = Math.max(0.0, Math.min(1.0, (st.t50 - 1350) / 100));

      assembly.thermalMaterials.forEach((item) => {
        const isSelectedInner =
          st.selectedStage !== null && item.stageId === st.selectedStage && !item.isOuterShell;
        const isSelectedShroud =
          st.selectedStage !== null && item.stageId === st.selectedStage && item.isOuterShell;

        // Drive custom GLSL thermal shader uniforms (Blue -> Cyan -> Emerald -> Amber -> Bright Crimson)
        item.shaderUniforms.uThermalActive.value = THREE.MathUtils.lerp(
          item.shaderUniforms.uThermalActive.value,
          st.thermalHeatmap ? 1.0 : 0.0,
          0.25
        );
        item.shaderUniforms.uT24Norm.value = normT24;
        item.shaderUniforms.uT30Norm.value = normT30;
        item.shaderUniforms.uT50Norm.value = normT50;
        item.shaderUniforms.uTime.value = elapsed;

        // 1. Color & Emissive Selection (Thermal FLIR vs Normal / Selected Highlight)
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
                : _highlightCyan;
          item.mat.color.lerp(item.baseColor, 0.2);
          item.mat.emissive.lerp(highlightColor, 0.25);
          item.mat.emissiveIntensity = 0.55;
        } else if (isZoomedOrBlueprint && (item.isOuterShell || st.selectedStage !== null)) {
          // Outer shell & non-selected stages get a subtle CAD blueprint cyan tint
          item.mat.color.lerp(_blueprintTint, 0.16);
          item.mat.emissive.lerp(_blueprintStrokeCyan, 0.16);
          item.mat.emissiveIntensity = 0.18;
        } else {
          item.mat.color.lerp(item.baseColor, 0.2);
          item.mat.emissive.lerp(item.baseEmissive, 0.2);
          item.mat.emissiveIntensity = item.baseEmissiveIntensity;
        }

        // 2. Transparency & Depth Write (Inner parts solid, Outer casings & unselected parts transparent!)
        let targetOpacity = 1.0;
        if (st.thermalHeatmap) {
          // In Thermal FLIR mode, outer shells & cowlings become ultra-transparent blueprint wireframes so all 6 thermal stages glow vividly
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
            // Unselected adjacent stages become translucent blueprint ghosts so the zoomed stage stands out
            targetOpacity = item.isOuterShell ? 0.06 : 0.16;
          } else {
            // Full-engine Blueprint X-Ray mode (no single stage selected): outer shells transparent, inner rotors visible
            targetOpacity = item.isOuterShell ? 0.09 : 0.92;
          }
        } else {
          targetOpacity = item.stageId === 'COWLING' && st.cowlingOpen ? 0.22 : 1.0;
        }

        item.mat.opacity = THREE.MathUtils.lerp(item.mat.opacity, targetOpacity, 0.24);
        item.mat.depthWrite = item.mat.opacity > 0.65;
      });

      // 3. Update Blueprint Edge & Contour Stroke Lines (THREE.LineSegments)
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
                  : _blueprintStrokeCyan;
            stroke.mat.color.lerp(activeStrokeCol, 0.25);
            stroke.mat.opacity = stroke.isOuterShell ? 0.92 : 0.65;
          } else {
            stroke.mat.color.lerp(_blueprintStrokeCyan, 0.2);
            stroke.mat.opacity = stroke.stageId === 'COWLING' ? 0.72 : 0.58;
          }
        } else {
          // Subtle technical edge accent in standard solid mode
          stroke.line.visible = true;
          stroke.mat.color.lerp(stroke.baseColor, 0.2);
          stroke.mat.opacity = stroke.isOuterShell ? 0.22 : 0.12;
        }
      });

      // Project all 6 Stage Concentric Target Rings (`◎`) + Active Leader Line Callout
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
          btn.style.transform = `translate3d(${(sx - 16).toFixed(1)}px, ${(sy - 16).toFixed(1)}px, 0)`;
        }

        if (st.selectedStage === stageId && pinOverlayRef.current && leaderLineRef.current) {
          const cardWidth = 332;
          const minCardX = 335;
          const maxCardX = Math.max(minCardX, cWidth - 315 - cardWidth - 16);
          const preferredX = sx > cWidth * 0.52 ? sx - cardWidth - 46 : sx + 46;
          const cardX = Math.max(minCardX, Math.min(maxCardX, preferredX));
          const cardY = Math.max(24, Math.min(cHeight - 420, sy - 95));

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

  const activeStageSpec = selectedStage ? TURBOFAN_STAGE_SPECS[selectedStage] : null;
  const stageCalloutMetrics = activeStageSpec ? activeStageSpec.getMetrics(engine) : null;

  const tempColumns = [
    {
      label: 'LPC T24',
      tempText: `${Math.round(engine.t24)}°R`,
      fillPct: ((engine.t24 - 600) / 85) * 100,
      isWarning: engine.t24 >= 665,
    },
    {
      label: 'HPC T30',
      tempText: `${Math.round(engine.t30)}°R`,
      fillPct: ((engine.t30 - 1520) / 110) * 100,
      isWarning: engine.t30 >= 1590,
    },
    {
      label: 'EGT T50',
      tempText: `${Math.round(engine.t50)}°R`,
      fillPct: ((engine.t50 - 1340) / 120) * 100,
      isWarning: engine.t50 >= 1435,
    },
    {
      label: 'SOAP Fe',
      tempText: `${engine.soapOilPpm.fe.toFixed(0)}ppm`,
      fillPct: (engine.soapOilPpm.fe / 20) * 100,
      isWarning: engine.soapOilPpm.fe >= 16,
    },
  ];

  return (
    <section
      aria-label="3D Digital Twin Command Viewport"
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#111A19] overflow-hidden'
          : 'relative w-full h-[calc(100vh-76px)] min-h-[730px] bg-transparent overflow-hidden select-none'
      }
    >
      {/* Aceternity Shooting Stars & Stars Background Layer Behind the 3D Engine */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_rgba(179,197,139,0.11)_0%,_rgba(130,169,149,0.06)_45%,_rgba(17,26,25,0.96)_90%)]"
      >
        <StarsBackground starDensity={0.00024} />
        <ShootingStars starColor="#B3C58B" trailColor="#82A995" minDelay={900} maxDelay={2800} />
      </div>

      {/* Dedicated WebGL Mount Container */}
      <div
        ref={canvasMountRef}
        data-testid="digital-twin-canvas"
        className="absolute inset-0 z-10 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Action Notification Pill */}
      {actionBanner && (
        <div
          role="status"
          className="absolute top-3 left-1/2 -translate-x-1/2 z-30 backdrop-blur-2xl bg-[#1C2926]/95 border border-[#46564D] text-[#E7ECE7] px-4 py-2 rounded-2xl shadow-2xl text-xs font-mono flex items-center gap-2"
        >
          <span className="px-2 py-0.5 rounded-md bg-[#B3C58B] text-[#111A19] font-bold text-[10px] uppercase tracking-wider">
            AMM 72-00-00
          </span>
          <span>{actionBanner}</span>
        </div>
      )}

      {/* Custom GLSL Thermal Shader Gradient Legend Pill (Visible when Thermal Mode is active) */}
      {thermalHeatmap && !actionBanner && (
        <div
          data-testid="thermal-shader-legend"
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-2xl px-4 py-2 shadow-2xl flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-[#E7ECE7]"
        >
          <span className="text-[#B3C58B] font-bold">GLSL FLIR SHADER</span>
          <span className="text-[#A6B4AA]">
            T24: <strong className="text-[#82A995]">{engine.t24.toFixed(1)}°R</strong>
          </span>
          <div
            className="w-28 h-2 rounded-full border border-[#46564D]"
            style={{
              background:
                'linear-gradient(90deg, #1752eb 0%, #00e5ff 25%, #82A995 50%, #D8B65E 75%, #D97865 100%)',
            }}
          />
          <span className="text-[#A6B4AA]">
            T30: <strong className="text-[#D8B65E]">{engine.t30.toFixed(1)}°R</strong>
          </span>
          <span className="text-[#A6B4AA]">
            T50: <strong className="text-[#D97865]">{engine.t50.toFixed(1)}°R</strong>
          </span>
        </div>
      )}

      {/* Concentric Target Rings (`◎`) Projected on the 3D Engine */}
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
              onClick={() => handleSelectStage(stageId)}
              aria-label={`Inspect ${spec.shortName}`}
              className={`pointer-events-auto absolute top-0 left-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isSelected
                  ? 'border-2 border-[#B3C58B] bg-[#293834]/80 shadow-[0_0_16px_rgba(179,197,139,0.65)]'
                  : 'border border-[#82A995]/80 bg-[#1C2926]/70 hover:bg-[#293834]/80'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSelected ? 'bg-[#B3C58B]' : 'bg-[#82A995]'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* SVG Leader Line & Floating Glassmorphic Callout Card */}
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
                    : '#B3C58B'
              }
              strokeWidth="1.8"
              points="0,0 0,0 0,0"
            />
          </svg>

          <div
            ref={pinOverlayRef}
            data-testid="stage-pin-callout"
            className="pointer-events-auto absolute top-0 left-0 w-[332px] backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.75)] text-[#E7ECE7]"
          >
            {/* Header with circular icon badge */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                    activeStageSpec.severity === 'NOMINAL'
                      ? 'bg-[#82A995]/20 border-[#82A995]/60 text-[#82A995]'
                      : activeStageSpec.severity === 'WARNING'
                        ? 'bg-[#D8B65E]/20 border-[#D8B65E]/60 text-[#D8B65E]'
                        : 'bg-[#D97865]/20 border-[#D97865]/60 text-[#D97865]'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                        activeStageSpec.severity === 'NOMINAL'
                          ? 'text-[#82A995]'
                          : activeStageSpec.severity === 'WARNING'
                            ? 'text-[#D8B65E]'
                            : 'text-[#D97865]'
                      }`}
                    >
                      {activeStageSpec.shortName} · {activeStageSpec.severity}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#293834] border border-[#46564D] text-[9px] font-mono uppercase tracking-wider text-[#B3C58B]">
                      X-RAY STROKE
                    </span>
                  </div>
                  <div className="text-xs font-mono font-semibold text-[#E7ECE7] mt-0.5">
                    {stageCalloutMetrics.primaryReadout}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectStage(null)}
                aria-label="Close Stage Callout"
                className="text-[#A6B4AA] hover:text-[#E7ECE7] text-xs p-1 cursor-pointer font-mono"
              >
                ✕
              </button>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-[#46564D] text-[11px] text-[#E7ECE7] space-y-1.5">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-[#A6B4AA]">{stageCalloutMetrics.secondaryReadout}</span>
                <span className="font-bold text-[#B3C58B]">
                  {stageCalloutMetrics.efficiencyOrMargin}
                </span>
              </div>
              <p className="leading-relaxed text-[#A6B4AA] text-[11px]">
                {stageCalloutMetrics.borescopeLog}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2">
              {stageCalloutMetrics.actionType === 'WATER_WASH' ? (
                <button
                  type="button"
                  onClick={() => onWaterWash(engine.id)}
                  disabled={engine.waterWashApplied}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    engine.waterWashApplied
                      ? 'bg-[#82A995]/20 text-[#82A995] border border-[#82A995]/50 cursor-not-allowed'
                      : 'bg-[#B3C58B] hover:bg-[#B3C58B]/90 text-[#111A19] shadow-md'
                  }`}
                >
                  {engine.waterWashApplied ? 'Water Wash Completed' : stageCalloutMetrics.actionLabel}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateToDossier}
                  className="flex-1 py-1.5 px-3 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider bg-[#B3C58B] hover:bg-[#B3C58B]/90 text-[#111A19] transition-all cursor-pointer"
                >
                  {stageCalloutMetrics.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={onNavigateToDossier}
                className="py-1.5 px-2.5 rounded-xl text-[11px] font-mono font-semibold uppercase tracking-wider bg-[#293834] hover:bg-[#293834]/80 text-[#E7ECE7] border border-[#46564D] cursor-pointer"
              >
                Form 8130-3
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          LEFT FLOATING GLASSMORPHISM HUD PANEL ("Status" & "High-risk alarms")
         ===================================================================== */}
      {!hudCollapsed && (
        <aside
          aria-label="Active Engine Prognostics HUD"
          className="absolute top-4 left-5 z-20 w-[304px] backdrop-blur-2xl bg-[#1C2926]/85 border border-[#46564D] rounded-3xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.65)] space-y-3.5 text-[#E7ECE7]"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                Status
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#293834] border border-[#46564D] text-[10px] font-mono font-semibold uppercase tracking-wider text-[#B3C58B]">
                Active · {engine.id}
              </span>
            </div>
            <span className="text-[11px] font-mono font-semibold text-[#A6B4AA]">{engine.tailId}</span>
          </div>

          {/* Key-Value Rows */}
          <div className="space-y-2 text-xs pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
                Flight Cycle / LLP
              </span>
              <span className="font-mono font-semibold text-[#E7ECE7] tabular-nums">
                {engine.flightCycles}c · {engine.llpAccumulatedCycles.toLocaleString()}c
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
                Conformal RUL (90%)
              </span>
              <span className="font-mono font-bold text-[#B3C58B] tabular-nums">
                {engine.sensorFaultActive ? 'ABSTAIN [0–125c]' : `${engine.conformalRul.toFixed(1)} cycles`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
                90% Interval Bounds
              </span>
              <span className="font-mono font-semibold text-[#82A995] tabular-nums">
                [{engine.conformalLower90.toFixed(1)}, {engine.conformalUpper90.toFixed(1)}]c
              </span>
            </div>
          </div>

          {/* Dual Pill Bars ("DO-178C Sensor Fault" bar + Warning bar) */}
          <div className="space-y-2 pt-0.5">
            <div className="flex items-center justify-between bg-[#182321] border border-[#46564D] rounded-xl px-3.5 py-2 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
                DO-178C Sensor Fault
              </span>
              <span
                className={`font-mono font-bold ${
                  engine.sensorFaultActive ? 'text-[#D97865]' : 'text-[#82A995]'
                }`}
              >
                {engine.sensorFaultActive ? 'FAULT_ABSTAIN' : 'NOMINAL'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#D8B65E] rounded-xl px-3.5 py-2 text-xs shadow-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#111A19]">
                Warnings · {engine.urgency}
              </span>
              <span className="font-mono font-bold text-[#111A19]">
                {engine.urgency === 'NOMINAL' ? '0' : '1'}
              </span>
            </div>
          </div>

          {/* High-Risk Alarms Critical Banner */}
          <div className="pt-1 border-t border-[#46564D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A6B4AA]">
                High-risk alarms
              </span>
              <button
                type="button"
                onClick={onNavigateToDossier}
                className="text-[10px] font-mono uppercase tracking-wider text-[#B3C58B] hover:text-[#E7ECE7] cursor-pointer"
              >
                Dossier details ›
              </button>
            </div>

            <div className="flex items-center justify-between gap-2.5 bg-[#D97865]/15 border border-[#D97865]/50 rounded-2xl p-2.5">
              <div className="w-7 h-7 rounded-full bg-[#D97865] text-[#111A19] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] leading-snug text-[#E7ECE7] flex-1 font-mono">
                HPC T30 reaches <strong className="text-[#D97865]">{engine.t30.toFixed(1)}°R</strong> (
                {engine.t30CreepDelta >= 0 ? '+' : ''}
                {engine.t30CreepDelta.toFixed(1)}°R creep).
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#D97865] shrink-0" />
            </div>
          </div>

          {/* Interactive Maintenance & Safety Actions */}
          <div className="pt-1 space-y-1.5">
            <button
              type="button"
              onClick={() => onWaterWash(engine.id)}
              disabled={engine.waterWashApplied}
              className={`w-full py-2 px-3 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                engine.waterWashApplied
                  ? 'bg-[#82A995]/20 text-[#82A995] border border-[#82A995]/50 cursor-not-allowed'
                  : 'bg-[#B3C58B] hover:bg-[#B3C58B]/90 text-[#111A19] shadow-md'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>
                {engine.waterWashApplied
                  ? 'Water Wash Applied (+32c)'
                  : 'Perform Compressor Water Wash'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onToggleSensorFault(engine.id)}
              className={`w-full py-1.5 px-3 rounded-xl text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                engine.sensorFaultActive
                  ? 'bg-[#D97865] text-[#111A19] border-[#D97865] font-bold'
                  : 'bg-[#293834] hover:bg-[#293834]/80 text-[#E7ECE7] border-[#46564D]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>
                {engine.sensorFaultActive
                  ? 'Clear DO-178C Sensor Fault'
                  : 'Simulate Sensor Fault'}
              </span>
            </button>
          </div>
        </aside>
      )}

      {/* =====================================================================
          RIGHT FLOATING GLASSMORPHISM HUD PANEL ("Overview")
         ===================================================================== */}
      {!hudCollapsed && (
        <aside
          aria-label="Spool and Gas-Path Gauges HUD"
          className="absolute top-4 right-5 z-20 w-[296px] backdrop-blur-2xl bg-[#1C2926]/85 border border-[#46564D] rounded-3xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.65)] text-[#E7ECE7]"
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
              Overview
            </h2>
            <ArrowUpRight className="w-4 h-4 text-[#B3C58B]" />
          </div>

          <DottedArcEqualizerWidget
            powerLabel="HPC Efficiency"
            powerValue={engine.hpcEfficiencyPct.toFixed(1)}
            powerUnit="%"
            fraction={engine.hpcEfficiencyPct / 100}
            metricLeftLabel="Overall Pressure (OPR)"
            metricLeftValue={`${engine.overallPressureRatio.toFixed(1)} : 1`}
            metricRightLabel="Core P30 Pressure"
            metricRightValue={`${engine.p30.toFixed(1)} psia (${engine.p30LossPct.toFixed(2)}%)`}
            trajectory={engine.trajectory}
          />
        </aside>
      )}

      {/* =====================================================================
          BOTTOM 3-CARD DOCK ("Rotor & Spools" | "Stage & Nacelle" | "Temperatures")
         ===================================================================== */}
      <div className="absolute bottom-4 left-5 right-5 z-20 flex flex-col items-center gap-2 pointer-events-none">
        {/* Collapse/Expand HUD Pill */}
        <button
          type="button"
          onClick={() => setHudCollapsed((v) => !v)}
          className="pointer-events-auto px-3.5 py-1 rounded-full backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA] hover:text-[#E7ECE7] flex items-center gap-1.5 shadow-lg cursor-pointer"
        >
          {hudCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-[#B3C58B]" />
              <span>Restore Telemetry HUD</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-[#B3C58B]" />
              <span>Hide HUD (Cinema Inspection Mode)</span>
            </>
          )}
        </button>

        {!hudCollapsed && (
          <div className="pointer-events-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Bottom Left Card: Rotor & Spools */}
            <div className="lg:col-span-4 backdrop-blur-2xl bg-[#1C2926]/85 border border-[#46564D] rounded-3xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.65)] text-[#E7ECE7] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                    Rotor &amp; Spools
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-[#293834] border border-[#46564D] text-[10px] font-mono uppercase tracking-wider text-[#B3C58B]">
                    3-Shaft Control
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#B3C58B]" />
              </div>

              <CircularCompassSpoolDial
                centerTitle="Core N2"
                centerValue={`${engine.n2RpmPct.toFixed(1)}%`}
                bottomLabel="Fan N1 Speed"
                bottomValue={`${engine.n1RpmPct.toFixed(1)}% RPM`}
                angleDeg={135 + (engine.n2RpmPct - 95) * 18}
                leftReadouts={[
                  { label: 'Fan N1 Spool', value: `${engine.n1RpmPct.toFixed(1)}%` },
                  { label: 'IPC N2 Spool', value: `${engine.n2RpmPct.toFixed(1)}%` },
                  { label: 'Cruise SFC', value: `${engine.sfc.toFixed(3)}` },
                ]}
              />
            </div>

            {/* Bottom Center Card: Stage & Nacelle + Blueprint X-Ray & Thermal Controls */}
            <div className="lg:col-span-5 backdrop-blur-2xl bg-[#1C2926]/85 border border-[#46564D] rounded-3xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.65)] text-[#E7ECE7] flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 shrink-0">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7] whitespace-nowrap">
                    Stage &amp; Nacelle
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#82A995]/20 border border-[#82A995]/50 text-[9px] font-mono uppercase tracking-wider text-[#82A995] whitespace-nowrap">
                    On Wing
                  </span>
                </div>

                {/* Viewport Mode Toggles: Blueprint X-Ray, Cowling, Thermal Map, Spin, Reset, Fullscreen */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setBlueprintXray((v) => !v)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                      blueprintXray || selectedStage !== null
                        ? 'bg-[#B3C58B] text-[#111A19] font-bold shadow-sm'
                        : 'bg-[#293834] text-[#A6B4AA] hover:text-[#E7ECE7] border border-[#46564D]'
                    }`}
                  >
                    <Layers className="w-3 h-3 shrink-0" />
                    <span>Blueprint</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCowlingOpen((v) => !v)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                      cowlingOpen
                        ? 'bg-[#82A995] text-[#111A19] font-bold shadow-sm'
                        : 'bg-[#293834] text-[#A6B4AA] hover:text-[#E7ECE7] border border-[#46564D]'
                    }`}
                  >
                    {cowlingOpen ? <Eye className="w-3 h-3 shrink-0" /> : <EyeOff className="w-3 h-3 shrink-0" />}
                    <span>Cowling</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThermalHeatmap((v) => !v)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                      thermalHeatmap
                        ? 'bg-[#D97865] text-[#111A19] font-bold shadow-sm'
                        : 'bg-[#293834] text-[#A6B4AA] hover:text-[#E7ECE7] border border-[#46564D]'
                    }`}
                  >
                    <Flame className="w-3 h-3 shrink-0" />
                    <span>Thermal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSpinning((v) => !v)}
                    aria-label={isSpinning ? 'Pause Spool Rotation' : 'Play Spool Rotation'}
                    className="p-1 rounded-lg bg-[#293834] hover:bg-[#293834]/80 border border-[#46564D] text-[#E7ECE7] cursor-pointer"
                  >
                    {isSpinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetCamera}
                    aria-label="Reset 3D Camera"
                    className="p-1 rounded-lg bg-[#293834] hover:bg-[#293834]/80 border border-[#46564D] text-[#E7ECE7] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFullscreen((v) => !v)}
                    aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    className="p-1 rounded-lg bg-[#293834] hover:bg-[#293834]/80 border border-[#46564D] text-[#E7ECE7] cursor-pointer"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* 6 Interactive Turbofan Stage Pills */}
              <div
                className="grid grid-cols-3 sm:grid-cols-6 gap-1.5"
                role="group"
                aria-label="Engine Stage Auto-Zoom"
              >
                {STAGE_ORDER.map((stageId) => {
                  const spec = TURBOFAN_STAGE_SPECS[stageId];
                  const isActive = selectedStage === stageId;
                  return (
                    <button
                      key={stageId}
                      type="button"
                      onClick={() => handleSelectStage(stageId)}
                      className={`py-2 px-1 rounded-xl text-[9.5px] font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap text-center ${
                        isActive
                          ? 'bg-[#B3C58B] text-[#111A19] font-bold shadow-sm'
                          : 'bg-[#293834] text-[#A6B4AA] hover:text-[#E7ECE7] border border-[#46564D]'
                      }`}
                    >
                      {spec.shortName}
                    </button>
                  );
                })}
              </div>

              {/* Axial Split Scrubber Bar & Telemetry Readout Row */}
              <div className="bg-[#182321] border border-[#46564D] rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 flex-1">
                  <label
                    htmlFor="axial-explode-slider"
                    className="text-[10px] uppercase tracking-wider text-[#A6B4AA] whitespace-nowrap"
                  >
                    Axial Split
                  </label>
                  <input
                    id="axial-explode-slider"
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={explodedSlider}
                    onChange={(e) => setExplodedSlider(parseFloat(e.target.value))}
                    className="w-full accent-[#B3C58B] cursor-pointer"
                  />
                  <span className="text-[11px] font-mono font-bold text-[#B3C58B] tabular-nums w-9 text-right">
                    {Math.round(explodedSlider * 100)}%
                  </span>
                </div>

                <div className="text-[10px] uppercase tracking-wider text-[#A6B4AA] border-l border-[#46564D] pl-3 whitespace-nowrap">
                  Vib:{' '}
                  <strong className="font-mono text-[#82A995]">
                    {engine.vibrationIps.toFixed(2)} ips
                  </strong>
                </div>
              </div>
            </div>

            {/* Bottom Right Card: Temperatures */}
            <div className="lg:col-span-3 backdrop-blur-2xl bg-[#1C2926]/85 border border-[#46564D] rounded-3xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.65)] text-[#E7ECE7] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                  Temperatures
                </h3>
                <ArrowUpRight className="w-4 h-4 text-[#B3C58B]" />
              </div>

              <VerticalHatchedTempColumns columns={tempColumns} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

