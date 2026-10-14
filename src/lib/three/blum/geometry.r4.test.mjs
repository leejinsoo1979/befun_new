// R4-HW: CSG 면 그룹 재정렬·캐시·지연 교체 회귀 검사.
// node --no-warnings --import ./src/components/three/furniture-hardware/test-ts-resolve.mjs --test src/lib/three/blum/geometry.r4.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { createBlumDoorPlan } from './boring.ts';
import { createBoredBox, createBoredBoxCached, csgBoredBox, faceOfNormal, hasCachedBoredBox, regroupByFace } from './geometry.ts';

const panels = [-30, 30].map(x => ({ x, y: 16, z: 16, w: 1.8, h: 28, d: 32, matType: 'verticalBase' }));
const door = { x: 0, y: 16, z: 31.2, width: 57.6, height: 27.4, pivotOffsetX: 0, layerIndex: 0 };
const plan = createBlumDoorPlan(door, panels, 1.6);
const side = plan.mounts[0];

const tris = (g) => {
  const p = g.getAttribute('position'), idx = g.index, n = idx ? idx.count : p.count, out = [];
  for (let i = 0; i < n; i += 3) {
    const v = [0, 1, 2].map(k => { const j = idx ? idx.getX(i + k) : i + k; return [p.getX(j), p.getY(j), p.getZ(j)].map(x => x.toFixed(5)).join(','); });
    out.push(v.join('|'));
  }
  return out;
};
/** 기존(연속 구간) 방식으로 삼각형 → 면 번호 */
const legacyFaces = (g) => {
  const nrm = g.getAttribute('normal'), idx = g.index, n = idx ? idx.count : nrm.count, out = [];
  for (let i = 0; i < n; i += 3) { const j = idx ? idx.getX(i) : i; out.push(faceOfNormal(nrm.getX(j), nrm.getY(j), nrm.getZ(j))); }
  return out;
};
const contiguousGroups = (faces) => faces.reduce((c, f, i) => c + (i === 0 || f !== faces[i - 1] ? 1 : 0), 0);

for (const [name, w, h, d, holes] of [['door', door.width, door.height, 1.6, plan.holes], ['side panel', panels[1].w, panels[1].h, panels[1].d, side.holes]]) {
  test(`${name}: 재정렬은 형상·면 번호를 바꾸지 않고 그룹만 ≤6`, () => {
    const raw = csgBoredBox(w, h, d, holes);
    const rawTris = tris(raw), rawFaces = legacyFaces(raw);
    const before = contiguousGroups(rawFaces);
    const faceOfTri = new Map(rawTris.map((t, i) => [t, rawFaces[i]]));
    const g = regroupByFace(raw);
    assert.ok(g.groups.length <= 6, `groups ${g.groups.length}`);
    assert.ok(before > 6, `fixture should be fragmented before (${before})`);
    const after = tris(g);
    assert.deepEqual([...after].sort(), [...rawTris].sort(), 'same triangle multiset (geometry unchanged)');
    for (const grp of g.groups) for (let i = grp.start; i < grp.start + grp.count; i += 3) assert.equal(faceOfTri.get(after[i / 3]), grp.materialIndex, 'triangle keeps its face material');
    const covered = g.groups.reduce((s, x) => s + x.count, 0);
    assert.equal(covered, g.index.count, 'groups cover every triangle once');
    console.log(`  ${name}: groups ${before} → ${g.groups.length}, triangles ${after.length}`);
    g.dispose();
  });
}

test('구멍 깊이 회귀: 문 컵 바닥·옆판 고정공 깊이 유지', () => {
  const geo = createBoredBox(door.width, door.height, 1.6, plan.holes);
  const mat = new MeshBasicMaterial({ side: DoubleSide }), mesh = new Mesh(geo, mat); mesh.updateMatrixWorld();
  for (const h of plan.holes) {
    const hit = new Raycaster(new Vector3(h.center[0] / 10, h.center[1] / 10, -2), new Vector3(0, 0, 1)).intersectObject(mesh)[0];
    assert.ok(Math.abs(hit.point.z - 0.5) < 1e-5);
  }
  const s = createBoredBox(panels[1].w, panels[1].h, panels[1].d, side.holes), sm = new Mesh(s, mat); sm.updateMatrixWorld();
  const hh = side.holes[0];
  const hit = new Raycaster(new Vector3(-2, hh.center[1] / 10, hh.center[2] / 10), new Vector3(1, 0, 0)).intersectObject(sm)[0];
  assert.ok(Math.abs(hit.point.x - 0.25) < 1e-5);
  geo.dispose(); s.dispose(); mat.dispose();
});

test('캐시: 복제본 반환, 복제본 dispose가 캐시를 해치지 않음, 같은 형상', () => {
  const w = 40.3, h = 27.4;
  assert.equal(hasCachedBoredBox(w, h, 1.6, plan.holes), false);
  const a = createBoredBoxCached(w, h, 1.6, plan.holes);
  assert.equal(hasCachedBoredBox(w, h, 1.6, plan.holes), true);
  const b = createBoredBoxCached(w, h, 1.6, plan.holes);
  assert.notEqual(a, b); assert.notEqual(a.getAttribute('position'), b.getAttribute('position'));
  a.dispose();
  assert.deepEqual(tris(b).sort(), tris(createBoredBox(w, h, 1.6, plan.holes)).sort());
  assert.equal(b.groups.length <= 6, true);
  b.dispose();
  const plain = createBoredBoxCached(10, 10, 1, []);
  assert.ok(plain instanceof BoxGeometry);
  plain.dispose();
});

test('지연 교체: 빠른 연속 변경 후 마지막 치수의 구멍, 이전 작업 덮어쓰기 없음, unmount 시 해제', async () => {
  const dom = new JSDOM('<!doctype html><div id="r"></div>', { pretendToBeVisual: true });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { useBoredBoxGeometry } = await import('./useBoredBox.ts');
  const seen = []; const disposed = new Set();
  function Probe({ w }) {
    const g = useBoredBoxGeometry(w, door.height, 1.6, plan.holes, [1, 0, 0], 120);
    if (seen[seen.length - 1] !== g) { seen.push(g); g.addEventListener('dispose', () => disposed.add(g)); }
    return null;
  }
  const root = createRoot(document.getElementById('r'));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const widths = Array.from({ length: 12 }, (_, i) => 50 + i * 0.7);
  for (const w of widths) { await React.act(async () => root.render(React.createElement(Probe, { w }))); await sleep(15); }
  const last = widths[widths.length - 1];
  const beforeSettle = seen[seen.length - 1];
  assert.equal(beforeSettle.groups.length === 0 || beforeSettle.type === 'BoxGeometry', true, 'during drag: plain box (no CSG)');
  await React.act(async () => { await sleep(260); });
  const final = seen[seen.length - 1];
  final.computeBoundingBox();
  const size = final.boundingBox.getSize(new Vector3());
  assert.ok(Math.abs(size.x - last) < 1e-4 && Math.abs(final.boundingBox.min.x - (1 - last / 2)) < 1e-4, `final geometry is the LAST width ${last} with offset (got ${size.x})`);
  assert.ok(final.index && final.index.count > 36, 'final geometry has bores');
  const settledCount = seen.filter(g => g.index && g.index.count > 36 && g.type !== 'BoxGeometry').length;
  assert.equal(settledCount, 1, `only the last change was CSG-evaluated (${settledCount})`);
  // 캐시 히트: 이전 치수로 되돌리면 즉시 구멍 버전
  await React.act(async () => root.render(React.createElement(Probe, { w: last })));
  assert.ok(seen[seen.length - 1].index?.count > 36);
  await React.act(async () => root.unmount());
  const leaked = seen.filter(g => !disposed.has(g));
  assert.equal(leaked.length, 0, `all hook-owned geometries disposed (${leaked.length} leaked of ${seen.length})`);
  console.log(`  rapid: ${widths.length} changes → ${seen.length} geometries, 1 CSG, all disposed`);
});
