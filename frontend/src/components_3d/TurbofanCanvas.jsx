/**
 * VISION: Interactive 3D Turbofan Jet Engine Canvas
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Features:
 * ---------
 * - Procedural Three.js 3D turbofan jet engine with 6 distinct aerospace components.
 * - Dual rotational spool animation (N1 and N2) with telemetry-driven speed.
 * - Interactive raycasting via ComponentSelector for hover and click selection.
 * - Smooth camera focal interpolation (spherical lerp) onto selected components.
 * - ComponentTooltip HUD overlay showing real-time subsystem health & sensor data.
 * - ComponentGlow dynamic thermal degradation coloring and legend.
 * - Exploded view axial separation and cowling visibility toggles.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useTurbofanModel } from './TurbofanModel.jsx';
import { ComponentSelector } from './ComponentSelector.js';
import ComponentTooltip from './ComponentTooltip.jsx';
import ComponentGlowLegend from './ComponentGlow.jsx';
import {
  RotateCcw,
  Eye,
  EyeOff,
  Flame,
  Layers,
  Pause,
  Play,
  Crosshair,
} from 'lucide-react';

export default function TurbofanCanvas({
  healthData = {},
  latestSensors = {},
  selectedComponent = null,
  onSelectComponent = null,
  n1Speed = 1.0,
  n2Speed = 1.45,
  useGltf = false,
  className = '',
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const selectorRef = useRef(new ComponentSelector());
  const mouseRef = useRef(new THREE.Vector2(-999, -999));

  // Local Interactive View Controls
  const [hoveredComponent, setHoveredComponent] = useState(null);
  const [showCowling, setShowCowling] = useState(true);
  const [explodedView, setExplodedView] = useState(0.0);
  const [thermalMode, setThermalMode] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useCadModel, setUseCadModel] = useState(false);

  // Initialize Three.js Scene and Renderer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera: angled 3/4 isometric aerospace perspective
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(13.0, 6.5, 14.0);
    cameraRef.current = camera;

    // 3. WebGLRenderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3.5;
    controls.maxDistance = 45.0;
    controls.target.set(0, 0, 0.5);
    controls.update();
    controlsRef.current = controls;

    // 5. Studio 3-Point Aerospace Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    // Key Light (Hangar main overhead light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(12, 16, 14);
    scene.add(keyLight);

    // Rim Fill Light (Cool sky blue backlight for edge definition)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    rimLight.position.set(-14, -8, -12);
    scene.add(rimLight);

    // Bottom Bounce Light (Reflected tarmac floor)
    const bounceLight = new THREE.DirectionalLight(0x475569, 0.4);
    bounceLight.position.set(0, -10, 4);
    scene.add(bounceLight);

    // Subtle grid ground plane for spatial grounding
    const gridHelper = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
    gridHelper.position.y = -4.0;
    scene.add(gridHelper);

    // 6. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // 7. Cleanup on Unmount
    return () => {
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Sync Smooth Camera Focus on Selected Component
  useEffect(() => {
    if (selectorRef.current) {
      selectorRef.current.setFocus(selectedComponent);
    }
  }, [selectedComponent]);

  // Hook model controller
  const { engineRoot, updateAnimation } = useTurbofanModel({
    scene: sceneRef.current,
    healthData,
    hoveredComponent,
    selectedComponent,
    n1Speed: isRotating ? n1Speed * speedMultiplier : 0.0,
    n2Speed: isRotating ? n2Speed * speedMultiplier : 0.0,
    showCowling,
    explodedView,
    thermalMode,
    useGltf: useCadModel || useGltf,
    onLoaded: () => setIsLoaded(true),
  });

  // Render & Animation Loop
  useEffect(() => {
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Smooth camera transition if active
      if (selectorRef.current && cameraRef.current && controlsRef.current) {
        selectorRef.current.update(cameraRef.current, controlsRef.current, delta);
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (updateAnimation) {
        updateAnimation(delta);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [updateAnimation]);

  // Raycasting for Mouse Interaction (Hover & Click)
  const handlePointerMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !cameraRef.current || !sceneRef.current) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const hit = selectorRef.current.raycast(mouseRef.current, cameraRef.current, sceneRef.current);
    const foundComponent = hit ? hit.componentId : null;

    setHoveredComponent(foundComponent);
    canvas.style.cursor = foundComponent ? 'pointer' : 'grab';
  }, []);

  const handlePointerDown = useCallback((e) => {
    // Only handle primary click
    if (e.button !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas || !cameraRef.current || !sceneRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const hit = selectorRef.current.raycast(
      new THREE.Vector2(mouseX, mouseY),
      cameraRef.current,
      sceneRef.current
    );

    if (hit && hit.componentId) {
      if (onSelectComponent) {
        onSelectComponent(selectedComponent === hit.componentId ? null : hit.componentId);
      }
    }
  }, [onSelectComponent, selectedComponent]);

  const handleResetCamera = () => {
    if (selectorRef.current) {
      selectorRef.current.resetFocus();
    }
    if (onSelectComponent) {
      onSelectComponent(null);
    }
  };

  const effectiveSensors = latestSensors && Object.keys(latestSensors).length > 0
    ? latestSensors
    : (healthData.sensors || {});

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[440px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl select-none ${className}`}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      {/* Three.js HTML5 Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Floating HUD Information Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-3 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-700/60 shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200 tracking-wider uppercase font-mono">
              3D Digital Twin
            </span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
              60 FPS
            </span>
          </div>
        </div>

        {hoveredComponent && !selectedComponent && (
          <div className="bg-cyan-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/50 text-xs text-cyan-200 font-mono shadow-md animate-fade-in flex items-center space-x-1.5">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target: <strong className="text-white uppercase">{hoveredComponent}</strong> (Click to inspect)</span>
          </div>
        )}
      </div>

      {/* Detailed Inspection Tooltip / HUD Panel when component is selected */}
      {selectedComponent && (
        <ComponentTooltip
          selectedComponent={selectedComponent}
          onClose={() => onSelectComponent && onSelectComponent(null)}
          latestSensors={effectiveSensors}
          onSelectComponent={onSelectComponent}
        />
      )}

      {/* Thermal Heatmap Scale Legend */}
      {thermalMode && (
        <div className="absolute top-4 right-4 z-10">
          <ComponentGlowLegend />
        </div>
      )}

      {/* Bottom Interactive Controls Toolbar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-2 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/60 shadow-xl">
        {/* Model Switcher: Procedural vs Trent 1000 CAD */}
        <button
          onClick={() => setUseCadModel(!useCadModel)}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            useCadModel
              ? 'bg-blue-600/40 text-blue-200 border border-blue-400/50 shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title="Toggle between Procedural WebGL Twin and Rolls-Royce Trent 1000 CAD Model"
        >
          <span>{useCadModel ? 'CAD: Trent 1000' : 'Procedural 3D'}</span>
        </button>

        {/* Cowling Toggle */}
        <button
          onClick={() => setShowCowling(!showCowling)}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showCowling
              ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              : 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
          }`}
          title="Toggle Transparent Cowling"
        >
          {showCowling ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Cowl</span>
        </button>

        {/* Thermal Heatmap Toggle */}
        <button
          onClick={() => setThermalMode(!thermalMode)}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            thermalMode
              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title="Toggle Thermal Degradation Heatmap"
        >
          <Flame className={`w-3.5 h-3.5 ${thermalMode ? 'text-amber-400' : ''}`} />
          <span>Thermal</span>
        </button>

        {/* Exploded View Slider */}
        <div className="flex items-center space-x-2 px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700/40">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-300 font-mono">Split:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={explodedView}
            onChange={(e) => setExplodedView(parseFloat(e.target.value))}
            className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            title="Axial Component Separation (Exploded View)"
          />
        </div>

        {/* Spool Rotation Toggle */}
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            isRotating ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-red-500/30 text-red-300 border border-red-500/50'
          }`}
          title={isRotating ? 'Pause Spool Rotation' : 'Resume Rotation'}
        >
          {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {/* Camera Reset */}
        <button
          onClick={handleResetCamera}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Component Legend Overlay (Top Right, hidden when thermal mode shows legend) */}
      {!thermalMode && (
        <div className="absolute top-4 right-4 z-10 bg-slate-900/85 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/60 shadow-xl hidden md:block">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
            Spool Architecture
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span>
              <span className="text-slate-300 text-[11px]">N1 Spool (Fan, LPC, LPT)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>
              <span className="text-slate-300 text-[11px]">N2 Spool (HPC, HPT)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
              <span className="text-slate-300 text-[11px]">Static (Combustor, Cowl)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
