import test from 'node:test';
import assert from 'node:assert/strict';
import { Mesh, MeshBasicMaterial, Raycaster, Vector3, DoubleSide } from 'three';
import { createBlumDoorPlan, createBlumShelfPlans } from './boring.ts';
import { createBoredBox } from './geometry.ts';
const panels = [-30,30].map(x=>({x,y:16,z:16,w:1.8,h:28,d:32,matType:'verticalBase'}));
const door = {x:0,y:16,z:31.2,width:57.6,height:27.4,pivotOffsetX:0,layerIndex:0};
const plan = createBlumDoorPlan(door,panels,1.6);

test('inset datum: 3mm reveal, TB4, cup21.5, INSERTA45/9.5, plate54.5/32',()=>{
  assert.deepEqual(plan.issues,[]);
  assert.equal(plan.drillingDistance,4);
  assert.equal(plan.holes.length,6);
  assert.equal(plan.cups[0][0],266.5);
  assert.equal(plan.holes[1].center[0],257);
  assert.equal(plan.holes[2].center[1]-plan.holes[1].center[1],45);
  assert.equal(plan.mounts[0].panelIndex,1);
  assert.ok(Math.abs(plan.mounts[0].position[2]-26.55)<1e-9);
  assert.equal(plan.mounts[0].holes[1].center[1]-plan.mounts[0].holes[0].center[1],32);
});
test('mirroring changes side/normal, never diameter, depth, spacing or Y datums',()=>{
  const left=createBlumDoorPlan({...door,reference:{hingeSide:'left',thickness:1.6}},panels,1.6);
  left.holes.forEach((h,i)=>{assert.equal(h.center[0],-plan.holes[i].center[0]);assert.equal(h.center[1],plan.holes[i].center[1]);assert.equal(h.depth,plan.holes[i].depth);});
  assert.equal(left.mounts[0].panelIndex,0);
  assert.deepEqual(left.mounts[0].holes[0].direction,[-1,0,0]);
});
test('blind cup has exact 13mm floor and retains 3mm front skin, fixing holes also cut',()=>{
  const geo=createBoredBox(door.width,door.height,1.6,plan.holes);
  const mat=new MeshBasicMaterial({side:DoubleSide}), mesh=new Mesh(geo,mat);mesh.updateMatrixWorld();
  for(const h of plan.holes) {
    const ray=new Raycaster(new Vector3(h.center[0]/10,h.center[1]/10,-2),new Vector3(0,0,1));
    const hits=ray.intersectObject(mesh);
    assert.ok(hits.length>0);
    assert.ok(Math.abs(hits[0].point.z-.5)<1e-5,`wrong floor at ${hits[0].point.z}`);
  }
  const front=new Raycaster(new Vector3(plan.cups[0][0]/10,plan.cups[0][1]/10,2),new Vector3(0,0,-1)).intersectObject(mesh);
  assert.ok(Math.abs(front[0].point.z-.8)<1e-5);
  geo.dispose();mat.dispose();
});
test('side bores enter correct face and stop 11.5mm into 18mm panel',()=>{
  const mount=plan.mounts[0],p=panels[1];
  const geo=createBoredBox(p.w,p.h,p.d,mount.holes),mat=new MeshBasicMaterial({side:DoubleSide}),mesh=new Mesh(geo,mat);mesh.updateMatrixWorld();
  const h=mount.holes[0];
  const hit=new Raycaster(new Vector3(-2,h.center[1]/10,h.center[2]/10),new Vector3(1,0,0)).intersectObject(mesh)[0];
  assert.ok(Math.abs(hit.point.x-.25)<1e-5);
  geo.dispose();mat.dispose();
});
test('missing side / unsupported thickness never invent manufacturing holes',()=>{
  assert.equal(createBlumDoorPlan(door,[],1.6).holes.length,0);
  assert.equal(createBlumDoorPlan(door,panels,1.2).holes.length,0);
});
test('overlapping mounts are reported for downstream manufacturing',()=>{
  const plans=createBlumShelfPlans([door,door],panels,1.6);
  assert.ok(plans.every(p=>p.issues.some(i=>i.includes('겹칩니다'))));
});
