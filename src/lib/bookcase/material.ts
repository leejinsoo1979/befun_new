import * as THREE from 'three';
import colors from './data/colors.json';
import type {SourceMaterial} from './types';
export function colorHex(name:string):string {const value=(colors as Record<string,number>)[name];return '#'+(value??0xaaaaaa).toString(16).padStart(6,'0');}
export function sourceMaterial(source:SourceMaterial|null):THREE.MeshStandardMaterial {
 const name=source?.name??'laminate';
 if(name==='veneer'&&['lightCleaf','darkCleaf'].includes(source?.colors.primary??'')){
  const prefix=source?.colors.primary==='darkCleaf'?'dark':'light';
  const loader=new THREE.TextureLoader();
  const map=loader.load(`/textures/wardrobe/${prefix}_cleaf_512_albedo.jpg`);
  const bumpMap=loader.load(`/textures/wardrobe/${prefix}_cleaf_512_bump.jpg`);
  const ratio=source?.mapRatio;const u=ratio?.u??.9;const v=ratio?.v??.9;
  for(const texture of [map,bumpMap]){
   texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;texture.anisotropy=1;
   texture.repeat.set(2*u/.9,2*v/.9);texture.offset.set(u>v?0:(1-u/.9)/2,u>v?(1-v/.9)/2:0);texture.rotation=source?.mapAngle??0;texture.updateMatrix();
  }
  const material=new THREE.MeshStandardMaterial({map,bumpMap,color:'#ffffff',roughness:.65,bumpScale:.007,envMapIntensity:.73});
  material.addEventListener('dispose',()=>{map.dispose();bumpMap.dispose();});
  return material;
 }
 const chrome=name==='chrome';const metal=name==='paintedMetal';
 return new THREE.MeshStandardMaterial({color:chrome?0x777777:colorHex(source?.colors.primary??'default'),roughness:chrome?.42:metal?.43:.7,metalness:chrome?.95:metal?.11:0,envMapIntensity:metal?.94:.78});
}
