// node --no-warnings --import ./src/components/three/furniture-hardware/test-ts-resolve.mjs src/components/three/furniture-hardware/ovvo/ovvo.test.mjs
// OVVO V-1230 P/R: 홈 외곽 안 착좌(감사 003), 비대칭/대칭, 단계 변환, 혀-립 맞물림 검사 (mm)
import assert from 'node:assert/strict';
import { OVVO_V1230_OBSERVED as O, SLOT_CAPSULE, insideSlotEnvelope, panelAPose, panelAToJoint, jointToPanelA } from './ovvoContract.ts';
import { OVVO_ILLUSTRATIVE as D, phGeometry, pcGeometry, rcGeometry, rhGeometry } from './ovvoGeometry.ts';

const verts = (g) => { const p = g.attributes.position; return Array.from({ length: p.count }, (_, i) => [p.getX(i), p.getY(i), p.getZ(i)]); };
const bbox = (g) => { g.computeBoundingBox(); return g.boundingBox; };

// 0) 도면값
assert.equal(SLOT_CAPSULE.centerHalfSpanMm, 10.3);
assert.equal(SLOT_CAPSULE.radiusMm, 4.7);
assert.ok(Math.abs(2 * (SLOT_CAPSULE.centerHalfSpanMm + SLOT_CAPSULE.radiusMm) - O.slotLengthMm) < 1e-9, 'capsule length 30');
assert.equal(D.status, 'illustrative');

// 1) 하우징 착좌: 모든 정점이 홈 외곽 안 (OVVO-AUDIT-003 교정 확인 — 끝 원호 침범 없음)
for (const [name, g] of [['PH', phGeometry()], ['RH', rhGeometry()]]) {
  const out = verts(g).filter((v) => !insideSlotEnvelope(v));
  assert.equal(out.length, 0, `${name} vertices outside slot envelope: ${JSON.stringify(out.slice(0, 3))}`);
  const b = bbox(g); assert.ok(b.max.z <= 1e-6, `${name} flush/below face`);
}

// 2) 커넥터: 단계별 각 판 안쪽 부분이 해당 판 홈 외곽 안
const inPanelB = (vJ) => vJ[2] < -1e-6 ? insideSlotEnvelope(vJ) : true;
const inPanelA = (vJ, pose) => { const a = jointToPanelA(vJ, pose); return a[2] < -1e-6 ? insideSlotEnvelope(a) : true; };
const pc = verts(pcGeometry());
{ const pose = panelAPose('P', 'pressed'); const bad = pc.filter((v) => !inPanelB(v) || !inPanelA(v, pose)); assert.equal(bad.length, 0, 'PC pressed inside both slots'); }
const rc = verts(rcGeometry());
for (const phase of ['inserted', 'locked']) {
  const pose = panelAPose('R', phase);
  const vJ = rc.map((v) => [v[0] + pose.position[0], v[1] + pose.position[1], v[2] + pose.position[2]]);
  const bad = vJ.filter((v) => !inPanelB(v) || !inPanelA(v, pose));
  assert.equal(bad.length, 0, `RC ${phase} inside both slots: ${JSON.stringify(bad.slice(0, 2))}`);
}

// 3) 대칭/비대칭: PC는 z 대칭, RC는 아래 혀가 -x로 치우친 L자
{ const b = bbox(pcGeometry()); assert.ok(Math.abs(b.max.z + b.min.z) < 1e-6 && Math.abs(b.max.x + b.min.x) < 1e-6, 'PC symmetric'); }
{
  const lower = rc.filter((v) => v[2] < -1e-6), upper = rc.filter((v) => v[2] > 1e-6);
  const mx = (a, i, f) => f(...a.map((v) => v[i]));
  assert.ok(mx(lower, 0, Math.max) < 0 && mx(lower, 0, Math.min) < mx(upper, 0, Math.min), 'RC tongue offset to -x beyond upper part (L shape)');
  assert.ok(Math.abs(mx(upper, 0, Math.max) + mx(upper, 0, Math.min)) < 1e-6, 'RC upper centered');
}

// 4) R 맞물림: 체결 시 혀 목(립 깊이 구간)은 립 개구보다 좁고 혀 바브는 립 아래, 혀 x는 립 구간 안 / 삽입 시 혀 전체가 창 안
{
  const lipBottom = D.rh.lipZ[0];
  const tongueLocked = rc.filter((v) => v[2] < -1e-6); // pose locked = 원점
  const inLip = tongueLocked.filter((v) => v[2] > lipBottom + 1e-6);
  assert.ok(inLip.every((v) => Math.abs(v[1]) < D.rh.lipOpeningHalfMm), 'neck passes lip opening');
  assert.ok(inLip.every((v) => v[0] >= D.rh.lipRegionXMm[0] - 1e-6 && v[0] <= D.rh.lipRegionXMm[1] + 1e-6), 'locked tongue under lip region');
  const barb = tongueLocked.filter((v) => Math.abs(v[1]) > D.rh.lipOpeningHalfMm + 1e-6);
  assert.ok(barb.length > 0 && barb.every((v) => v[2] < lipBottom), 'barb retained below lip');
  const t = O.releaseTravelMm;
  const tongueInserted = tongueLocked.map((v) => [v[0] + t, v[1], v[2]]);
  assert.ok(tongueInserted.every((v) => v[0] >= D.rh.windowXMm[0] - 1e-6 && v[0] <= D.rh.windowXMm[1] + 1e-6 && Math.abs(v[1]) <= D.rh.windowHalfMm),
    'inserted tongue drops through window');
}

// 5) 단계 변환: R 삽입 → 체결 이동 = 해제 이동 15 (도면), P는 Z만
assert.deepEqual(panelAPose('P', 'pressed').position, [0, 0, 0]);
assert.deepEqual(panelAPose('R', 'inserted').position, [15, 0, 0]);
assert.deepEqual(panelAPose('R', 'locked').position, [0, 0, 0]);
{ const pose = panelAPose('R', 'inserted'); const p = [1, 2, -3]; assert.deepEqual(jointToPanelA(panelAToJoint(p, pose), pose), p, 'frame round-trip'); }

console.log('all ovvo checks passed');
