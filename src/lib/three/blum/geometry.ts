import { BoxGeometry, CylinderGeometry, MeshBasicMaterial, Vector3 } from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import type { Bore } from './boring';

/** Real blind pockets, not decals. Input/output geometry dimensions are cm. */
export function createBoredBox(w: number, h: number, d: number, holes: readonly Bore[]) {
  if (!holes.length) return new BoxGeometry(w,h,d);
  const evaluator = new Evaluator();
  evaluator.useGroups = false;
  const material = new MeshBasicMaterial();
  let solid = new Brush(new BoxGeometry(w,h,d), material);
  solid.updateMatrixWorld();
  for (const hole of holes) {
    const axis = new Vector3(...hole.direction);
    // Cutter extends 0.1mm outside the face; the blind floor stays exact.
    const length = (hole.depth + .1) / 10;
    const cutter = new Brush(new CylinderGeometry(hole.diameter/20,hole.diameter/20,length,48), material);
    cutter.quaternion.setFromUnitVectors(new Vector3(0,1,0), axis);
    cutter.position.set(...hole.center).multiplyScalar(.1).addScaledVector(axis,(hole.depth-.1)/20);
    cutter.updateMatrixWorld();
    const next = evaluator.evaluate(solid,cutter,SUBTRACTION);
    solid.disposeCacheData(); solid.geometry.dispose();
    cutter.disposeCacheData(); cutter.geometry.dispose();
    solid = next;
    solid.updateMatrixWorld();
  }
  const geometry = solid.geometry;
  solid.disposeCacheData(); material.dispose();
  // Preserve BoxGeometry face-material ordering for body panels.
  geometry.clearGroups();
  const normal = geometry.getAttribute('normal');
  const count = geometry.index?.count ?? normal.count;
  let last = -1, start = 0;
  for (let i=0;i<count;i+=3) {
    const j=geometry.index?.getX(i) ?? i;
    const x=normal.getX(j), y=normal.getY(j), z=normal.getZ(j);
    const face=Math.abs(x)>Math.abs(y)&&Math.abs(x)>Math.abs(z) ? (x>0?0:1) : Math.abs(y)>Math.abs(z)?(y>0?2:3):(z>0?4:5);
    if(face!==last) { if(last>=0) geometry.addGroup(start,i-start,last); last=face; start=i; }
  }
  geometry.addGroup(start,count-start,last);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}
