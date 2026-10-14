import * as THREE from 'three';
import type {MaterialSet} from '../three/materials';

/** Edge wood-effect surface assets observed in the public renderer. These are
 * distinct from Original veneer. Panel UV transforms are applied by wardrobe-panel-materials. */
export async function createWardrobeWoodMaterials(dark:boolean):Promise<MaterialSet>{
  const prefix=dark?'dark':'light';
  const loader=new THREE.TextureLoader();
  const [map,bumpMap]=await Promise.all([
    loader.loadAsync(`/textures/wardrobe/${prefix}_cleaf_512_albedo.jpg`),
    loader.loadAsync(`/textures/wardrobe/${prefix}_cleaf_512_bump.jpg`),
  ]);
  map.colorSpace=THREE.SRGBColorSpace;
  for(const texture of [map,bumpMap]){
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.anisotropy=8;
    texture.flipY=false;
  }
  const make=()=>{
    const material=new THREE.MeshStandardMaterial({map,bumpMap,color:'#ffffff',roughness:.65,bumpScale:.007,envMapIntensity:.73});
    material.userData.wardrobeCleaf=true;
    return material;
  };
  return {verticalBase:make(),verticalEdge:make(),horizontalBase:make(),horizontalEdge:make(),backPanel:make()};
}

/** The shared legacy disposer has no bumpMap branch. Deduplicate owned textures. */
export function disposeFurnitureMaterials(materials:MaterialSet):void{
  const textures=new Set<THREE.Texture>();
  for(const material of Object.values(materials)){
    for(const texture of [material.map,material.bumpMap,material.normalMap,material.roughnessMap,material.aoMap])if(texture)textures.add(texture);
    material.dispose();
  }
  for(const texture of textures)texture.dispose();
}
