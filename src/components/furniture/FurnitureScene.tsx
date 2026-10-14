'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { FurnitureDesign } from '@/lib/furniture/design';
import { createColorMaterials, createMaterialsForColor, type MaterialSet } from '@/lib/three/materials';
import { REFERENCE_CLASSIC_COLORS, REFERENCE_COLORS } from '@/lib/three/reference-colors';
import { WARDROBE_COLORS } from '@/lib/furniture/wardrobe-colors';
import {createWardrobeWoodMaterials,disposeFurnitureMaterials} from '@/lib/furniture/wardrobe-materials';
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
      if(classic) for(const material of [materials.verticalBase,materials.horizontalBase,materials.backPanel]){
        material.map?.dispose();material.map=null;material.color.set(classic);material.needsUpdate=true;
      }
      if(disposed){disposeFurnitureMaterials(materials);return;}
      owned=materials;setLoaded({color,materials});
    });
    return()=>{disposed=true;if(owned)disposeFurnitureMaterials(owned);};
  },[color]);
  return loaded?.color===color?children(loaded.materials):null;
}
function Camera({width,height,depth,front,reset}:{width:number;height:number;depth:number;front:boolean;reset:number}){
  const controls=useRef<OrbitControlsImpl>(null);
  const {camera,size}=useThree();
  useEffect(()=>{
    const perspective=camera as THREE.PerspectiveCamera;
    const aspect=size.width/size.height;
    const distance=Math.max(height,width/Math.max(aspect,.5))/(2*Math.tan(THREE.MathUtils.degToRad(perspective.fov/2)))*1.4+depth;
    const target=new THREE.Vector3(0,height/2,depth/2);
    camera.position.set(front?0:-distance*.32,front?height/2:height/2+distance*.22,depth/2+distance);
    camera.lookAt(target);controls.current?.target.copy(target);controls.current?.update();
  },[camera,width,height,depth,front,reset,size.width,size.height]);
  return <OrbitControls ref={controls} makeDefault minDistance={30} maxDistance={1500} maxPolarAngle={Math.PI*.49} enableDamping/>;
}
/** Animate option transitions, then let the GPU rest until the next interaction. */
function TransitionFrames({design,open}:{design:FurnitureDesign;open:boolean}){
  const until=useRef(0);
  const invalidate=useThree(state=>state.invalidate);
  useEffect(()=>{until.current=performance.now()+2200;invalidate();},[design,open,invalidate]);
  useFrame(()=>{if(performance.now()<until.current)invalidate();});
  return null;
}
export default function FurnitureScene({design,open,dimensions,front,reset,selectedSectionId,onSelectSection}:{design:FurnitureDesign;open:boolean;dimensions:boolean;front:boolean;reset:number;selectedSectionId:string|null;onSelectSection:(id:string)=>void}) {
  const [ready,setReady]=useState(false);
  const [contextLost,setContextLost]=useState(false);
  const [contextKey,setContextKey]=useState(0);
  const footMaterial=useMemo(()=>new THREE.MeshStandardMaterial({color:'#202020',roughness:.65}),[]);
  useEffect(()=>()=>footMaterial.dispose(),[footMaterial]);
  const width=design.config.widthMm/10,depth=(design.kind==='desk'?design.config.depthMm:Math.max(design.config.depthMm,...design.config.sections.map(s=>s.localDepthMm??0)))/10,height=design.kind==='desk'?73:Math.max(design.config.heightMm,...design.config.sections.map(s=>s.localHeightMm??0))/10;
  return <><ConfiguratorLoading ready={ready||contextLost}/>{contextLost&&<div role="alert" style={{position:'absolute',inset:0,zIndex:20,display:'grid',placeContent:'center',gap:12,textAlign:'center',background:'#e6e4e0'}}><p>3D 화면 연결이 끊겼습니다. 편집한 디자인은 유지됩니다.</p><button onClick={()=>{setContextLost(false);setReady(false);setContextKey(value=>value+1);}}>3D 화면 다시 열기</button></div>}<Canvas key={contextKey} shadows frameloop="demand" dpr={[1,1.5]} camera={{position:[0,height/2,400],fov:40,near:1,far:5000}} onCreated={({gl})=>{gl.toneMapping=THREE.NeutralToneMapping;gl.toneMappingExposure=1;}}>
    <ContextStatus onLost={setContextLost}/>
    <color attach="background" args={['#e6e4e0']}/>
    <Environment resolution={128} frames={1} environmentIntensity={1.25}>
      <Lightformer form="rect" intensity={2} position={[0,6,3]} rotation-x={Math.PI/2} scale={[12,8,1]}/>
      <Lightformer form="rect" intensity={1.2} position={[-6,2,4]} rotation-y={Math.PI/3} scale={[5,7,1]}/>
      <Lightformer form="rect" intensity={.9} position={[6,2,4]} rotation-y={-Math.PI/3} scale={[5,7,1]}/>
      <Lightformer form="rect" intensity={.6} position={[0,1.5,7]} scale={[10,4,1]}/>
    </Environment>
    <ambientLight intensity={0.65}/>
    <directionalLight position={[-160,320,300]} intensity={1.9} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-350} shadow-camera-right={350} shadow-camera-top={400} shadow-camera-bottom={-150} shadow-camera-far={1000} shadow-bias={-.0004} shadow-normalBias={0.12}/>
    <mesh rotation-x={-Math.PI/2} position={[0,design.kind==='desk'?-1.08:-.03,0]} receiveShadow><planeGeometry args={[3000,3000]}/><meshStandardMaterial color="#deddd9" roughness={1}/></mesh>
    <Suspense fallback={null}>
      <Materials color={design.color}>{materials=><><TransitionFrames design={design} open={open}/><ModelReady onReady={setReady}/>{design.kind==='desk'?<DeskModel config={design.config} materials={materials} footMaterial={footMaterial} open={open} selectedSectionId={selectedSectionId} onSelectSection={onSelectSection} sectionIds={design.sectionIds}/>:design.config.model==='tone'?<Materials color={design.innerColor}>{inner=><WardrobeModel config={design.config} materials={materials} innerMaterials={inner} open={open} selectedSectionId={selectedSectionId} onSelectSection={onSelectSection}/>}</Materials>:design.color==='E_LightCleaf'||design.color==='E_DarkCleaf'?<Materials color={design.color==='E_LightCleaf'?'T_Cashmere':'T_Stone'}>{inner=><WardrobeModel config={design.config} materials={materials} innerMaterials={inner} open={open} selectedSectionId={selectedSectionId} onSelectSection={onSelectSection}/>}</Materials>:<WardrobeModel config={design.config} materials={materials} innerMaterials={materials} open={open} selectedSectionId={selectedSectionId} onSelectSection={onSelectSection}/>}</>}</Materials>
      {dimensions&&<>
        <Html position={[0,height+7,depth]} center style={{pointerEvents:'none',fontSize:13,color:'#555',whiteSpace:'nowrap'}}>{width} cm</Html>
        <Html position={[width/2+7,height/2,depth]} center style={{pointerEvents:'none',fontSize:13,color:'#555',whiteSpace:'nowrap'}}>{height} cm</Html>
      </>}
    </Suspense>
    <Camera width={width} height={height} depth={depth} front={front} reset={reset}/>
  </Canvas></>;
}
