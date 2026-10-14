'use client';

import { Suspense, useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import { ExtrudeGeometry, Path, Shape } from 'three';
import { GuidePanel } from '../GuidePanel';
import { TylkoClip, TylkoClipPin, createClipMaterials } from '@/components/three/furniture-hardware/connectors/TylkoClip';
import { clipBodyExtent } from '@/components/three/furniture-hardware/connectors/clipContract';
import { ILLUSTRATIVE_CLIP as clip, ILLUSTRATIVE_PIN as pin } from '@/components/three/furniture-hardware/connectors/illustrativeDimensions';
import { samplePose, type Chapter, type Pose } from '@/lib/assembly-guide/tylko-manual/chapters';
import styles from './manual.module.css';

type V = [number,number,number];
function Board({size,position=[0,0,0],inside=false}:{size:V;position?:V;inside?:boolean}) {
 const axis = size.indexOf(Math.min(...size)) as 0|1|2;
 return <GuidePanel size={size} position={position} axis={axis} inside={inside}/>;
}
function Block({size,position=[0,0,0],color='#303338',metal=0}:{size:V;position?:V;color?:string;metal?:number}) {
 return <mesh position={position} castShadow><boxGeometry args={size}/><meshStandardMaterial color={color} metalness={metal} roughness={.42}/></mesh>;
}
function Pin({position=[0,0,0],radius=3,height=8,color='#babec1'}:{position?:V;radius?:number;height?:number;color?:string}) {
 return <mesh position={position} rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[radius,radius,height,24]}/><meshStandardMaterial color={color} metalness={.75} roughness={.32}/></mesh>;
}
function Label({at,children}:{at:V;children:React.ReactNode}) {return <Html position={at} center className={styles.label}>{children}</Html>;}
function Arrow({a,b}:{a:V;b:V}) {return <><Line points={[a,b]} color="#ea5b35" lineWidth={2}/><mesh position={b}><sphereGeometry args={[2,12,12]}/><meshBasicMaterial color="#ea5b35"/></mesh></>;}

function ClipHardware({colour,inside}:{colour:'black'|'orange'|'silver';inside:boolean}) {
 const material=useMemo(()=>{
  const m=createClipMaterials(colour);m.body.metalness=colour==='orange'?.25:.7;
  if(inside){m.body.transparent=true;m.body.opacity=.45;m.body.depthWrite=false;m.cavity.transparent=true;m.cavity.opacity=.12;m.cavity.depthWrite=false;}
  return m;
 },[colour,inside]);
 useEffect(()=>()=>Object.values(material).forEach(m=>m.dispose()),[material]);
 const extent=clipBodyExtent(clip);
 return <group>
  <TylkoClip dims={clip} bodyMaterial={material.body} cavityMaterial={material.cavity}/>
  {/* Fixing heads are visible in supplied image 030. Dimensions remain illustrative. */}
  {[extent.startX+3,extent.endX-3].map(x=><group key={x} position={[x,0,-.4]}>
   <Pin radius={1.5} height={1.2}/><Block size={[1.9,.35,.3]} position={[0,0,.8]} color="#101010"/><Block size={[.35,1.9,.3]} position={[0,0,.8]} color="#101010"/>
  </group>)}
 </group>;
}
function ClipPanel({inside}:{inside:boolean}) {
 const geometry=useMemo(()=>{
  const s=new Shape();s.moveTo(-90,-9);s.lineTo(90,-9);s.lineTo(90,9);s.lineTo(-90,9);s.closePath();
  const {startX,endX}=clipBodyExtent(clip);const r=clip.widthMm/2;
  for(const x of [-50,45]){const h=new Path();h.moveTo(x+startX+r,-r);h.lineTo(x+endX-r,-r);h.absarc(x+endX-r,0,r,-Math.PI/2,Math.PI/2,false);h.lineTo(x+startX+r,r);h.absarc(x+startX+r,0,r,Math.PI/2,Math.PI*1.5,false);s.holes.push(h);}
  const g=new ExtrudeGeometry(s,{depth:clip.depthMm,bevelEnabled:false,curveSegments:24});g.translate(0,0,-clip.depthMm);return g;
 },[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <><GuidePanel source={geometry} size={[180,18,clip.depthMm]} axis={1} inside={inside}/><Board size={[180,18,100-clip.depthMm]} position={[0,0,-(100+clip.depthMm)/2]} inside={inside}/></>;
}
function ClipModel({p,inside,orange}:{p:Pose;inside:boolean;orange:boolean}) {
 const materials=useMemo(()=>[createClipMaterials('black'),createClipMaterials(orange?'orange':'silver')],[orange]);
 useEffect(()=>()=>materials.forEach(m=>Object.values(m).forEach(v=>v.dispose())),[materials]);
 return <group rotation={[-Math.PI/2,0,0]}>
  <Board size={[200,160,18]} position={[0,0,9]} inside={inside}/>
  {[-50,45].map((x,i)=><group key={x} position={[x+clip.travelMm,0,0]} rotation={[Math.PI,0,0]}><TylkoClipPin dims={pin} material={materials[i].pin}/></group>)}
  <group position={[p.slide,p.lateral,-p.gap]}><ClipPanel inside={inside}/>{[-50,45].map((x,i)=><group key={x} position={[x,0,0]}><ClipHardware colour={i===0?'black':orange?'orange':'silver'} inside={inside}/></group>)}</group>
  <Label at={[0,-65,5]}>상대 판 · 같은 색 핀</Label><Label at={[0,-20,-p.gap-50]}>단면 매입 클립 · 고정 나사</Label>
  {p.gap>0?<Arrow a={[75,0,-p.gap-25]} b={[75,0,-12]}/>:p.slide>0?<Arrow a={[80,0,-30]} b={[60,0,-30]}/>:<Label at={[0,30,-5]}>끝선 정렬</Label>}
 </group>;
}
function Cabinet({inside,topOffset=0}:{inside:boolean;topOffset?:number}) {return <><Board size={[250,16,160]} position={[0,0,0]} inside={inside}/><Board size={[250,16,160]} position={[0,190+topOffset,0]} inside={inside}/>{[-117,117].map(x=><Board key={x} size={[16,174,160]} position={[x,95,0]} inside={inside}/>)}</>;}
function Back({p,inside,support}:{p:Pose;inside:boolean;support:boolean}) {return <>
 <Cabinet inside={inside} topOffset={p.upper??0}/>
 <group position={[0,10+(p.bottom??0),-65]} rotation={[p.tilt??0,0,0]}>
  <Board size={[support?65:218,170,8]} position={[0,85,0]} inside={inside}/>
  {(support?[-20,20]:[-85,85]).map(x=><group key={x}>
   <group rotation={[Math.PI/2,0,0]}><Pin position={[x,0,4]} radius={2.5} height={10}/></group>
   <group position={[x,172-(p.spring??0)*7,0]} rotation={[Math.PI/2,0,0]}><Pin radius={2.5} height={10}/></group>
  </group>)}
  <Label at={[0,185,0]}>상단 스프링핀</Label><Label at={[0,-12,0]}>하단 고정핀</Label>
 </group>
 {(p.tape??0)>0&&[-65,65].map(x=><Block key={x} size={[12,215,1]} position={[x,98,-60]} color="#ba9346"/>)}
 </>;}
function Wide({p,inside}:{p:Pose;inside:boolean}) {return <>
 <Board size={[180,18,150]} position={[-90-p.gap/2,0,0]} inside={inside}/><Board size={[180,18,150]} position={[90+p.gap/2,0,0]} inside={inside}/>
 {[-45,45].map(z=><group key={z}><group position={[-p.gap/2,0,z]} rotation={[0,Math.PI/2,0]}><Pin height={20} radius={3} color="#b79a6e"/></group><Block size={[12,8,24]} position={[-20-p.gap/2,0,z]} metal={.7}/><Block size={[12,8,24]} position={[20+p.gap/2,0,z]} metal={.7}/><group position={[20+p.gap/2,23,z]} rotation={[0,(p.turn??0)*Math.PI*4,0]}><Block size={[3,30,3]} metal={1}/><Block size={[22,3,3]} position={[9,15,0]} metal={1}/></group></group>)}
 <Label at={[0,50,0]}>암·수 연결부 + 다월 · 가로판마다 조임</Label>
 </>;}
function Insert({p,inside}:{p:Pose;inside:boolean}) {return <><Cabinet inside={inside}/><Board size={[216,14,150]} position={[0,90+p.raise,p.front]} inside={inside}/>{[-105,105].map(x=>[-50,50].map(z=><group key={`${x}-${z}`} position={[x,95,z]} rotation={[0,Math.PI/2,0]}><Pin radius={5} height={3} color="#262626"/><Pin radius={3} height={3} position={[0,7,0]} color="#262626"/></group>))}<Label at={[0,210,0]}>작은 원 위 · 좌우 방향 확인</Label></>;}
function Drawer({p,inside,rails}:{p:Pose;inside:boolean;rails:boolean}) {return <>
 {rails&&<><Cabinet inside={inside}/>{[-102,102].map(x=><Block key={x} size={[9,12,200]} position={[x,33,35]} color="#979ba0" metal={.8}/>)}</>}
 <group position={[0,rails?30+(p.raise??0):40,p.front??0]} rotation={[p.flip??0,0,0]}>
  <Board size={[214,80,14]} position={[0,40,78]} inside={inside}/>
  {[-1,1].map(side=><Board key={side} size={[12,70,140]} position={[side*(97+(p.side??0)),40,0]} inside={inside}/>)}
  <Board size={[188,70,12]} position={[0,40+(p.back??0),-73]} inside={inside}/>
  <Board size={[196,8,144]} position={[0,-(p.bottom??0),0]} inside={inside}/>
  {[-80,80].map(x=><Block key={x} size={[20,6,18]} position={[x+(x>0?-1:1)*(p.catch??0)*6,-8,48]} color="#e4bb32"/>)}
 </group>
 {rails&&<Label at={[0,225,0]}>하단 노란 캐치 · 양쪽 동시 해제</Label>}
 </>;}
function Door({p,inside}:{p:Pose;inside:boolean}) {return <><Cabinet inside={inside}/><group position={[-106+(p.shift??0),10+(p.raise??0),86+(p.depth??0)]} rotation={[0,-(p.angle??0),0]}>
 <group position={[p.gap??0,0,0]}><Board size={[210,174,12]} position={[105,87,0]} inside={inside}/>{[38,140].map(y=><group key={y} position={[12,y,-13]}><Pin radius={9} height={7}/><Block size={[34,8,9]} position={[-12,0,0]} color="#b7b9ba" metal={.8}/><Block size={[8,4,12]} position={[-24,4+(1-(p.latch??0))*6,0]} color="#999b9e" metal={.8}/></group>)}</group>
 </group>{[48,150].map(y=><Block key={y} size={[6,22,28]} position={[-106,y,67]} color="#b7b9ba" metal={.8}/>)}<Pin position={[101,170,82]} radius={3} height={3} color="#777"/></>;}
function Leg({p,inside,silver}:{p:Pose;inside:boolean;silver:boolean}) {
 const plate=useMemo(()=>{
  const s=new Shape();s.moveTo(-3,38);s.quadraticCurveTo(0,41,3,38);s.lineTo(38,3);s.quadraticCurveTo(41,0,38,-3);s.lineTo(3,-38);s.quadraticCurveTo(0,-41,-3,-38);s.lineTo(-38,-3);s.quadraticCurveTo(-41,0,-38,3);s.closePath();
  for(const [x,y] of [[-19,0],[19,0],[0,-25]]){const h=new Path();h.moveTo(x-5,y);h.absarc(x,y,5,Math.PI,Math.PI*2);h.lineTo(x+2.5,y+12);h.absarc(x,y+12,2.5,0,Math.PI);h.closePath();s.holes.push(h);}
  const center=new Path();center.absarc(0,0,2.5,0,Math.PI*2);s.holes.push(center);
  return new ExtrudeGeometry(s,{depth:3,bevelEnabled:true,bevelSize:.4,bevelThickness:.4,bevelSegments:1});
 },[]);useEffect(()=>()=>plate.dispose(),[plate]);
 const color=silver?'#babfc4':'#292c30';
 return <group rotation={[-Math.PI/2,0,0]}><Board size={[180,180,18]} position={[0,0,-9]} inside={inside}/>
 {([[-19,12],[19,12],[0,-13]] as const).map(([x,y])=><group key={x} position={[x,y,0]}><Pin height={6} radius={2.2} position={[0,0,2]}/><Pin height={3} radius={4.5} position={[0,0,5]}/></group>)}
 <Pin height={6} radius={2} position={[0,0,3-(p.pin??0)*4]}/>
 <group position={[0,p.slide??0,p.gap??0]}><mesh geometry={plate}><meshStandardMaterial color={color} metalness={.75} roughness={.4} transparent={inside} opacity={inside?.45:1}/></mesh>{[-1,1].map(side=><group key={side} position={[side*19,19,5]} rotation={[0,0,side*Math.PI/4]}><Block size={[3,53,9]} color={color} metal={.7}/></group>)}<Pin radius={8} height={95} position={[0,31,50]} color={color}/><Pin radius={8.1} height={3} position={[0,31,99]} color="#66635b"/></group>
 <Label at={[0,-64,0]}>나사 3개·중앙 핀은 판에 남음</Label></group>;
}
function Plinth({p,inside}:{p:Pose;inside:boolean}) {return <>
 <Board size={[300,16,180]} inside={inside}/>
 {[-1,1].map(side=><group key={side} position={[side*(130+(p.side??0)),-35,0]} rotation={[0,0,side*(p.rotate??0)]}><Board size={[12,54,156]} inside={inside}/></group>)}
 {[-1,1].map(side=><Board key={side} size={[270,54,12]} position={[0,-35,side*(78+(p.long??0))]} inside={inside}/>)}
 <Label at={[0,32,0]}>짧은 부품 해제 → 긴 부품 → 회전·분리</Label>
 </>;}
function Module({p,inside,tall}:{p:Pose;inside:boolean;tall:boolean}) {
 return <group position={[0,-100,0]}><Cabinet inside={inside}/><group position={[0,190+(p.gap??0),-(p.slide??0)]}><Cabinet inside={inside}/>{tall&&<group position={[0,190,0]}><Cabinet inside={inside}/></group>}</group>{(p.tape??0)>0&&[-65,65].map(x=><Block key={x} size={[12,155,1]} position={[x,95,-62]} color="#ba9346"/>)}<Label at={[0,-25,0]}>같은 행의 접합부를 모두 해제</Label></group>;
}
function Wall({p,inside}:{p:Pose;inside:boolean}) {return <><Board size={[240,16,160]} position={[0,0,0]} inside={inside}/><Block size={[300,170,8]} position={[0,70,-120]} color="#d3d2cf"/><group position={[p.bracket??0,0,0]}><Block size={[22,3,55]} position={[0,11,-87]} metal={.7}/><Block size={[22,30,3]} position={[0,26,-113]} metal={.7}/><group rotation={[Math.PI/2,0,0]}><Pin position={[0,-68,18+(p.screw??0)]} height={15} radius={2}/></group><Pin position={[0,26,-110+(p.screw??0)]} radius={2} height={15}/></group></>;}
function Model({chapter,p,inside,orange,silver,support}:{chapter:Chapter;p:Pose;inside:boolean;orange:boolean;silver:boolean;support:boolean}) {
 switch(chapter.mechanism){
  case 'clip':return <ClipModel p={p} inside={inside} orange={orange}/>;
  case 'back':return <Back p={p} inside={inside} support={support}/>;
  case 'wide':return <Wide p={p} inside={inside}/>;
  case 'insert':return <Insert p={p} inside={inside}/>;
  case 'drawer':return <Drawer p={p} inside={inside} rails={chapter.id==='drawer-rail'}/>;
  case 'door':return <Door p={p} inside={inside}/>;
  case 'leg':return <Leg p={p} inside={inside} silver={silver}/>;
  case 'plinth':return <Plinth p={p} inside={inside}/>;
  case 'module':return <Module p={p} inside={inside} tall={chapter.id==='module-tall'}/>;
  case 'lift':return <group rotation={[p.angle??0,0,0]}><Module p={{gap:0,slide:0}} inside={inside} tall={false}/></group>;
  case 'wall':return <Wall p={p} inside={inside}/>;
  case 'care':return <>{[0,1,2].map(i=><group key={i}><Board size={[240,16,160]} position={[0,i*(18+(p.gap??0)),0]} inside={inside}/>{(p.gap??0)>0&&<Block size={[246,2,166]} position={[0,i*(18+(p.gap??0))+11,0]} color="#a78d6b"/>}</group>)}</>;
 }
}
function Camera({chapter,close,reset}:{chapter:Chapter;close:boolean;reset:number}) {
 const {camera,size}=useThree();const orbit=useRef<ComponentRef<typeof OrbitControls>>(null);
 useEffect(()=>{
  const high=chapter.id==='module-tall';const target:V=chapter.mechanism==='clip'?[10,-45,0]:chapter.mechanism==='module'?[0,high?160:100,0]:['back','insert','door'].includes(chapter.mechanism)?[0,95,0]:[0,25,0];
  const radius=close?chapter.mechanism==='clip'?65:chapter.mechanism==='leg'?55:125:high?320:chapter.mechanism==='module'||chapter.mechanism==='lift'?250:chapter.mechanism==='clip'?105:chapter.mechanism==='leg'?95:190;
  const d=radius/Math.sin(Math.atan(Math.tan(Math.PI/8)*Math.min(1,size.width/Math.max(1,size.height))));
  camera.position.set(target[0]+d*.7,target[1]+d*(chapter.mechanism==='clip'?-.35:.5),target[2]+d*.8);camera.lookAt(...target);orbit.current?.target.set(...target);orbit.current?.update();
 },[camera,chapter,close,reset,size.width,size.height]);
 return <OrbitControls ref={orbit} makeDefault minDistance={30} maxDistance={4000} enableDamping/>;
}
export default function Simulation({chapter,step,progress,inside,close,reset,orange,silver,support}:{chapter:Chapter;step:number;progress:number;inside:boolean;close:boolean;reset:number;orange:boolean;silver:boolean;support:boolean}) {
 const p=samplePose(chapter,step,progress);
 return <Canvas camera={{fov:45,near:.5,far:10000}} dpr={[1,1.5]} aria-label={`${chapter.title} 3D 동작 시뮬레이션`}>
  <color attach="background" args={['#eeede9']}/><ambientLight intensity={1.7}/><directionalLight position={[300,500,400]} intensity={2.5}/><directionalLight position={[-300,200,-200]} intensity={1.1}/>
  <Suspense fallback={null}><Model chapter={chapter} p={p} inside={inside} orange={orange} silver={silver} support={support}/></Suspense><Camera chapter={chapter} close={close} reset={reset}/>
 </Canvas>;
}
