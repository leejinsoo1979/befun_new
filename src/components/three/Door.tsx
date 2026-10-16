'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useBoredBoxGeometry } from '@/lib/three/blum/useBoredBox';
import type { Bore } from '@/lib/three/blum/boring';

const NO_HOLES: readonly Bore[] = [];
import type { BlumDoorPlan } from '@/lib/three/blum/boring';
import { BlumCup } from './blum/BlumHardware';
import type { MaterialSet } from '@/lib/three/materials';
import type { DoorPlacement } from '@/lib/three/hardware';
import { createType01Handle } from '@/lib/three/type01-handle';

useGLTF.preload('/models/handle_door.glb');



interface DoorProps {
  placement: DoorPlacement;
  materials: MaterialSet;
  isOpen: boolean;
  thickness: number;
  blum?: BlumDoorPlan;
  revealBores?: boolean;
}

export function Door({ placement, materials, isOpen, thickness, blum, revealBores = false }: DoorProps) {
  const groupRef = useRef<THREE.Group>(null);

  const reference = placement.reference;
  const isReference = !!reference;
  const handleGltf = useGLTF('/models/handle_door.glb');


  const panelThickness = reference?.thickness ?? thickness;
  const frontOffsetY = reference?.frontOffsetY ?? 0;
  const geometry = useBoredBoxGeometry(placement.width, placement.height, panelThickness, blum?.holes ?? NO_HOLES, [placement.pivotOffsetX, frontOffsetY, 0]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = isOpen ? reference?.openAngle ?? Math.PI / 2 : 0;
    const rotation = THREE.MathUtils.lerp(groupRef.current.rotation.y, target, 1 - Math.exp(-(isOpen ? 8 : 10) * delta));
    groupRef.current.rotation.y = rotation;

  });

  const handleScene = useMemo(() => {
    const clone = handleGltf.scene.clone();
    clone.traverse(child => {
      if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).material = materials.backPanel;
    });
    if (!isReference) return clone;
    // Native profile: rear mounting wing at -Z, finger grip at +Z.
    // The wing is 1.5 mm thick; its inner face rests on the panel back.
    clone.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    clone.position.sub(new THREE.Vector3(center.x, bounds.max.y - .05, bounds.min.z + .15 + panelThickness / 2));
    const group = new THREE.Group();
    group.add(clone);
    return group;
  }, [handleGltf.scene, materials.backPanel, isReference, panelThickness]);
  const fullKind = reference?.handleKind;
  const fullHeight = reference?.handleSize?.h ?? 1;
  const fullHandleGeometry = useMemo(() =>
    fullKind === 'full-left' || fullKind === 'full-right'
      ? createType01Handle(fullKind, fullHeight) : null,
  [fullKind, fullHeight]);
  useEffect(() => () => fullHandleGeometry?.dispose(), [fullHandleGeometry]);
  const handle = reference ? reference.handle : { x: -placement.width + 7.5, y: placement.height / 2 - .15, z: 1.1 };
  const sign = blum?.side === 'left' ? 1 : -1;
  const pivot: [number,number,number] = [placement.pivotOffsetX - sign * placement.width / 2, 0, -panelThickness/2];

  return (
    <group position={[placement.x, placement.y, placement.z]}>
    <group ref={groupRef} position={pivot} userData={{displayDoorPivot:true}}>
    <group position={[-pivot[0],0,-pivot[2]]}>
      <mesh geometry={geometry} material={materials.backPanel} castShadow={false} receiveShadow />
      {handle && (fullHandleGeometry
        ? <mesh geometry={fullHandleGeometry} material={materials.backPanel} position={[handle.x, handle.y, handle.z]} castShadow receiveShadow />
        : <primitive object={handleScene} position={[handle.x, handle.y, handle.z]}
          rotation={[0, 0, reference?.handleRotation ?? 0]} />)}
      <group visible={!revealBores} userData={{displayRestoreVisible:true}}>
      {blum?.cups.map((c,i) => {
        const center: [number,number,number] = [c[0]/10+placement.pivotOffsetX,c[1]/10+frontOffsetY,c[2]/10];
        const mount=blum.mounts[i];
        const platePoint: [number,number,number] = [mount.position[0]-placement.x+sign*.85,mount.position[1]-placement.y,mount.position[2]-placement.z];
        return <BlumCup key={i} center={center} inwardSign={sign} platePoint={platePoint} pivot={pivot} opening={groupRef}/>;
      })}
      </group>
    </group>
    </group>
    </group>
  );
}
