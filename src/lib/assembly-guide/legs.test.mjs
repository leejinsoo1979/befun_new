import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { Box3, Matrix4, PerspectiveCamera, Quaternion, Vector3 } from 'three';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) return next(new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) return next(new URL(`${specifier}.ts`, context.parentURL).href, context);
  return next(specifier, context);
} });
const { legPhase, legSteps, legReferenceFrame, canConfirmLeg, legGuideContract, legInspectionShot } = await import('./legs.ts');
const { LONG_LEG_ASSET, LONG_LEG_UNKNOWN, longLegHeight } = await import('../../components/three/furniture-hardware/legs/longLegContract.ts');

test('leg sequence keeps fixed screw/pin roles and unknown values from HW without creating geometry', () => {
  assert.strictEqual(legGuideContract.unknown, LONG_LEG_UNKNOWN);
  assert.equal(legGuideContract.slideTravelMm, null);
  assert.equal(legGuideContract.pinTravelMm, null);
  assert.equal(legGuideContract.fixedModelAvailable, false);
  assert.deepEqual(legGuideContract.parts.filter(p => p.role === 'fixed').map(p => p.id), ['screw_1','screw_2','screw_3','central_pin']);
  assert.equal(legGuideContract.movement, 'plate-and-shaft-rigid');
  for (const action of ['assemble','disassemble']) for (const step of legSteps(action)) assert.doesNotMatch(step.instruction, /15\s*mm|색상 대응|OVVO/);
});
test('pin pressing and entry alignment precede removal; no completion before source end', () => {
  assert.equal(legPhase('disassemble',1,0).pinPressed,false);
  assert.equal(legPhase('disassemble',1,1).pinPressed,true);
  for (const progress of [0,.5,1]) {
    assert.equal(legPhase('disassemble',2,progress).pinPressed,true);
    assert.equal(legPhase('disassemble',2,progress).removed,false);
  }
  assert.equal(legPhase('disassemble',3,0).openingAligned,true);
  assert.equal(legPhase('disassemble',3,.5).removed,false);
  assert.equal(legPhase('disassemble',3,1).removed,true);
  assert.equal(canConfirmLeg('disassemble',4,1,new Set([0,2,3])),false);
  assert.equal(canConfirmLeg('disassemble',4,1,new Set([0,1,2,3])),true);
});
test('assembly lock and ordered confirmations are required, including after seeking directly to final', () => {
  assert.equal(legPhase('assemble',2,1).locked,false);
  assert.equal(legPhase('assemble',3,.5).locked,false);
  assert.equal(legPhase('assemble',3,1).locked,true);
  assert.equal(canConfirmLeg('assemble',4,1,new Set()),false);
  assert.equal(canConfirmLeg('assemble',4,1,new Set([0,1,2])),false);
  assert.equal(canConfirmLeg('assemble',3,.5,new Set([0,1,2])),false);
  assert.equal(canConfirmLeg('assemble',4,1,new Set([0,1,2,3])),true);
});
test('backward seeking restores original source frames rather than reversing OVVO assembly', () => {
  assert.deepEqual([0,.5,1].map(p=>legReferenceFrame('disassemble',2,p)),['press','slide','entry']);
  assert.equal(legReferenceFrame('disassemble',4,1),'removed');
  assert.equal(legReferenceFrame('disassemble',1,0),'locked');
  assert.equal(legReferenceFrame('disassemble',2,.5),'slide');
});
test('desktop and 390px camera fit actual GLB vertices with the provider unit/TRS intact', () => {
  const bytes=readFileSync(new URL('../../../public/models/furniture/long-leg.glb',import.meta.url));
  const jsonLength=bytes.readUInt32LE(12), gltf=JSON.parse(bytes.subarray(20,20+jsonLength));
  const binary=bytes.subarray(28+jsonLength);
  const node=gltf.nodes.find(n=>n.name===LONG_LEG_ASSET.nodeName);
  const accessor=gltf.accessors[gltf.meshes[node.mesh].primitives[0].attributes.POSITION];
  const view=gltf.bufferViews[accessor.bufferView], data=binary.subarray(view.byteOffset+(accessor.byteOffset??0));
  const transform=new Matrix4().compose(new Vector3(...(node.translation??[0,0,0])),new Quaternion(...node.rotation),new Vector3(...node.scale).multiplyScalar(1000));
  const points=Array.from({length:accessor.count},(_,i)=>new Vector3(data.readFloatLE(i*12),data.readFloatLE(i*12+4),data.readFloatLE(i*12+8)).applyMatrix4(transform));
  const box=new Box3().setFromPoints(points);
  assert.ok(Math.abs(box.max.y-longLegHeight('mm'))<.01); assert.ok(Math.abs(box.min.y)<.001);
  for(const aspect of [.72,2.5]) for(const overview of [true,false]) for(const rear of [true,false]) {
    const shot=legInspectionShot(aspect,overview,rear); const camera=new PerspectiveCamera(40,aspect,1,8000);
    camera.position.set(...shot.position);camera.up.set(...shot.up);camera.lookAt(new Vector3(...shot.target));camera.updateMatrixWorld();
    for(const point of points) {
      if(!overview&&point.y<100)continue;
      const projected=point.clone().project(camera);
      assert.ok(Math.abs(projected.x)<1&&Math.abs(projected.y)<1&&projected.z>-1&&projected.z<1);
    }
  }
});
