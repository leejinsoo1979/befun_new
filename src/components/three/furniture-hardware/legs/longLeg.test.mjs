// R3-HW 장다리 검사 (원본 GLB 직접 파싱). 실행:
// node --no-warnings --import ./src/components/three/furniture-hardware/test-ts-resolve.mjs src/components/three/furniture-hardware/legs/longLeg.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LONG_LEG_ASSET as A, LONG_LEG_GEOMETRY_MM as G, LONG_LEG_PARTS, LONG_LEG_UNKNOWN, LONG_LEG_RIGID_GROUP, longLegSceneScale, longLegHeight } from './longLegContract.ts';
import { createLongLegInstance, releaseLongLegInstance } from './longLegInstance.ts';
import { OBSERVED_HARDWARE } from '../specs/observedHardware.ts';

const out = []; const ok = (id, c, m) => { assert.ok(c, `${id}: ${m}`); out.push(`${id} pass — ${m}`); };
const close = (a, b, e = 0.01) => Math.abs(a - b) <= e;
const file = readFileSync('public/models/furniture/long-leg.glb');
ok('ASSET', createHash('sha256').update(file).digest('hex') === A.sha256 && file.length === A.bytes, `GLB unchanged (sha256 ${A.sha256.slice(0, 12)}…, ${A.bytes} B)`);

const gltf = await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset, file.byteOffset + file.length), '');
const meshes = []; gltf.scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
const node = gltf.scene.getObjectByName(A.nodeName);

// ── 구성: 노드 1, 메시 1, 연결 성분 1 → rigid ──
ok('R3-HW-03', meshes.length === 1 && node && node.isMesh && node.children.length === 0 && gltf.scene.children.length === 1, 'one node / one mesh, no children: shaft+plate cannot be separated by node');
const pos = node.geometry.attributes.position; const index = node.geometry.index;
{
  const key = (i) => `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
  const weld = new Map(); const id = []; for (let i = 0; i < pos.count; i++) { const k = key(i); if (!weld.has(k)) weld.set(k, weld.size); id.push(weld.get(k)); }
  const par = [...Array(weld.size).keys()]; const f = (x) => (par[x] === x ? x : (par[x] = f(par[x])));
  for (let t = 0; t < index.count; t += 3) { const a = f(id[index.getX(t)]); par[f(id[index.getX(t + 1)])] = a; par[f(id[index.getX(t + 2)])] = a; }
  const roots = new Set(id.map(f));
  ok('R3-HW-03', roots.size === 1, 'welded mesh has 1 connected component: moving group = leg_shaft + mounting_plate (rigid)');
}
ok('R3-HW-03', !LONG_LEG_RIGID_GROUP.separableNodes && LONG_LEG_PARTS.filter((p) => p.role === 'fixed').every((p) => !p.inAsset), 'fixed screws ×3 + central pin are NOT in the GLB (contract inAsset=false)');
ok('R3-HW-03', Object.entries(LONG_LEG_UNKNOWN).every(([k, v]) => (k === 'manufacturingReady' ? v === false : v === null)), 'screw/pin/keyhole/slide dimensions stay null, manufacturingReady=false');

// ── 노드 TRS 보존 ──
ok('R3-HW-01', node.quaternion.toArray().every((v, i) => close(v, A.nodeRotation[i], 1e-6)) && [node.scale.x, node.scale.y, node.scale.z].every((v) => close(v, A.nodeScale, 1e-12)), 'node rotation Y135° and uniform scale 0.0010322 preserved');

// ── 몸통 곧음: 메시 y∈[0,98] 정점은 반경 8 원통, 단면 중심 (0,0) ──
{
  let maxOff = 0; let rmin = 1e9, rmax = 0; const bins = new Map();
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y > 98 - 1e-3) continue; const x = pos.getX(i), z = pos.getZ(i); const r = Math.hypot(x, z);
    if (r > 7.9) { rmin = Math.min(rmin, r); rmax = Math.max(rmax, r); } const b = bins.get(Math.round(y)) ?? [0, 0, 0]; b[0] += x; b[1] += z; b[2]++; bins.set(Math.round(y), b); }
  for (const [, b] of bins) maxOff = Math.max(maxOff, Math.hypot(b[0] / b[2], b[1] / b[2]));
  ok('R3-HW-01', rmax - rmin < 0.01 && close(rmax, 8, 0.01), `shaft outer radius constant ${rmin.toFixed(3)}..${rmax.toFixed(3)} (mesh) = Ø${(2 * G.shaftRadius).toFixed(2)} mm`);
  ok('R3-HW-01', maxOff < 0.3, `shaft section centroids stay on the axis (max offset ${maxOff.toFixed(3)} mesh units) → straight, not slanted`);
  let plateMinY = 1e9; for (let i = 0; i < pos.count; i++) if (Math.hypot(pos.getX(i), pos.getZ(i)) > 8.5) plateMinY = Math.min(plateMinY, pos.getY(i));
  ok('R3-HW-01', plateMinY >= 98 - 1e-3, `everything wider than the shaft starts at mesh y ≥ ${plateMinY.toFixed(2)} (plate/folded edges only)`);
}

// ── 관찰 bounds 유지 (observedHardware) ──
gltf.scene.updateMatrixWorld(true);
const box = new THREE.Box3().setFromObject(gltf.scene, true); // precise: 회전된 정점 기준
const obs = OBSERVED_HARDWARE.long_leg.bounds;
ok('R3-HW-01', ['x', 'y', 'z'].every((k, i) => close(box.min[k] * 1000, obs.min[i], 0.02) && close(box.max[k] * 1000, obs.max[i], 0.02)), `world bounds (mm) equal observedHardware.long_leg ${JSON.stringify(obs.min)}..${JSON.stringify(obs.max)}`);
{
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(node.quaternion);
  ok('R3-HW-01', close(dir.x, -Math.SQRT1_2, 1e-6) && close(dir.z, Math.SQRT1_2, 1e-6), 'plate extends toward (−√½, 0, +√½) after node rotation');
}

// ── 단위: m → cm/mm 변환 1회 ──
for (const unit of ['cm', 'mm']) {
  const parent = new THREE.Group(); parent.scale.setScalar(longLegSceneScale(unit));
  const inst = createLongLegInstance(gltf.scene); parent.add(inst); parent.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(parent, true); const h = b.max.y - b.min.y;
  ok('R3-HW-02', close(h, longLegHeight(unit), 1e-4) && close(b.min.y, 0, 1e-6), `${unit} scene: rendered height ${h.toFixed(4)} = original ${G.totalHeight.toFixed(2)} mm (scale ×${longLegSceneScale(unit)} once, ground y=0)`);
  // 이중 적용이면 100배 차이
  ok('R3-HW-02', !close(h, longLegHeight(unit) * longLegSceneScale(unit), 1), `${unit}: no double conversion`);
}

// ── 수명: 반복 mount/unmount가 공유 geometry/material을 dispose하지 않음 ──
{
  const shared = node.geometry; const injected = new THREE.MeshStandardMaterial(); let geoDisposed = 0, matDisposed = 0;
  shared.addEventListener('dispose', () => geoDisposed++); injected.addEventListener('dispose', () => matDisposed++);
  const parent = new THREE.Group();
  for (let i = 0; i < 200; i++) {
    const inst = createLongLegInstance(gltf.scene, injected); parent.add(inst);
    let m; inst.traverse((o) => { if (o.isMesh) m = o; });
    assert.ok(m.geometry === shared && m.material === injected, 'instance shares loader geometry and injected material');
    releaseLongLegInstance(inst);
  }
  ok('R3-HW-04', geoDisposed === 0 && matDisposed === 0 && parent.children.length === 0 && shared.attributes.position.count === pos.count, '200 mount/unmount cycles: shared geometry & material never disposed, no leaked children');
  const orig = node.material; createLongLegInstance(gltf.scene, injected);
  ok('R3-HW-04', node.material === orig, 'source scene material untouched (clone only)');
}

console.log(out.join('\n')); console.log('all R3-HW long-leg checks passed');
