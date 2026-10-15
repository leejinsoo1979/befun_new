'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import {DeskPanel} from './DeskPanel';
import type {DeskCableOpening} from '@/lib/furniture/desk';
import type {Bore} from '@/lib/three/blum/boring';
const NO_BORES:readonly Bore[]=[];
const NO_OPENINGS:readonly DeskCableOpening[]=[];
import type { MaterialSet } from '@/lib/three/materials';
import { generateWardrobe, type WardrobeInput, type WardrobeFront, type WardrobeDrawer, type WardrobeBar } from '@/lib/furniture/wardrobe';
import { resolveWardrobeDoorMotions, type WardrobeDoorMotion } from '@/lib/furniture/wardrobe/door-motion';
import { resolveWardrobePanelSeams } from '@/lib/furniture/wardrobe/panel-seams';
import {loadWardrobeHingeGeometry} from '@/lib/furniture/wardrobe-hinge-assets';
import {resolveWardrobeHingePlacements,type WardrobeHingePlacement,type WardrobeHingeDoor} from '@/lib/furniture/wardrobe-hinges';
import { createType01Handle } from '@/lib/three/type01-handle';
import { createWardrobeGripHandle, createWardrobeShortHandle, createWardrobeFrontBar, createWardrobeCrossBar, createWardrobeLightProfile, createWardrobeLightDiffuser, createWardrobeRingHandle, createWardrobeRingHole, loadWardrobeFullHandle } from '@/lib/furniture/wardrobe-hardware';

function FullDrawerHandle({width,handle,material}:{width:number;handle:NonNullable<WardrobeFront['handle']>;material:THREE.Material}){
  const [loaded,setLoaded]=useState<{width:number;geometry:THREE.BufferGeometry}|null>(null);
  const invalidate=useThree(state=>state.invalidate);
  useEffect(()=>{
    let disposed=false;
    let owned:THREE.BufferGeometry|undefined;
    loadWardrobeFullHandle(width).then(geometry=>{
      if(disposed){geometry.dispose();return;}
      owned=geometry;setLoaded({width,geometry});invalidate();
    }).catch(error=>console.error('Drawer handle asset could not be loaded',error));
    return()=>{disposed=true;owned?.dispose();};
  },[width,invalidate]);
  return loaded?.width===width?<mesh geometry={loaded.geometry} material={material} position={[handle.x,handle.y,handle.z]} castShadow receiveShadow dispose={null}/>:null;
}

function Handle({handle,material}:{handle:NonNullable<WardrobeFront['handle']>;material:THREE.Material}){
  const geometry=useMemo(()=>{
    if(handle.asset==='ringHandle')return createWardrobeRingHandle();
    if(handle.asset==='gripHandle')return createWardrobeGripHandle();
    if(handle.asset==='shortHandleLeft'||handle.asset==='shortHandleRight')return createWardrobeShortHandle(handle.asset==='shortHandleLeft'?'left':'right');
    if(handle.height&&(handle.asset==='fullHandleLeft'||handle.asset==='fullHandleRight'))return createType01Handle(handle.asset==='fullHandleLeft'?'full-left':'full-right',handle.height);
    return null;
  },[handle.asset,handle.height]);
  const hole=useMemo(()=>handle.asset==='ringHandle'?createWardrobeRingHole():null,[handle.asset]);
  useEffect(()=>()=>{geometry?.dispose();hole?.dispose();},[geometry,hole]);
  if(!geometry)return null;
  return <group position={[handle.x,handle.y,handle.z]}>
    {handle.asset==='ringHandle'?<mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color="#bfbfbf" metalness={1} roughness={.2}/></mesh>:<mesh geometry={geometry} material={material} castShadow receiveShadow/>}
    {hole&&<mesh geometry={hole} position-z={.1}><meshStandardMaterial color="#302923" roughness={.85}/></mesh>}
  </group>;
}
function Front({front,motion,materials,open,interior,onSelect,hinges,hingeGeometry}:{front:WardrobeFront;motion:WardrobeDoorMotion;materials:MaterialSet;open:boolean;interior:boolean;onSelect:(id:string)=>void;hinges:WardrobeHingePlacement[];hingeGeometry:THREE.BufferGeometry|null}){
  const hinge=useRef<THREE.Group>(null);
  const target=open?(interior?motion.openAngle:motion.ajarAngle):0;
  useFrame((_,delta)=>{if(hinge.current)hinge.current.rotation.y=THREE.MathUtils.damp(hinge.current.rotation.y,target,9,delta);});
  return <group ref={hinge} position={[motion.pivotX,0,motion.pivotZ]} onClick={event=>{event.stopPropagation();onSelect(front.sectionId);}} userData={{sectionId:front.sectionId,doorId:front.id,limitedBy:motion.limitedBy}}>
    <group position={[-motion.pivotX,0,-motion.pivotZ]}>
      {hingeGeometry&&hinges.map((hinge,i)=><HingeMesh key={i} geometry={hingeGeometry} placement={hinge}/>)}
      <DeskPanel panel={front} bores={NO_BORES} openings={NO_OPENINGS} materials={materials}/>
      {front.handle&&<Handle handle={front.handle} material={materials.backPanel}/>}
    </group>
  </group>;
}
function SlidingDrawer({drawer,materials,bodyMaterials,open,onSelect}:{drawer:WardrobeDrawer;materials:MaterialSet;bodyMaterials:MaterialSet;open:boolean;onSelect:(id:string)=>void}){
  const moving=useRef<THREE.Group>(null);
  useFrame((_,delta)=>{if(moving.current)moving.current.position.z=THREE.MathUtils.damp(moving.current.position.z,open?drawer.travelCm:0,8,delta);});
  return <group ref={moving} onClick={event=>{event.stopPropagation();onSelect(drawer.sectionId);}} userData={{sectionId:drawer.sectionId,drawerId:drawer.id}}>
    {drawer.parts.map((part,i)=><DeskPanel key={i} panel={part} bores={NO_BORES} openings={NO_OPENINGS} materials={bodyMaterials}/>)}
    <DeskPanel panel={drawer.front} bores={NO_BORES} openings={NO_OPENINGS} materials={materials}/>
    {drawer.front.handle&&(drawer.front.handle.asset==='fullHandleTop'?<FullDrawerHandle width={drawer.front.w} handle={drawer.front.handle} material={bodyMaterials.backPanel}/>:<Handle handle={drawer.front.handle} material={bodyMaterials.backPanel}/>)}
  </group>;
}
function Rail({bar,material}:{bar:WardrobeBar;material:THREE.Material}){
  const geometry=useMemo(()=>bar.axis==='x'?createWardrobeFrontBar(bar.w):createWardrobeCrossBar(bar.d),[bar.axis,bar.w,bar.d]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} material={material} position={[bar.x,bar.y,bar.z]} castShadow receiveShadow/>;
}
function HingeMesh({geometry,placement}:{geometry:THREE.BufferGeometry;placement:WardrobeHingePlacement}){
  const material=useMemo(()=>new THREE.MeshStandardMaterial({color:'#c5c5c5',metalness:1,roughness:.24}),[]);
  useEffect(()=>()=>material.dispose(),[material]);
  return <mesh geometry={geometry} material={material} position={placement.position} rotation-z={placement.rotationZ} castShadow receiveShadow dispose={null}/>;
}
function useHingeAssets(){
  const invalidate=useThree(state=>state.invalidate);
  const [loaded,setLoaded]=useState<{wing:THREE.BufferGeometry;anchor:THREE.BufferGeometry}|null>(null);
  useEffect(()=>{
    let disposed=false;
    const owned:THREE.BufferGeometry[]=[];
    Promise.all(['hingeWing','hingeAnchor'].map(asset=>loadWardrobeHingeGeometry(asset as 'hingeWing'|'hingeAnchor').then(geometry=>{if(disposed)geometry.dispose();else owned.push(geometry);return geometry;}))).then(([wing,anchor])=>{if(!disposed){setLoaded({wing,anchor});invalidate();}}).catch(()=>{for(const geometry of owned)geometry.dispose();});
    return()=>{disposed=true;for(const geometry of owned)geometry.dispose();};
  },[invalidate]);
  return loaded;
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
export function WardrobeModel({config,materials,innerMaterials,open,interior,selectedSectionId,onSelectSection}:{config:WardrobeInput;materials:MaterialSet;innerMaterials:MaterialSet;open:boolean;interior:boolean;selectedSectionId:string|null;onSelectSection:(id:string)=>void}){
  const result=useMemo(()=>generateWardrobe(config),[config]);
  const doorMotions=useMemo(()=>resolveWardrobeDoorMotions(result.fronts),[result.fronts]);
  const source=result.sourceGeometryMm;
  const panelSeams=useMemo(()=>source?resolveWardrobePanelSeams(source):[],[source]);
  const hingeAssets=useHingeAssets();
  const hinges=useMemo(()=>source?.hinges?resolveWardrobeHingePlacements(config.model,source.doors as WardrobeHingeDoor[],source.walls,source.hinges):[],[source,config.model]);
  const panelOpenings=useMemo(()=>result.panels.map((panel,index):DeskCableOpening[]=>panel.matType==='backPanel'?(result.sourceGeometryMm?.cable_management??[]).filter(hole=>Math.abs(hole.z1/10-panel.z)<=panel.d/2&&Math.abs(hole.x1/10-panel.x)<panel.w/2&&Math.abs(hole.y1/10-panel.y)<panel.h/2).map(hole=>({panelIndex:index,columnIndex:0,storageIndex:0,surface:'back',x:hole.x1/10,y:hole.y1/10,z:hole.z1/10,radius:3})):[]),[result]);
  const frameStart=source?source.slabs.length+source.walls.length+source.backs.length:Infinity;
  return <group name="befun-wardrobe" userData={{model:config.model,unsupported:result.unsupported,panelCount:result.panels.length,doorCount:result.fronts.length,drawerCount:result.drawers?.length??0}}>
    {result.panels.map((panel,index)=><DeskPanel key={`panel-${index}`} panel={panel} bores={NO_BORES} openings={panelOpenings[index]} materials={config.model==='tone'&&index<frameStart?innerMaterials:materials}/>)}
    {panelSeams.map(seam=><Line key={seam.id} points={seam.points} segments color="#49443e" lineWidth={0.85} transparent opacity={0.42} depthTest depthWrite={false} raycast={()=>null}/>)}
    {result.fronts.map((front,index)=><Front key={`${front.id}:${doorMotions[index].pivotX}:${doorMotions[index].pivotZ}`} front={front} motion={doorMotions[index]} materials={materials} open={open} interior={interior} onSelect={onSelectSection} hinges={hinges.filter(h=>h.asset==='hingeWing'&&h.doorIndex===Number(front.id.replace('door-','')))} hingeGeometry={hingeAssets?.wing??null}/>)}
    {result.drawers?.map(drawer=><SlidingDrawer key={drawer.id} drawer={drawer} materials={drawer.front.external?materials:innerMaterials} bodyMaterials={innerMaterials} open={open&&interior} onSelect={onSelectSection}/>)}
    {hingeAssets&&hinges.filter(h=>h.asset==='hingeAnchor').map((hinge,i)=><HingeMesh key={`anchor-${i}`} geometry={hingeAssets.anchor} placement={hinge}/>)}
    {source?.lighting?.map((part,index)=><CabinetLight key={`light-${index}`} part={part}/>)}
    {result.bars.map(bar=><Rail key={bar.id} bar={bar} material={innerMaterials.backPanel}/>)}
    {result.sections.map(section=><mesh key={section.id} position={[section.x,section.height/2,section.depth+.1]} userData={{selectionCollider:true,sectionId:section.id}} onClick={event=>{event.stopPropagation();onSelectSection(section.id);}}>
      <planeGeometry args={[section.width,section.height]}/><meshBasicMaterial color="#79ab55" transparent opacity={selectedSectionId===section.id?0.025:0} depthWrite={false}/>
    </mesh>)}
  </group>;
}
