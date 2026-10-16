import { setPanelEdgeFinish } from './panel-edge';
import * as THREE from 'three';
import { createMaterialsForColor, type MaterialSet } from './materials';
import { importedNaturalTexture } from './natural-textures';

const loader = new THREE.TextureLoader();
const faces: (keyof MaterialSet)[] = ['verticalBase', 'verticalEdge', 'horizontalBase', 'horizontalEdge', 'backPanel'];

/** Imported wood only; all previous finishes keep their original factory. */
export async function createNaturalMaterialsForColor(color: string): Promise<MaterialSet> {
  const pack = importedNaturalTexture(color);
  if (!pack) return createMaterialsForColor(color);
  const results = await Promise.allSettled([pack.base, pack.normal, pack.roughness].map(url => loader.loadAsync(url)));
  const failed = results.find(result => result.status === 'rejected');
  if (failed) {
    for (const result of results) if (result.status === 'fulfilled') result.value.dispose();
    throw new Error(`Failed to load natural material ${color}`, { cause: failed.reason });
  }
  const [base, normal, roughness] = results.map(result => (result as PromiseFulfilledResult<THREE.Texture>).value);
  base.colorSpace = THREE.SRGBColorSpace;
  normal.colorSpace = roughness.colorSpace = THREE.NoColorSpace;
  for (const texture of [base, normal, roughness]) texture.anisotropy = 16;
  const materials = {} as MaterialSet;
  // Each face owns its maps, so the existing disposal and UV rotation paths
  // cannot invalidate another face or another configurator's material set.
  for (const face of faces) {
    const maps = [base.clone(), normal.clone(), roughness.clone()];
    if (face === 'horizontalBase' || face === 'horizontalEdge') {
      // Source grain runs along V; horizontal boards run along world X (U).
      for (const map of maps) {
        map.center.set(.5, .5);
        map.rotation = Math.PI / 2;
      }
    }
    materials[face] = new THREE.MeshStandardMaterial({
      map: maps[0], normalMap: maps[1], roughnessMap: maps[2],
      // Lift this near-black scan in linear light so the grain survives studio lighting.
      // Keep the original maps and normal/roughness response, rather than adding emission.
      color: new THREE.Color().setScalar(color === 'N_Wood_W4' ? 3.5 : 1),
      normalScale: new THREE.Vector2(.4, .4), roughness: 1, metalness: 0, side: THREE.DoubleSide,
    });
  }
  for (const texture of [base, normal, roughness]) texture.dispose();
  return setPanelEdgeFinish(materials, color);
}
