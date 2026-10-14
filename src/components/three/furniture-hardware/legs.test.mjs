// node src/components/three/furniture-hardware/legs.test.mjs
// 관찰 치수와 생성 형상의 bounds·앵커 일치를 검증 (단위 mm)
import assert from 'node:assert/strict';
import { latheLegGeometry } from './legGeometry.ts';
import { OBSERVED_HARDWARE, OBSERVED_LEG_PROFILES } from './specs/observedHardware.ts';

const EPS = 0.05;
for (const [name, profile] of Object.entries(OBSERVED_LEG_PROFILES)) {
  const geo = latheLegGeometry(profile, 64);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const obs = OBSERVED_HARDWARE[name].bounds;
  const height = obs.max[1] - obs.min[1];
  const radius = obs.max[0];
  // 앵커: 윗면이 원점(y=0), 형상은 아래로
  assert.ok(Math.abs(bb.max.y) < EPS, `${name} top at anchor y=0 (got ${bb.max.y})`);
  assert.ok(Math.abs(bb.min.y + height) < EPS, `${name} bottom at -${height} (got ${bb.min.y})`);
  // 외경
  assert.ok(Math.abs(bb.max.x - radius) < EPS && Math.abs(bb.max.z - radius) < 0.1, `${name} radius ${radius} (got ${bb.max.x.toFixed(3)}, ${bb.max.z.toFixed(3)})`);
  // 중심축
  assert.ok(Math.abs(bb.min.x + bb.max.x) < EPS, `${name} centered on axis`);
  geo.dispose();
  console.log(`ok ${name}: H${height} Ø${radius * 2} anchor=top`);
}
assert.throws(() => latheLegGeometry([[1, 0]]), /at least 2/);
console.log('all leg checks passed');
