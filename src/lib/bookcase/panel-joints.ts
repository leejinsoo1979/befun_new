import type {Geometry,SourcePanel} from './types';
export type PanelJoint = {axis:'x'|'y';at:number;a1:number;a2:number;b1:number;b2:number};
/** Actual coplanar board boundaries from the source engine, in millimetres.
 * A wide top may span several columns: never infer a cut from column count. */
export function panelJoints(geometry:Pick<Geometry,'slabs'|'walls'>):PanelJoint[]{
 const result:PanelJoint[]=[];
 const same=(a:number,b:number)=>Math.abs(a-b)<.01;
 const join=(panels:SourcePanel[],axis:'x'|'y')=>{
  const other=axis==='x'?'y':'x';
  for(let i=0;i<panels.length;i++)for(let j=i+1;j<panels.length;j++){
   const a=panels[i],b=panels[j];
   if(!same(a[`${other}1`],b[`${other}1`])||!same(a[`${other}2`],b[`${other}2`]))continue;
   const at=same(a[`${axis}2`],b[`${axis}1`])?a[`${axis}2`]:same(b[`${axis}2`],a[`${axis}1`])?b[`${axis}2`]:null;
   const z1=Math.max(a.z1,b.z1),z2=Math.min(a.z2,b.z2);
   if(at!==null&&z2>z1)result.push({axis,at,a1:a[`${other}1`],a2:a[`${other}2`],b1:z1,b2:z2});
  }
 };
 join(geometry.slabs,'x');join(geometry.walls,'y');return result;
}
/** Contact shading follows only the real joint perimeter; no panel resize/gap. */
export function jointVertices(joints:PanelJoint[]):Float32Array{
 const vertices:number[]=[];const bias=.06;
 for(const j of joints){
  const rect=[[j.a1-bias,j.b1-bias],[j.a2+bias,j.b1-bias],[j.a2+bias,j.b2+bias],[j.a1-bias,j.b2+bias]];
  const point=([a,b]:number[])=>j.axis==='x'?[j.at,a,b]:[a,j.at,b];
  for(let i=0;i<4;i++)vertices.push(...point(rect[i]),...point(rect[(i+1)%4]));
 }
 return new Float32Array(vertices.map(n=>n/1000));
}
