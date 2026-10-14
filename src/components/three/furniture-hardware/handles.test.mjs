// node src/components/three/furniture-hardware/handles.test.mjs — 단면 압출 손잡이 bounds 검증 (mm)
import assert from 'node:assert/strict';
import { extrudedHandleGeometry } from './handleGeometry.ts';
import { OBSERVED_FULL_HANDLE_30_SECTION, OBSERVED_HARDWARE } from './specs/observedHardware.ts';

const EPS = 0.05;
for (const h of [100, 380, 1900]) {
  const g = extrudedHandleGeometry(OBSERVED_FULL_HANDLE_30_SECTION, h);
  g.computeBoundingBox();
  const { min, max } = g.boundingBox;
  assert.ok(Math.abs(min.y + h / 2) < EPS && Math.abs(max.y - h / 2) < EPS, `height ${h} centered (got ${min.y}..${max.y})`);
  const obs = OBSERVED_HARDWARE.vertical_handle_30.bounds;
  // 관찰 bounds(x -20..10, z -9.7..9.3)와 단면 bounds(x -19.2..9.9, z -9.7..9.2) — 0.8mm 이내
  assert.ok(Math.abs(min.x - obs.min[0]) <= 0.8 && Math.abs(max.x - obs.max[0]) <= 0.15, `x ${min.x}..${max.x} vs ${obs.min[0]}..${obs.max[0]}`);
  assert.ok(Math.abs(min.z - obs.min[2]) <= 0.05 && Math.abs(max.z - obs.max[2]) <= 0.15, `z ${min.z}..${max.z} vs ${obs.min[2]}..${obs.max[2]}`);
  g.dispose();
  console.log(`ok full handle 30: h${h} x ${min.x.toFixed(1)}..${max.x.toFixed(1)} z ${min.z.toFixed(1)}..${max.z.toFixed(1)}`);
}
assert.throws(() => extrudedHandleGeometry(OBSERVED_FULL_HANDLE_30_SECTION, 0), /positive/);
console.log('all handle checks passed');
