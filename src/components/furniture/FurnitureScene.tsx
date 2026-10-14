'use client';

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { FurnitureDesign } from '@/lib/furniture/design';
import { createColorMaterials, solidDisplayColor, createMaterialsForColor, type MaterialSet } from '@/lib/three/materials';
import { REFERENCE_CLASSIC_COLORS, REFERENCE_COLORS } from '@/lib/three/reference-colors';
import { WARDROBE_COLORS } from '@/lib/furniture/wardrobe-colors';
import {createWardrobeWoodMaterials,disposeFurnitureMaterials} from '@/lib/furniture/wardrobe-materials';
import { Effects } from '@/components/three/Effects';
import { Background } from '@/components/three/Background';
import { applyReferenceAlbedo } from '@/lib/three/reference-materials';
import { ReferenceStudio } from '@/components/three/ReferenceStudio';
import { fitView } from '@/components/three/display/viewMath';
import { DeskModel } from './DeskModel';
import { WardrobeModel } from './WardrobeModel';
import { ConfiguratorLoading } from '@/components/ui/ConfiguratorLoading';

function ModelReady({onReady}:{onReady:(ready:boolean)=>void}){
  const frames=useRef(0);
  useFrame(state=>{if(++frames.current===1)state.invalidate();else if(frames.current===2)onReady(true);});
  return null;
}
function ContextStatus({onLost}:{onLost:(lost:boolean)=>void}){
  const {gl,invalidate}=useThree();
  useEffect(()=>{
    const canvas=gl.domElement;
    const lost=(event:Event)=>{event.preventDefault();onLost(true);};
    const restored=()=>{onLost(false);invalidate();};
    canvas.addEventListener('webglcontextlost',lost);
    canvas.addEventListener('webglcontextrestored',restored);
    return()=>{canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);};
  },[gl,invalidate,onLost]);
  return null;
}
function Materials({color,children}:{color:string;children:(materials:MaterialSet)=>React.ReactNode}) {
  const [loaded,setLoaded]=useState<{color:string;materials:MaterialSet}|null>(null);
  useEffect(()=>{
    let disposed=false;
    let owned:MaterialSet|undefined;
    const ref=REFERENCE_COLORS[color]??WARDROBE_COLORS[color];
    const classic=REFERENCE_CLASSIC_COLORS[color];
    const wood=color==='E_LightCleaf'||color==='E_DarkCleaf';
    const request=wood?createWardrobeWoodMaterials(color==='E_DarkCleaf'):ref?Promise.resolve(createColorMaterials(ref.base,ref.edge)):createMaterialsForColor(classic?'C_White':color);
    request.then(materials=>{
      if(ref) applyReferenceAlbedo(materials,ref);
      if(classic) for(const material of [materials.verticalBase,materials.horizontalBase,materials.backPanel]){
        material.map?.dispose();material.map=null;material.color.set(color==='C_Green'?solidDisplayColor(classic):classic);
        if(color==='C_Green'){material.roughness=.5;material.envMapIntensity=1;}
        material.needsUpdate=true;
      }
      if(disposed){disposeFurnitureMaterials(materials);return;}
      owned=materials;setLoaded({color,materials});
    });
    return()=>{disposed=true;if(owned)disposeFurnitureMaterials(owned);};
  },[color]);
  return loaded?.color===color?children(loaded.materials):null;
}
function Camera({width,height,depth,front,reset,zoom}:{width:number;height:number;depth:number;front:boolean;reset:number;zoom:{factor:number;revision:number}}){
  const controls=useRef<OrbitControlsImpl>(null);
  const {camera,size,invalidate}=useThree();
  const frame=useMemo(()=>fitView(width,height,depth,size.width/Math.max(1,size.height),front?'front':'standard'),[width,height,depth,size.width,size.height,front]);
  // Keep orbiting outside the cabinet, with room to zoom out even for the widest model.
  const minimum=Math.hypot(width,depth)/2+15;
  const maximum=Math.max(1500,frame.distance*4);
  useLayoutEffect(()=>{
    const target=new THREE.Vector3(0,height/2,depth/2);
    camera.up.copy(frame.up);
    camera.position.copy(target).addScaledVector(frame.direction,Math.max(minimum,frame.distance));
    camera.lookAt(target);
    if(controls.current){controls.current.target.copy(target);controls.current.update();}
    invalidate();
  },[camera,height,depth,frame,minimum,reset,invalidate]);
  const appliedZoom=useRef(0);
  useEffect(()=>{
    if(zoom.revision===appliedZoom.current||!controls.current)return;
    appliedZoom.current=zoom.revision;
    const offset=camera.position.clone().sub(controls.current.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length()*zoom.factor,minimum,maximum));
    camera.position.copy(controls.current.target).add(offset);
    controls.current.update();invalidate();
  },[zoom.revision,zoom.factor,camera,minimum,maximum,invalidate]);
  return <OrbitControls ref={controls} makeDefault zoomToCursor minDistance={minimum} maxDistance={maximum} minAzimuthAngle={-Math.PI*.48} maxAzimuthAngle={Math.PI*.48} maxPolarAngle={Math.PI/2} enablePan={false} enableDamping/>;
}
/** Animate option transitions, then let the GPU rest until the next interaction. */
function TransitionFrames({design,open}:{design:FurnitureDesign;open:boolean}){
  const until=useRef(0);
  const invalidate=useThree(state=>state.invalidate);
  useEffect(()=>{until.current=performance.now()+2200;invalidate();},[design,open,invalidate]);
  useFrame(()=>{if(performance.now()<until.current)invalidate();});
  return null;
}
export default function FurnitureScene({design,open,dimensions,front,reset,zoom,interior,selectedSectionId,onSelectSection,onEditDeskLegroom}:{design:FurnitureDesign;open:boolean;dimensions:boolean;front:boolean;reset:number;zoom:{factor:number;revision:number};interior:boolean;selectedSectionId:string|null;onSelectSection:(id:string)=>void;onEditDeskLegroom?:()=>void}) {
  const [ready,setReady]=useState(false);
  const [contextLost,setContextLost]=useState(false);
  const [contextKey,setContextKey]=useState(0);
  const footMaterial=useMemo(()=>new THREE.MeshStandardMaterial({color:'#202020',roughness:.65}),[]);
  useEffect(()=>()=>footMaterial.dispose(),[footMaterial]);
  const width=design.config.widthMm/10,depth=(design.kind==='desk'?design.config.depthMm:Math.max(design.config.depthMm,...design.config.sections.map(s=>s.localDepthMm??0)))/10,height=design.kind==='desk'?73:Math.max(design.config.heightMm,...design.config.sections.map(s=>s.localHeightMm??0))/10;
  return <><ConfiguratorLoading ready={ready||contextLost}/>{contextLost&&<div role="alert" style={{position:'absolute',inset:0,zIndex:20,display:'grid',placeContent:'center',gap:12,textAlign:'center',background:'#e6e4e0'}}><p>3D 화면 연결이 끊겼습니다. 편집한 디자인은 유지됩니다.</p><button onClick={()=>{setContextLost(false);setReady(false);setContextKey(value=>value+1);}}>3D 화면 다시 열기</button></div>}<Canvas key={contextKey} shadows frameloop="demand" dpr={[1,1.5]} camera={{position:[0,height/2,400],fov:40,near:1,far:5000}} onCreated={({gl})=>{gl.toneMapping=THREE.NeutralToneMapping;gl.toneMappingExposure=1;}}>
    <ContextStatus onLost={setContextLost}/>
    <Suspense fallback={null}><ReferenceStudio width={width} height={height}/></Suspense>
    <Suspense fallback={null}>
      <group position-y={design.kind==='desk'?-1.08:-.03}><Background shelfWidth={width} shelfHeight={height} shelfDepth={depth}/></group>
      <Materials color={design.color}>{materials=><><TransitionFrames key={String(interior)} design={design} open={open}/><ModelReady onReady={setReady}/>{design.kind==='desk'?<DeskModel config={design.config} materials={materials} footMaterial={footMaterial} open={open} selectedSectionId={selectedSectionId} onSelectSection={onSelectSection} sectionIds={design.sectionIds} onEditLegroom={onEditDeskLegroom}/>:design.config.model==='tone'?<Materials color={design.innerColor}>{inner=><WardrobeModel interior={interior} config={design.config} materials={materials} innerMaterials={inner} open={open} selectedSectionId={selectedSectionId} onSelectSection={onSelectSection}/>}</Materials>:design.color==='E_LightCleaf'||design.color==='E_DarkCleaf'?<Materials color={design.color==='E_LightCleaf'?'T_Cashmere':'T_Stone'}>{inner=><WardrobeModel interior={interior} config={design.config} materials={materials} innerMaterials={inner} open={open} selectedSectionId={selectedSectionId} onSelectSection={onSelectSection}/>}</Materials>:<WardrobeModel interior={interior} config={design.config} materials={materials} innerMaterials={materials} open={open} selectedSectionId={selectedSectionId} onSelectSection={onSelectSection}/>}</>}</Materials>
      {dimensions&&<>
        <Html position={[0,height+7,depth]} center style={{pointerEvents:'none',fontSize:13,color:'#555',whiteSpace:'nowrap'}}>{width} cm</Html>
        <Html position={[width/2+7,height/2,depth]} center style={{pointerEvents:'none',fontSize:13,color:'#555',whiteSpace:'nowrap'}}>{height} cm</Html>
      </>}
    </Suspense>
    <Effects/>
    <Camera width={width} height={height} depth={depth} front={front} reset={reset} zoom={zoom}/>
  </Canvas></>;
}
