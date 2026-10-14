import { BufferGeometry, Material, Mesh, Object3D, Texture } from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Public reference assets stored locally so the configurator has no Tylko runtime dependency.
 * Source attribution and file hashes: public/models/wardrobe/README.md.
 */
export const WARDROBE_HINGE_ASSETS = {
  hingeWing: '/models/wardrobe/hinge-wing.glb',
  hingeAnchor: '/models/wardrobe/hinge-anchor.glb',
} as const;
export type WardrobeHingeAsset = keyof typeof WARDROBE_HINGE_ASSETS;

function disposeImportedScene(root: Object3D) {
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>(), textures = new Set<Texture>();
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
  });
  for (const material of materials) for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}

/** Preserve the measured local origin and all source normals/UVs; metres → cm once.
 * Source models each contain exactly one unskinned mesh and no node TRS.
 */
export function wardrobeHingeGeometryFromGltf(gltf: GLTF, asset: WardrobeHingeAsset): BufferGeometry {
  gltf.scene.updateMatrixWorld(true);
  const meshes: Mesh[] = [];
  gltf.scene.traverse(object => { if (object instanceof Mesh) meshes.push(object); });
  try {
    if (meshes.length !== 1 || 'isSkinnedMesh' in meshes[0]) throw new Error('Unexpected wardrobe hinge asset structure');
    const geometry = meshes[0].geometry.clone();
    geometry.applyMatrix4(meshes[0].matrixWorld);
    geometry.scale(100, 100, 100);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometry.name = asset;
    geometry.userData = { asset, source: WARDROBE_HINGE_ASSETS[asset], units: 'cm' };
    return geometry;
  } finally {
    disposeImportedScene(gltf.scene);
  }
}

/** No module cache: every successful call gives the caller one independently owned geometry.
 * Dispose it when replaced/unmounted, including when an async load finishes after unmount.
 */
export async function loadWardrobeHingeGeometry(asset: WardrobeHingeAsset): Promise<BufferGeometry> {
  const gltf = await new GLTFLoader().loadAsync(WARDROBE_HINGE_ASSETS[asset]);
  return wardrobeHingeGeometryFromGltf(gltf, asset);
}
