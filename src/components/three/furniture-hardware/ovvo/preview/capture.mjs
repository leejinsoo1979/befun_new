// OVVO 단품 캡처 (설명용 단면). tmpDir를 127.0.0.1:${CAPTURE_PORT:-8766}로 정적 서빙한 뒤 실행:
// node --no-warnings --import ./src/components/three/furniture-hardware/test-ts-resolve.mjs src/components/three/furniture-hardware/ovvo/preview/capture.mjs <outDir> <tmpDir>
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { phGeometry, pcGeometry, rcGeometry, rhGeometry, slotEnvelopeGeometry } from '../ovvoGeometry.ts';
import { panelAPose } from '../ovvoContract.ts';

const [outDir, tmpDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true }); mkdirSync(tmpDir, { recursive: true });
const port = process.env.CAPTURE_PORT ?? '8766';
for (const f of ['three.module.js', 'three.core.js']) copyFileSync(resolve('node_modules/three/build', f), resolve(tmpDir, f));
const raw = (g) => ({ p: Array.from(g.attributes.position.array, (v) => +v.toFixed(3)) });
const G = { ph: raw(phGeometry()), pc: raw(pcGeometry()), rc: raw(rcGeometry()), rh: raw(rhGeometry()), slot: raw(slotEnvelopeGeometry()) };

// [name, model, phase, cameraDir, up, clipPlane(normal,const)|null]
const V = [
  ['P-front', 'P', 'pressed', [0, 0.0001, 1], [0, 1, 0], null],
  ['P-side', 'P', 'pressed', [0, -1, 0], [0, 0, 1], null],
  ['P-section-x0', 'P', 'pressed', [-1, 0, 0], [0, 0, 1], [[1, 0, 0], 0]],
  ['P-before-separated', 'P', 'separated', [0.9, -1.2, 0.8], [0, 0, 1], [[0, 1, 0], 0]],
  ['P-after-pressed', 'P', 'pressed', [0.9, -1.2, 0.8], [0, 0, 1], [[0, 1, 0], 0]],
  ['R-front', 'R', 'locked', [0, 0.0001, 1], [0, 1, 0], null],
  ['R-side', 'R', 'locked', [0, -1, 0], [0, 0, 1], null],
  ['R-section-x-8', 'R', 'locked', [-1, 0, 0], [0, 0, 1], [[1, 0, 0], 8]],
  ['R-before-inserted', 'R', 'inserted', [0.9, -1.2, 0.8], [0, 0, 1], [[0, 1, 0], 0]],
  ['R-after-locked', 'R', 'locked', [0.9, -1.2, 0.8], [0, 0, 1], [[0, 1, 0], 0]],
];
for (const [name, model, phase, dir, up, clip] of V) {
  const pose = panelAPose(model, phase, 15);
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff;font:14px sans-serif">
<div style="position:absolute;left:10px;top:8px;color:#333">OVVO V-1230${model} · ${name} · 단계 ${phase} · 설명용 단면(도면값: 홈 30×9.4×12.5, 해제 15) · 회색 반투명 = 홈 외곽(언더컷 내부 윤곽 미확정)</div>
<script type="importmap">{"imports":{"three":"/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';
const W=1000,H=620; const r=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); r.setSize(W,H); r.localClippingEnabled=true; document.body.appendChild(r.domElement);
const s=new THREE.Scene(); s.background=new THREE.Color('#fff');
s.add(new THREE.HemisphereLight('#fff','#8a8a8a',2.4)); const dl=new THREE.DirectionalLight('#fff',1.8); dl.position.set(20,-30,50); s.add(dl);
const g=${JSON.stringify(G)}; const geo=(o)=>{const b=new THREE.BufferGeometry();b.setAttribute('position',new THREE.Float32BufferAttribute(o.p,3));b.computeVertexNormals();return b;};
const planes=${clip ? `[new THREE.Plane(new THREE.Vector3(...${JSON.stringify(clip[0])}),${clip[1]})]` : '[]'};
const M=(c,o=1)=>new THREE.MeshStandardMaterial({color:c,roughness:.55,metalness:0,side:THREE.DoubleSide,clippingPlanes:planes,transparent:o<1,opacity:o,depthWrite:o>=1});
const add=(o,m,pos=[0,0,0],rot=[0,0,0])=>{const x=new THREE.Mesh(geo(o),m);x.position.set(...pos);x.rotation.set(...rot);s.add(x);return x;};
const P=${JSON.stringify(pose.position)}, R=${JSON.stringify(pose.rotation)};
add(g.slot,M('#9aa0a6',.18)); add(g.slot,M('#9aa0a6',.18),P,R); // 판 B / 판 A 홈 외곽
${model === 'P' ? "add(g.ph,M('#5b6168'));" : "add(g.rh,M('#7a675e'));"}
add(g.ph,M('#5b6168'),P,R);
${model === 'P' ? "add(g.pc,M('#9ec43a'),P);" : "add(g.rc,M('#9ec43a'),P);"}
s.add(new THREE.AxesHelper(6));
const box=new THREE.Box3().setFromObject(s); const c=box.getCenter(new THREE.Vector3()); const sz=box.getSize(new THREE.Vector3()).length();
const cam=new THREE.OrthographicCamera(-sz*.55*W/H,sz*.55*W/H,sz*.55,-sz*.55,-500,500); cam.up.set(...${JSON.stringify(up)}); cam.position.copy(c).add(new THREE.Vector3(...${JSON.stringify(dir)}).normalize().multiplyScalar(100)); cam.lookAt(c);
r.render(s,cam);
</script></body></html>`;
  writeFileSync(resolve(tmpDir, `${name}.html`), html);
  execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist',
    '--window-size=1000,620', '--virtual-time-budget=4000', `--user-data-dir=${tmpDir}/prof`, `--screenshot=${resolve(outDir, `ovvo-${name}.png`)}`, `http://127.0.0.1:${port}/${name}.html`], { stdio: 'ignore' });
  console.log('captured', name);
}
