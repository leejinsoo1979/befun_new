import * as THREE from 'three';
import type { MaterialSet } from '../three/materials';
import type { PanelData } from '../../types/shelf';

type PanelShape = Pick<PanelData, 'w' | 'h' | 'd' | 'matType'>;
// Measured flat-face UV atlas coordinates from the three public panel GLBs.
// Each row maps BoxGeometry (u,v,1) to source (u,v); face order is +X,-X,+Y,-Y,+Z,-Z.
// Rounded edge geometry is separate; these map its inner planar corners to our box face.
const panelAtlas = {
  horizontal: [
    [-0.2467047125, 0.0000313222, 0.4963977188, 0.0000311732, 0.2467149496, 0.7493013442],
    [-0.2469406724, -0.0000104904, 0.9962609410, -0.0000229776, 0.2469227612, 0.7492620200],
    [-0.4922006726, -0.0000000596, 0.4961003661, -0.0000000596, 0.4922005534, 0.1288997233],
    [0.4922006726, 0.0000000000, 0.5038996935, 0.0000001192, -0.4922004938, 0.6211001873],
    [-0.2468370795, -0.0000109076, 0.7462880313, -0.0000232756, 0.2468223274, 0.7492799908],
    [-0.2466813572, 0.0000314914, 0.2466813598, 0.0000314713, 0.2466862798, 0.7493471205],
  ],
  vertical: [
    [0.4922126830, 0.0000000298, 0.0038936287, 0.0000000596, -0.4922127128, 0.6211062968],
    [0.4922127128, 0.0000001192, 0.5038935542, 0.0000000596, -0.4922127128, 0.6211062968],
    [-0.0000253171, -0.2468197197, 0.4966492429, -0.2468052506, 0.0000377893, 0.9960350394],
    [0.0000044405, -0.2467543185, 0.9962562770, -0.2467611432, -0.0000045300, 0.9959702492],
    [-0.0000255406, -0.2468105257, 0.7464923412, -0.2467960119, 0.0000379682, 0.9959828258],
    [-0.0000043073, 0.2467901550, 0.0000043226, 0.2467950881, 0.0000043809, 0.7492678910],
  ],
  front: [
    [0.0000061691, -0.2468114793, 0.7502020448, -0.2467967868, -0.0000185966, 0.9960679710],
    [0.0000354974, 0.2467654771, 0.0037439028, 0.2467724085, -0.0000353456, 0.7492631674],
    [0.2468027622, 0.0000065416, 0.2535551414, 0.0000188947, -0.2467880249, 0.9960169792],
    [-0.2467822134, -0.0000000298, 1.0000000149, -0.0000000596, 0.2467872500, 0.7492760122],
    [-0.4921985865, 0.0000001192, 0.4960992336, 0.0000000596, 0.4921986461, 0.1289006174],
    [-0.4921985865, -0.0000001192, 0.9960993528, 0.0000000000, 0.4921989441, 0.1289005280],
  ],
} as const;

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

/** Creates six owned materials and their own texture transforms, in Three's
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
  const clone = (isEdge: boolean, face: number) => {
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
      texture.repeat.set(uv.repeat[0], uv.repeat[1]);
      texture.offset.set(uv.offset[0], uv.offset[1]);
      texture.rotation = uv.rotation;
      texture.updateMatrix();
      const atlas = panelAtlas[horizontal ? 'horizontal' : frontal ? 'front' : 'vertical'][face];
      texture.matrix.multiply(new THREE.Matrix3().set(
        atlas[0], atlas[1], atlas[2], atlas[3], atlas[4], atlas[5], 0, 0, 1,
      ));
      texture.matrixAutoUpdate = false;
      texture.needsUpdate = true;
      material[slot] = texture;
    }
    return material;
  };
  const planeFaces = horizontal ? [2, 3] : frontal ? [4, 5] : [0, 1];
  return Array.from({ length: 6 }, (_, face) => clone(!planeFaces.includes(face), face));
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
