import type * as THREE from 'three';
import { OVVO_V1230_OBSERVED, SLOT_CAPSULE, insideSlotEnvelope, jointToPanelA, panelAPose } from './ovvoContract';
import { OVVO_ILLUSTRATIVE } from './ovvoGeometry';

/**
 * 재사용 가능한 검사 (QA·조립 담당 공용). 모두 홈 외곽과 설명용 치수의 자기 일관성 검사이며
 * 공급사 CAD 형상 일치 검사가 아니다.
 */

export type V3 = [number, number, number];

export function vertices(g: THREE.BufferGeometry): V3[] {
  const p = g.attributes.position;
  return Array.from({ length: p.count }, (_, i) => [p.getX(i), p.getY(i), p.getZ(i)] as V3);
}

/** 홈 외곽 밖으로 나간 최대 반경 초과량(mm). ≤ 0 이면 침범 없음 */
export function maxRadialExcess(points: V3[]): number {
  let worst = -Infinity;
  for (const [x, y] of points) {
    const cx = Math.max(-SLOT_CAPSULE.centerHalfSpanMm, Math.min(SLOT_CAPSULE.centerHalfSpanMm, x));
    worst = Math.max(worst, Math.hypot(x - cx, y) - SLOT_CAPSULE.radiusMm);
  }
  return worst;
}

/**
 * 감사 003 재현: 기존 GuideScene 하우징 끝캡(박스) 모서리를 같은 홈 원호와 비교.
 * 값은 GuideScene.tsx 상수(끝캡 중심 13.7, 크기 8.6 × 11.6 × 1)를 옮긴 것 — 장면 축(z=장축, x=폭)을 S(x=장축, y=폭)로 바꿔 계산.
 */
export function legacyEndcapCorner(): V3 { return [13.7 + 0.5, 8.6 / 2, -0.5]; }

/**
 * R 맞물림 판정 — 혀 단면 정의(OVVO_ILLUSTRATIVE.tongue, tongueXMm) 기준.
 * 정점 기반 판정은 립 깊이 구간에 정점이 없으면 빈 집합 통과가 되므로 쓰지 않는다.
 * orientation: +1 = 계약 방향(혀가 −x), −1 = 장축 반대로 놓은 RC.
 */
export function checkRTongueEngagement(orientation: 1 | -1 = 1): { ok: boolean; reasons: string[] } {
  const d = OVVO_ILLUSTRATIVE; const rh = d.rh; const reasons: string[] = [];
  const lipDepth = rh.lipZ[1] - rh.lipZ[0];
  const [a, b] = d.tongueXMm;
  const x0 = orientation === 1 ? a : -b, x1 = orientation === 1 ? b : -a;
  const neckRows = d.tongue.filter((r) => r.d0 < lipDepth);
  if (neckRows.length === 0) reasons.push('no tongue section at lip depth');
  if (!neckRows.every((r) => r.hw < rh.lipOpeningHalfMm)) reasons.push('neck wider than lip opening');
  if (!(x0 >= rh.lipRegionXMm[0] - 1e-6 && x1 <= rh.lipRegionXMm[1] + 1e-6)) reasons.push('locked tongue not under lip region');
  const barbs = d.tongue.filter((r) => r.hw > rh.lipOpeningHalfMm);
  if (!(barbs.length > 0 && barbs.every((r) => r.d0 >= lipDepth))) reasons.push('barb not retained below lip');
  const t = OVVO_V1230_OBSERVED.releaseTravelMm;
  const maxHw = Math.max(...d.tongue.map((r) => r.hw));
  if (!(x0 + t >= rh.windowXMm[0] - 1e-6 && x1 + t <= rh.windowXMm[1] + 1e-6 && maxHw <= rh.windowHalfMm)) reasons.push('inserted tongue does not fit the window');
  return { ok: reasons.length === 0, reasons };
}

/** 커넥터 정점(J, 판 A와 함께 이동한 위치)이 단계별로 양쪽 판 홈 외곽 안에 있는지 */
export function connectorInsideBothSlots(model: 'P' | 'R', phase: 'pressed' | 'inserted' | 'locked', verts: V3[]): boolean {
  const pose = panelAPose(model, phase);
  return verts.every((v0) => {
    const v: V3 = [v0[0] + pose.position[0], v0[1] + pose.position[1], v0[2] + pose.position[2]];
    if (v[2] < -1e-6 && !insideSlotEnvelope(v)) return false;
    const a = jointToPanelA(v, pose);
    return !(a[2] < -1e-6 && !insideSlotEnvelope(a));
  });
}

/** 정점 변환: S의 Z축 π (장축·폭 방향 뒤집기) — 비대칭 부품을 반대로 놓는 사례 */
export function flipAboutZ(v: V3[]): V3[] { return v.map(([x, y, z]) => [-x, -y, z]); }
