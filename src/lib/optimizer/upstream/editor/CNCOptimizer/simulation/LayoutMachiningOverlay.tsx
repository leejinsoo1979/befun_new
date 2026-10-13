import React, {useLayoutEffect, useMemo, useRef} from 'react';
import type {MachiningProgram, ReplayClock} from './program';
import {layoutMachiningAt, routedLayoutAt} from './layoutMachining';

/** 재생 시계를 직접 구독해 오른쪽 구멍·홈·공구 위치를 3D와 동시에 갱신한다. */
export default function LayoutMachiningOverlay({program,clock,time,font}:{program:MachiningProgram;clock?:ReplayClock;time:number;font:number}) {
  const holeNodes=useRef(new Map<string,SVGGElement>()),routeNodes=useRef(new Map<string,SVGGElement>());
  const markerNode=useRef<SVGGElement>(null);
  const drills=useMemo(()=>program.steps.filter(s=>s.kind==='drill'),[program]);
  const routed=useMemo(()=>program.stocks.filter(stock=>program.steps.some(s=>s.stockId===stock.id&&s.kind==='mill')),[program]);
  const cached=useRef(new Map<string,string>());
  useLayoutEffect(()=>{
    cached.current.clear();
    const draw=()=>{
      const elapsed=clock?.elapsedMs??time,{holes,marker,cursor}=layoutMachiningAt(program,elapsed);
      const byId=new Map(holes.map(h=>[h.id,h]));
      holeNodes.current.forEach((node,id)=>{
        const hole=byId.get(id);node.style.display=hole?'':'none';
        if(!hole){node.removeAttribute('data-hole');return;}
        node.setAttribute('data-hole',id);node.setAttribute('data-depth',String(hole.depth));
        node.setAttribute('data-hole-state',hole.active?'active':'complete');
        const circle=node.children[0],line=node.children[1];
        circle.setAttribute('cx',String(hole.from[0]));circle.setAttribute('cy',String(hole.from[1]));circle.setAttribute('r',String(hole.diameter/2));
        circle.setAttribute('display',hole.side?'none':'');
        line.setAttribute('display',hole.side?'':'none');
        for(const [attr,v] of Object.entries({x1:hole.from[0],y1:hole.from[1],x2:hole.to[0],y2:hole.to[1],'stroke-width':hole.diameter}))line.setAttribute(attr,String(v));
        node.setAttribute('opacity',String(.45+.55*hole.progress));
      });
      for(const stock of routed) {
        const steps=program.steps.flatMap((s,i)=>s.stockId===stock.id&&s.kind==='mill'&&i<=cursor.index?[[s.id,i===cursor.index?cursor.progress:1]]:[]);
        const key=JSON.stringify(steps),node=routeNodes.current.get(stock.id);
        if(!node||cached.current.get(stock.id)===key)continue;
        cached.current.set(stock.id,key);
        const shape=routedLayoutAt(program,stock.id,elapsed);
        node.children[0].setAttribute('d',shape.through);node.children[1].setAttribute('d',shape.pocketTop);
        node.children[2].setAttribute('d',shape.pocketBottom);
      }
      const node=markerNode.current;
      if(node){
        node.style.display=marker?'':'none';
        if(marker){node.setAttribute('transform',`translate(${marker.x} ${marker.y})`);node.setAttribute('data-machining-marker','');node.setAttribute('stroke',marker.cutting?'#e35c26':'#278ea5');}
        else node.removeAttribute('data-machining-marker');
      }
    };
    draw();return clock?.subscribe(draw);
  },[program,clock,time,routed]);
  return <g aria-label="현재까지 가공된 홈·따내기·보링">
    {routed.map(stock=><g key={stock.id} transform={`translate(${stock.sourceOrigin?.[0]??0} ${stock.sourceOrigin?.[1]??0})`} ref={node=>{if(node)routeNodes.current.set(stock.id,node);else routeNodes.current.delete(stock.id);}}>
      <path data-through-machining={stock.id} fill="var(--theme-surface)" fillRule="evenodd" stroke="#9b7950" strokeWidth={.8} vectorEffect="non-scaling-stroke" />
      <path data-pocket-machining={stock.id} aria-label="상면 홈" fill="#c9ad80" fillRule="evenodd" stroke="#9b7950" strokeWidth={.6} vectorEffect="non-scaling-stroke" />
      <path data-pocket-bottom-machining={stock.id} aria-label="하면 홈·반턱" fill="#83aab9" fillOpacity={.55} fillRule="evenodd" stroke="#477f94" strokeDasharray="4 2" strokeWidth={.8} vectorEffect="non-scaling-stroke"><title>하면 홈·반턱</title></path>
    </g>)}
    {drills.map(step=><g key={step.id} style={{display:'none'}} ref={node=>{if(node)holeNodes.current.set(step.id,node);else holeNodes.current.delete(step.id);}}>
      <circle fill="var(--theme-text)" stroke="var(--theme-text-secondary)" strokeWidth={.7} vectorEffect="non-scaling-stroke" />
      <line stroke="#66889c" strokeLinecap="round" />
    </g>)}
    <g ref={markerNode} style={{display:'none'}} fill="none" strokeWidth={1.5} vectorEffect="non-scaling-stroke" pointerEvents="none">
      <circle r={font*.65} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <path d={`M${-font} 0H${font}M0 ${-font}V${font}`} strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
    </g>
  </g>;
}
