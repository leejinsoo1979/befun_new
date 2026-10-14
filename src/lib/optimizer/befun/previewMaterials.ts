import * as THREE from 'three';
import { createColorMaterials, createFaceMaterials, solidDisplayColor, type MaterialSet } from '@/lib/three/materials';
import { createNaturalMaterialsForColor } from '@/lib/three/natural-materials';
import { REFERENCE_COLORS, REFERENCE_CLASSIC_COLORS } from '@/lib/three/reference-colors';
import { applyReferenceAlbedo } from '@/lib/three/reference-materials';
import type { CncPanelBox } from './toCncPanels';

/** Same calibrated surfaces and exposed plywood edges as Shelf. */
export async function previewMaterialSet(color: string): Promise<MaterialSet> {
  const reference = REFERENCE_COLORS[color];
  const classic = REFERENCE_CLASSIC_COLORS[color];
  const materials = reference ? createColorMaterials(reference.base, reference.edge)
    : await createNaturalMaterialsForColor(classic ? 'C_White' : color);
  if (reference) applyReferenceAlbedo(materials, reference);
  if (classic) {
    for (const material of [materials.verticalBase, materials.horizontalBase, materials.backPanel]) {
      material.map?.dispose();
      material.map = null;
      material.color.set(color === 'C_Green' ? solidDisplayColor(classic) : classic);
      material.roughness = color === 'C_Green' ? 0.5 : 0.7;
      material.envMapIntensity = color === 'C_Green' ? 1 : 0.78;
      material.needsUpdate = true;
    }
    materials.verticalEdge.roughness = materials.horizontalEdge.roughness = 0.5;
  }
  return materials;
}

/** World-axis BoxGeometry face order, matching Panel and front/drawer rendering. */
export function previewFaces(box: CncPanelBox, materials: MaterialSet): THREE.MeshStandardMaterial[] {
  if (box.kind === 'back' || box.kind === 'door') return Array(6).fill(materials.backPanel);
  if (box.kind === 'drawer') return Array(6).fill(box.frame.n === 1 ? materials.horizontalBase : box.frame.n === 0 ? materials.verticalBase : materials.backPanel);
  if (box.kind === 'support') return createFaceMaterials(materials.verticalEdge, materials.verticalBase, true);
  const vertical = box.kind === 'vertical';
  return createFaceMaterials(vertical ? materials.verticalBase : materials.horizontalBase,
    vertical ? materials.verticalEdge : materials.horizontalEdge, vertical);
}

/** CSG removes BoxGeometry groups. Restore surface/edge selection in its local
 * manufacturing frame without changing the machining coordinates or topology. */
export function groupMachinedFaces(geometry: THREE.BufferGeometry, box: CncPanelBox): void {
  const normal = geometry.getAttribute('normal');
  const index = geometry.index;
  const axes = [box.frame.u, box.frame.v, box.frame.n];
  geometry.clearGroups();
  const count = index?.count ?? normal.count;
  for (let offset = 0; offset < count; offset += 3) {
    const vertex = index ? index.getX(offset) : offset;
    const values = [normal.getX(vertex), normal.getY(vertex), normal.getZ(vertex)];
    const axis = Math.abs(values[0]) > Math.abs(values[1]) ? (Math.abs(values[0]) > Math.abs(values[2]) ? 0 : 2) : (Math.abs(values[1]) > Math.abs(values[2]) ? 1 : 2);
    const face = axes[axis] * 2 + (values[axis] < 0 ? 1 : 0);
    const previous = geometry.groups[geometry.groups.length - 1];
    if (previous?.materialIndex === face) previous.count += 3;
    else geometry.addGroup(offset, 3, face);
  }
}
