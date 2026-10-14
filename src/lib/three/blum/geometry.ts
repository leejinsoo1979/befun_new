import { BoxGeometry, CylinderGeometry, MeshBasicMaterial, Vector3, type BufferGeometry } from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import type { Bore } from './boring';

const boredCache = new Map<string, BufferGeometry>();
const BORED_CACHE_LIMIT = 64;

/** 치수·구멍 캐시 키 (cm 치수 + 구멍 mm 값) */
export function boredBoxKey(w: number, h: number, d: number, holes: readonly Bore[]) {
  return `${w}|${h}|${d}|${holes.map(b => `${b.center}/${b.direction}/${b.diameter}/${b.depth}`).join(';')}`;
}
export function hasCachedBoredBox(w: number, h: number, d: number, holes: readonly Bore[]) {
  return !holes.length || boredCache.has(boredBoxKey(w,h,d,holes));
}
/** 같은 치수·구멍이면 CSG를 다시 하지 않는다(LRU 64). 캐시 원본은 내부 소유, 호출자는 항상 복제본을 받아 직접 dispose */
export function createBoredBoxCached(w: number, h: number, d: number, holes: readonly Bore[]) {
  if (!holes.length) return new BoxGeometry(w,h,d);
  const key = boredBoxKey(w,h,d,holes);
  let hit = boredCache.get(key);
  if (hit) { boredCache.delete(key); boredCache.set(key, hit); }
  else {
    hit = createBoredBox(w,h,d,holes);
    boredCache.set(key, hit);
    if (boredCache.size > BORED_CACHE_LIMIT) { const oldest = boredCache.keys().next().value!; boredCache.get(oldest)?.dispose(); boredCache.delete(oldest); }
  }
  return hit.clone();
}

/** BoxGeometry 면 번호: 0 +x, 1 −x, 2 +y, 3 −y, 4 +z, 5 −z (첫 정점 법선 기준) */
export function faceOfNormal(x: number, y: number, z: number) {
  return Math.abs(x)>Math.abs(y)&&Math.abs(x)>Math.abs(z) ? (x>0?0:1) : Math.abs(y)>Math.abs(z)?(y>0?2:3):(z>0?4:5);
}

/**
 * CSG 결과의 면 재질 그룹을 BoxGeometry처럼 최대 6개로 만든다.
 * 삼각형 면 판정은 기존(연속 구간 그룹)과 같고, 삼각형을 면별로 재정렬(index)만 한다 — 정점·형상 불변.
 * 연속 구간마다 그룹을 만들면 구멍 있는 판 하나가 수백 개 draw call이 된다.
 */
export function regroupByFace(geometry: BufferGeometry) {
  geometry.clearGroups();
  const normal = geometry.getAttribute('normal');
  const count = geometry.index?.count ?? normal.count;
  const buckets: number[][] = [[],[],[],[],[],[]];
  for (let i=0;i<count;i+=3) {
    const a=geometry.index?.getX(i) ?? i, b=geometry.index?.getX(i+1) ?? i+1, c=geometry.index?.getX(i+2) ?? i+2;
    buckets[faceOfNormal(normal.getX(a), normal.getY(a), normal.getZ(a))].push(a,b,c);
  }
  geometry.setIndex(buckets.flat());
  let start = 0;
  buckets.forEach((tris,face) => { if (tris.length) geometry.addGroup(start,tris.length,face); start += tris.length; });
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}

/** CSG만 수행(그룹 정리 전). 검사·비교용 */
export function csgBoredBox(w: number, h: number, d: number, holes: readonly Bore[]): BufferGeometry {
  if (!holes.length) return new BoxGeometry(w,h,d);
  const evaluator = new Evaluator();
  evaluator.useGroups = false;
  const material = new MeshBasicMaterial();
  let solid = new Brush(new BoxGeometry(w,h,d), material);
  solid.updateMatrixWorld();
  for (const hole of holes) {
    const axis = new Vector3(...hole.direction);
    // Cutter extends 0.1mm outside the face; the blind floor stays exact.
    const length = (hole.depth + .1) / 10;
    const cutter = new Brush(new CylinderGeometry(hole.diameter/20,hole.diameter/20,length,48), material);
    cutter.quaternion.setFromUnitVectors(new Vector3(0,1,0), axis);
    cutter.position.set(...hole.center).multiplyScalar(.1).addScaledVector(axis,(hole.depth-.1)/20);
    cutter.updateMatrixWorld();
    const next = evaluator.evaluate(solid,cutter,SUBTRACTION);
    solid.disposeCacheData(); solid.geometry.dispose();
    cutter.disposeCacheData(); cutter.geometry.dispose();
    solid = next;
    solid.updateMatrixWorld();
  }
  const geometry = solid.geometry;
  solid.disposeCacheData(); material.dispose();
  return geometry;
}

/** Real blind pockets, not decals. Input/output geometry dimensions are cm. Caller owns the result. */
export function createBoredBox(w: number, h: number, d: number, holes: readonly Bore[]) {
  if (!holes.length) return new BoxGeometry(w,h,d);
  return regroupByFace(csgBoredBox(w,h,d,holes));
}
