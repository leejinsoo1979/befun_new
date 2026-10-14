import test from 'node:test';
import assert from 'node:assert/strict';
import { Mesh, MeshBasicMaterial, Raycaster, Vector3, DoubleSide } from 'three';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({mockServices:false});
const { calculateDeskGeometry }=await import('../../src/lib/furniture/desk/index.ts');
const { createDeskPanelGeometry }=await import('../../src/lib/furniture/desk-cable-geometry.ts');
const { createBlumDoorPlan }=await import('../../src/lib/three/blum/boring.ts');
const volume=geometry=>{
 const p=geometry.getAttribute('position'),count=geometry.index?.count??p.count;
 let value=0;const a=new Vector3(),b=new Vector3(),c=new Vector3();
 for(let i=0;i<count;i+=3){a.fromBufferAttribute(p,geometry.index?.getX(i)??i);b.fromBufferAttribute(p,geometry.index?.getX(i+1)??i+1);c.fromBufferAttribute(p,geometry.index?.getX(i+2)??i+2);value+=a.dot(b.cross(c))/6;}
 return Math.abs(value);
};
const materialArray=()=>Array.from({length:6},()=>new MeshBasicMaterial({side:DoubleSide}));
const ray=(mesh,origin,direction)=>new Raycaster(new Vector3(...origin),new Vector3(...direction)).intersectObject(mesh);
function checkHole(mesh,p,h){
 const x=h.x-p.x,y=h.y-p.y,z=h.z-p.z;
 for(const offset of [0,h.radius*.8]){
  if(h.surface==='top'){
   assert.equal(ray(mesh,[x+offset,p.h/2+1,z],[0,-1,0]).length,0,'top hole must pass through both Y faces');
   assert.equal(ray(mesh,[x+offset,-p.h/2-1,z],[0,1,0]).length,0);
  }else{
   assert.equal(ray(mesh,[x+offset,y,p.d/2+1],[0,0,-1]).length,0,'back hole must pass through both Z faces');
   assert.equal(ray(mesh,[x+offset,y,-p.d/2-1],[0,0,1]).length,0);
  }
 }
 const beyond=h.radius+.1;
 const hits=h.surface==='top'?ray(mesh,[x+beyond,p.h/2+1,z],[0,-1,0]):ray(mesh,[x+beyond,y,p.d/2+1],[0,0,-1]);
 assert.ok(hits.length>=2,'board outside the cable hole must remain solid');
}
for(const family of ['type01','type02'])for(const side of ['left','right'])test(`${family} ${side}: cable bores remove volume and pass rays through actual top/back panels`,()=>{
 const result=calculateDeskGeometry({family,widthMm:side==='left'?1471:1785,depthMm:600,storageColumns:side==='left'?2:1,legroomPosition:side==='left'?1:0,hasBackPanel:true,cableManagement:side,channels:[{kind:'door',cableOpenings:true},{kind:'mix',cableOpenings:true}]});
 const groups=new Map();for(const h of result.cableOpenings){const group=groups.get(h.panelIndex)??[];group.push(h);groups.set(h.panelIndex,group);}
 assert.ok(result.cableOpenings.some(h=>h.surface==='top'));assert.ok(result.cableOpenings.some(h=>h.surface==='back'));
 for(const [index,openings] of groups){
  const p=result.panels[index],g=createDeskPanelGeometry(p,[],openings),m=materialArray(),mesh=new Mesh(g,m);mesh.updateMatrixWorld();
  try{
   openings.forEach(h=>checkHole(mesh,p,h));
   const exteriorChecks=[
    [[p.w/2+1,p.h/2-.05,p.d/2-.05],[-1,0,0],0],
    [[-p.w/2-1,p.h/2-.05,p.d/2-.05],[1,0,0],1],
    [[p.w/2-.05,p.h/2+1,p.d/2-.05],[0,-1,0],2],
    [[p.w/2-.05,-p.h/2-1,p.d/2-.05],[0,1,0],3],
    [[p.w/2-.05,p.h/2-.05,p.d/2+1],[0,0,-1],4],
    [[p.w/2-.05,p.h/2-.05,-p.d/2-1],[0,0,1],5],
   ];
   for(const [origin,direction,face]of exteriorChecks)
    assert.equal(ray(mesh,origin,direction)[0]?.face?.materialIndex,face,'BoxGeometry exterior material slot is preserved');
   const expected=p.w*p.h*p.d-openings.reduce((sum,h)=>sum+(96/2)*h.radius*h.radius*Math.sin(2*Math.PI/96)*(h.surface==='top'?p.h:p.d),0);
   assert.ok(Math.abs(volume(g)-expected)<.02,`${volume(g)} != ${expected}`);
   const positions=g.getAttribute('position');assert.equal(g.groups.reduce((sum,group)=>sum+group.count,0),g.index?.count??positions.count,'face groups cover all triangles');
   for(const group of g.groups)assert.ok(group.materialIndex>=0&&group.materialIndex<6);
   assert.ok(g.boundingBox&&g.boundingSphere);
  } finally {g.dispose();m.forEach(material=>material.dispose());}
 }
});

test('cable CSG retains existing blind hinge pockets and front skin',()=>{
 // Synthetic combined board verifies the operations compose without changing
 // the independent Blum bore contract; this is not a Desk manufacturing layout.
 const panel={x:12,y:30,z:9,w:57.6,h:27.4,d:1.6,matType:'backPanel'};
 const plan=createBlumDoorPlan({x:0,y:16,z:31.2,width:57.6,height:27.4,pivotOffsetX:0,layerIndex:0},[-30,30].map(x=>({x,y:16,z:16,w:1.8,h:28,d:32,matType:'verticalBase'})),1.6);
 assert.ok(plan.holes.length>0);
 const cable={panelIndex:0,columnIndex:0,storageIndex:0,surface:'back',x:panel.x,y:panel.y,z:panel.z,radius:3};
 const before=createDeskPanelGeometry(panel,plan.holes,[]),after=createDeskPanelGeometry(panel,plan.holes,[cable]),m=materialArray(),mesh=new Mesh(after,m);mesh.updateMatrixWorld();
 try {
  checkHole(mesh,panel,cable);
  const expectedRemoval=(96/2)*9*Math.sin(2*Math.PI/96)*panel.d;
  assert.ok(Math.abs(volume(before)-volume(after)-expectedRemoval)<.02);
  for(const h of plan.holes){
   const rear=ray(mesh,[h.center[0]/10,h.center[1]/10,-2],[0,0,1]);
   assert.ok(rear.length>0);assert.ok(Math.abs(rear[0].point.z-.5)<1e-5,'hinge blind floor must remain at 13mm');
   const front=ray(mesh,[h.center[0]/10,h.center[1]/10,2],[0,0,-1]);
   assert.ok(Math.abs(front[0].point.z-.8)<1e-5,'hinge front skin remains intact');
  }
 } finally {before.dispose();after.dispose();m.forEach(material=>material.dispose());}
});
