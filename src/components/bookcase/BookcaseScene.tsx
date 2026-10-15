'use client';
import {Suspense, useEffect, useMemo, useRef} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {Html, OrbitControls, useGLTF} from '@react-three/drei';
import type {OrbitControls as OrbitImpl} from 'three-stdlib';
import * as THREE from 'three';
import {panelJoints,jointVertices} from '@/lib/bookcase/panel-joints';
import {nativeGeometry,sourceRoundedPanel} from '@/lib/bookcase/native-geometry';
import {sourceMaterial} from '@/lib/bookcase/material';
import assets from '@/lib/bookcase/data/assets.json';
import type {Part,Schema,Segment,Snapshot,Vec} from '@/lib/bookcase/types';
import {ReferenceStudio} from '@/components/three/ReferenceStudio';
import {Background} from '@/components/three/Background';
import {PlaneLeg} from '@/components/three/furniture-hardware/legs';
import {Effects} from '@/components/three/Effects';

const AVAILABLE = new Set(['shortLeg','slimHandle','roundedPanel','liftLeg','pillarLeg','thickLeg','planeLeg','horizontalPanel','verticalPanel','frontalPanel','channelSlab','gripHandle','hingeWing','hingeAnchor','crossWardrobeBar','frontWardrobeBar','lightBar','lightDiffuser','fakedLightRays','fullHandleTop','fullHandleLeft','fullHandleRight','maskingProfile','ringHandle','ringHole','shortHandleLeft','shortHandleRight']);
const tuple=(v:Vec):[number,number,number]=>[v.x,v.y,v.z];
function NativePart({part}:{part:Part}){
 const entry=(assets as Record<string,{url:string}>)[part.asset];
 const {scene}=useGLTF(entry.url);
 const geometry=useMemo(()=>nativeGeometry(scene,part),[scene,part]);
 const materials=useMemo(()=>geometry.map(g=>{
  const surface=g.userData.sourceSurface;const source=part.material;
  if(!source)return sourceMaterial(source);
  const colour=surface==='edge'?source.colors.secondary:surface==='bottom'?source.colors.tertiary:source.colors.primary;
  if(surface==='edge'&&source.name==='laminatedPlywood'){
   const map=new THREE.TextureLoader().load('/three/bookcase/plywood_edge_512_albedo.jpg');map.colorSpace=THREE.SRGBColorSpace;map.flipY=false;map.wrapS=map.wrapT=THREE.RepeatWrapping;
   const mat=new THREE.MeshStandardMaterial({map,color:0xffffff,roughness:.5,envMapIntensity:.48});mat.addEventListener('dispose',()=>map.dispose());return mat;
  }
  return sourceMaterial({...source,colors:{...source.colors,primary:colour}});
 }),[geometry,part.material]);
 useEffect(()=>()=>{geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());},[geometry,materials]);
 const rotation:[number,number,number]=[0,0,0];if(part.rotation)rotation[['x','y','z'].indexOf(part.rotation.axis)]=part.rotation.angle;
 return <group position={tuple(part.position)} rotation={rotation}>{geometry.map((g,i)=><mesh key={i} geometry={g} material={materials[i]} castShadow receiveShadow/>)}</group>;
}
/** Existing GLB-measured 15 × 30 mm profile. Source schema uses a bottom
 * origin; shared PlaneLeg uses its top as origin. Keep the original 10 mm
 * insertion into the bottom panel, rather than shrinking it to 20 mm. */
function ObservedPlaneLeg({part}:{part:Part}){
 const material=useMemo(()=>sourceMaterial(part.material),[part.material]);
 useEffect(()=>()=>material.dispose(),[material]);
 return <group name="planeLeg" position={tuple(part.position)} scale={tuple(part.size)}>
  <group position={[0,.03,0]} scale={.001}><PlaneLeg material={material} castShadow/></group>
 </group>;
}
function BedsideTop({part}:{part:Part}){
 const material=useMemo(()=>sourceMaterial(part.material),[part.material]);
 const geometry=useMemo(()=>sourceRoundedPanel(part),[part]);
 useEffect(()=>()=>{geometry.dispose();material.dispose();},[geometry,material]);
 return <mesh name="roundedPanel" position={tuple(part.position)} geometry={geometry} material={material} castShadow receiveShadow/>;
}
function NativeSegment({segment,open}:{segment:Segment;open:boolean}){
 const group=useRef<THREE.Group>(null);
 const motion=segment.segmentTag.motion;
 useFrame((_,dt)=>{if(!group.current)return;const t=1-Math.exp(-dt*12);if(segment.name==='door'&&motion)group.current.rotation.y=THREE.MathUtils.lerp(group.current.rotation.y,(open?motion.open:motion.close)*Math.PI/180,t);if(segment.name==='drawer'&&motion)group.current.position.z=THREE.MathUtils.lerp(group.current.position.z,(open?motion.open:motion.close)-motion.close,t);});
 return <group position={tuple(segment.position)}><group ref={group}>{segment.geometries.filter(p=>AVAILABLE.has(p.asset)).map((p,i)=>p.asset==='roundedPanel'?<BedsideTop key={i} part={p}/>:p.asset==='planeLeg'?<ObservedPlaneLeg key={i} part={p}/>:<NativePart key={i} part={p}/>)}</group></group>;
}
function PanelJoints({snapshot}:{snapshot:Snapshot}){
 const geometry=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(jointVertices(panelJoints(snapshot.geometry)),3));return g;},[snapshot.geometry]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <lineSegments name="source-panel-joints" geometry={geometry} renderOrder={1}><lineBasicMaterial color="#30302c" transparent opacity={.28} depthWrite={false}/></lineSegments>;
}
function ColumnTargets({schema,selected,onSelect}:{schema:Schema;selected:number|null;onSelect:(n:number)=>void}){
 return <>{schema.find(g=>g.key==='hovers')?.children.map((s,i)=>{
 const p=s.geometries[0];const id=Number(s.segmentTag.channelId)-1;const active=id===selected;
 return <group key={i} position={tuple(s.position)}><mesh onClick={e=>{if(e.delta>4)return;e.stopPropagation();onSelect(id);}}>
 <boxGeometry args={tuple(p.size)}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
 {active&&<mesh position={[0,0,p.size.z/2+.004]} renderOrder={30}><planeGeometry args={[p.size.x,p.size.y]}/><meshBasicMaterial color="#309b20" transparent opacity={.07} depthWrite={false} polygonOffset polygonOffsetFactor={-1}/></mesh>}
 <Html position={[0,p.size.y/2+.12,0]} center><button aria-label={`${id+1}구획 편집`} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onSelect(id);}} style={{width:32,height:32,border:active?'1px solid #309b20':'1px solid #ddd',borderRadius:'50%',background:active?'#309b20':'#fff',color:active?'white':'#222',cursor:'pointer'}}>{id+1}</button></Html></group>;
 })}</>;
}
function Camera({width,height,depth,reset,zoom}:{width:number;height:number;depth:number;reset:number;zoom:number}){
 const controls=useRef<OrbitImpl>(null);const previousZoom=useRef(zoom);const {camera,size}=useThree();
 // Include the shared 167 cm person and the space to the furniture's left.
 const frameHeight=Math.max(height,175);const targetX=-44;
 const distance=Math.max(frameHeight/2/Math.tan(Math.PI/12),(width+88)/2/(size.width/size.height)/Math.tan(Math.PI/12))*1.1;
 useEffect(()=>{camera.position.set(targetX-distance*.28,frameHeight*.5+distance*.12,distance+depth/2);camera.lookAt(targetX,frameHeight/2,depth/2);if(controls.current){controls.current.target.set(targetX,frameHeight/2,depth/2);controls.current.update();}},[camera,distance,frameHeight,depth,reset,targetX]);
 useEffect(()=>{const delta=zoom-previousZoom.current;previousZoom.current=zoom;if(!delta||!controls.current)return;const target=controls.current.target;camera.position.sub(target).multiplyScalar(Math.pow(.84,delta)).add(target);controls.current.update();},[zoom,camera]);
 return <OrbitControls ref={controls} makeDefault enableDamping minDistance={60} maxDistance={2500} minPolarAngle={.08} maxPolarAngle={Math.PI/2} target={[targetX,frameHeight/2,depth/2]}/>;
}
export default function BookcaseScene({snapshot,selected,onSelect,open,editingColumns,dimensions,reset,zoom}:{snapshot:Snapshot;selected:number|null;onSelect:(n:number|null)=>void;open:boolean;editingColumns:boolean;dimensions:boolean;reset:number;zoom:number}){
 const {width,height,depth}=snapshot.geometry;const w=width/10,h=height/10,d=depth/10;
 // Original calculateShelfOrigin: TYPE_24 HANGING_AT.y = 250 mm.
 const elevation="shelf_type" in snapshot.geometry && snapshot.geometry.shelf_type===7?25:0;

 return <Canvas shadows dpr={[1,2]} camera={{fov:30,near:1,far:10000,position:[-200,200,700]}} gl={{antialias:true}} onCreated={({gl})=>{gl.toneMapping=THREE.NeutralToneMapping;gl.toneMappingExposure=1;}} onPointerMissed={()=>onSelect(null)}>
 <Suspense fallback={<Html center><span>가구 불러오는 중…</span></Html>}>
 <ReferenceStudio width={w} height={h+elevation}/>
 <Background shelfWidth={w} shelfHeight={h} shelfDepth={d}/>
 <group position={[0,elevation,0]} scale={100}>
 {snapshot.schema.filter(g=>!['openings','hovers','dimensions'].includes(g.key)).map(g=><group key={g.key}>{g.children.map((s,i)=><NativeSegment key={`${g.key}-${i}`} segment={s} open={open}/>)}</group>)}
 <PanelJoints snapshot={snapshot}/>
 {editingColumns&&<ColumnTargets schema={snapshot.schema} selected={selected} onSelect={onSelect}/>}
 </group>
 {dimensions&&<><Html center position={[0,h+elevation+26,d]}><div className="bookcase-dimension">{width/10} cm</div></Html><Html center position={[w/2+18,h/2+elevation,d]}><div className="bookcase-dimension">{height/10} cm</div></Html><Html center position={[w/2+12,3+elevation,d/2]}><div className="bookcase-dimension">{depth/10} cm</div></Html></>}
 <Camera width={w} height={h+elevation} depth={d} reset={reset} zoom={zoom}/>
 <Effects/>
 </Suspense></Canvas>;
}
