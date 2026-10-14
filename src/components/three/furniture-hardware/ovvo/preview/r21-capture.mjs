// R2.1-HW 증거 캡처: HW-01(공식 PDF 분해도와 같은 방향 비교) · HW-02(기존 GuideScene 끝캡 vs 교정 PH/RH 같은 단면)
// tmpDir를 127.0.0.1:${CAPTURE_PORT:-8766}로 정적 서빙한 뒤 실행 (pdfDir: p-parts.png, r-parts.png 원본 잘라낸 그림):
// node --no-warnings --import ./src/components/three/furniture-hardware/test-ts-resolve.mjs src/components/three/furniture-hardware/ovvo/preview/r21-capture.mjs <outDir> <tmpDir> <pdfDir>
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { phGeometry, pcGeometry, rcGeometry, rhGeometry, slotEnvelopeGeometry } from '../ovvoGeometry.ts';
import { maxRadialExcess, legacyEndcapCorner, vertices } from '../ovvoChecks.ts';

const [outDir, tmpDir, pdfDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true }); mkdirSync(tmpDir, { recursive: true });
const port = process.env.CAPTURE_PORT ?? '8766';
for (const f of ['three.module.js', 'three.core.js']) copyFileSync(resolve('node_modules/three/build', f), resolve(tmpDir, f));
for (const f of ['p-parts.png', 'r-parts.png']) copyFileSync(resolve(pdfDir, f), resolve(tmpDir, f));
const raw = (g) => ({ p: Array.from(g.attributes.position.array, (v) => +v.toFixed(3)) });
const G = { ph: raw(phGeometry()), pc: raw(pcGeometry()), rc: raw(rcGeometry()), rh: raw(rhGeometry()), slot: raw(slotEnvelopeGeometry()) };
const legacyExcess = maxRadialExcess([legacyEndcapCorner()]).toFixed(3);
const phExcess = maxRadialExcess(vertices(phGeometry())).toFixed(3);
const rhExcess = maxRadialExcess(vertices(rhGeometry())).toFixed(3);

const head = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#fff;font:13px sans-serif;color:#222}
.row{display:flex;gap:8px;padding:8px}.cell{position:relative}.cap{font-weight:600;margin:4px 0}.note{font-size:12px;line-height:1.5;max-width:760px}
.ok{color:#1a7f37}.est{color:#b26a00}.unk{color:#b42318}</style></head><body>
<script type="importmap">{"imports":{"three":"/three.module.js"}}</script>`;
const lib = `import * as THREE from 'three';
const g=${JSON.stringify(G)};
const geo=(o)=>{const b=new THREE.BufferGeometry();b.setAttribute('position',new THREE.Float32BufferAttribute(o.p,3));b.computeVertexNormals();return b;};
function view(id,W,H,build,dir,up,planes=[]){const r=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(W,H);r.localClippingEnabled=true;document.getElementById(id).appendChild(r.domElement);
const s=new THREE.Scene();s.background=new THREE.Color('#fff');s.add(new THREE.HemisphereLight('#fff','#8a8a8a',2.4));const dl=new THREE.DirectionalLight('#fff',1.8);dl.position.set(20,-30,50);s.add(dl);
const M=(c,o=1)=>new THREE.MeshStandardMaterial({color:c,roughness:.55,side:THREE.DoubleSide,clippingPlanes:planes,transparent:o<1,opacity:o,depthWrite:o>=1});
const add=(o,m,pos=[0,0,0],rot=[0,0,0])=>{const x=new THREE.Mesh(o.isBufferGeometry?o:geo(o),m);x.position.set(...pos);x.rotation.set(...rot);s.add(x);return x;};
build(add,M,s);const box=new THREE.Box3().setFromObject(s);const c=box.getCenter(new THREE.Vector3());const sz=box.getSize(new THREE.Vector3()).length();
const cam=new THREE.OrthographicCamera(-sz*.52*W/H,sz*.52*W/H,sz*.52,-sz*.52,-500,500);cam.up.set(...up);cam.position.copy(c).add(new THREE.Vector3(...dir).normalize().multiplyScalar(100));cam.lookAt(c);r.render(s,cam);}
window.view=view;window.THREE=THREE;window.geo=geo;window.g=g;`;

// HW-01: PDF 분해도 방향 = 장축(X_S) 화면 좌우, 위에서 아래로 B쪽 PH(뒤집힘) → 커넥터 → A쪽 하우징, 약간 위·앞에서 내려다봄
const explodeDir = [0.35, -1, 0.55], up = [0, 0, 1];
const hw01 = (model) => `${head}
<div class="row"><div class="cell"><div class="cap">공식 PDF V-1230${model} 분해도 (원본 잘라냄)</div><img src="/${model.toLowerCase()}-parts.png" style="height:560px"></div>
<div class="cell"><div class="cap">우리 모델 · 같은 방향 분해 배치 (위: PH 뒤집힘 / 가운데: ${model}C / 아래: ${model}H)</div><div id="v" ></div>
<div class="note"><span class="ok">■ 확정(도면값)</span> 홈 30 × 9.4 × 깊이 12.5 ±0.5 · 커터 20.5–20.7 · ${model === 'R' ? '해제 이동 15 · ' : ''}판 ≥ 15 &nbsp; 
<span class="est">■ 추정(설명용 OVVO_ILLUSTRATIVE)</span> 단면 층 높이, ${model === 'R' ? '혀·립·창 치수, L자 단차' : '포크 다리 폭, 화살표 돌기'} &nbsp;
<span class="unk">■ 미확정</span> 언더컷 내부 윤곽, 재질 두께, 공급사 CAD 형상</div></div></div>
<script type="module">${lib}
view('v',760,560,(add,M)=>{
 add(g.slot,M('#9aa0a6',.15));
 add(g.${model === 'P' ? 'ph' : 'rh'},M('${model === 'P' ? '#5b6168' : '#7a675e'}'));
 add(g.${model.toLowerCase()}c,M('#9ec43a'),[0,0,24]);
 add(g.ph,M('#5b6168'),[0,0,52],[Math.PI,0,0]);
},${JSON.stringify(explodeDir)},${JSON.stringify(up)});
</script></body></html>`;

// HW-02: 같은 단면(홈 장축 끝 원호 부근 수평 단면 z_S = −0.5, 위에서 내려다봄)에서 기존 끝캡 박스 vs 교정 하우징
const hw02 = `${head}
<div class="row">
<div class="cell"><div class="cap">교정 전 · 기존 GuideScene Housing (끝캡 박스 8.6 × 11.6 × 1 @ 장축 ±13.7)</div><div id="a"></div>
<div class="note unk">끝캡 모서리 (14.2, 4.3) → 홈 끝 원호(r 4.7, 중심 ±10.3) 밖으로 <b>${legacyExcess} mm</b> 침범 (감사 003 재현)</div></div>
<div class="cell"><div class="cap">교정 후 · PH / RH (같은 단면, 같은 카메라)</div><div id="b"></div>
<div class="note ok">PH 최대 초과 ${phExcess} mm · RH 최대 초과 ${rhExcess} mm (≤ 0 = 홈 외곽 안)</div>
<div class="note unk">언더컷 내부 윤곽은 미확정 — 외곽 침범 여부만 판정</div></div></div>
<script type="module">${lib}
const cut=[new THREE.Plane(new THREE.Vector3(0,0,-1),-0.5)]; // z_S ≤ −0.5 만 남김 (판 면 아래 0.5 mm 단면)
const legacy=(add,M)=>{ // GuideScene 상수를 S 축으로 옮김: 장면 z→X_S, 장면 x→Y_S, 장면 y→Z_S
 const B=(sx,sy,sz,px,py,pz,c)=>add(new THREE.BoxGeometry(sx,sy,sz),M(c),[px,py,pz]);
 for(const s of [-1,1]){B(27,1.3,11.4,0,s*3.7,-5.7,'#c1c3bd');B(28,1.1,1.2,0,s*4.1,-.6,'#b8bab4');}
 B(27,8.6,1.1,0,0,-11.8,'#b8bab4');for(const e of [-1,1])B(1,8.6,11.6,e*13.7,0,-5.8,'#d0605a');};
const slotLine=(add,M)=>add(g.slot,M('#2f6fd6',.22));
view('a',620,420,(add,M)=>{slotLine(add,M);legacy(add,M);},[0,0,1],[0,1,0],cut);
view('b',620,420,(add,M)=>{slotLine(add,M);add(g.ph,M('#5b6168'));add(g.slot,M('#2f6fd6',.22),[0,12,0]);add(g.rh,M('#7a675e'),[0,12,0]);},[0,0,1],[0,1,0],cut);
</script></body></html>`;

const pages = { 'hw01-P-pdf-vs-model': hw01('P'), 'hw01-R-pdf-vs-model': hw01('R'), 'hw02-endcap-before-after': hw02 };
for (const [name, html] of Object.entries(pages)) {
  writeFileSync(resolve(tmpDir, `${name}.html`), html);
  execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist',
    `--window-size=${name.startsWith('hw01') ? '1300,680' : '1290,540'}`, '--virtual-time-budget=4000', `--user-data-dir=${tmpDir}/prof`,
    `--screenshot=${resolve(outDir, `${name}.png`)}`, `http://127.0.0.1:${port}/${name}.html`], { stdio: 'ignore' });
  console.log('captured', name);
}
