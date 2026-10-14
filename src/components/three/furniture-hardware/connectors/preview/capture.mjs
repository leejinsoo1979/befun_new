// 단품 캡처 생성 (설명용 치수). 실행: node --no-warnings --import ./src/components/three/furniture-hardware/test-ts-resolve.mjs \
//   src/components/three/furniture-hardware/connectors/preview/capture.mjs <outDir> <tmpDir>
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { clipBodyGeometry, clipCavityGeometry, clipPinGeometry } from '../clipGeometry.ts';
import { pinPositionInClip, clipBodyExtent } from '../clipContract.ts';
import { ILLUSTRATIVE_CLIP as C, ILLUSTRATIVE_PIN as P } from '../illustrativeDimensions.ts';

const [outDir, tmpDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true }); mkdirSync(tmpDir, { recursive: true });
const port = process.env.CAPTURE_PORT ?? '8765'; // tmpDir를 정적 서버로 띄운 상태에서 실행
copyFileSync(resolve('node_modules/three/build/three.module.js'), resolve(tmpDir, 'three.module.js'));
copyFileSync(resolve('node_modules/three/build/three.core.js'), resolve(tmpDir, 'three.core.js'));
// 정점 배열로 직렬화(ExtrudeGeometry.toJSON은 파라미터 형식이라 BufferGeometryLoader로 복원 불가)
const raw = (g) => { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return { p: Array.from(n.attributes.position.array, (v) => +v.toFixed(4)) }; };
const geos = { body: raw(clipBodyGeometry(C)), cavity: raw(clipCavityGeometry(C)), pin: raw(clipPinGeometry(P)) };
const ext = clipBodyExtent(C);
const phases = { aligned: pinPositionInClip(C, 'aligned', 10), entered: pinPositionInClip(C, 'entered'), locked: pinPositionInClip(C, 'locked') };

// view: [name, camera dir (from target), up, clip?, phase|null, color]
const views = [
  ['front-orange', [0, 0, 1], [0, 1, 0], false, null, 'orange'],
  ['front-black', [0, 0, 1], [0, 1, 0], false, null, 'black'],
  ['side', [0, -1, 0], [0, 0, 1], false, null, 'orange'],
  ['section-y0', [0, -1, 0.0001], [0, 0, 1], true, 'locked', 'orange'],
  ['iso-aligned', [0.9, -1.2, 1.3], [0, 0, 1], true, 'aligned', 'black'],
  ['iso-entered', [0.9, -1.2, 1.3], [0, 0, 1], true, 'entered', 'black'],
  ['iso-locked', [0.9, -1.2, 1.3], [0, 0, 1], true, 'locked', 'black'],
];
const colors = { orange: '#e2601e', black: '#1d1d1f' };
for (const [name, dir, up, clip, phase, color] of views) {
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff;font:14px sans-serif">
<div style="position:absolute;left:10px;top:8px;z-index:2;color:#333">${name} · 설명용 치수(미측정, 제조 불가) · mm · 클립 길이 ${C.lengthMm} / 폭 ${C.widthMm} / 깊이 ${C.depthMm} / 립 ${C.lipThicknessMm} / 이동 ${C.travelMm} · 핀은 캡처용 밝은 톤${phase ? ' · 단계 ' + phase : ''}</div>
<script type="importmap">{"imports":{"three":"/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';
const W=900,H=560; const r=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); r.setSize(W,H); r.localClippingEnabled=true; document.body.appendChild(r.domElement);
const s=new THREE.Scene(); s.background=new THREE.Color('#ffffff');
s.add(new THREE.HemisphereLight('#ffffff','#999999',2.2)); const dl=new THREE.DirectionalLight('#ffffff',2); dl.position.set(30,-40,60); s.add(dl);
const g=${JSON.stringify(geos)}; const L={parse:(o)=>{const b=new THREE.BufferGeometry();b.setAttribute('position',new THREE.Float32BufferAttribute(o.p,3));b.computeVertexNormals();return b;}};
const planes=${clip}?[new THREE.Plane(new THREE.Vector3(0,1,0),0)]:[];
const mat=(c,m=0,rr=.5)=>new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:rr,side:THREE.DoubleSide,clippingPlanes:planes});
s.add(new THREE.Mesh(L.parse(g.body),mat('${colors[color]}')));
s.add(new THREE.Mesh(L.parse(g.cavity),mat('#0b0b0c',0,.9)));
// 판재 단면(접합면) 표시: 클립이 박힌 판의 단면 윤곽 (설명용 18mm 판)
if('${name}'.startsWith('front')){const edge=new THREE.Mesh(new THREE.BoxGeometry(${ext.endX - ext.startX + 24},18,0.2),new THREE.MeshBasicMaterial({color:'#d9c6a3',transparent:true,opacity:.35,clippingPlanes:planes})); edge.position.set(${(ext.startX + ext.endX) / 2},0,-0.6); s.add(edge);}
${phase ? `const pin=new THREE.Mesh(L.parse(g.pin),mat('${color === 'black' ? '#6a6d73' : '#f08a4b'}',.2,.35)); pin.rotation.x=Math.PI; pin.position.set(...${JSON.stringify(phase ? phases[phase] : [0, 0, 0])}); s.add(pin);` : ''}
s.add(new THREE.AxesHelper(8));
const box=new THREE.Box3().setFromObject(s); const c=box.getCenter(new THREE.Vector3()); const sz=box.getSize(new THREE.Vector3()).length();
const cam=new THREE.OrthographicCamera(-sz*.6*W/H,sz*.6*W/H,sz*.6,-sz*.6,-500,500); cam.up.set(...${JSON.stringify(up)}); cam.position.copy(c).add(new THREE.Vector3(...${JSON.stringify(dir)}).normalize().multiplyScalar(100)); cam.lookAt(c);
r.render(s,cam); document.title='done';
</script></body></html>`;
  const f = resolve(tmpDir, `${name}.html`);
  writeFileSync(f, html);
  execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist',
    '--window-size=900,560', '--virtual-time-budget=4000', `--user-data-dir=${tmpDir}/prof`, `--screenshot=${resolve(outDir, `clip-${name}.png`)}`, `http://127.0.0.1:${port}/${name}.html`], { stdio: 'ignore' });
  console.log('captured', name);
}
