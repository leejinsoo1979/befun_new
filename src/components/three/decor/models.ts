import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createElectronicMaterials, createSpeaker, createSmallLamp } from './electronics.ts';
import { createHouseBird } from './bird.ts';
import { createSurfaceTextures } from './surfaces.ts';
import type { DecorPlacement } from './layout';

const COLORS=['#e4dfd2','#283c44','#c28c76','#a2ada0','#ded3b8','#60564f','#d3b7b5','#eee9de'];
const TITLES=['THE ART OF LIVING','FORM & SPACE','ARCHITECTURE','BOTANICAL STUDIES','OBJECTS / 08','STILL LIFE','COLOUR & LIGHT','MODERN INTERIORS'];

function bookAtlas() {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;
  const ctx=canvas.getContext('2d')!;
  for(let i=0;i<8;i++) {
    const x=i*128;ctx.fillStyle=COLORS[i];ctx.fillRect(x,0,128,1024);
    for(let j=0;j<1800;j++) {
      ctx.fillStyle=j%2?'rgba(255,255,255,.055)':'rgba(0,0,0,.025)';
      ctx.fillRect(x+(j*47%128),j*71%1024,1,2);
    }
    ctx.strokeStyle=i===1?'#b9c6bf':'#9d9180';ctx.lineWidth=2;
    ctx.strokeRect(x+14,20,100,984);
    ctx.fillStyle=i===1?'#e6e1d3':'#494840';
    ctx.save();ctx.translate(x+65,460);ctx.rotate(-Math.PI/2);
    ctx.font='500 35px Georgia';ctx.textAlign='center';ctx.fillText(TITLES[i],0,0,660);
    ctx.font='18px Georgia';ctx.fillText('B E F U N   E D I T I O N S',0,29,500);ctx.restore();
    ctx.fillStyle=i===1?'#e6e1d3':'#494840';ctx.font='24px Georgia';ctx.textAlign='center';
    ctx.fillText(`0${i+1}`,x+64,912);ctx.fillRect(x+43,941,42,3);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  return texture;
}
function grainTexture(pages=false) {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle=pages?'#eee9da':'#e0d8ca';ctx.fillRect(0,0,128,128);
  for(let i=0;i<128;i++) {
    ctx.fillStyle=pages?`rgba(112,96,70,${i%3===0?.16:.04})`:'rgba(70,60,42,.085)';ctx.fillRect(0,i,128,1);
    if(!pages) ctx.fillRect(i,0,1,128);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  return texture;
}

/** Shared texture/material library; resizing does not repaint the book atlas. */
export function createDecorAssets() {
  const atlas=bookAtlas(),paper=grainTexture(true),linen=grainTexture();
  const surface=createSurfaceTextures();
  const palette=COLORS.map((color,i)=>new THREE.MeshStandardMaterial({color,roughness:.64+(i%3)*.1,
    roughnessMap:surface.roughness,bumpMap:surface.weave,bumpScale:.012,envMapIntensity:.72}));
  const spine=new THREE.MeshStandardMaterial({map:atlas,roughness:.76,roughnessMap:surface.roughness,bumpMap:surface.weave,bumpScale:.007,envMapIntensity:.72});
  const pages=new THREE.MeshStandardMaterial({map:paper,roughness:.98,bumpMap:surface.paper,bumpScale:.018,envMapIntensity:.68});
  const cloth=new THREE.MeshStandardMaterial({map:linen,color:'#a98279',roughness:.96,roughnessMap:surface.roughness,bumpMap:surface.weave,bumpScale:.065,envMapIntensity:.65});
  const ceramic=new THREE.MeshPhysicalMaterial({color:'#bfb69e',roughness:.3,roughnessMap:surface.roughness,
    bumpMap:surface.pores,bumpScale:.016,clearcoat:.32,clearcoatRoughness:.24,envMapIntensity:.82});
  const charcoal=new THREE.MeshPhysicalMaterial({color:'#303a38',roughness:.52,roughnessMap:surface.roughness,
    bumpMap:surface.pores,bumpScale:.024,clearcoat:.08,clearcoatRoughness:.45,envMapIntensity:.7});
  const soil=new THREE.MeshStandardMaterial({color:'#352c21',roughness:1,bumpMap:surface.pores,bumpScale:.15,envMapIntensity:.45});
  const stem=new THREE.MeshStandardMaterial({color:'#596b42',roughness:.8,envMapIntensity:.65});
  const leaves=['#739867','#96b480'].map(color=>new THREE.MeshPhysicalMaterial({color,map:surface.leaf,
    roughness:.48,roughnessMap:surface.roughness,bumpMap:surface.leaf,bumpScale:.018,
    clearcoat:.18,clearcoatRoughness:.4,side:THREE.DoubleSide,envMapIntensity:.65}));
  const birdLacquer=new THREE.MeshPhysicalMaterial({color:'#171918',roughness:.3,clearcoat:.3,clearcoatRoughness:.27,envMapIntensity:.85});
  const birdSteel=new THREE.MeshStandardMaterial({color:'#252827',metalness:.75,roughness:.28});
  const birdEye=new THREE.MeshPhysicalMaterial({color:'#090a09',roughness:.12,clearcoat:1});
  const electronics=createElectronicMaterials();
  const materials=[...Object.values(electronics),birdLacquer,birdSteel,birdEye,...palette,spine,pages,cloth,ceramic,charcoal,soil,stem,...leaves];
  return {electronics,palette,spine,pages,cloth,ceramic,charcoal,soil,stem,leaves,birdLacquer,birdSteel,birdEye,
    dispose(){surface.dispose();materials.forEach(m=>m.dispose());[atlas,paper,linen].forEach(t=>t.dispose());}};
}
/** Original procedural assets, batched by material so a large shelf stays inexpensive. */
export function buildDecor(placements:DecorPlacement[], shared?:ReturnType<typeof createDecorAssets>) {
  const assets=shared??createDecorAssets();
  const {palette,spine,pages,cloth,ceramic,charcoal,soil,stem,leaves}=assets;
  const source=new THREE.Group();
  function mesh(parent:THREE.Group,g:THREE.BufferGeometry,m:THREE.Material,pos:[number,number,number]=[0,0,0]) {
    const object=new THREE.Mesh(g,m);object.position.set(...pos);parent.add(object);return object;
  }
  function box(parent:THREE.Group,w:number,h:number,d:number,m:THREE.Material,pos:[number,number,number],radius=.06) {
    return mesh(parent,new RoundedBoxGeometry(w,h,d,2,Math.min(radius,w/4,h/4,d/4)),m,pos);
  }
  function book(parent:THREE.Group,w:number,h:number,d:number,variant:number) {
    const v=variant%8,cover=palette[v];
    box(parent,w-.2,h-.35,d-.35,pages,[0,h/2,0]);
    for(const x of [-w/2+.055,w/2-.055]) box(parent,.11,h,d,cover,[x,h/2,0],.025);
    box(parent,w,h,.16,cover,[0,h/2,d/2-.06]);
    const face=new THREE.PlaneGeometry(w*.96,h*.99);const uv=face.getAttribute('uv');
    for(let i=0;i<uv.count;i++) uv.setX(i,(uv.getX(i)+v)/8);
    mesh(parent,face,spine,[0,h/2,d/2+.025]);
  }
  function vessel(parent:THREE.Group,h:number,r:number,m:THREE.Material,pot=false,shape=0) {
    const profile=pot?[[.01,0],[.68,0],[.73,.04],[.96,.92],[1,.96],[1,1],[.9,1],[.87,.92],[.64,.12],[.01,.12]]:
      [[.01,0],[.49,0],[.61,.03],[.88,.16],[1,.32],[.96,.48],[.68,.65],[.35,.77],[.31,.95],[.36,.99],[.36,1],[.25,1],[.23,.95],[.27,.79],[.6,.64],[.88,.46],[.9,.32],[.75,.18],[.01,.08]];
    const contour=!pot && shape===1 ? [[.01,0],[.7,0],[.83,.06],[1,.32],[.98,.56],[.72,.8],[.65,.96],[.68,1],[.55,1],[.53,.95],[.61,.8],[.88,.56],[.9,.32],[.73,.12],[.01,.12]] : profile;
    const curve=new THREE.SplineCurve(contour.map(([x,y])=>new THREE.Vector2(x*r,y*h)));
    mesh(parent,new THREE.LatheGeometry(curve.getPoints(90).map(p=>new THREE.Vector2(Math.max(.01,p.x),Math.max(0,Math.min(h,p.y)))),48),m);
  }
  function plant(parent:THREE.Group) {
    vessel(parent,7,5.4,ceramic,true);
    mesh(parent,new THREE.CylinderGeometry(4.7,4.7,.3,32),soil,[0,6.35,0]);
    for(let n=0;n<11;n++) {
      const angle=n*2.399,top=11+(n%4)*3,reach=3+(n%3)*1.1;
      const start=new THREE.Vector3(0,6.4,0),base=new THREE.Vector3(Math.cos(angle)*1.1,top-2,Math.sin(angle)*1.1);
      const curve=new THREE.QuadraticBezierCurve3(start,new THREE.Vector3(-Math.sin(angle),top*.9,Math.cos(angle)),base);
      mesh(parent,new THREE.TubeGeometry(curve,8,.085,5,false),stem);
      const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
      for(let j=0;j<=12;j++) {
        const t=j/12,width=Math.pow(Math.sin(Math.PI*t),.8)*1.35;
        for(let k=0;k<3;k++) {
          const side=k-1,r=1.1+t*reach;
          positions.push(Math.cos(angle)*r-Math.sin(angle)*width*side,base.y+Math.sin(t*Math.PI)*2.2-t*.9-Math.abs(side)*.4,Math.sin(angle)*r+Math.cos(angle)*width*side);
          uvs.push(k/2,t);
          if(j<12&&k<2) {const a=j*3+k;indices.push(a,a+3,a+1,a+1,a+3,a+4);}
        }
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
      mesh(parent,geo,leaves[n%2]);
    }
  }
  for(const p of placements) {
    const group=new THREE.Group();group.position.set(...p.position);source.add(group);
    if(p.kind==='books') {
      // Parallel spines lean toward the supporting side; each lower corner rests on the shelf.
      const angle=(p.bookSide==='right'?-1:1)*(p.variant%3===0?0:.07);
      const cos=Math.cos(angle),sin=Math.sin(angle);
      let x=0;
      for(let i=0;i<p.count;i++) {
        const w=1.65+(i%3)*.45,h=p.size[1]-.3-(i*3%5)*.75,d=p.size[2]-.6-(i%3)*.5;
        const item=new THREE.Group();item.rotation.z=angle;
        item.position.set(x+w/2,Math.abs(sin)*w/2,(i%2)*.12);
        group.add(item);book(item,w,h,d,p.variant+i);x+=w/cos+.08;
      }
      group.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(group);
      const shift=p.bookSide==='right' ? p.position[0]+p.size[0]/2-bounds.max.x : p.position[0]-p.size[0]/2-bounds.min.x;
      for(const item of group.children) item.position.x+=shift;
    } else if(p.kind==='stack') {
      for(let i=0;i<3;i++) {
        const item=new THREE.Group();item.rotation.z=-Math.PI/2;item.rotation.y=(i-1)*.025;
        item.position.set(-(20-i*.8)/2,i*2.35+1.05,(i%2)*.3);group.add(item);book(item,2.1,20-i*.8,13.3-i*.3,p.variant+i);
      }
    } else if(p.kind==='bird') {
      if(p.variant===1) for(let i=0;i<2;i++) {
        const item=new THREE.Group();item.rotation.z=-Math.PI/2;
        item.position.set(-12+i*.4,i*2.4+1.2,0);group.add(item);book(item,2.4,24-i*.8,14-i*.4,i===0?7:1);
      }
      const bird=createHouseBird(assets.birdLacquer,assets.birdSteel,assets.birdEye);
      bird.position.y=p.variant===1?4.8:0;group.add(bird);
    } else if(p.kind==='speaker') {
      group.add(createSpeaker(p.size[1],assets.electronics));
    } else if(p.kind==='lamp') {
      group.add(createSmallLamp(assets.electronics));
    } else if(p.kind==='vase') {
      vessel(group,p.size[1],5.3,p.variant>4?ceramic:charcoal,false,p.variant%3);
    } else if(p.kind==='plant') plant(group);
    else {
      for(let i=0;i<2;i++) {
        const w=25-i*2,d=17-i,h=5.7;
        box(group,w,h,d,cloth,[0,i*6.5+h/2,0],.18);
        box(group,w+.4,.65,d+.4,cloth,[0,i*6.5+h+.2,0],.1);
        box(group,5,1.9,.08,palette[7],[0,i*6.5+3,d/2+.1],.04);
        box(group,3.5,.12,.04,palette[5],[0,i*6.5+3,d/2+.16],.02);
      }
    }
  }
  source.updateMatrixWorld(true);
  const buckets=new Map<THREE.Material,THREE.BufferGeometry[]>();
  source.traverse(o=>{
    if(!(o instanceof THREE.Mesh)) return;
    const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);
    // RoundedBox has a second UV set in some Three versions; normalize the batch contract.
    for(const attr of Object.keys(geo.attributes)) if(!['position','normal','uv'].includes(attr)) geo.deleteAttribute(attr);
    const list=buckets.get(o.material)??[];list.push(geo);buckets.set(o.material,list);o.geometry.dispose();
  });
  const root=new THREE.Group();root.name='Befun styled accessories';root.userData.displayDecor=true;
  for(const [material,parts] of buckets) {
    const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());
    if(!geometry) continue;
    const object=new THREE.Mesh(geometry,material);object.castShadow=true;object.receiveShadow=true;object.raycast=()=>{};root.add(object);
  }
  return {root,dispose(){root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});if(!shared)assets.dispose();}};
}
