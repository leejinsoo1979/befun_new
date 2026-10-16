import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { Euler, Matrix3, Quaternion, Vector3 } from 'three';
import { OBB } from 'three/addons/math/OBB.js';
registerHooks({ resolve(s, c, next) {
  if (s.startsWith('@/')) return next(pathToFileURL(`${process.cwd()}/src/${s.slice(2)}${/\.[a-z]+$/i.test(s) ? '' : '.ts'}`).href, c);
  if (s.startsWith('.') && !/\.[a-z]+$/i.test(s)) return next(new URL(`${s}.ts`, c.parentURL).href, c);
  return next(s, c);
} });
const { createCabinetPlan, cabinetPartPose, initialCabinetState, isCabinetRear } = await import('./cabinet.ts');
const { backExample, backPanelPose, rearDisplayClearance } = await import('./backPanel.ts');
const { cabinetFilmShot } = await import('./cabinetFilm.ts');
const { samplePart } = await import('../../components/three/display/assemblyPlan.ts');

function orientedBox(center, half, quaternion = new Quaternion()) {
  const x = new Vector3(1, 0, 0).applyQuaternion(quaternion), y = new Vector3(0, 1, 0).applyQuaternion(quaternion), z = new Vector3(0, 0, 1).applyQuaternion(quaternion);
  return new OBB(center, new Vector3(...half), new Matrix3().set(x.x,y.x,z.x,x.y,y.y,z.y,x.z,y.z,z.z));
}
function rearBounds(part, pose) {
  const q = new Quaternion().setFromEuler(new Euler(...part.animation.rotation)).slerp(new Quaternion(), pose.rotationProgress)
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pose.tilt));
  const clearance = rearDisplayClearance / 10;
  const center = new Vector3(0, -clearance / 2, 0).applyQuaternion(q).add(new Vector3(...pose.position));
  return orientedBox(center, [part.box.w / 2, (part.box.h - clearance) / 2, part.box.d / 2], q);
}
const solid = part => orientedBox(new Vector3(part.box.x,part.box.y,part.box.z), [part.box.w/2-1e-7,part.box.h/2-1e-7,part.box.d/2-1e-7]);

test('the collision check reproduces the reported top-board crossing in the old front carry', () => {
  const plan=createCabinetPlan(), part=plan.parts.find(p=>p.box.kind==='support');
  const legacy={...part.animation,floor:[-97.52812630800385,-.4,180.1],anchor:[part.box.x,20.97169297438259,4.675069140028083]};
  const pose=samplePart(legacy,.4/.7);
  const bounds=rearBounds(part,{...pose,tilt:Math.PI/15*pose.rotationProgress});
  assert.ok(bounds.intersectsOBB(solid(plan.parts.find(p=>p.box.kind==='horizontal'&&!p.feet))));
});

// SAT tests all separating axes. AABB-only checks falsely reject a tilted board near its seat.
test('both rear pieces lift, rotate, lower and approach behind the installed body without crossing any board', () => {
  const plan = createCabinetPlan();
  for (const rear of plan.parts.filter(isCabinetRear)) {
    for (const phase of ['placing','spring-press','spring-seat','spring-lock']) for (let n=0;n<=1000;n++) {
      const state = {...initialCabinetState(),step:rear.number-1,phase,progress:n/1000};
      const pose = cabinetPartPose(rear,state), bounds = rearBounds(rear,pose);
      for (const fixed of plan.parts.filter(p=>p.number<rear.number)) assert.ok(!bounds.intersectsOBB(solid(fixed),1e-10), `${rear.id}/${phase}/${n}: intersects ${fixed.id}`);
      if (phase==='placing' && n<=500) {
        const q=pose.rotationProgress, tilt=Math.PI/2*(1-q)+pose.tilt;
        const front=pose.position[2]+Math.abs(rear.box.h/2*Math.sin(tilt))+Math.abs(rear.box.d/2*Math.cos(tilt));
        assert.ok(front<0,'rotation and lowering must finish outside the rear body plane');
      }
    }
  }
});

test('lower fixed pin segments remain within their receiving bores while the upper edge swings in', () => {
  const plan=createCabinetPlan();
  for (const rear of plan.parts.filter(isCabinetRear)) for(let n=0;n<=1000;n++) {
    const pose=cabinetPartPose(rear,{...initialCabinetState(),step:rear.number-1,phase:'spring-seat',progress:n/1000});
    for(const x of rear.pinCenters) for(const length of [0,.25,.5]) {
      const pin=new Vector3(x/10,-rear.box.h/2-length,0).applyAxisAngle(new Vector3(1,0,0),pose.tilt).add(new Vector3(...pose.position));
      assert.ok(Math.abs(pin.z-rear.box.z)+.15 < .35,'3mm fixed pin must remain inside the 7mm illustrative receiver');
    }
  }
});

test('standalone seven-step rear guide also clears the base, top and side boards', () => {
  const e=backExample;
  const fixed=[orientedBox(new Vector3(0,-9,52),[108-1e-6,9-1e-6,58-1e-6]),orientedBox(new Vector3(0,e.height+9,52),[108-1e-6,9-1e-6,58-1e-6]), ...[-1,1].map(s=>orientedBox(new Vector3(s*99,110,52),[9-1e-6,110-1e-6,58-1e-6]))];
  for(let step=0;step<7;step++) for(let n=0;n<=1000;n++) {
    const pose=backPanelPose(step,n/1000), q=new Quaternion().setFromAxisAngle(new Vector3(1,0,0),pose.tilt);
    const center=new Vector3(0,(e.height-rearDisplayClearance)/2,0).applyQuaternion(q).add(new Vector3(...pose.pivot));
    const bounds=orientedBox(center,[e.width/2,(e.height-rearDisplayClearance)/2,e.thickness/2],q);
    for(const box of fixed) assert.ok(!bounds.intersectsOBB(box,1e-10),`guide ${step}/${n}: panel intersects a board`);
  }
});

test('rear carry cameras stay behind the moving panel and seeking reproduces the same pose', () => {
  const plan=createCabinetPlan();
  for(const part of plan.parts.filter(isCabinetRear)) for(const progress of [0,.125,.25,.5,.8,1]) {
    const state={...initialCabinetState(),step:part.number-1,phase:'placing',progress};
    const pose=cabinetPartPose(part,state), shot=cabinetFilmShot(plan,state,390/480);
    assert.deepEqual(cabinetPartPose(part,state),pose);
    assert.ok(shot.position[2]<shot.target[2]);
  }
});
