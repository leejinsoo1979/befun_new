import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PerspectiveCamera, Quaternion, Vector3 } from 'three';

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) return next(new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) return next(new URL(`${specifier}.ts`, context.parentURL).href, context);
  return next(specifier, context);
} });
const { cinematicJointShot } = await import('./cinematicShot.ts');
const { jointPose, jointExample } = await import('./sequence.ts');
const { settledOvvoMounts } = await import('./ovvoMounts.ts');
const { phGeometry, rhGeometry, pcGeometry, rcGeometry } = await import('../../components/three/furniture-hardware/ovvo/ovvoGeometry.ts');

test('directed macro shots keep the actual moving hardware in frame throughout P/R assembly', () => {
  for (const model of ['V-1230P', 'V-1230R']) {
    const mounts = settledOvvoMounts(model, jointExample.centers[0]);
    const geometry = [model === 'V-1230P' ? phGeometry() : rhGeometry(), phGeometry(), model === 'V-1230P' ? pcGeometry() : rcGeometry()];
    try {
      for (const step of [1, 2, 3, 4, 5, ...(model === 'V-1230R' ? [6] : [])]) for (const progress of [0, .5, 1]) for (const aspect of [.7, 2.5]) {
        const pose = jointPose(model, step, progress);
        const shot = cinematicJointShot(model, step, progress, aspect, false, false);
        const camera = new PerspectiveCamera(40, aspect, 1, 8000);
        camera.position.set(...shot.position); camera.up.set(...shot.up); camera.lookAt(new Vector3(...shot.target)); camera.updateMatrixWorld();
        const selected = step === 1 ? [0] : step === 2 ? [1] : step === 3 ? [1, 2] : [0, 1, 2];
        for (const i of selected) {
          const mount = [mounts.baseHousing, mounts.endHousing, mounts.connector][i];
          const offset = [pose.baseHousingOffset, pose.endHousingOffset + pose.panelGap, pose.connectorOffset + pose.panelGap][i];
          const positions = geometry[i].attributes.position;
          for (let v = 0; v < positions.count; v++) {
            const point = new Vector3(positions.getX(v), positions.getY(v), positions.getZ(v)).applyQuaternion(new Quaternion(...mount.quaternion)).add(new Vector3(...mount.position)).add(new Vector3(0, offset, i === 0 ? 0 : pose.panelSlide)).project(camera);
            assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1 && point.z > -1 && point.z < 1, `${model}/${step}/${progress}/${aspect}: ${point.toArray()}`);
          }
        }
      }
    } finally { geometry.forEach(g => g.dispose()); }
  }
});

test('camera seeking is deterministic and a reverse-side view changes only the shot', () => {
  const shot = cinematicJointShot('V-1230R', 6, .4, 1.5, false, false);
  assert.deepEqual(shot, cinematicJointShot('V-1230R', 6, .4, 1.5, false, false));
  const reverse = cinematicJointShot('V-1230R', 6, .4, 1.5, false, true);
  assert.deepEqual(reverse.target, shot.target);
  assert.notDeepEqual(reverse.position, shot.position);
});
