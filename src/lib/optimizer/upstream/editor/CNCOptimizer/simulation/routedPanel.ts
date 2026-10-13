import * as THREE from 'three';
import clip, { type MultiPolygon, type Ring } from 'polygon-clipping';
import { interpolate, type Point3, type ReplayStep } from './program';
import type { PanelHole } from './drilledPanel';

export interface MillSweep { step: Extract<ReplayStep,{kind:'mill'}>; diameter:number; progress:number }
const eps=1e-6;
const area=(ring:Ring)=>ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2;
// 접하는 두 공구 원호의 sin/cos 잔차로 극소 틈이 생기면 polygon-clipping이 닫힌 윤곽을 잃는다.
// 제조값/이동경로는 그대로 두고, 윤곽 연산의 기존 eps(0.000001mm)에 좌표를 맞춘다.
const contourCoordinate=(value:number)=>Math.round(value/eps)*eps;

/** 회전 엔드밀의 실제 이동 원통을 XY 캡슐로 만든다. 가공 전 윤곽을 미리 빼지 않는다. */
export function millFootprint(from:Point3,to:Point3,diameter:number):Ring {
  const angle=Math.atan2(to[1]-from[1],to[0]-from[0]),r=diameter/2;
  const ring:Ring=[];
  for(const [p,start] of [[to,angle-Math.PI/2],[from,angle+Math.PI/2]] as const) {
    for(let i=0;i<=32;i++) {const a=start+Math.PI*i/32;ring.push([contourCoordinate(p[0]+Math.cos(a)*r),contourCoordinate(p[1]+Math.sin(a)*r)]);}
  }
  ring.push(ring[0]); return ring;
}

/** 깊이별 2D 차집합을 이어 닫힌 메시로 만든다. 반복 BVH 연산 없이 홈의 바닥·벽·공구 반경을 유지한다. */
export function routedSections(size:Point3,sweeps:MillSweep[],holes:PanelHole[],edgeCuts:Ring[] = [], region: [number,number,number,number] = [0,0,size[0],size[1]]) {
  const [x0,y0,x1,y1]=region;
  const rectangle:MultiPolygon=[[[[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]]]];
  const cuts=sweeps.filter(s=>s.progress>0).map(({step,diameter,progress})=>({
    shape:[millFootprint(step.from,interpolate(step.from,step.to,progress),diameter)] as Ring[],
    bottom:step.face === 'bottom' ? 0 : Math.max(0,step.from[2]),
    top:step.face === 'bottom' ? Math.min(size[2],step.from[2]) : size[2],
  }));
  for (const shape of edgeCuts) cuts.push({shape:[shape],bottom:0,top:size[2]});
  for(const h of holes.filter(h=>h.depth>eps)) {
    const ring:Ring=Array.from({length:65},(_,i)=>[h.surface[0]+Math.cos(i*Math.PI/32)*h.diameter/2,h.surface[1]+Math.sin(i*Math.PI/32)*h.diameter/2]);
    cuts.push({shape:[ring],bottom:Math.max(0,size[2]-h.depth),top:size[2]});
  }
  // 관통 윤곽이 닫힌 뒤에만 연결이 끊긴 잔재를 제외한다. 그 전에는 잔재도 원판 일부다.
  const released = sweeps.flatMap(s => s.step.releaseOffcut && s.progress >= 1 ? [s.step.releaseOffcut] : []);
  if (released.length) {
    const through = cuts.filter(c => c.bottom <= eps && c.top >= size[2] - eps);
    const islands = through.length ? clip.difference(rectangle, ...through.map(c => c.shape)) : rectangle;
    const waste: MultiPolygon = released.map(({min, max}) => [[[min[0],min[1]], [max[0],min[1]], [max[0],max[1]], [min[0],max[1]], [min[0],min[1]]]]);
    // 가장 큰 조각을 남기는 방식은 넓은 따내기에서 잔재를 제품으로 뒤바꾼다.
    // 완료된 원본 노치 영역 안에 완전히 들어간 분리 조각만 제거한다.
    for (const shape of islands) if (clip.difference(shape, ...waste).length === 0) cuts.push({shape, bottom:0, top:size[2]});
  }
  const levels=[...new Set([0,size[2],...cuts.flatMap(c=>[c.bottom,c.top])])].sort((a,b)=>a-b);
  const layers=levels.slice(1).map((top,i)=>{
    const bottom=levels[i],active=cuts.filter(c=>c.bottom<top-eps && c.top>bottom+eps);
    return {bottom,top,shape:active.length?clip.difference(rectangle,...active.map(c=>c.shape)):rectangle};
  });
  return { rectangle, layers };
}

export function routedPanel(size:Point3,sweeps:MillSweep[],holes:PanelHole[],edgeCuts:Ring[] = [], region?: [number,number,number,number]):THREE.BufferGeometry {
  const { layers } = routedSections(size,sweeps,holes,edgeCuts,region);
  const positions:number[]=[],normals:number[]=[],uv:number[]=[];
  const tri=(a:Point3,b:Point3,c:Point3,n:Point3)=>{
    const cross=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).cross(new THREE.Vector3(...c).sub(new THREE.Vector3(...a)));
    if(cross.dot(new THREE.Vector3(...n))<0) [b,c]=[c,b];
    for(const p of [a,b,c]) {positions.push(...p);normals.push(...n);uv.push(p[0]/size[0],p[1]/size[1]);}
  };
  const face=(shape:MultiPolygon,z:number,sign:number)=>{
    for(const [outer,...inner] of shape) {
      const points=(ring:Ring)=>ring.slice(0,-1).map(([x,y])=>new THREE.Vector2(x,y));
      const o=points(outer),h=inner.map(points),vertices=[...o,...h.flat()];
      for(const f of THREE.ShapeUtils.triangulateShape(o,h)) tri(...f.map(i=>[vertices[i].x,vertices[i].y,z] as Point3) as [Point3,Point3,Point3],[0,0,sign]);
    }
  };
  for(const [i,layer] of layers.entries()) {
    const below=layers[i-1]?.shape,above=layers[i+1]?.shape;
    face(below?clip.difference(layer.shape,below):layer.shape,layer.bottom,-1);
    face(above?clip.difference(layer.shape,above):layer.shape,layer.top,1);
    for(const polygon of layer.shape) for(const [j,ring] of polygon.entries()) {
      const oriented=(area(ring)>0)===(j===0)?ring:[...ring].reverse();
      for(let k=1;k<oriented.length;k++) {
        const a=oriented[k-1],b=oriented[k],d=Math.hypot(b[0]-a[0],b[1]-a[1]); if(d<eps)continue;
        const n:Point3=[(b[1]-a[1])/d,-(b[0]-a[0])/d,0];
        tri([a[0],a[1],layer.bottom],[b[0],b[1],layer.bottom],[a[0],a[1],layer.top],n);
        tri([b[0],b[1],layer.bottom],[b[0],b[1],layer.top],[a[0],a[1],layer.top],n);
      }
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.computeBoundingBox();g.computeBoundingSphere();return g;
}
