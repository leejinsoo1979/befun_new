import type { Material, Mesh } from 'three';

// Transient render overrides, never part of serialized design or userData.
export const originalDisplayMaterials = new WeakMap<Mesh, Material | Material[]>();
