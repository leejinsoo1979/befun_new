import clip, {type MultiPolygon} from 'polygon-clipping';
import {cursorAt, interpolate, isEdgeMillFace, type MachiningProgram, type Point3} from './program';
import {routedSections, type MillSweep} from './routedPanel';
import {replayCameraCut} from './replayCamera';
import {bandingAt,bandingContact,focusedBanding} from './edgeBandingProcess';

export type LayoutFrame = {x:number;y:number;width:number;height:number};
export function fullLayoutFrame(program:MachiningProgram):LayoutFrame {
  const [width,height]=program.stocks[0].size, pad=Math.max(width,height)*.045;
  return {x:-pad,y:-pad,width:width+2*pad,height:height+2*pad};
}

/** 3D와 같은 샷 선택을 쓰되 반송 좌표를 원장의 원래 위치로 투영한다. */
export function layoutCameraAt(program:MachiningProgram,time:number):LayoutFrame {
  const full=fullLayoutFrame(program),cursor=cursorAt(program,time),step=program.steps[cursor.index];
  if(!step || cursor.done || time<1800)return full;
  if(step.kind==='band') {
    const active=focusedBanding(bandingAt(program,time));
    if(active) {
      const p=bandingContact(active).local,o=active.stock.sourceOrigin??[0,0,0];
      return {x:o[0]+p[0]-180,y:o[1]+p[1]-180,width:360,height:360};
    }
  }
  const cut=replayCameraCut(program,cursor.index);
  const stock=program.stocks.find(s=>s.id===(cut??step).stockId)!;
  const origin=stock.sourceOrigin??[0,0,0];
  // 반송·방향 전환은 전체 배치를 보여 주고, 절삭 진입부터 공구와 함께 다가간다.
  if(!cut)return full;
  const previous=program.steps.indexOf(cut)<cursor.index;
  const t=cut===step?cursor.progress:previous?1:0;
  const contact=cut.kind==='drill'?cut.surface
    :cut.kind==='saw'||cut.kind==='mill'?interpolate(cut.from,cut.to,t):[0,0,0];
  // 3D 재단 추적은 안전 높이 이동에서도 같은 톱 캐리지를 따라간다.
  const local=cut.kind==='saw'&&step.kind==='travel'?interpolate(step.from,step.to,cursor.progress):contact;
  const radius=cut.kind==='saw'?320:cut.kind==='mill'?150:100;
  const width=radius*2,height=radius*2;
  const x=origin[0]+Math.max(0,Math.min(stock.size[0],local[0]));
  const y=origin[1]+Math.max(0,Math.min(stock.size[1],local[1]));
  return {x:x-width/2,y:y-height/2,width,height};
}

/** 보링·공구 표식은 작업대 반송 좌표 대신 원장 안 원래 위치에 투영한다. */
export function layoutMachiningAt(program:MachiningProgram,time:number) {
  const cursor=cursorAt(program,time);
  const holes=program.steps.flatMap((step,index)=>{
    if(step.kind!=='drill'||index>cursor.index)return [];
    const progress=index===cursor.index?cursor.progress:1;if(progress<=0)return [];
    const stock=program.stocks.find(s=>s.id===step.stockId)!,origin=stock.sourceOrigin??[0,0,0];
    const tool=program.tools.find(t=>t.id===step.toolId)!;
    const from=step.surface.map((v,i)=>v+origin[i]) as Point3;
    const to=from.map((v,i)=>v+step.direction[i]*step.depth*progress) as Point3;
    return [{id:step.id,stockId:stock.id,from,to,diameter:tool.diameter,depth:step.depth*progress,progress,side:Math.abs(step.direction[2])<.5,active:index===cursor.index}];
  });
  const step=program.steps[cursor.index];
  let marker: {x:number;y:number;cutting:boolean;diameter:number}|undefined;
  if(step?.station==='router' && (step.kind==='mill'||step.kind==='drill'||step.kind==='travel')) {
    const stock=program.stocks.find(s=>s.id===step.stockId)!,o=stock.sourceOrigin??[0,0,0];
    const p=step.kind==='drill'?step.surface.map((v,i)=>v+step.direction[i]*step.depth*cursor.progress):interpolate(step.from,step.to,cursor.progress);
    marker={x:p[0]+o[0],y:p[1]+o[1],cutting:step.kind!=='travel',diameter:program.tools.find(t=>t.id===step.toolId)!.diameter};
  }
  return {holes,marker,cursor};
}
const path=(shape:MultiPolygon)=>shape.flatMap(p=>p.map(r=>r.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' ')+'Z')).join(' ');
const sub=(a:MultiPolygon,b:MultiPolygon):MultiPolygon=>b.length?clip.difference(a,b):a;

export type RoutedLayer={bottom:number;top:number;shape:MultiPolygon};

/**
 * 깊이 단면을 관통·상면·하면으로 가른다.
 * 층별 shape는 상→하 단조 포함이 아니다. 하면 반턱은 아래 층에서만 사라지고 위 층은 온전하다.
 * 그래서 맨 아래 층 하나만 보고 관통을 정하면 하면 반턱이 관통으로 나온다.
 * 관통은 "어느 층에도 남지 않은" 영역이므로 모든 층 유지 영역의 합집합을 원판에서 뺀다.
 * 밀링은 언제나 한쪽 면에서 들어가므로, 관통이 아닌 제거는 맨 위 층(상면) 또는 맨 아래 층(하면)에 반드시 나타난다.
 * 같은 자리를 위아래에서 함께 판 경우 두 쪽에 모두 들어간다. 가운데 층이 남으면 관통으로 분류하지 않는다.
 * XY는 판재 좌표 그대로다. 반전은 flip step / replayPose.flips가 맡으므로 여기서 다시 미러링하지 않는다.
 */
export function routedRegions(rectangle:MultiPolygon,layers:RoutedLayer[]) {
  if(!layers.length)return {through:[] as MultiPolygon,pocketTop:[] as MultiPolygon,pocketBottom:[] as MultiPolygon};
  const kept=layers.length>1?clip.union(layers[0].shape,...layers.slice(1).map(l=>l.shape)):layers[0].shape;
  const through=sub(rectangle,kept);
  const ordered=[...layers].sort((a,b)=>a.bottom-b.bottom);
  return {
    through,
    pocketTop:sub(sub(rectangle,ordered[ordered.length-1].shape),through),
    pocketBottom:sub(sub(rectangle,ordered[0].shape),through),
  };
}

/** 3D와 같은 깊이 단면의 차집합. 깊이 없는 선을 홈으로 대신하지 않는다. */
export function routedLayoutAt(program:MachiningProgram,stockId:string,time:number) {
  const cursor=cursorAt(program,time),stock=program.stocks.find(s=>s.id===stockId)!;
  const sweeps:MillSweep[]=program.steps.flatMap((step,index)=>step.stockId===stockId && step.kind==='mill' && !isEdgeMillFace(step.face) && index<=cursor.index
    ?[{step,diameter:program.tools.find(t=>t.id===step.toolId)!.diameter,progress:index===cursor.index?cursor.progress:1}]:[]);
  const {rectangle,layers}=routedSections(stock.size,sweeps,[]);
  const {through,pocketTop,pocketBottom}=routedRegions(rectangle,layers);
  // pocket은 기존 소비부 계약을 지킨다. 면 구분이 필요하면 pocketTop·pocketBottom을 쓴다.
  const pocket=pocketTop.length&&pocketBottom.length?clip.union(pocketTop,pocketBottom):pocketTop.length?pocketTop:pocketBottom;
  return {through:path(through),pocket:path(pocket),pocketTop:path(pocketTop),pocketBottom:path(pocketBottom)};
}
