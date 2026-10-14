// R3-HW-01/02 캡처: 원본 GLB(노드 TRS 그대로) vs 표시 어댑터(cm 장면 ×100 1회). 헤드리스 Chrome.
// tmpDir를 127.0.0.1:${CAPTURE_PORT:-8767}로 정적 서빙한 뒤 실행:
// node src/components/three/furniture-hardware/legs/preview/capture.mjs <outDir> <tmpDir>
import { writeFileSync, mkdirSync, cpSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const [outDir, tmpDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true }); mkdirSync(tmpDir, { recursive: true });
const port = process.env.CAPTURE_PORT ?? '8767';
cpSync(resolve('node_modules/three/build'), resolve(tmpDir, 'three/build'), { recursive: true });
cpSync(resolve('node_modules/three/examples/jsm'), resolve(tmpDir, 'three/jsm'), { recursive: true });
copyFileSync(resolve('public/models/furniture/long-leg.glb'), resolve(tmpDir, 'long-leg.glb'));

const page = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#fff;font:13px sans-serif;color:#222}
.row{display:flex;gap:6px;padding:6px}.cap{font-weight:600;margin:2px 0 4px}.note{font-size:12px;line-height:1.5}</style></head><body>
<div style="padding:8px 8px 0;font-weight:700">${title}</div>
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/jsm/"}}</script>
<script type="module">
import * as THREE from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const gltf = await new GLTFLoader().loadAsync('/long-leg.glb');
const metal = new THREE.MeshStandardMaterial({ color:'#b9bcbf', metalness:.6, roughness:.35 });
function legInstance(){ const o=gltf.scene.clone(true); o.traverse(c=>{ if(c.isMesh) c.material=metal; }); return o; }
function view(parent, W, H, build, dir, up=[0,1,0], fit=1){
  const box=document.createElement('div'); parent.appendChild(box);
  const r=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); r.setPixelRatio(1); r.localClippingEnabled=true; r.setSize(W,H); box.appendChild(r.domElement);
  const s=new THREE.Scene(); s.background=new THREE.Color('#f6f6f4'); s.add(new THREE.HemisphereLight('#fff','#777',2.2)); const d=new THREE.DirectionalLight('#fff',2); d.position.set(3,5,4); s.add(d); const d2=new THREE.DirectionalLight('#fff',1.2); d2.position.set(-2,-4,-3); s.add(d2);
  const info=build(s); s.updateMatrixWorld(true); const bb=info.box??new THREE.Box3().setFromObject(info.fitTo??s,true); const c=bb.getCenter(new THREE.Vector3()); const sz=bb.getSize(new THREE.Vector3()).length()*fit;
  const cam=new THREE.OrthographicCamera(-sz*.55*W/H,sz*.55*W/H,sz*.55,-sz*.55,-1e4,1e4); cam.up.set(...up); cam.position.copy(c).add(new THREE.Vector3(...dir).normalize().multiplyScalar(sz*3)); cam.lookAt(c); r.render(s,cam);
  if(info.label){ const n=document.createElement('div'); n.className='note'; n.innerHTML=info.label; box.appendChild(n); }
}
const axisLine=(h,color='#d22')=>{ const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-h*.05,0),new THREE.Vector3(0,h*1.08,0)]); return new THREE.Line(g,new THREE.LineBasicMaterial({color})); };

${body}
document.title='done';
</script></body></html>`;

const pages = {
  'r3-hw01-original-vs-adapter': page('R3-HW-01 · 원본 long-leg.glb vs 표시 어댑터 — 빨간선 = 몸통 축(곧음), 장착판 회전 Y135°·크기 원본 유지', `
const row=document.createElement('div'); row.className='row'; document.body.appendChild(row);
const sizeOf=(o)=>{o.updateMatrixWorld(true);return new THREE.Box3().setFromObject(o,true);};
const fmt=(b,k)=>b.min.toArray().map(v=>(v*k).toFixed(2)).join(', ')+' → '+b.max.toArray().map(v=>(v*k).toFixed(2)).join(', ');
view(row,330,420,s=>{const o=legInstance();s.add(o);s.add(axisLine(.1115));const b=sizeOf(o);return{fitTo:o,label:'<b>원본 전체</b> (scene m, 노드 TRS 그대로)<br>bounds mm: '+fmt(b,1000)};},[1,.55,1]);
view(row,330,420,s=>{const o=legInstance();s.add(o);s.add(axisLine(.1115));return{fitTo:o,label:'<b>측면</b> (장착판 방향과 직교 시선) — 몸통 수직'};},[1,0,1]);
view(row,330,420,s=>{const o=legInstance();s.add(o);s.add(axisLine(.1115));return{fitTo:o,label:'<b>측면</b> (장착판 방향 시선) — 판이 −x,+z로 뻗음'};},[-1,0,1]);
view(row,330,420,s=>{const g=new THREE.Group();g.scale.setScalar(100);g.add(legInstance());s.add(g);s.add(axisLine(11.15));const b=sizeOf(g);return{fitTo:g,label:'<b>어댑터 cm 장면</b> (부모 ×100 1회)<br>bounds cm: '+fmt(b,1)};},[1,.55,1]);
`),
  'r3-hw01-plate-closeup': page('R3-HW-01 · 장착판 확대 — 위(장착면)/아래/비스듬히. 둥근 모서리 사각판, 몸통은 한 모서리. 나사·핀·키홀 형상은 원본 자산에 없음(막힌 윗면)', `
const row=document.createElement('div'); row.className='row'; document.body.appendChild(row);
const clip=(o)=>{o.traverse(c=>{if(c.isMesh){c.material=c.material.clone();c.material.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,1,0),-.095)];c.material.side=THREE.DoubleSide;}});return o;};
const mk=(s)=>{const o=clip(legInstance());s.add(o);return o;};
for(const [dir,up,lab] of [[[0,1,0],[1,0,-1],'<b>위에서</b> (장착면, 법선 +Y)'],[[0,-1,0],[1,0,-1],'<b>아래에서</b> (y 95mm 위만 표시 — 판 아랫면. 구멍·나사 자리 없음)'],[[1,-.35,-1],[0,1,0],'<b>비스듬히 아래</b> (윗판 3.61mm, 접힌 테두리 101.16→107.86mm)']]){
  view(row,440,400,s=>{const o=mk(s);const box=new THREE.Box3(new THREE.Vector3(-.045,.095,-.045),new THREE.Vector3(.045,.112,.045));return{box,label:lab};},dir,up,1);
}

`),
  'r3-hw02-height-cm': page('R3-HW-02 · mm↔cm 변환 1회 — 원본 높이 111.48mm vs cm 장면 렌더 높이', `
const row=document.createElement('div'); row.className='row'; document.body.appendChild(row);
const H=(o)=>{o.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(o,true);return b;};
view(row,640,460,s=>{
  const g=new THREE.Group();g.scale.setScalar(100);g.add(legInstance());s.add(g);
  const b=H(g); const h=b.max.y-b.min.y;
  const ruler=new THREE.Mesh(new THREE.BoxGeometry(.15,h,.15),new THREE.MeshBasicMaterial({color:'#2f6fd6'}));ruler.position.set(6,h/2,-6);s.add(ruler);
  const base11=new THREE.Mesh(new THREE.BoxGeometry(.15,11,.15),new THREE.MeshBasicMaterial({color:'#e08a1e'}));base11.position.set(7,5.5,-7);s.add(base11);
  const floor=new THREE.Mesh(new THREE.BoxGeometry(30,.05,30),new THREE.MeshBasicMaterial({color:'#ddd'}));floor.position.y=-.03;s.add(floor);
  return{fitTo:g,label:'<b>cm 장면</b>: 렌더 높이 <b>'+h.toFixed(4)+' cm</b> = 원본 111.48 mm / 100 · 접지 y='+b.min.y.toFixed(4)+'<br>파랑 = 렌더 높이, 주황 = 리더 baseHeight(legs) 11 cm (차이 0.148 cm는 밑판 겹침 — 늘이지 않음)<br>이중 변환이면 1114.8 cm, 미적용이면 0.111 cm'};
},[1,.4,1],[0,1,0],1.6);
`),
};
for (const [name, html] of Object.entries(pages)) {
  writeFileSync(resolve(tmpDir, `${name}.html`), html);
  execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist',
    `--window-size=${name === 'r3-hw01-original-vs-adapter' ? '1360,560' : name === 'r3-hw02-height-cm' ? '700,600' : '1360,520'}`, '--virtual-time-budget=6000', `--user-data-dir=${tmpDir}/prof`,
    `--screenshot=${resolve(outDir, `${name}.png`)}`, `http://127.0.0.1:${port}/${name}.html`], { stdio: 'ignore' });
  console.log('captured', name);
}
