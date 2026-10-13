import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshStandardMaterial, Vector3, Euler } from 'three';
import { createAssemblyPlan, partProgress, samplePart, footPanelIndex } from './assemblyPlan.ts';
import { assembledClone } from './assembledClone.ts';

const board = (x, y, w, h, matType) => ({ x, y, z: 20, w, h, d: 40, matType, castShadow: true, receiveShadow: true });
const panels = [board(0, 1, 90, 2, 'horizontalBase'), board(-44, 21, 2, 38, 'verticalBase'), board(44, 21, 2, 38, 'verticalBase'), board(0, 41, 90, 2, 'horizontalBase'), board(-44, 61, 2, 38, 'verticalBase'), board(0, 81, 90, 2, 'horizontalBase')];
const plan = createAssemblyPlan(panels, [], [], 90, 82, 40, 2);

test('assembly orders base horizontal, uprights, next horizontal and never overlaps successive stages', () => {
  const byId = Object.fromEntries(plan.parts.map(p => [p.id, p]));
  assert.ok(byId['panel-0'].stage < byId['panel-1'].stage);
  assert.ok(byId['panel-1'].stage < byId['panel-3'].stage);
  assert.ok(byId['panel-3'].stage < byId['panel-4'].stage);
  for (let t = 0; t < plan.assemblyDuration; t += 0.025) {
    for (const p of plan.parts) {
      if (partProgress(p, plan, 'assembling', t) > 0) {
        for (const prior of plan.parts.filter(q => q.stage < p.stage)) assert.equal(partProgress(prior, plan, 'assembling', t), 1);
      }
    }
  }
});

test('floor layout does not overlap and is deterministic', () => {
  assert.deepEqual(plan, createAssemblyPlan(panels, [], [], 90, 82, 40, 2));
  for (let i = 0; i < plan.parts.length; i++) for (let j = i + 1; j < plan.parts.length; j++) {
    const a = plan.parts[i], b = plan.parts[j];
    const overlapX = Math.abs(a.floor[0] - b.floor[0]) < (a.footprint[0] + b.footprint[0]) / 2;
    const overlapZ = Math.abs(a.floor[2] - b.floor[2]) < (a.footprint[1] + b.footprint[1]) / 2;
    assert.ok(!(overlapX && overlapZ), `${a.id} overlaps ${b.id}`);
  }
});

test('both animation endpoints are exact and motion is continuous at lift/travel/dock boundaries', () => {
  for (const p of plan.parts) {
    assert.deepEqual(samplePart(p, 0).position, p.floor);
    assert.deepEqual(samplePart(p, 1).position, p.anchor);
    assert.equal(partProgress(p, plan, 'assembling', plan.assemblyDuration), 1);
    assert.equal(partProgress(p, plan, 'disassembling', plan.disassemblyDuration), 0);
    for (const boundary of [0.18, 0.78]) {
      const a = new Vector3(...samplePart(p, boundary - 1e-6).position);
      const b = new Vector3(...samplePart(p, boundary + 1e-6).position);
      assert.ok(a.distanceTo(b) < 0.01);
    }
  }
});

test('AR export reverses floor rotations and pivot translations without changing live simulation', () => {
  const root = new Group(), pivot = new Group(), inverse = new Group();
  const mesh = new Mesh(new BoxGeometry(2, 38, 40), new MeshStandardMaterial());
  pivot.userData = { displayExplodedPart: true, assembledPosition: [10, 20, 30] };
  pivot.position.set(100, 1, 200); pivot.rotation.z = Math.PI / 2;
  inverse.position.set(-10, -20, -30); mesh.position.set(10, 20, 30);
  root.add(pivot); pivot.add(inverse); inverse.add(mesh);
  const copy = assembledClone(root);
  const exportedMesh = copy.children[0].children[0].children[0];
  assert.deepEqual(exportedMesh.getWorldPosition(new Vector3()).toArray(), [10, 20, 30]);
  assert.equal(pivot.rotation.z, Math.PI / 2);
  mesh.geometry.dispose(); mesh.material.dispose();
});

test('thin back braces lie on their broad face, and large layouts stay collision-free', () => {
  const brace = { ...board(0, 20, 10, 38, 'supportPanel'), d: 2 };
  const bracePlan = createAssemblyPlan([brace], [], [], 90, 82, 40, 2);
  assert.deepEqual(bracePlan.parts[0].rotation, [Math.PI / 2, 0, 0]);
  assert.equal(bracePlan.parts[0].floor[1], 0);
  const many = Array.from({ length: 100 }, (_, i) => board((i % 10) * 30 - 135, Math.floor(i / 10) * 20 + 10, 2, 18, 'verticalBase'));
  const large = createAssemblyPlan(many, [], [], 450, 228, 40, 2);
  for (let i = 0; i < large.parts.length; i++) for (let j = i + 1; j < large.parts.length; j++) {
    const a = large.parts[i], b = large.parts[j];
    assert.ok(Math.abs(a.floor[0] - b.floor[0]) >= (a.footprint[0] + b.footprint[0]) / 2 || Math.abs(a.floor[2] - b.floor[2]) >= (a.footprint[1] + b.footprint[1]) / 2);
  }
});


test('preinstalled feet belong to bottom boards and keep floor clearance throughout motion', () => {
  const split = [board(-25, 1, 50, 2, 'horizontalBase'), board(25, 1, 50, 2, 'horizontalBase'), board(0, 41, 100, 2, 'horizontalBase')];
  const grouped = createAssemblyPlan(split, [], [], 100, 42, 40, 2);
  assert.equal(grouped.parts.length, split.length);
  assert.equal(grouped.stages[0], '조절발이 체결된 바닥판 놓기');
  assert.ok(!grouped.parts.some(p => p.id === 'feet'));
  for (const [x, expected] of [[-40, 0], [40, 1], [0, 0]]) {
    const foot = [x, -1, 3];
    const owner = footPanelIndex(split, foot);
    assert.equal(owner, expected);
    const part = grouped.parts[owner];
    for (const progress of [0, 0.1, 0.4, 0.8, 1]) {
      const pose = samplePart(part, progress);
      const footY = pose.position[1] + foot[1] - part.anchor[1] + 1;
      assert.ok(footY >= -1e-9, 'attached foot must stay above the floor');
    }
    assert.deepEqual(part.rotation, [0, 0, 0]);
  }
});


test('preinstalled door cups and side plates face upwards on the floor', () => {
  const door = {x:0,y:20,z:31,width:30,height:27,pivotOffsetX:0,layerIndex:0};
  const layout=createAssemblyPlan(panels,[door],[],90,82,40,2,[1,-1]);
  const cupNormal=new Vector3(0,0,-1).applyEuler(new Euler(...layout.parts[panels.length].rotation));
  assert.ok(cupNormal.y>.999);
  const plateNormal=new Vector3(-1,0,0).applyEuler(new Euler(...layout.parts[1].rotation));
  assert.ok(plateNormal.y>.999);
});

test('AR restores hardware hidden by boring view and closes articulated links without changing live scene',()=>{
  const root=new Group(), hidden=new Group(), door=new Group(), link=new Group();
  hidden.visible=false;hidden.userData.displayRestoreVisible=true;
  door.rotation.y=1;door.userData.displayDoorPivot=true;
  link.position.set(9,9,9);link.scale.set(1,9,1);
  link.userData.displayClosedPose={position:[1,2,3],quaternion:[0,0,0,1],scale:[1,2,1]};
  root.add(hidden,door);door.add(link);
  const copy=assembledClone(root);
  assert.equal(copy.children[0].visible,true);assert.equal(copy.children[1].rotation.y,0);
  assert.deepEqual(copy.children[1].children[0].scale.toArray(),[1,2,1]);
  assert.equal(hidden.visible,false);assert.equal(door.rotation.y,1);
});

test('shuffled boards assemble individually left-to-right with each brace before the next floor',()=>{
 const fixture=[board(40,21,2,38,'verticalBase'),board(0,41,90,2,'horizontalBase'),
   {...board(0,21,20,38,'supportPanel'),d:2},board(-40,21,2,38,'verticalBase'),board(0,1,90,2,'horizontalBase')];
 const result=createAssemblyPlan(fixture,[],[],90,42,40,2);
 const sequence=[...result.parts].sort((a,b)=>a.stage-b.stage);
 assert.deepEqual(sequence.map(p=>p.id),['panel-4','panel-3','panel-0','panel-2','panel-1']);
 for(let t=0;t<result.assemblyDuration;t+=.01) {
  const moving=result.parts.filter(p=>{const n=partProgress(p,result,'assembling',t);return n>0&&n<1;});
  assert.ok(moving.length<=1,'only one board may be carried at a time');
 }
 for(const part of result.parts) {
  const before=samplePart(part,.82-1e-6),after=samplePart(part,.82+1e-6);
  assert.ok(Math.hypot(...before.position.map((n,i)=>n-after.position[i]))<.001);
  for(let t=.82;t<1;t+=.01) assert.equal(samplePart(part,t).rotationProgress,1,'align before insertion');
 }
});
