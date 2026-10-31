/**
 * VISION: Aerospace Turbofan PBR Materials & Dynamic Thermal Shaders
 * Vital Intelligence for System Integrity, Observation & Nostics
 */

import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Base Physically Based Rendering (PBR) Materials
// -----------------------------------------------------------------------------

export const materials = {
  // Titanium fan and compressor blades (Ti-6Al-4V)
  titanium: new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.28,
    metalness: 0.82,
    envMapIntensity: 1.2,
  }),

  // Nickel-chromium superalloy for high-temperature combustor (Inconel 718)
  combustorAlloy: new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.52,
    metalness: 0.65,
    envMapIntensity: 0.9,
  }),

  // Single-crystal nickel turbine blade alloy (CMSX-4)
  turbineAlloy: new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.35,
    metalness: 0.88,
    envMapIntensity: 1.4,
  }),

  // Aerodynamic carbon-composite spinner nose cone
  spinnerNose: new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.15,
    metalness: 0.92,
    envMapIntensity: 1.5,
  }),

  // Structural forged rotor-shaft core alloy
  shaftAlloy: new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.42,
    metalness: 0.85,
  }),

  // Transparent aerodynamic glass nacelle casing
  glassCasing: new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    opacity: 0.18,
    roughness: 0.12,
    metalness: 0.1,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),

  // Internal flame core glow inside combustor
  flameCore: new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xf97316,
    emissiveIntensity: 0.8,
    roughness: 0.7,
    transparent: true,
    opacity: 0.75,
  }),

  // Structural gold/brass seal rings and instrumentation bungs
  accentGold: new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.32,
    metalness: 0.88,
  }),
};

/**
 * Generate a dynamic material instance reflecting condition health, hover, selection,
 * or thermodynamic heat dissipation.
 *
 * @param {string} componentId - 'fan', 'lpc', 'hpc', 'combustor', 'hpt', 'lpt', 'casing'
 * @param {Object} options - { healthIndex, isHovered, isSelected, thermalMode }
 * @returns {THREE.MeshStandardMaterial}
 */
export function getComponentMaterial(componentId, options = {}) {
  const {
    healthIndex = 100.0,
    isHovered = false,
    isSelected = false,
    thermalMode = false,
  } = options;

  if (componentId === 'casing') {
    return materials.glassCasing;
  }

  // Base material selection based on physical aerospace metallurgy
  let baseMat = materials.titanium;
  if (componentId === 'combustor') {
    baseMat = materials.combustorAlloy;
  } else if (componentId === 'hpt' || componentId === 'lpt') {
    baseMat = materials.turbineAlloy;
  } else if (componentId === 'spinner') {
    baseMat = materials.spinnerNose;
  }

  // Clone material for dynamic per-component highlights
  const mat = baseMat.clone();

  // Highlight states take visual priority
  if (isSelected) {
    mat.emissive = new THREE.Color(0x38bdf8); // Bright cyan outline glow
    mat.emissiveIntensity = 0.55;
    mat.roughness = 0.2;
    return mat;
  }

  if (isHovered) {
    mat.emissive = new THREE.Color(0x60a5fa); // Soft blue hover glow
    mat.emissiveIntensity = 0.35;
    return mat;
  }

  // Thermal Heatmap Mode or Degradation Status
  if (thermalMode || healthIndex < 85.0) {
    if (healthIndex < 40.0) {
      // Critical degradation: red thermal runaway
      mat.color = new THREE.Color(0xef4444);
      mat.emissive = new THREE.Color(0xdc2626);
      mat.emissiveIntensity = 0.65;
    } else if (healthIndex < 75.0) {
      // Advisory monitor: amber thermal creep
      mat.color = new THREE.Color(0xf59e0b);
      mat.emissive = new THREE.Color(0xd97706);
      mat.emissiveIntensity = 0.35;
    } else {
      // Nominal: subtle cyan/emerald operating envelope
      mat.emissive = new THREE.Color(0x10b981);
      mat.emissiveIntensity = 0.12;
    }
  }

  return mat;
}

