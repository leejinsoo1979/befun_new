import * as THREE from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {SourceRoundedPanel} from './upstream/rounded-panel.js';
import type {Part} from './types';

/** Original pool: Vpe(1,.018,1,6,.03,1,.001); original Ome shader
 * displaces vertices by sign instead of scaling the corner radius. */
export function sourceRoundedPanel(part:Part):THREE.BufferGeometry {
 const geometry=new SourceRoundedPanel(1,.018,1,6,.03,1,.001);
 const position=geometry.getAttribute('position');
 for(let i=0;i<position.count;i++){
  const x=position.getX(i),z=position.getZ(i);
  position.setX(i,x+Math.sign(x)*(part.size.x-1)/2);
  position.setZ(i,z+Math.sign(z)*(part.size.z-1)/2);
 }
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return geometry;
}

/** Source Modifier.stretchCubeBones / extendLineBones (module 77), not object
 * scaling: the native bevels and handle ends retain their original dimensions. */
export function nativeGeometry(source:THREE.Object3D,part:Part):THREE.BufferGeometry[] {
 const root=clone(source);
 const single=part.asset==='pillarLeg';
 if(single)root.getObjectByName('top')?.children.forEach(bone=>{bone.position.y=part.size.y;});
 const cube=['horizontalPanel','verticalPanel','frontalPanel','channelSlab'].includes(part.asset);
 const linear=['fullHandleTop','fullHandleLeft','fullHandleRight','crossWardrobeBar'].includes(part.asset);
 root.traverse(object=>{
  if(!(object instanceof THREE.Bone))return;
  if(cube && /^[0-7]$/.test(object.name)) {
   const n=Number(object.name);
   object.position.set((n<4?1:-1)*part.size.x/2,([2,3,6,7].includes(n)?1:-1)*part.size.y/2,([0,3,4,7].includes(n)?1:-1)*part.size.z/2);
  } else if(linear) {
   const sides:{[key:string]:['x'|'y'|'z',number]}={right:['x',1],left:['x',-1],top:['y',1],bottom:['y',-1],front:['z',1],back:['z',-1]};
   const side=sides[object.name];if(side)object.position[side[0]]=side[1]*(part.size[side[0]]-.002)/2;
  }
 });
 root.updateMatrixWorld(true);
 const results:THREE.BufferGeometry[]=[];
 root.traverse(object=>{
  if(!(object instanceof THREE.Mesh))return;
  const geometry=object.geometry.clone();
  geometry.userData.sourceSurface = (Array.isArray(object.material) ? object.material[0] : object.material).name;
  if(object instanceof THREE.SkinnedMesh){
   object.skeleton.update();
   const position=geometry.getAttribute('position');const v=new THREE.Vector3();
   for(let i=0;i<position.count;i++){object.getVertexPosition(i,v);position.setXYZ(i,v.x,v.y,v.z);}
   geometry.deleteAttribute('skinIndex');geometry.deleteAttribute('skinWeight');
   // Native cube/linear bones translate only. Normals are unchanged.
  }
  geometry.applyMatrix4(object.matrixWorld);
  if(!cube&&!linear&&!single)geometry.scale(part.size.x,part.size.y,part.size.z);
  if(part.mirror){const s={x:1,y:1,z:1};s[part.mirror]=-1;geometry.scale(s.x,s.y,s.z);const index=geometry.getIndex();if(index)for(let i=0;i<index.count;i+=3){const a=index.getX(i);index.setX(i,index.getX(i+2));index.setX(i+2,a);}}
  geometry.computeBoundingBox();geometry.computeBoundingSphere();results.push(geometry);
 });
 return results;
}
