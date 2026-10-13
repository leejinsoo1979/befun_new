import React, {useLayoutEffect,useRef} from 'react';
import {bandPasses,cursorAt,type MachiningProgram,type ReplayClock} from './program';
import {bandingAt} from './edgeBandingProcess';
import {bandOutline} from './bandMachining';

export default function LayoutBandingOverlay({program,clock,time}:{program:MachiningProgram;clock?:ReplayClock;time:number}) {
  const nodes=useRef(new Map<string,SVGPathElement>());
  useLayoutEffect(()=>{
    const cached=new Map<string,string>();
    const draw=()=>{
      const elapsed=clock?.elapsedMs??time,all=bandingAt(program,elapsed),states=new Map(all.map(s=>[s.id,s]));
      const cursor=cursorAt(program,elapsed);
      const machining=new Map(program.stocks.map(stock=>[stock.id,JSON.stringify(program.steps.flatMap((s,i)=>
        s.stockId===stock.id&&(s.kind==='mill'||s.kind==='drill')&&i<=cursor.index?[[s.id,i===cursor.index?cursor.progress:1]]:[]))]));
      nodes.current.forEach((node,id)=>{
        const state=states.get(id);node.style.display=state&&state.pressed>0?'':'none';
        if(!state){cached.delete(id);return;}
        const key=JSON.stringify([machining.get(state.stock.id),all.filter(s=>s.stock.id===state.stock.id).map(s=>[s.id,s.pressed,s.millCenter,s.buffed])]);
        if(cached.get(id)===key)return;
        cached.set(id,key);
        node.setAttribute('d',bandOutline(program,state,all,elapsed));
        node.setAttribute('stroke',state.band.color);node.setAttribute('data-applied-length',String(state.pressed));
        node.setAttribute('data-finished-length',String(state.buffed));
      });
    };
    draw();return clock?.subscribe(draw);
  },[program,clock,time]);
  return <g aria-label="현재까지 부착한 엣지" fill="none">{bandPasses(program).map(s=><path key={s.id} data-edge-band={s.id} data-stock-id={s.stockId} strokeWidth={1.5} vectorEffect="non-scaling-stroke" style={{display:'none'}} ref={node=>{if(node)nodes.current.set(s.id,node);else nodes.current.delete(s.id);}} />)}</g>;
}
