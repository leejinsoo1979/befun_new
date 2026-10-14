import { DoubleSide, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, type BufferGeometry, type Texture } from 'three';

export type PanelAxis = 0 | 1 | 2;
export const birchEdgeTexture = '/imgs/textures/wood002/verticalEdge_diff.jpg';

export function createGuidePanelMaterials(source: Texture, axis: PanelAxis, inside: boolean, opacity = .08) {
  const texture = source.clone();
  texture.colorSpace = SRGBColorSpace;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  const common = { side: DoubleSide, transparent: inside, opacity: inside ? opacity : 1, depthWrite: !inside };
  const laminate = new MeshStandardMaterial({ ...common, color: '#e4e7eb', roughness: .38, metalness: 0 });
  const birch = new MeshStandardMaterial({ ...common, map: texture, roughness: .72, metalness: 0 });
  return { laminate, birch, faces: panelFaceMaterials(laminate, birch, axis), texture };
}

export function disposeGuidePanelMaterials(materials: ReturnType<typeof createGuidePanelMaterials>) {
  materials.laminate.dispose();
  materials.birch.dispose();
  materials.texture.dispose();
}

/** Box face order is +X, -X, +Y, -Y, +Z, -Z. Both broad faces are laminate. */
export function panelFaceMaterials<T>(laminate: T, birch: T, axis: PanelAxis): T[] {
  return Array.from({ length: 6 }, (_, face) => Math.floor(face / 2) === axis ? laminate : birch);
}

/** The existing plywood photograph runs across thickness in U, along the edge in V.
 * Absolute board coordinates keep layers continuous across the pocket cutaway. */
export function mapPanelEdgeUvs(geometry: BufferGeometry, axis: PanelAxis, thickness: number, minimum: number, offset: readonly number[] = [0, 0, 0]) {
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    const normal = [normals.getX(i), normals.getY(i), normals.getZ(i)];
    const faceAxis = normal.findIndex(value => Math.abs(value) > .9);
    if (faceAxis === axis || faceAxis < 0) continue;
    const along = [0, 1, 2].find(value => value !== axis && value !== faceAxis)!;
    const point = [positions.getX(i), positions.getY(i), positions.getZ(i)];
    uv.setXY(i, (point[axis] + offset[axis] - minimum) / thickness, (point[along] + offset[along]) / 300 + .5);
  }
  uv.needsUpdate = true;
  return geometry;
}
