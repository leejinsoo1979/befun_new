import { LEAD_IN, STAGE_TIME } from './assemblyPlan.ts';
import type { AssemblyPhase, Vec3 } from './assemblyPlan';

/** Render-loop data, kept outside React so following a part never rerenders the UI. */
export const assemblyPlayback = {
  elapsed: 0, duration: 1, focus: [0,0,0] as Vec3, active: false,
  outro: 0, kind: 'horizontal' as string, beat: 0,
};
export const CINEMATIC_OUTRO = 3.2;
export const CINEMATIC_HOLD = .12;
/** Insert a short pause after each completed row without changing part trajectories. */
export function cinematicAssemblyTime(elapsed:number, stages:number):number {
  if(elapsed<=LEAD_IN) return elapsed;
  const stage=Math.min(Math.max(0,stages-1),Math.floor((elapsed-LEAD_IN)/(STAGE_TIME+CINEMATIC_HOLD)));
  const within=elapsed-LEAD_IN-stage*(STAGE_TIME+CINEMATIC_HOLD);
  return LEAD_IN+stage*STAGE_TIME+(stage<stages-1?Math.min(within,STAGE_TIME):within);
}
const smooth=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export interface ShotInput {
  phase: AssemblyPhase;
  progress: number;
  outro: number;
  width: number;
  height: number;
  depth: number;
  aspect: number;
  focus: Vec3;
  kind?: string;
  beat?: number;
  stage: {width:number;height:number;depth:number;center:Vec3};
}
export function cinematicShot(input: ShotInput): {position:Vec3;target:Vec3} {
  const {phase,width,height,depth,aspect,focus,stage}=input;
  const p=Math.max(0,Math.min(1,input.progress));
  const ending=smooth(input.outro);
  const opening=phase==='assembling'?smooth(p/.22):0;
  const follow=opening*(1-ending);
  // Keep the active row readable without zooming so tightly that long panels get cut off.
  const sweep=Math.sin(p*Math.PI*3)*.24;
  const workingAngle=input.kind==='back'?1.95:lerp(.72,-.48,smooth((focus[0]+width/2)/Math.max(1,width)))+sweep;
  const angle=phase==='disassembling'?lerp(.6,1.1,smooth(p)):lerp(lerp(.8,workingAngle,opening),-.32,ending);
  const elevation=lerp(lerp(.62,input.kind==='horizontal'?.48:.18,follow),.26,ending);
  const wide=shotDistance(stage.width,stage.height,stage.depth,aspect,angle,elevation);
  const layer=shotDistance(Math.min(width+24,Math.max(85,width*.65)),Math.max(65,height*.48),depth+40,aspect,angle,elevation);
  const hero=shotDistance(width+18,height+18,depth+22,aspect,angle,elevation);
  const overview:Vec3=[stage.center[0],Math.max(12,height*.25),stage.center[2]*.85];
  const target:Vec3=[lerp(overview[0],focus[0]*.55,follow),lerp(overview[1],Math.max(10,focus[1]),follow),lerp(overview[2],depth*.6,follow)];
  for(let i=0;i<3;i++) target[i]=lerp(target[i],[0,height*.5,depth*.5][i],ending);
  const distance=lerp(lerp(wide,layer,follow),hero,ending);
  const horizontal=Math.cos(elevation)*distance;
  return {target,position:[target[0]+Math.sin(angle)*horizontal,target[1]+Math.sin(elevation)*distance,target[2]+Math.cos(angle)*horizontal]};
}


/** Fit the actual moving camera angle, including narrow mobile viewports. */
function shotDistance(w:number,h:number,d:number,aspect:number,angle:number,elevation:number) {
  const sa=Math.sin(angle),ca=Math.cos(angle),se=Math.sin(elevation),ce=Math.cos(elevation);
  const tan=Math.tan(Math.PI/9);
  let distance=0;
  for(const x of [-w/2,w/2]) for(const y of [-h/2,h/2]) for(const z of [-d/2,d/2]) {
    const forward=x*sa*ce+y*se+z*ca*ce;
    const right=x*ca-z*sa;
    const up=-x*sa*se+y*ce-z*ca*se;
    distance=Math.max(distance,forward+Math.max(Math.abs(right)/(tan*Math.max(.1,aspect)),Math.abs(up)/tan));
  }
  return distance*1.22+20;
}
