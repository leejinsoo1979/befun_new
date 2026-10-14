import * as THREE from 'three';
import type { MaterialSet } from '../three/materials';
import type { PanelData } from '../../types/shelf';

type PanelShape = Pick<PanelData, 'w' | 'h' | 'd' | 'matType'>;
const ownedMaterials = new WeakSet<THREE.Material>();
const ownedTextures = new WeakSet<THREE.Texture>();
const textureSlots = ['map', 'bumpMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'] as const;

/** Source CG3UhuDu2: TU/EU/frontalPanel mapRatio is measured in metres.
 * Nj/lme centre the shorter axis BEFORE multiplying its repeat, and rotation
 * stays about (0, 0). The 0.9 m / 0.05 m scales are not panel dimensions.
 */
export function wardrobeCleafUv(panel: PanelShape, edge = false) {
  const horizontal = panel.matType === 'horizontalBase' || panel.matType === 'horizontalEdge';
  const frontal = panel.matType === 'backPanel' || panel.matType === 'supportPanel';
  const [u, v, w] = (horizontal ? [panel.w, panel.d, panel.h]
    : frontal ? [panel.w, panel.h, panel.d] : [panel.d, panel.h, panel.w]).map(n => n / 100);
  const x = edge ? v : u;
  const y = edge ? w : v;
  const scale = edge ? 0.05 : 0.9;
  const multiplier = edge ? 3.5 : 2;
  return {
    repeat: [multiplier * x / scale, multiplier * y / scale] as const,
    offset: x > y ? [0, (1 - y / scale) / 2] as const : [(1 - x / scale) / 2, 0] as const,
    rotation: horizontal ? Math.PI / 2 : 0,
  };
}

/** Creates two owned materials and their own texture transforms, in Three's
 * +X/-X/+Y/-Y/+Z/-Z BoxGeometry order. The source MaterialSet stays immutable.
 * Pass a front/back panel as matType=backPanel, and a drawer bottom as horizontal.
 */
export function createWardrobePanelMaterials(materials: MaterialSet, panel: PanelShape): THREE.Material[] | null {
  const horizontal = panel.matType === 'horizontalBase' || panel.matType === 'horizontalEdge';
  const frontal = panel.matType === 'backPanel' || panel.matType === 'supportPanel';
  const base = frontal ? materials.backPanel : horizontal ? materials.horizontalBase : materials.verticalBase;
  if (base.userData.wardrobeCleaf !== true) return null;
  if (![panel.w, panel.h, panel.d].every(n => Number.isFinite(n) && n > 0)) {
    throw new RangeError('Cleaf panel dimensions must be positive finite centimetres.');
  }
  const clone = (isEdge: boolean) => {
    const original = isEdge ? horizontal ? materials.horizontalEdge : materials.verticalEdge : base;
    const material = original.clone();
    ownedMaterials.add(material);
    const uv = wardrobeCleafUv(panel, isEdge);
    for (const slot of textureSlots) {
      const source = original[slot];
      if (!source) continue;
      const texture = source.clone();
      ownedTextures.add(texture);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.flipY = false;
      texture.center.set(0, 0);
      texture.repeat.set(...uv.repeat);
      texture.offset.set(...uv.offset);
      texture.rotation = uv.rotation;
      texture.updateMatrix();
      texture.needsUpdate = true;
      material[slot] = texture;
    }
    return material;
  };
  const plane = clone(false);
  const edge = clone(true);
  return horizontal ? [edge, edge, plane, plane, edge, edge]
    : frontal ? [edge, edge, edge, edge, plane, plane]
      : [plane, plane, edge, edge, edge, edge];
}

/** Disposes ONLY clones made by createWardrobePanelMaterials, once each.
 * Safe to call with null, duplicate face entries or the original shared set.
 */
export function disposeWardrobePanelMaterials(materials: readonly THREE.Material[] | null): void {
  for (const material of new Set(materials ?? [])) {
    if (!ownedMaterials.delete(material)) continue;
    const surface = material as THREE.MeshStandardMaterial;
    for (const slot of textureSlots) {
      const texture = surface[slot];
      if (texture && ownedTextures.delete(texture)) texture.dispose();
    }
    material.dispose();
  }
}
