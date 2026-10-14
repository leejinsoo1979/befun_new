import test from 'node:test';
import assert from 'node:assert/strict';
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({mockServices:false});
const h=await import('../../src/lib/furniture/wardrobe-hardware.ts');
const close=(a,b,tolerance=0.0001)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
const size=g=>g.boundingBox.getSize(new Vector3());
const material=new MeshBasicMaterial();
function hit(g,origin,direction){const mesh=new Mesh(g,material);mesh.updateMatrixWorld();return new Raycaster(new Vector3(...origin),new Vector3(...direction)).intersectObject(mesh);}

test('grip keeps its measured anchor and rounded capsule end',()=>{
 const g=h.createWardrobeGripHandle();
 try{const s=size(g);close(s.x,1.2);close(s.y,25);close(s.z,2);close(g.boundingBox.min.z,0);
 assert.ok(hit(g,[0,12.4,4],[0,0,-1]).length>0);
 assert.equal(hit(g,[.5,12.4,4],[0,0,-1]).length,0,'rounded end must not become a bounding box');
 assert.ok(hit(g,[0,0,-1],[0,0,1]).length>0,'back cap winding faces outward');
 }finally{g.dispose();}
});

test('short handles retain folded rear clip and mirrored handedness',()=>{
 const l=h.createWardrobeShortHandle('left'),r=h.createWardrobeShortHandle('right');
 try{close(l.boundingBox.min.x,-2.49004);close(l.boundingBox.max.x,.15);close(r.boundingBox.min.x,-.15);close(r.boundingBox.max.x,2.49004);
 close(l.boundingBox.min.y,-11.150524);close(l.boundingBox.max.y,11.349189);close(l.boundingBox.max.z,2.2);
 const lp=l.getAttribute('position'),rp=r.getAttribute('position');assert.equal(lp.count,rp.count);
 for(let i=0;i<lp.count;i+=3)for(let j=0;j<3;j++){const k=i+2-j;close(lp.getX(i+j),-rp.getX(k));close(lp.getY(i+j),rp.getY(k));close(lp.getZ(i+j),rp.getZ(k));}
 assert.ok(hit(l,[-2,0,-4],[0,0,1]).length>0,'folded clip reaches behind the door');
 assert.equal(hit(l,[-2,0,1],[0,0,1]).length,0,'rear clip must not fill the grip opening');
 }finally{l.dispose();r.dispose();}
});

for(const length of [30,60,90])test(`front bar ${length} cm keeps capsule section`,()=>{
 const g=h.createWardrobeFrontBar(length);
 try{const s=size(g);close(s.x,length);close(s.y,4);close(s.z,2);
 assert.ok(hit(g,[-length,1.8,.5],[1,0,0]).length>0);
 assert.equal(hit(g,[-length,1.8,.8],[1,0,0]).length,0);
 }finally{g.dispose();}
});

for(const depth of [30,50,60])test(`cross bar ${depth} cm moves intact posts`,()=>{
 const g=h.createWardrobeCrossBar(depth);
 try{const s=size(g);close(s.x,1.6);close(s.y,8.5);close(s.z,depth+1.4);close(g.boundingBox.max.y,.015342);
 const post=(depth-.2)/2;
 assert.ok(hit(g,[0,2,post],[0,-1,0]).length>0);
 assert.ok(hit(g,[0,2,-post],[0,-1,0]).length>0);
 const middle=hit(g,[0,2,0],[0,-1,0]);assert.ok(middle.length>0);close(middle[0].point.y,-5.484658);
 }finally{g.dispose();}
});

test('light housing preserves its asymmetric section and the diffuser is three-faced',()=>{
 const g=h.createWardrobeLightProfile(65),d=h.createWardrobeLightDiffuser(65);
 try{close(size(g).x,65);close(g.boundingBox.min.y,-1.35183);close(g.boundingBox.max.y,.03294);close(g.boundingBox.min.z,-2.22103);close(g.boundingBox.max.z,2.48006);
 close(size(d).x,65 * 0.9993801359);assert.equal(d.getAttribute('position').count,18);
 }finally{g.dispose();d.dispose();}
});

test('parametric hardware rejects non-finite or non-positive lengths',()=>{
 for(const create of [h.createWardrobeFrontBar,h.createWardrobeCrossBar,h.createWardrobeLightProfile,h.createWardrobeLightDiffuser])
 for(const value of [NaN,Infinity,-1,0])assert.throws(()=>create(value),RangeError);
});
