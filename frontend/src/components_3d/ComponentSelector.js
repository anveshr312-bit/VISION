/**
 * VISION: Interactive 3D Component Selector & Smooth Camera Focus Controller
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Smooth Camera Interpolation:
 * ----------------------------
 * When a component is selected (via click or HUD), the camera smoothly transitions
 * toward the component focal station using spherical linear interpolation (lerp),
 * providing cinematic inspection without disorienting cuts.
 */

import * as THREE from 'three';

// Focal centers and ideal viewing camera offsets along the central Z-axis
export const COMPONENT_FOCUS_TARGETS = {
  fan: {
    target: new THREE.Vector3(0, 0, 6.2),
    cameraPos: new THREE.Vector3(7.5, 3.8, 10.5),
  },
  lpc: {
    target: new THREE.Vector3(0, 0, 4.3),
    cameraPos: new THREE.Vector3(6.5, 3.2, 7.8),
  },
  hpc: {
    target: new THREE.Vector3(0, 0, 1.8),
    cameraPos: new THREE.Vector3(5.2, 2.8, 4.8),
  },
  combustor: {
    target: new THREE.Vector3(0, 0, -0.6),
    cameraPos: new THREE.Vector3(4.8, 2.5, 2.2),
  },
  hpt: {
    target: new THREE.Vector3(0, 0, -2.1),
    cameraPos: new THREE.Vector3(4.8, 2.6, -0.2),
  },
  lpt: {
    target: new THREE.Vector3(0, 0, -4.2),
    cameraPos: new THREE.Vector3(6.2, 3.4, -2.2),
  },
  default: {
    target: new THREE.Vector3(0, 0, 0.5),
    cameraPos: new THREE.Vector3(13.0, 6.5, 14.0),
  },
};

export class ComponentSelector {
  constructor(raycaster = new THREE.Raycaster()) {
    this.raycaster = raycaster;
    this.activeComponent = null;

    // Desired interpolation targets
    this.targetLookAt = COMPONENT_FOCUS_TARGETS.default.target.clone();
    this.targetCameraPos = COMPONENT_FOCUS_TARGETS.default.cameraPos.clone();
    this.isTransitioning = false;
  }

  /**
   * Set active component to focus camera upon. Pass null to reset to fleet overview.
   */
  setFocus(componentId) {
    this.activeComponent = componentId;
    const config = COMPONENT_FOCUS_TARGETS[componentId] || COMPONENT_FOCUS_TARGETS.default;

    this.targetLookAt.copy(config.target);
    this.targetCameraPos.copy(config.cameraPos);
    this.isTransitioning = true;
  }

  /**
   * Reset view to standard full engine perspective.
   */
  resetFocus() {
    this.setFocus(null);
  }

  /**
   * Perform smooth camera and controls target interpolation in animation loop.
   */
  update(camera, controls, delta = 0.016) {
    if (!this.isTransitioning || !camera || !controls) return;

    // Exponential smoothing factor (independent of framerate)
    const factor = Math.min(1.0, 4.5 * delta);

    camera.position.lerp(this.targetCameraPos, factor);
    controls.target.lerp(this.targetLookAt, factor);
    controls.update();

    // Check if close enough to terminate transition
    const posDist = camera.position.distanceTo(this.targetCameraPos);
    const targetDist = controls.target.distanceTo(this.targetLookAt);

    if (posDist < 0.05 && targetDist < 0.05) {
      camera.position.copy(this.targetCameraPos);
      controls.target.copy(this.targetLookAt);
      this.isTransitioning = false;
    }
  }

  /**
   * Raycast through mouse coordinates to identify intersected turbofan components.
   */
  raycast(mouseCoords, camera, scene) {
    if (!mouseCoords || !camera || !scene) return null;

    this.raycaster.setFromCamera(mouseCoords, camera);
    const intersects = this.raycaster.intersectObjects(scene.children, true);

    for (const hit of intersects) {
      const compId = hit.object?.userData?.componentId;
      // Ignore outer nacelle glass casing so internal core remains interactive
      if (compId && compId !== 'casing') {
        return {
          componentId: compId,
          componentName: hit.object.userData.componentName,
          spool: hit.object.userData.spool,
          mesh: hit.object,
          point: hit.point,
        };
      }
    }

    return null;
  }
}

