import { LEAD_IN, STAGE_TIME } from './assemblyPlan.ts';
import type { AssemblyPhase, AssemblyPlan, Vec3 } from './assemblyPlan';

/** Render-loop data, kept outside React so following a part never rerenders the UI. */
export const assemblyPlayback = {
  elapsed: 0, duration: 1, focus: [0,0,0] as Vec3, active: false,
  outro: 0, kind: 'horizontal' as string, beat: 0,
  phase: 'assembled' as AssemblyPhase, extent: [60, 40, 40] as Vec3,
  layout: null as AssemblyPlan['bounds'] | null,
};
export const CINEMATIC_OUTRO = 3.2;
export const DISASSEMBLY_OUTRO = 2.4;
export const CINEMATIC_HOLD = .12;
/** Insert a short pause after each completed row without changing part trajectories. */
export function cinematicAssemblyTime(elapsed:number, stages:number):number {
  if(elapsed<=LEAD_IN) return elapsed;
  const stage=Math.min(Math.max(0,stages-1),Math.floor((elapsed-LEAD_IN)/(STAGE_TIME+CINEMATIC_HOLD)));
  const within=elapsed-LEAD_IN-stage*(STAGE_TIME+CINEMATIC_HOLD);
  return LEAD_IN+stage*STAGE_TIME+(stage<stages-1?Math.min(within,STAGE_TIME):within);
}

/** Both directions use the same individual-part pacing, with different closing shots. */
export function playbackTiming(plan: AssemblyPlan, phase: AssemblyPhase, cinematic: boolean, elapsed: number) {
  const moving = phase === 'assembling' || phase === 'disassembling';
  const baseDuration = cinematic ? plan.assemblyDuration + Math.max(0, plan.stages.length - 1) * CINEMATIC_HOLD
    : phase === 'assembling' ? plan.assemblyDuration : plan.disassemblyDuration;
  const closingDuration = cinematic && moving ? phase === 'assembling' ? CINEMATIC_OUTRO : DISASSEMBLY_OUTRO : 0;
  const partTime = cinematic ? cinematicAssemblyTime(elapsed, plan.stages.length) : elapsed;
  const duration = baseDuration + closingDuration;
  return {
    baseDuration, duration, partTime,
    disassemblyInterval: cinematic ? STAGE_TIME : 0.22,
    outro: closingDuration ? elapsed >= duration ? 1 : Math.max(0, (elapsed - baseDuration) / closingDuration) : 0,
    shotStage: Math.min(Math.max(0, plan.stages.length - 1), Math.max(0,
      Math.floor((partTime - LEAD_IN)
        / (phase === 'disassembling' && !cinematic ? 0.22 : STAGE_TIME)))),
  };
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
  extent?: Vec3;
  elapsed?: number;
  layout?: AssemblyPlan['bounds'];
  stage: {width:number;height:number;depth:number;center:Vec3};
}
export function cinematicShot(input: ShotInput): {position:Vec3;target:Vec3} {
  const {phase,width,height,depth,aspect,focus,stage}=input;
  const p=Math.max(0,Math.min(1,input.progress));
  const disassembling = phase === 'disassembling';
  const layoutBounds = input.layout ?? { width: stage.width, height: 20, depth: stage.depth, center: [stage.center[0], 5, stage.center[2]] as Vec3 };
  const ending=smooth(input.outro);
  const opening=smooth(input.elapsed === undefined ? p/.22 : input.elapsed/1.05);
  const follow=opening*(1-ending);
  // Move around the visible side of the current part, with a restrained dolly during its carry.
  const sweep=Math.sin(p*Math.PI*2)*.12 + ((input.beat ?? .5)-.5)*.16;
  const workingAngle=input.kind==='back'?2.1:lerp(.64,-.64,smooth((focus[0]+width/2)/Math.max(1,width)))+sweep;
  const angle=lerp(lerp(disassembling?.22:.42,workingAngle,opening),disassembling?-.28:-.32,ending);
  const workingElevation=input.kind==='horizontal'?.54:input.kind==='back'?.22:.28;
  const elevation=lerp(lerp(disassembling?.26:.72,workingElevation,opening),disassembling?.92:.26,ending);
  const heroCenter:Vec3=[0,height*.5,depth*.5];
  const layoutCenter = layoutBounds.center;
  const openingCenter=disassembling?heroCenter:layoutCenter;
  const closingCenter=disassembling?layoutCenter:heroCenter;
  const target=openingCenter.map((v,i)=>lerp(lerp(v,focus[i],opening),closingCenter[i],ending)) as Vec3;
  const extent=input.extent ?? [Math.min(width,90),65,depth];
  const detail=shotDistance(Math.max(42,extent[0]+28),Math.max(42,extent[1]+28),Math.max(32,extent[2]+24),aspect,angle,elevation);
  const hero=shotDistance(width+18,height+18,depth+22,aspect,angle,elevation);
  const layout=shotDistance(layoutBounds.width + 12,layoutBounds.height + 10,layoutBounds.depth + 12,aspect,angle,elevation);
  const distance=lerp(lerp(disassembling?hero:layout,detail,follow),disassembling?layout:hero,ending);
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
