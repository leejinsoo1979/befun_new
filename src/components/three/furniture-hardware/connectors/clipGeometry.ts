import * as THREE from 'three';
import { clipBodyExtent, type TylkoClipDimensions, type TylkoClipPinDimensions } from './clipContract';

const ARC_SEGMENTS = 24;

/** 클립 바깥 윤곽: 양끝이 둥근 장방형(stadium), XY 평면(X=장축, Y=폭) */
function stadiumShape(d: TylkoClipDimensions): THREE.Shape {
  const { startX, endX } = clipBodyExtent(d);
  const r = d.widthMm / 2;
  const s = new THREE.Shape();
  s.moveTo(startX + r, -r);
  s.lineTo(endX - r, -r);
  s.absarc(endX - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(startX + r, r);
  s.absarc(startX + r, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
  return s;
}

/** 열쇠구멍 윤곽: x=0 둥근 입구(지름 entry) + x=travel까지 좁은 홈(폭 slot, 끝 둥금) */
export function keyholePoints(d: TylkoClipDimensions): THREE.Vector2[] {
  const re = d.entryDiameterMm / 2;
  const hs = d.slotWidthMm / 2;
  const a0 = Math.asin(hs / re); // 입구 원과 홈 변이 만나는 각
  const pts: THREE.Vector2[] = [];
  // 입구 원: +x 쪽 홈 입구를 제외하고 a0 → 2π-a0 반시계
  for (let i = 0; i <= ARC_SEGMENTS; i++) {
    const a = a0 + ((2 * Math.PI - 2 * a0) * i) / ARC_SEGMENTS;
    pts.push(new THREE.Vector2(re * Math.cos(a), re * Math.sin(a)));
  }
  // 홈 아래 변 → 끝 반원 → 위 변
  pts.push(new THREE.Vector2(d.travelMm, -hs));
  for (let i = 1; i < ARC_SEGMENTS / 2; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / (ARC_SEGMENTS / 2);
    pts.push(new THREE.Vector2(d.travelMm + hs * Math.cos(a), hs * Math.sin(a)));
  }
  pts.push(new THREE.Vector2(d.travelMm, hs));
  return pts;
}

/** 핀 머리가 지나가는 언더컷 통로: 입구 원(x=0)부터 체결 위치(x=travel)까지 폭 = 입구 지름인 장공 */
function undercutPoints(d: TylkoClipDimensions): THREE.Vector2[] {
  const r = d.entryDiameterMm / 2;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= ARC_SEGMENTS / 2; i++) {
    const a = Math.PI / 2 + (Math.PI * i) / (ARC_SEGMENTS / 2);
    pts.push(new THREE.Vector2(r * Math.cos(a), r * Math.sin(a)));
  }
  for (let i = 0; i <= ARC_SEGMENTS / 2; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / (ARC_SEGMENTS / 2);
    pts.push(new THREE.Vector2(d.travelMm + r * Math.cos(a), r * Math.sin(a)));
  }
  return pts;
}

/**
 * 클립 몸체 (설명용 단순화) — 접합면(z=0)부터 -depth까지 매입.
 *  - 립 z ∈ [-lip, 0]: 열쇠구멍(입구 + 좁은 홈) 관통 → 핀 목만 슬라이드
 *  - 아래 z ∈ [-depth, -lip]: 핀 머리 통로(언더컷, 폭 = 입구 지름)
 */
export function clipBodyGeometry(d: TylkoClipDimensions): THREE.BufferGeometry {
  const lip = new THREE.Shape(stadiumShape(d).getPoints(ARC_SEGMENTS));
  lip.holes.push(new THREE.Path(keyholePoints(d)));
  const lipGeo = new THREE.ExtrudeGeometry(lip, { depth: d.lipThicknessMm, bevelEnabled: false, curveSegments: ARC_SEGMENTS });
  lipGeo.translate(0, 0, -d.lipThicknessMm);
  const lower = new THREE.Shape(stadiumShape(d).getPoints(ARC_SEGMENTS));
  lower.holes.push(new THREE.Path(undercutPoints(d)));
  const lowerDepth = d.depthMm - d.lipThicknessMm;
  const lowerGeo = new THREE.ExtrudeGeometry(lower, { depth: lowerDepth, bevelEnabled: false, curveSegments: ARC_SEGMENTS });
  lowerGeo.translate(0, 0, -d.depthMm);
  const merged = mergeNonIndexed([lipGeo, lowerGeo]);
  lipGeo.dispose(); lowerGeo.dispose();
  return merged;
}

/** 외부 의존 없이 위치/법선만 합치기 (BufferGeometryUtils 대체) */
function mergeNonIndexed(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const count = parts.reduce((n, g) => n + g.attributes.position.count, 0);
  const pos = new Float32Array(count * 3); const nor = new Float32Array(count * 3);
  let o = 0;
  for (const g of parts) {
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    nor.set(g.attributes.normal.array as Float32Array, o * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}

/** 통로 바닥(어두운 내부) — 매입 깊이의 90% 위치 평면 */
export function clipCavityGeometry(d: TylkoClipDimensions): THREE.ShapeGeometry {
  const geo = new THREE.ShapeGeometry(new THREE.Shape(undercutPoints(d)));
  geo.translate(0, 0, -d.depthMm * 0.9);
  return geo;
}

/** 상대 핀 — 원점=판 면, +Z=핀 축. 목(원기둥) + 머리(원판, 윗모서리 모따기) */
export function clipPinGeometry(p: TylkoClipPinDimensions, radialSegments = 32): THREE.LatheGeometry {
  const rn = p.neckDiameterMm / 2;
  const rh = p.headDiameterMm / 2;
  const top = p.neckLengthMm + p.headHeightMm;
  const chamfer = Math.min(p.headHeightMm * 0.35, rh * 0.25);
  const prof = [
    new THREE.Vector2(0, 0), new THREE.Vector2(rn, 0), new THREE.Vector2(rn, p.neckLengthMm),
    new THREE.Vector2(rh, p.neckLengthMm), new THREE.Vector2(rh, top - chamfer),
    new THREE.Vector2(rh - chamfer, top), new THREE.Vector2(0, top),
  ];
  const geo = new THREE.LatheGeometry(prof, radialSegments);
  geo.rotateX(Math.PI / 2); // 회전축 +Y → +Z  ((x,y,z)→(x,-z,y))
  return geo;
}
