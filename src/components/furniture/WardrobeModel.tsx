'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Panel } from '@/components/three/Panel';
import type { MaterialSet } from '@/lib/three/materials';
import { generateWardrobe, type WardrobeInput, type WardrobeFront, type WardrobeDrawer, type WardrobeBar } from '@/lib/furniture/wardrobe';
import { createType01Handle } from '@/lib/three/type01-handle';
import { createWardrobeGripHandle, createWardrobeShortHandle, createWardrobeFrontBar, createWardrobeCrossBar, createWardrobeLightProfile, createWardrobeLightDiffuser } from '@/lib/furniture/wardrobe-hardware';

function Handle({handle,material}:{handle:NonNullable<WardrobeFront['handle']>;material:THREE.Material}){
  const geometry=useMemo(()=>{
    if(handle.asset==='gripHandle')return createWardrobeGripHandle();
    if(handle.asset==='shortHandleLeft'||handle.asset==='shortHandleRight')return createWardrobeShortHandle(handle.asset==='shortHandleLeft'?'left':'right');
    if(handle.height&&(handle.asset==='fullHandleLeft'||handle.asset==='fullHandleRight'))return createType01Handle(handle.asset==='fullHandleLeft'?'full-left':'full-right',handle.height);
    return null;
  },[handle.asset,handle.height]);
  useEffect(()=>()=>geometry?.dispose(),[geometry]);
  return geometry?<mesh geometry={geometry} material={material} position={[handle.x,handle.y,handle.z]} castShadow receiveShadow/>:null;
}
function Front({front,materials,open,onSelect}:{front:WardrobeFront;materials:MaterialSet;open:boolean;onSelect:(id:string)=>void}){
  const hinge=useRef<THREE.Group>(null);
  useFrame((_,delta)=>{if(hinge.current)hinge.current.rotation.y=THREE.MathUtils.damp(hinge.current.rotation.y,open?front.openAngle:0,9,delta);});
  return <group ref={hinge} position={[front.pivotX,0,front.z]} onClick={event=>{event.stopPropagation();onSelect(front.sectionId);}} userData={{sectionId:front.sectionId,doorId:front.id}}>
    <group position={[-front.pivotX,0,-front.z]}>
      <Panel {...front} position={[front.x,front.y,front.z]} materials={materials}/>
      {front.handle&&<Handle handle={front.handle} material={materials.backPanel}/>}
    </group>
  </group>;
}
function SlidingDrawer({drawer,materials,open,onSelect}:{drawer:WardrobeDrawer;materials:MaterialSet;open:boolean;onSelect:(id:string)=>void}){
  const moving=useRef<THREE.Group>(null);
  useFrame((_,delta)=>{if(moving.current)moving.current.position.z=THREE.MathUtils.damp(moving.current.position.z,open?drawer.travelCm:0,8,delta);});
  return <group ref={moving} onClick={event=>{event.stopPropagation();onSelect(drawer.sectionId);}} userData={{sectionId:drawer.sectionId,drawerId:drawer.id}}>
    {[...drawer.parts,drawer.front].map((part,i)=><Panel key={i} {...part} position={[part.x,part.y,part.z]} materials={materials}/>)}
    {drawer.front.handle&&<Handle handle={drawer.front.handle} material={materials.backPanel}/>}
  </group>;
}
function Rail({bar,material}:{bar:WardrobeBar;material:THREE.Material}){
  const geometry=useMemo(()=>bar.axis==='x'?createWardrobeFrontBar(bar.w):createWardrobeCrossBar(bar.d),[bar.axis,bar.w,bar.d]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} material={material} position={[bar.x,bar.y,bar.z]} castShadow receiveShadow/>;
}
function CabinetLight({part}:{part:{x1:number;x2:number;y1:number;z2:number}}){
  const width=(part.x2-part.x1)/10;
  const profile=useMemo(()=>createWardrobeLightProfile(width),[width]);
  const diffuser=useMemo(()=>createWardrobeLightDiffuser(width),[width]);
  useEffect(()=>()=>{profile.dispose();diffuser.dispose();},[profile,diffuser]);
  return <group position={[(part.x1+part.x2)/20,(part.y1+7)/10,(part.z2-24)/10]}>
    <mesh geometry={profile} castShadow receiveShadow><meshStandardMaterial color="#737575" metalness={0.75} roughness={0.35}/></mesh>
    <mesh geometry={diffuser}><meshStandardMaterial color="#fff6e6" emissive="#fff1d7" emissiveIntensity={1.2} toneMapped={false}/></mesh>
  </group>;
}
export function WardrobeModel({config,materials,innerMaterials,open,selectedSectionId,onSelectSection}:{config:WardrobeInput;materials:MaterialSet;innerMaterials:MaterialSet;open:boolean;selectedSectionId:string|null;onSelectSection:(id:string)=>void}){
  const result=useMemo(()=>generateWardrobe(config),[config]);
  const source=result.sourceGeometryMm;
  const frameStart=source?source.slabs.length+source.walls.length+source.backs.length:Infinity;
  return <group name="befun-wardrobe" userData={{model:config.model,unsupported:result.unsupported,panelCount:result.panels.length,doorCount:result.fronts.length,drawerCount:result.drawers?.length??0}}>
    {result.panels.map((panel,index)=><Panel key={`panel-${index}`} {...panel} position={[panel.x,panel.y,panel.z]} materials={config.model==='tone'&&index<frameStart?innerMaterials:materials}/>)}
    {result.fronts.map(front=><Front key={front.id} front={front} materials={materials} open={open} onSelect={onSelectSection}/>)}
    {result.drawers?.map(drawer=><SlidingDrawer key={drawer.id} drawer={drawer} materials={drawer.front.external?materials:innerMaterials} open={open} onSelect={onSelectSection}/>)}
    {source?.lighting?.map((part,index)=><CabinetLight key={`light-${index}`} part={part}/>)}
    {result.bars.map(bar=><Rail key={bar.id} bar={bar} material={innerMaterials.backPanel}/>)}
    {result.sections.map(section=><mesh key={section.id} position={[section.x,section.height/2,section.depth+.1]} userData={{selectionCollider:true,sectionId:section.id}} onClick={event=>{event.stopPropagation();onSelectSection(section.id);}}>
      <planeGeometry args={[section.width,section.height]}/><meshBasicMaterial color="#79ab55" transparent opacity={selectedSectionId===section.id?0.025:0} depthWrite={false}/>
    </mesh>)}
  </group>;
}
