// R2.1-HW 증거 검사 (HW-02~05). 실행:
// node --no-warnings --import ./src/components/three/furniture-hardware/test-ts-resolve.mjs src/components/three/furniture-hardware/ovvo/ovvo.r21.test.mjs
import assert from 'node:assert/strict';
import * as THREE from 'three';
// index.ts는 TSX 컴포넌트를 함께 export하므로 Node 검사는 순수 .ts 모듈을 직접 import (같은 심볼)
import { phGeometry, rhGeometry, pcGeometry, rcGeometry } from './ovvoGeometry.ts';
import { vertices, maxRadialExcess, legacyEndcapCorner, checkRTongueEngagement, connectorInsideBothSlots, flipAboutZ } from './ovvoChecks.ts';
import { guideMounts, slotPointToGuide, guidePointToSlot, SLOT_TO_GUIDE_QUATERNION, SLOT_TO_GUIDE_MATRIX_ROWS, quatMul, FLIP_X_QUATERNION } from './guideAdapter.ts';

const close = (a, b, e = 1e-9) => Math.abs(a - b) < e;
const results = [];
const ok = (id, cond, msg) => { assert.ok(cond, `${id}: ${msg}`); results.push(`${id} pass — ${msg}`); };

// ── HW-02 기존 끝캡/슬롯 간섭: 교정 전 재현 → 교정 후 같은 기준 ──
const legacy = maxRadialExcess([legacyEndcapCorner()]);
ok('HW-02', close(legacy, 1.105170109479996, 1e-9), `legacy GuideScene endcap corner exceeds slot arc by ${legacy.toFixed(3)} mm (reproduced)`);
const ph = maxRadialExcess(vertices(phGeometry()));
const rh = maxRadialExcess(vertices(rhGeometry()));
ok('HW-02', ph <= 1e-6 && rh <= 1e-6, `corrected PH excess ${ph.toFixed(3)} mm, RH excess ${rh.toFixed(3)} mm (<= 0, inside capsule)`);

// ── HW-04 P/R 방향: 정상 방향 통과, 비대칭 부품을 반대로 두면 실패 ──
const rc = vertices(rcGeometry());
ok('HW-04', checkRTongueEngagement(1).ok, 'RC correct orientation: neck/lip/barb/window all pass');
const flipped = checkRTongueEngagement(-1);
ok('HW-04', !flipped.ok && flipped.reasons.includes('locked tongue not under lip region'), `RC reversed (Z π) is rejected: ${flipped.reasons.join(', ')}`);
ok('HW-04', !connectorInsideBothSlots('R', 'inserted', flipAboutZ(rc)), 'reversed RC also leaves the slot envelope at the inserted pose');
const pc = vertices(pcGeometry());
ok('HW-04', connectorInsideBothSlots('P', 'pressed', pc) && connectorInsideBothSlots('P', 'pressed', flipAboutZ(pc)), 'PC is symmetric: both orientations fit (P has no direction requirement)');

// ── HW-03 앵커·축·단위 (조립 화면 변환) ──
{
  const m = SLOT_TO_GUIDE_MATRIX_ROWS;
  const det = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  ok('HW-03', det === 1, 'slot→guide matrix is a proper rotation (det +1, right-handed)');
  const q = new THREE.Quaternion(...SLOT_TO_GUIDE_QUATERNION);
  for (const [i, axis] of [[0, [1, 0, 0]], [1, [0, 1, 0]], [2, [0, 0, 1]]]) {
    const v = new THREE.Vector3(...axis).applyQuaternion(q);
    const col = [m[0][i], m[1][i], m[2][i]];
    assert.ok(close(v.x, col[0], 1e-9) && close(v.y, col[1], 1e-9) && close(v.z, col[2], 1e-9), `quaternion matches matrix column ${i}`);
  }
  results.push('HW-03 pass — quaternion (−.5,−.5,−.5,.5) equals matrix: X_S→+Z, Y_S→+X, Z_S→+Y');
  const xs = new THREE.Vector3(1, 0, 0), ys = new THREE.Vector3(0, 1, 0), zs = new THREE.Vector3(0, 0, 1);
  ok('HW-03', new THREE.Vector3().crossVectors(xs, ys).equals(zs), 'S frame handedness X×Y=Z');
  ok('HW-03', slotPointToGuide([0, 0, 0], 37.5).join() === '0,0,37.5', 'S origin → guide (0, faceY, centerZ): mm, no extra scale');
  ok('HW-03', guidePointToSlot(slotPointToGuide([3, -2, -5], 12), 12).join() === '3,-2,-5', 'slot↔guide round trip');
  const r = guideMounts('R', 'inserted', 40);
  ok('HW-03', r.connector.position.join() === '0,0,55', 'R inserted connector sits +15 mm along guide +Z (slide axis −Z on lock)');
  const qEnd = new THREE.Quaternion(...quatMul(SLOT_TO_GUIDE_QUATERNION, FLIP_X_QUATERNION));
  const n = new THREE.Vector3(0, 0, 1).applyQuaternion(qEnd);
  ok('HW-03', close(n.y, -1, 1e-9), 'end-panel housing normal points down (−Y): B 아래 끝 홈이 A를 향함');
  const l = guideMounts('R', 'locked', 40);
  ok('HW-03', l.connector.position.join() === '0,0,40' && l.baseHousing.position.join() === '0,0,40', 'R locked: connector and base housing share the slot anchor');
}

// ── HW-05 수명: 팩토리는 매번 독립 geometry, 하나를 dispose해도 다른 것에 영향 없음, 반복 생성 안정 ──
{
  const a = phGeometry(), b = phGeometry();
  ok('HW-05', a !== b && a.attributes.position !== b.attributes.position, 'each factory call returns an independent geometry (no shared buffers)');
  const before = b.attributes.position.count; a.dispose();
  ok('HW-05', b.attributes.position.count === before && b.attributes.position.array.length === before * 3, 'disposing one geometry leaves the other intact');
  const counts = new Set();
  for (let i = 0; i < 40; i++) for (const f of [phGeometry, rhGeometry, pcGeometry, rcGeometry]) { const g = f(); counts.add(`${f.name}:${g.attributes.position.count}`); g.dispose(); }
  ok('HW-05', counts.size === 4, `40× create/dispose cycles stable (${[...counts].join(', ')})`);
  b.dispose();
}

console.log(results.join('\n'));
console.log('all R2.1-HW checks passed');
