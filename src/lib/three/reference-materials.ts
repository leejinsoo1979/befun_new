import type { MaterialSet } from './materials';

/** Reference albedos are already calibrated. Do not apply the legacy studio's
 * additive brightness lift a second time under the reference environment. */
export function applyReferenceAlbedo(materials: MaterialSet, colors: { base: string; edge: string }): void {
  for (const material of [materials.verticalBase, materials.horizontalBase, materials.backPanel]) {
    material.color.set(colors.base);
  }
  for (const material of [materials.verticalEdge, materials.horizontalEdge]) {
    material.color.set(colors.edge);
  }
}
