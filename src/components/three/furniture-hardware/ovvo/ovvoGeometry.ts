import * as THREE from 'three';
import { SLOT_CAPSULE } from './ovvoContract';

/**
 * OVVO V-1230 부품 형상 (설명용 치수) — 단위 mm, 각 부품은 자기 기준 좌표에서 생성.
 *
 * 형상 근거(도면 판독):
 *  PH  평면이 U자인 포크 — 두 레일이 한쪽(+x) 끝에서 둥근 다리로 연결, -x 끝은 열림. 단면은 위 립 → 얇은 벽 → 바깥 바브 → 아래 V.
 *  PC  위아래 대칭 화살촉: 몸통 + 걸림 바브 + 끝 좁아짐, 양끝 둥금.
 *  RC  L자 비대칭: 위쪽 절반은 PC 반쪽(PH에 압입), 아래 혀는 -x 쪽으로 치우쳐 짧게(RH에 삽입 후 슬라이드).
 *  RH  바닥 있는 홈통: 입구 립이 -x 구간에만 있어 좁은 개구(혀 목만 통과), +x 구간은 넓은 창(혀 삽입).
 * 단면을 "깊이별 판(slab) 적층"으로 계단 근사한다. 각 판의 평면 외곽은 홈 캡슐 원호 안에 들어가도록 둥근 끝으로 만든다
 * (OVVO-AUDIT-003의 직사각 끝캡 침범 교정).
 */

const SEG = 20;

/** 중심 x0..x1, 반경 r인 장방형(stadium) — 반시계 */
export function stadium(x0: number, x1: number, r: number): THREE.Vector2[] {
  const p: THREE.Vector2[] = [];
  for (let i = 0; i <= SEG; i++) { const a = -Math.PI / 2 + (Math.PI * i) / SEG; p.push(new THREE.Vector2(x1 + r * Math.cos(a), r * Math.sin(a))); }
  for (let i = 0; i <= SEG; i++) { const a = Math.PI / 2 + (Math.PI * i) / SEG; p.push(new THREE.Vector2(x0 + r * Math.cos(a), r * Math.sin(a))); }
  return p;
}

/** U자 포크 평면: 바깥 반경 ro의 장방형(중심 ±c)에서, -x 끝부터 x = c - bridge까지 폭 2·ri 채널을 뺀 외곽 */
function uFork(c: number, ro: number, ri: number, bridge: number): THREE.Vector2[] {
  const p: THREE.Vector2[] = [new THREE.Vector2(-c, -ro)];
  p.push(new THREE.Vector2(c, -ro));
  for (let i = 1; i < SEG; i++) { const a = -Math.PI / 2 + (Math.PI * i) / SEG; p.push(new THREE.Vector2(c + ro * Math.cos(a), ro * Math.sin(a))); }
  p.push(new THREE.Vector2(c, ro), new THREE.Vector2(-c, ro), new THREE.Vector2(-c, ri),
    new THREE.Vector2(c - bridge, ri), new THREE.Vector2(c - bridge, -ri), new THREE.Vector2(-c, -ri));
  return p;
}

interface Slab { z0: number; z1: number; outer: THREE.Vector2[]; hole?: THREE.Vector2[] }

function slabsGeometry(slabs: Slab[]): THREE.BufferGeometry {
  const parts = slabs.map((s) => {
    const shape = new THREE.Shape(s.outer);
    if (s.hole) shape.holes.push(new THREE.Path(s.hole));
    const g = new THREE.ExtrudeGeometry(shape, { depth: s.z1 - s.z0, bevelEnabled: false, curveSegments: SEG });
    g.translate(0, 0, s.z0);
    return g.index ? g.toNonIndexed() : g;
  });
  const count = parts.reduce((n, g) => n + g.attributes.position.count, 0);
  const pos = new Float32Array(count * 3); const nor = new Float32Array(count * 3);
  let o = 0;
  for (const g of parts) { pos.set(g.attributes.position.array as Float32Array, o * 3); nor.set(g.attributes.normal.array as Float32Array, o * 3); o += g.attributes.position.count; g.dispose(); }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}

const C = SLOT_CAPSULE.centerHalfSpanMm; // 10.3 — 하우징 끝 원호 중심을 홈과 일치

/**
 * 설명용 단면 치수 (status: illustrative). 홈 외곽 30×9.4×12.5만 도면값.
 * 깊이 z: 홈 좌표 S 기준(0 = 판 표면, 음수 = 판 안).
 */
export const OVVO_ILLUSTRATIVE = {
  status: 'illustrative' as const,
  ph: [
    { z0: -1.0, z1: 0, ro: 4.5, ri: 2.6 }, // 입구 립
    { z0: -6.5, z1: -1.0, ro: 4.0, ri: 2.9 }, // 얇은 벽
    { z0: -9.0, z1: -6.5, ro: 4.6, ri: 2.0 }, // 바깥 바브(홈 언더컷 걸림, 위치 미확정)
    { z0: -11.0, z1: -9.0, ro: 3.2, ri: 0.9 }, // 아래 V
  ],
  phBridgeMm: 1.5,
  /** 커넥터 화살촉 (|z|: 접합면으로부터 거리, hw: 반폭) */
  arrow: [
    { d0: 0, d1: 5.0, hw: 2.5 }, // 몸통 (PH 립 개구 2.6 통과)
    { d0: 5.0, d1: 6.5, hw: 2.8 }, // 바브 (립 아래 걸림)
    { d0: 6.5, d1: 9.0, hw: 1.8 },
    { d0: 9.0, d1: 10.5, hw: 0.9 }, // 끝
  ],
  connectorCenterHalfSpanMm: 5.8, // PC/RC 위쪽: 둥근 끝 중심 ±5.8 → 끝 x = ±8.6 (PH 다리 안쪽 8.8 이내)
  /** RC 혀 (B 판 쪽, |z|, hw) — 립 개구 2.1보다 좁은 목 + 립 아래 바브 */
  tongue: [
    { d0: 0, d1: 4.5, hw: 1.8 },
    { d0: 4.5, d1: 6.0, hw: 2.2 },
    { d0: 6.0, d1: 9.0, hw: 1.6 },
    { d0: 9.0, d1: 9.4, hw: 0.8 },
  ],
  /** RC 혀 장축 범위 (RC 중심 기준) — 체결 시 RH 립 구간 아래, 삽입 시(+15) 창 구간 */
  tongueXMm: [-12.4, -3.4] as [number, number],
  rh: {
    lipZ: [-1.2, 0] as [number, number], ro: 4.5,
    lipRegionXMm: [-13.5, -2.0] as [number, number], lipOpeningHalfMm: 2.1, // 혀 목만 통과
    windowXMm: [-2.0, 12.0] as [number, number], windowHalfMm: 4.0, // 혀 바브까지 통과
    wallZ: [-9.5, -1.2] as [number, number], wallRo: 4.3, innerCentersXMm: [-11.4, 10.0] as [number, number], innerR: 2.8,
    floorZ: [-11.0, -9.5] as [number, number], floorRo: 3.0,
  },
};

/** PH — 판 B 또는 판 A의 홈 좌표 S에서 착좌 형상 */
export function phGeometry(d = OVVO_ILLUSTRATIVE): THREE.BufferGeometry {
  return slabsGeometry(d.ph.map((l) => ({ z0: l.z0, z1: l.z1, outer: uFork(C, l.ro, l.ri, d.phBridgeMm) })));
}

function arrowSlabs(rows: { d0: number; d1: number; hw: number }[], sign: 1 | -1, x0: number, x1: number): Slab[] {
  return rows.map((r) => ({
    z0: sign > 0 ? r.d0 : -r.d1, z1: sign > 0 ? r.d1 : -r.d0,
    outer: stadium(x0 + r.hw, x1 - r.hw, r.hw),
  }));
}

/** PC — J 기준. 위(+z, 판 A)·아래(-z, 판 B) 대칭 화살촉 */
export function pcGeometry(d = OVVO_ILLUSTRATIVE): THREE.BufferGeometry {
  const s = d.connectorCenterHalfSpanMm;
  const rows = d.arrow;
  const slab = (sign: 1 | -1) => rows.map((r) => ({ z0: sign > 0 ? r.d0 : -r.d1, z1: sign > 0 ? r.d1 : -r.d0, outer: stadium(-s, s, r.hw) }));
  return slabsGeometry([...slab(1), ...slab(-1)]);
}

/** RC — J 기준(판 A와 함께 이동). 위쪽 = PC 반쪽(전체 길이), 아래 = -x로 치우친 짧은 혀 → L자 비대칭 */
export function rcGeometry(d = OVVO_ILLUSTRATIVE): THREE.BufferGeometry {
  const s = d.connectorCenterHalfSpanMm;
  const upper = d.arrow.map((r) => ({ z0: r.d0, z1: r.d1, outer: stadium(-s, s, r.hw) }));
  const [tx0, tx1] = d.tongueXMm;
  const tongue = arrowSlabs(d.tongue, -1, tx0, tx1);
  return slabsGeometry([...upper, ...tongue]);
}

/** RH — 판 B의 홈 좌표 S. 립(좁은 개구 + 넓은 창) / 벽(내부 통로) / 바닥 */
export function rhGeometry(d = OVVO_ILLUSTRATIVE): THREE.BufferGeometry {
  const r = d.rh;
  const lx0 = r.lipRegionXMm[0]; const [wx0, wx1] = r.windowXMm; // 립 구간 끝(lipRegionXMm[1]) = 창 시작 wx0
  // 립 개구: -x 구간은 좁고(±2.1), +x 창은 넓다(±4.0) — 하나의 계단형 구멍
  const lipHole = [
    new THREE.Vector2(lx0, -r.lipOpeningHalfMm), new THREE.Vector2(wx0, -r.lipOpeningHalfMm),
    new THREE.Vector2(wx0, -r.windowHalfMm), new THREE.Vector2(wx1, -r.windowHalfMm),
    new THREE.Vector2(wx1, r.windowHalfMm), new THREE.Vector2(wx0, r.windowHalfMm),
    new THREE.Vector2(wx0, r.lipOpeningHalfMm), new THREE.Vector2(lx0, r.lipOpeningHalfMm),
  ];
  return slabsGeometry([
    { z0: r.lipZ[0], z1: r.lipZ[1], outer: stadium(-C, C, r.ro), hole: lipHole },
    { z0: r.wallZ[0], z1: r.wallZ[1], outer: stadium(-C, C, r.wallRo), hole: stadium(r.innerCentersXMm[0], r.innerCentersXMm[1], r.innerR) },
    { z0: r.floorZ[0], z1: r.floorZ[1], outer: stadium(-C, C, r.floorRo) },
  ]);
}

/** 홈 외곽(캡슐 × 깊이) 표시용 — 언더컷 내부 윤곽은 미확정이므로 외곽만 */
export function slotEnvelopeGeometry(): THREE.BufferGeometry {
  return slabsGeometry([{ z0: -SLOT_CAPSULE.depthMm, z1: 0, outer: stadium(-C, C, SLOT_CAPSULE.radiusMm) }]);
}
