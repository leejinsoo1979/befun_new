import type {MachiningProgram,Point3} from './program';
import {bandingAt,bandPoint} from './edgeBandingProcess';
import {millFootprint} from './routedPanel';

/** 마마 지정: 재단 치수 유지, 단면 1mm(입력 테이프 두께) 프리밀링 후 같은 두께를 채운다. */
export function edgeMillingFootprints(program:MachiningProgram,stockId:string,time:number) {
  return bandingAt(program,time).filter(s=>s.stock.id===stockId && s.millCenter>-40).map(s=>{
    const r=40,offset=r-s.band.thickness;
    const outward:Point3=s.band.edge==='bottom'?[0,-1,0]:s.band.edge==='top'?[0,1,0]:s.band.edge==='left'?[-1,0,0]:[1,0,0];
    const at=(distance:number)=>bandPoint(s.stock.size,s.band.edge,distance).map((v,i)=>i===2?0:v+outward[i]*offset) as Point3;
    return millFootprint(at(-r-1),at(Math.min(s.length+r+1,s.millCenter)),r*2);
  });
}
