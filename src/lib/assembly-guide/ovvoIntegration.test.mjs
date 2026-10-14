import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { registerHooks } from 'node:module';

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) return next(new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) return next(new URL(`${specifier}.ts`, context.parentURL).href, context);
  return next(specifier, context);
} });
const { jointPose, guideSteps, jointExample } = await import('./sequence.ts');
const { settledOvvoMounts, ovvoAssemblyTravel } = await import('./ovvoMounts.ts');
const { auditPocketFootprint } = await import('./pocketAudit.ts');
const { inspectionShot } = await import('./inspectionShot.ts');
const { guideMounts } = await import('../../components/three/furniture-hardware/ovvo/guideAdapter.ts');
const { phGeometry, rhGeometry, pcGeometry, rcGeometry } = await import('../../components/three/furniture-hardware/ovvo/ovvoGeometry.ts');
const { checkRTongueEngagement } = await import('../../components/three/furniture-hardware/ovvo/ovvoChecks.ts');

const transform = (point, mount, gap = 0, slide = 0) => new Vector3(...point).applyQuaternion(new Quaternion(...mount.quaternion)).add(new Vector3(...mount.position)).add(new Vector3(0, gap, slide));
const pointsOf = geometry => Array.from({ length: geometry.attributes.position.count }, (_, i) => [geometry.attributes.position.getX(i), geometry.attributes.position.getY(i), geometry.attributes.position.getZ(i)]);
const pocket = { widthMm: jointExample.slotWidth, lengthMm: jointExample.slotLength, depthMm: jointExample.slotDepth };

test('ASM-01: all P/R chapters sample absolutely at 0/0.5/1 and withstand backward seeking', () => {
  for (const model of ['V-1230P', 'V-1230R']) {
    const samples = guideSteps(model).flatMap((_, step) => [0, .5, 1].map(progress => ({ step, progress, pose: jointPose(model, step, progress) })));
    for (const sample of samples.toReversed()) {
      assert.deepEqual(jointPose(model, sample.step, sample.progress), sample.pose);
      assert.ok(Object.values(sample.pose).filter(value => typeof value === 'number').every(Number.isFinite));
    }
  }
});

test('ASM-02/03: both planner joints consume provider anchors once, including the upper PH flip', () => {
  for (const model of ['V-1230P', 'V-1230R']) for (const center of jointExample.centers) {
    const mounts = settledOvvoMounts(model, center);
    const upperNormal = new Vector3(0, 0, 1).applyQuaternion(new Quaternion(...mounts.endHousing.quaternion));
    const upperLong = new Vector3(1, 0, 0).applyQuaternion(new Quaternion(...mounts.endHousing.quaternion));
    assert.deepEqual(upperNormal.toArray(), [0, -1, 0]);
    assert.deepEqual(upperLong.toArray(), [0, 0, 1]);
    const code = model === 'V-1230P' ? 'P' : 'R';
    const pose = jointPose(model, 5, 1);
    const end = transform([0, 0, 0], mounts.endHousing, pose.panelGap, pose.panelSlide);
    const expected = guideMounts(code, code === 'P' ? 'pressed' : 'inserted', center).endHousing.position;
    assert.deepEqual(end.toArray(), expected);
    if (code === 'P') assert.equal(pose.panelSlide, 0);
  }
  assert.equal(ovvoAssemblyTravel('V-1230R').status, 'inferred');
});

test('ASM-04: actual mounted PH/RH bodies and PC/RC fit the observed capsule at both joints', () => {
  for (const model of ['V-1230P', 'V-1230R']) for (const center of jointExample.centers) {
    const mounts = settledOvvoMounts(model, center);
    const face = model === 'V-1230P' ? phGeometry() : rhGeometry();
    const end = phGeometry();
    const connector = model === 'V-1230P' ? pcGeometry() : rcGeometry();
    try {
      const inPocket = (world, upper, gap, slide) => ({ acrossMm: world.x, alongMm: world.z - center - (upper ? slide : 0), inwardMm: upper ? world.y - gap : -world.y });
      for (const [geometry, mount, upper] of [[face, mounts.baseHousing, false], [end, mounts.endHousing, true]]) {
        const world = pointsOf(geometry).map(point => transform(point, mount));
        const audit = auditPocketFootprint(world.map(point => inPocket(point, upper, 0, 0)), pocket);
        assert.equal(audit.footprintFits, true, `${model}, ${center}, ${upper}: ${JSON.stringify(audit)}`);
        assert.ok(world.every(point => inPocket(point, upper, 0, 0).inwardMm <= pocket.depthMm + .001));
        assert.equal(audit.undercutFit, 'unknown');
        assert.equal(audit.manufacturingApproved, false);
      }
      for (const [step, progress] of model === 'V-1230P' ? [[5, 1]] : [[5, 1], [6, .5], [6, 1]]) {
        const pose = jointPose(model, step, progress);
        const world = pointsOf(connector).map(point => transform(point, mounts.connector, pose.panelGap, pose.panelSlide));
        for (const upper of [false, true]) {
          const audit = auditPocketFootprint(world.map(point => inPocket(point, upper, pose.panelGap, pose.panelSlide)), pocket);
          assert.equal(audit.footprintFits, true, `${model} ${step}/${progress} ${upper}: ${JSON.stringify(audit)}`);
        }
      }
    } finally { face.dispose(); end.dispose(); connector.dispose(); }
  }
});

test('ASM-03/04: reversed asymmetric RC fails lip/window engagement instead of silently passing', () => {
  assert.equal(checkRTongueEngagement(1).ok, true);
  assert.equal(checkRTongueEngagement(-1).ok, false);
  assert.ok(checkRTongueEngagement(-1).reasons.length > 0);
});

test('ASM-07: fixed inspection cameras fit corrected hardware bounds without object scaling', () => {
  for (const model of ['V-1230P', 'V-1230R']) {
    const center = jointExample.centers[0];
    const mounts = settledOvvoMounts(model, center);
    const geometries = [model === 'V-1230P' ? phGeometry() : rhGeometry(), phGeometry(), model === 'V-1230P' ? pcGeometry() : rcGeometry()];
    try {
      for (const [step, progress] of model === 'V-1230P' ? [[5, 1]] : [[5, 1], [6, .5], [6, 1]]) for (const aspect of [.8, 2.2]) for (const view of ['front', 'side', 'section']) {
        const pose = jointPose(model, step, progress);
        const shot = inspectionShot(view, [0, -5, center], aspect);
        const camera = new PerspectiveCamera(40, aspect, 1, 8000);
        camera.position.set(...shot.position); camera.up.set(...shot.up); camera.lookAt(new Vector3(...shot.target)); camera.updateMatrixWorld();
        for (const [i, mount] of [mounts.baseHousing, mounts.endHousing, mounts.connector].entries()) for (const point of pointsOf(geometries[i])) {
          const projected = transform(point, mount, i === 0 ? 0 : pose.panelGap, i === 0 ? 0 : pose.panelSlide).project(camera);
          assert.ok(Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1 && projected.z > -1 && projected.z < 1, `${model}/${step}/${progress}/${view}/${aspect}: ${projected.toArray()}`);
        }
      }
    } finally { geometries.forEach(geometry => geometry.dispose()); }
  }
});
