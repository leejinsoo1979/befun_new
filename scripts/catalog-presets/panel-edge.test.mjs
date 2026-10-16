import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({ mockServices: false });
registerHooks({ load(url, context, next) {
  if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')}`, shortCircuit: true };
  return next(url, context);
} });
const { Vector3, Mesh, MeshBasicMaterial, Raycaster, DoubleSide } = await import('three');
const { createPanelBox, setPanelEdgeFinish, panelEdgeRadius } = await import('../../src/lib/three/panel-edge.ts');
const { hasEdgeBanding } = await import('../../src/lib/three/finish.ts');
const { createColorMaterials, getColorCategory, disposeMaterialSet } = await import('../../src/lib/three/materials.ts');
const { createBoredBoxCached, boredBoxKey } = await import('../../src/lib/three/blum/geometry.ts');
const { createDeskPanelGeometry } = await import('../../src/lib/furniture/desk-cable-geometry.ts');
const { catalogPreset } = await import('../../src/lib/three/catalog-presets.ts');
const { useMaterialStore } = await import('../../src/stores/useMaterialStore.ts');

function bounds(geometry, dimensions) {
  geometry.computeBoundingBox();
  const actual = geometry.boundingBox.getSize(new Vector3()).toArray();
  actual.forEach((v,i) => assert.ok(Math.abs(v-dimensions[i])<1e-4, `${actual} != ${dimensions}`));
}
function diagonalNormals(geometry) {
  const normals = geometry.getAttribute('normal'); let count=0;
  for(let i=0;i<normals.count;i++) if([normals.getX(i),normals.getY(i),normals.getZ(i)].filter(v=>Math.abs(v)>.01).length>1)count++;
  return count;
}
test('only exposed birch plywood is square; legacy Clay Brown is classified as Mix',()=>{
  assert.equal(hasEdgeBanding('C_White'),false);
  for(const color of ['N_Oak','N_Wood_W2','S_White','Sand+Green','C_Clay Brown','E_LightCleaf'])assert.equal(hasEdgeBanding(color),true);
  assert.equal(getColorCategory('C_Clay Brown'),'edgeMix');
  assert.equal(catalogPreset('bookcase-brown').colorCategory,'edgeMix');
  useMaterialStore.getState().setColor('C_Clay Brown','classic');
  assert.equal(useMaterialStore.getState().colorCategory,'edgeMix');
});
test('rounded edges preserve board dimensions, six material faces, and fixed 1mm radius during resize',()=>{
  for(const dimensions of [[227,2,32],[123,2,24],[450,2,40],[2,223,40],[38,28,1.8]]) {
    const geometry=createPanelBox(...dimensions,.1);
    bounds(geometry,dimensions);
    assert.equal(geometry.parameters.radius,.1);
    assert.ok(diagonalNormals(geometry)>0);
    assert.deepEqual(geometry.groups.map(g=>g.materialIndex),[0,1,2,3,4,5]);
    geometry.dispose();
  }
  const square=createPanelBox(227,2,32,0);
  assert.equal(diagonalNormals(square),0);square.dispose();
});
test('finish switches can never reuse the opposite geometry cache entry',()=>{
  const holes=[{center:[0,0,-9],direction:[0,0,1],diameter:35,depth:12}];
  assert.notEqual(boredBoxKey(40,30,1.8,holes,0),boredBoxKey(40,30,1.8,holes,.1));
  for(const radius of [0,.1,0,.1]) {
    const geometry=createBoredBoxCached(40,30,1.8,holes,radius);
    bounds(geometry,[40,30,1.8]);
    const material=new MeshBasicMaterial({side:DoubleSide});
    const mesh=new Mesh(geometry,material);mesh.updateMatrixWorld();
    const hit=new Raycaster(new Vector3(0,0,-2),new Vector3(0,0,1)).intersectObject(mesh)[0];
    assert.ok(hit&&Math.abs(hit.point.z-.3)<1e-4,'hinge cup blind floor remains 12mm deep');
    geometry.dispose();material.dispose();
  }
});
test('desk cable through-hole survives rounded geometry and colour changes',()=>{
  const panel={x:0,y:10,z:20,w:80,h:1.8,d:40,matType:'horizontalBase'};
  const opening={surface:'top',x:20,y:10,z:25,radius:3};
  const geometry=createDeskPanelGeometry(panel,[],[opening],.1);
  bounds(geometry,[80,1.8,40]);assert.ok(diagonalNormals(geometry)>0);
  const material=new MeshBasicMaterial({side:DoubleSide});const mesh=new Mesh(geometry,material);mesh.updateMatrixWorld();
  assert.equal(new Raycaster(new Vector3(20,5,5),new Vector3(0,-1,0)).intersectObject(mesh).length,0);
  geometry.dispose();material.dispose();
  const materials=createColorMaterials('#fff','#eee');
  for(const color of ['C_White','C_Clay Brown','N_Oak','S_White','Sand+Green']){
    setPanelEdgeFinish(materials,color);assert.equal(panelEdgeRadius(materials),color==='C_White'?0:.1);
  }
  disposeMaterialSet(materials);
});
test('moving Clay Brown to Mix retains the same source pricing after resizing',async()=>{
  const { shelfQuote }=await import('../../src/lib/commerce/shelf-quote.ts');
  const p=catalogPreset('bookcase-brown');
  const input={catalogPreset:'bookcase-brown',width:228,height:221,depth:40,thickness:2,density:p.density,
    rowHeights:p.rows,numRows:p.rows.length,hasBackPanel:true,hardwareLayers:[],hardwareRowStyles:{},color:p.color,baseType:'standard'};
  const before=shelfQuote('pattern',input,'classic');
  const after=shelfQuote('pattern',input,'edgeMix');
  assert.equal(after.finalPrice,before.finalPrice);
  assert.equal(after.version,before.version);
});
