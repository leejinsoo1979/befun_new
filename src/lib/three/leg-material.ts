import { MeshStandardMaterial } from 'three';
import type { FurnitureLegFinish } from './furniture-base';

/** Befun Classic/Natural leg finishes. Independent of the cabinet's wood textures. */
export function createMetalLegMaterial(finish: FurnitureLegFinish): MeshStandardMaterial {
  const material = new MeshStandardMaterial(finish === 'black'
    ? { color: '#242424', metalness: 0.35, roughness: 0.42, envMapIntensity: 1 }
    : { color: '#c8cdd2', metalness: 0.9, roughness: 0.3, envMapIntensity: 1 });
  material.name = `furniture-leg-${finish}`;
  return material;
}
