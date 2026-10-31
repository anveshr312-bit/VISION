/**
 * VISION: React Three.js Model Controller for Procedural Turbofan
 * Vital Intelligence for System Integrity, Observation & Nostics
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { buildProceduralTurbofan } from './engineGeometries.js';
import { getComponentMaterial } from './materials.js';

export function useTurbofanModel({
  scene,
  healthData = {},
  hoveredComponent = null,
  selectedComponent = null,
  n1Speed = 1.0,
  n2Speed = 1.45,
  showCowling = true,
  explodedView = 0.0,
  thermalMode = false,
  useGltf = false,
  onLoaded = null,
}) {
  const modelRef = useRef(null);
  const n1Ref = useRef(null);
  const n2Ref = useRef(null);
  const componentsRef = useRef({});
  const initialPositionsRef = useRef({});

  // 1. Initialize or rebuild model when scene or useGltf changes
  useEffect(() => {
    if (!scene) return;

    let isMounted = true;

    // Check if user requested external GLTF model
    if (useGltf) {
      const loader = new GLTFLoader();
      loader.load(
        '/models/turbofan.glb',
        (gltf) => {
          if (!isMounted) return;
          const root = gltf.scene;
          root.name = 'TurbofanGLTF';

          // Auto-normalize bounding box to viewport (~12 units long, centered at origin)
          const box = new THREE.Box3().setFromObject(root);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0) {
            const scaleFactor = 12.0 / maxDim;
            root.scale.setScalar(scaleFactor);
            root.position.x = -center.x * scaleFactor;
            root.position.y = -center.y * scaleFactor;
            root.position.z = -center.z * scaleFactor;
          }

          // Enable shadows and PBR metallic reflections on all meshes
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.metalness = 0.85;
                child.material.roughness = 0.25;
              }
            }
          });

          scene.add(root);
          modelRef.current = root;
          if (onLoaded) onLoaded();
        },
        undefined,
        (err) => {
          console.warn('[VISION 3D] GLTF load failed, falling back to procedural engine:', err);
          setupProceduralModel();
        }
      );
    } else {
      setupProceduralModel();
    }

    function setupProceduralModel() {
      const { engineRoot, n1Group, n2Group, components } = buildProceduralTurbofan();

      scene.add(engineRoot);
      modelRef.current = engineRoot;
      n1Ref.current = n1Group;
      n2Ref.current = n2Group;
      componentsRef.current = components;

      // Cache initial axial positions for exploded view interpolation
      const initPos = {};
      for (const [id, grp] of Object.entries(components)) {
        initPos[id] = grp.position.z;
      }
      initialPositionsRef.current = initPos;

      if (onLoaded) onLoaded();
    }

    return () => {
      isMounted = false;
      if (modelRef.current) {
        scene.remove(modelRef.current);
        modelRef.current.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
          }
        });
      }
    };
  }, [scene, useGltf]);

  // 2. Update Dynamic Materials when health, hover, selection, or thermalMode changes
  useEffect(() => {
    const components = componentsRef.current;
    if (!components) return;

    for (const [compId, compGroup] of Object.entries(components)) {
      const isSelected = selectedComponent === compId;
      const isHovered = hoveredComponent === compId;
      const health = healthData[compId] !== undefined ? healthData[compId] : 100.0;

      const dynamicMat = getComponentMaterial(compId, {
        healthIndex: health,
        isHovered,
        isSelected,
        thermalMode,
      });

      compGroup.traverse((child) => {
        if (child.isMesh && child.userData.componentId === compId) {
          // Keep transparent casing separate unless explicitly selected/hovered
          if (compId === 'casing' && !isSelected && !isHovered) {
            return;
          }
          child.material = dynamicMat;
        }
      });
    }
  }, [healthData, hoveredComponent, selectedComponent, thermalMode]);

  // 3. Toggle outer cowling visibility
  useEffect(() => {
    if (componentsRef.current.casing) {
      componentsRef.current.casing.visible = showCowling;
    }
  }, [showCowling]);

  // 4. Update Exploded View axial offsets
  useEffect(() => {
    const components = componentsRef.current;
    const initPos = initialPositionsRef.current;
    if (!components || !initPos) return;

    const explodeMultipliers = {
      fan: 4.2,
      lpc: 2.4,
      hpc: 1.1,
      combustor: -0.8,
      hpt: -2.2,
      lpt: -3.8,
      casing: 0.0,
    };

    for (const [compId, grp] of Object.entries(components)) {
      const baseZ = initPos[compId] || 0.0;
      const mult = explodeMultipliers[compId] || 0.0;
      grp.position.z = baseZ + explodedView * mult;
    }
  }, [explodedView]);

  // 5. Animation frame step function (called by parent render loop)
  const updateAnimation = (delta) => {
    // N1 Spool (Fan + LPC + LPT) rotation
    if (n1Ref.current) {
      n1Ref.current.rotation.z += n1Speed * 4.0 * delta;
    }
    // N2 Spool (HPC + HPT) rotation (runs faster)
    if (n2Ref.current) {
      n2Ref.current.rotation.z += n2Speed * 6.0 * delta;
    }
  };

  return {
    engineRoot: modelRef.current,
    components: componentsRef.current,
    updateAnimation,
  };
}

