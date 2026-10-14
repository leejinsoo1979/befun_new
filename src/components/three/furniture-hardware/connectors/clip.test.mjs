// node src/components/three/furniture-hardware/connectors/clip.test.mjs — Tylko 클립/핀 계약·형상 검증 (mm)
import assert from 'node:assert/strict';
import { clipBodyExtent, isManufacturingReady, pinPositionInClip, validateClipPair } from './clipContract.ts';
import { clipBodyGeometry, clipCavityGeometry, clipPinGeometry, keyholePoints } from './clipGeometry.ts';
import { ILLUSTRATIVE_CLIP as C, ILLUSTRATIVE_PIN as P } from './illustrativeDimensions.ts';

const EPS = 1e-3;
const bb = (g) => { g.computeBoundingBox(); return g.boundingBox; };

// 1) 설명용 치수는 기하 조건은 만족하지만 제조 출력은 차단
assert.deepEqual(validateClipPair(C, P), [], 'illustrative pair is geometrically consistent');
assert.equal(isManufacturingReady(C, P), false, 'illustrative dims must never be manufacturing-ready');
assert.equal(isManufacturingReady({ ...C, status: 'measured' }, P), false, 'pin still illustrative → blocked');
assert.equal(isManufacturingReady({ ...C, status: 'measured' }, { ...P, status: 'measured' }), true);

// 2) 조건 위반 탐지
assert.ok(validateClipPair({ ...C, slotWidthMm: 7 }, P).some((e) => e.includes('slotWidth')));
assert.ok(validateClipPair(C, { ...P, headDiameterMm: 7 }).some((e) => e.includes('pass the entry')));
assert.ok(validateClipPair(C, { ...P, neckDiameterMm: 3.5 }).some((e) => e.includes('neck')));
assert.ok(validateClipPair({ ...C, lengthMm: 15 }).some((e) => e.includes('too short')));

// 3) 클립 몸체: 접합면 z=0, 매입 -depth, 폭 ±w/2, 장축 범위 = clipBodyExtent
const body = clipBodyGeometry(C); const b = bb(body); const ext = clipBodyExtent(C);
assert.ok(Math.abs(b.max.z) < EPS && Math.abs(b.min.z + C.depthMm) < EPS, `z 0..-${C.depthMm} (got ${b.min.z}..${b.max.z})`);
assert.ok(Math.abs(b.min.y + C.widthMm / 2) < EPS && Math.abs(b.max.y - C.widthMm / 2) < EPS, 'width ±w/2');
assert.ok(Math.abs(b.min.x - ext.startX) < EPS && Math.abs(b.max.x - ext.endX) < EPS, 'long axis extent');
assert.ok(Math.abs(ext.endX - ext.startX - C.lengthMm) < EPS, 'total length');
// 구멍이 비어 있어야 한다(경계선 정점은 허용, 엄밀한 내부만 검사)
const e = 1e-3, re = C.entryDiameterMm / 2, hs = C.slotWidthMm / 2;
const insideKeyhole = (x, y) => Math.hypot(x, y) < re - e || (x > 0 && x < C.travelMm && Math.abs(y) < hs - e);
const insideUndercut = (x, y) => Math.hypot(x, y) < re - e || Math.hypot(x - C.travelMm, y) < re - e || (x > 0 && x < C.travelMm && Math.abs(y) < re - e);
const pos = body.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
  if (z > -C.lipThicknessMm + e) assert.ok(!insideKeyhole(x, y), `lip vertex inside keyhole (${x}, ${y}, ${z})`);
  if (z < -C.lipThicknessMm - e) assert.ok(!insideUndercut(x, y), `lower vertex inside undercut (${x}, ${y}, ${z})`);
}
assert.ok(validateClipPair({ ...C, lipThicknessMm: 7 }, P).some((e) => e.includes('clear the lip')));
// 4) 열쇠구멍: 입구 반경, 홈 끝 = travel + slot/2
const kh = keyholePoints(C);
assert.ok(Math.abs(Math.max(...kh.map((v) => v.x)) - (C.travelMm + C.slotWidthMm / 2)) < 1e-6, 'slot end');
assert.ok(Math.abs(Math.min(...kh.map((v) => v.x)) + C.entryDiameterMm / 2) < 1e-6, 'entry radius');
const cav = bb(clipCavityGeometry(C));
assert.ok(cav.max.z < 0 && cav.min.z > -C.depthMm, 'cavity floor inside the pocket');

// 5) 핀: 원점=판 면, +Z 축, 머리 지름
const pin = bb(clipPinGeometry(P));
assert.ok(Math.abs(pin.min.z) < EPS && Math.abs(pin.max.z - (P.neckLengthMm + P.headHeightMm)) < EPS, 'pin z 0..top');
assert.ok(Math.abs(pin.max.x - P.headDiameterMm / 2) < 0.01, 'pin head radius');

// 6) 단계별 핀 위치 (클립 좌표)
assert.deepEqual(pinPositionInClip(C, 'aligned', 20), [0, 0, 20]);
assert.deepEqual(pinPositionInClip(C, 'entered'), [0, 0, 0]);
assert.deepEqual(pinPositionInClip(C, 'locked'), [C.travelMm, 0, 0]);

console.log('all clip checks passed');
