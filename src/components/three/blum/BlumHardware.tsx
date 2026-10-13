'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { ExtrudeGeometry, Group, LatheGeometry, Mesh, Path, Quaternion, Shape, Vector2, Vector3 } from 'three';
import type { HingeMount, Point } from '@/lib/three/blum/boring';

const metal = { color:'#b9bec5', metalness:.88, roughness:.24 };
const darkMetal = { color:'#5c636c', metalness:.8, roughness:.32 };
function Screw({ position, axis = 'z' }: { position: Point; axis?: 'x'|'z' }) {
  return <group position={position} rotation={axis==='x'?[0,0,Math.PI/2]:[Math.PI/2,0,0]}>
    <mesh><cylinderGeometry args={[.31,.28,.12,20]}/><meshStandardMaterial {...metal}/></mesh>
    <mesh position={[0,.065,0]}><boxGeometry args={[.4,.018,.055]}/><meshStandardMaterial color="#363c43"/></mesh>
    <mesh position={[0,.066,0]}><boxGeometry args={[.055,.018,.4]}/><meshStandardMaterial color="#363c43"/></mesh>
  </group>;
}

/** Parametric visualization; drilling follows the cited technical data, mesh is not supplier CAD. */
export function BlumCup({ center, inwardSign, platePoint, opening, pivot }: {
  center: Point; inwardSign: number; platePoint: Point; opening: RefObject<Group|null>; pivot: Point;
}) {
  const armA=useRef<Mesh>(null), armB=useRef<Mesh>(null);
  const cup = useMemo(() => new LatheGeometry([
    new Vector2(0,1.25), new Vector2(1.68,1.25),new Vector2(1.735,1.18),new Vector2(1.735,0),
    new Vector2(1.62,0),new Vector2(1.62,1.1),new Vector2(0,1.1),
  ],48),[]);
  const flange=useMemo(()=>{
    const shape=new Shape();
    // 57mm along hinge axis; INSERTA boss envelope 43mm across the door.
    shape.moveTo(-1.8,-2.85);shape.lineTo(2.5,-2.85);shape.lineTo(2.5,2.85);shape.lineTo(-1.8,2.85);shape.closePath();
    const hole=new Path();hole.absarc(0,0,1.62,0,Math.PI*2,true);shape.holes.push(hole);
    return new ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false,curveSegments:48});
  },[]);
  useEffect(()=>()=>{cup.dispose();flange.dispose();},[cup,flange]);
  const vectors=useMemo(()=>({end:new Vector3(),start:new Vector3(),mid:new Vector3(),axis:new Vector3(0,1,0),delta:new Vector3()}),[]);
  useEffect(()=>{
    const a=new Vector3(inwardSign*.85,0,-.35);
    const b=new Vector3(platePoint[0]-center[0],platePoint[1]-center[1],platePoint[2]-center[2]);
    const mid=a.clone().lerp(b,.44);mid.z-=.65;
    for(const [mesh,start,end] of [[armA.current,a,mid],[armB.current,mid,b]] as const) if(mesh) {
      mesh.userData.displayClosedPose={position:start.clone().add(end).multiplyScalar(.5).toArray(),scale:[1,end.distanceTo(start),1],quaternion:new Quaternion().setFromUnitVectors(new Vector3(0,1,0),end.clone().sub(start).normalize()).toArray()};
    }
  },[center,inwardSign,platePoint]);
  useFrame(()=>{
    const angle=opening.current?.rotation.y??0;
    vectors.end.set(platePoint[0]-pivot[0],platePoint[1]-pivot[1],platePoint[2]-pivot[2]).applyAxisAngle(vectors.axis,-angle);
    vectors.end.set(vectors.end.x+pivot[0]-center[0],vectors.end.y+pivot[1]-center[1],vectors.end.z+pivot[2]-center[2]);
    vectors.start.set(inwardSign*.85,0,-.35);
    vectors.mid.copy(vectors.start).lerp(vectors.end,.44); vectors.mid.setZ(vectors.mid.z-.65);
    // Two articulated visual links retain the cup-to-plate connection while opening.
    for(const [mesh,a,b] of [[armA.current,vectors.start,vectors.mid],[armB.current,vectors.mid,vectors.end]] as const) {
      if(!mesh) continue;
      mesh.position.copy(a).add(b).multiplyScalar(.5);
      vectors.delta.copy(b).sub(a);mesh.scale.set(1,vectors.delta.length(),1);
      mesh.quaternion.setFromUnitVectors(vectors.axis,vectors.delta.normalize());
    }
  });
  return <group position={center} userData={{hardware:'Blum 71B3790', representation:'parametric', preinstalled:true}}>
    <mesh geometry={cup} rotation={[Math.PI/2,0,0]}><meshStandardMaterial {...metal}/></mesh>
    <group scale={[inwardSign,1,1]}>
      <mesh geometry={flange} position={[0,0,-.12]}><meshStandardMaterial {...metal}/></mesh>
      {[-1,1].map(sign=><group key={sign}>
        <mesh position={[.95,sign*2.25,.62]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.395,.395,1.24,24]}/><meshStandardMaterial color="#515760" roughness={.5}/></mesh>
        <Screw position={[.95,sign*2.25,-.2]}/>
      </group>)}
      <mesh position={[.75,0,-.42]}><boxGeometry args={[2.2,1.25,.6]}/><meshStandardMaterial {...darkMetal}/></mesh>
    </group>
    <mesh ref={armA}><boxGeometry args={[.65,1,1.1]}/><meshStandardMaterial {...metal}/></mesh>
    <mesh ref={armB}><boxGeometry args={[.55,1,.95]}/><meshStandardMaterial {...metal}/></mesh>
  </group>;
}

/** Remains a child of its actual side board during assembly/explosion. */
export function BlumPlate({ mount }: { mount: HingeMount }) {
  const s=mount.inwardSign;
  return <group position={mount.position} userData={{hardware:'Blum 174H7100E', representation:'parametric', preinstalled:true}}>
    <mesh position={[s*.08,0,0]}><boxGeometry args={[.16,4.6,1.5]}/><meshStandardMaterial {...metal}/></mesh>
    <mesh position={[s*.4,0,0]}><boxGeometry args={[.8,1.8,2.5]}/><meshStandardMaterial {...darkMetal}/></mesh>
    <mesh position={[s*.78,0,0]}><boxGeometry args={[.14,1.6,2.5]}/><meshStandardMaterial {...metal}/></mesh>
    {[-1,1].map(sign=><group key={sign}>
      <mesh position={[-s*.55,sign*1.6,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.245,.245,1.1,16]}/><meshStandardMaterial color="#4b5158"/></mesh>
      <Screw position={[s*.2,sign*1.6,0]} axis="x"/>
    </group>)}
    <Screw position={[s*.88,0,0]} axis="x"/>
  </group>;
}
