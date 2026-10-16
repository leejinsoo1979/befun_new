'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { MaterialSet } from '@/lib/three/materials';
import type { DrawerPlacement } from '@/lib/three/hardware';
import { MoventoDrawerRails } from './blum/MoventoDrawerRails';
import { createPanelBox, panelEdgeRadius } from '@/lib/three/panel-edge';
import { Panel } from './Panel';
import { selectBefunMovento } from '@/lib/three/blum/moventoPlacement';

// GLTF 모델 프리로드
useGLTF.preload('/models/handle_drawer_unit.glb');
useGLTF.preload('/models/handle_door.glb');

const DRAWER_GAP = 0.3;

interface DrawerProps {
  placement: DrawerPlacement;
  materials: MaterialSet;
  isOpen: boolean;
  thickness: number;
}

function DrawerFront({ w, h, d, position, materials }: {
  w: number; h: number; d: number; position: [number, number, number]; materials: MaterialSet;
}) {
  const radius = panelEdgeRadius(materials);
  const geometry = useMemo(() => createPanelBox(w, h, d, radius), [w, h, d, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const faces = useMemo(() => [materials.verticalEdge, materials.verticalEdge,
    materials.horizontalEdge, materials.horizontalEdge, materials.backPanel, materials.backPanel], [materials]);
  return <mesh geometry={geometry} material={faces} position={position} castShadow={false} receiveShadow />;
}

export function Drawer(props: DrawerProps) {
  return props.placement.reference ? <ReferenceDrawer {...props} /> : <LegacyDrawer {...props} />;
}

function ReferenceDrawer({ placement, materials, isOpen, thickness }: DrawerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const reference = placement.reference!;
  const bottom = reference.parts.find(part => part.name === 'bottom');
  const front = reference.parts.find(part => part.name === 'front');
  const side = reference.parts.find(part => part.name === 'side-left');
  const frontBack = front ? front.z - front.d / 2 : 0;
  const rail = bottom && front && side
    ? selectBefunMovento(placement.z + frontBack, thickness, side.d) : null;
  const handleGltf = useGLTF(reference.handleKind === 'full-top' ? '/models/handle_drawer_unit.glb' : '/models/handle_door.glb');
  const fullWidth = reference.handleSize?.w;
  const fullHeight = reference.handleSize?.h;
  const fullDepth = reference.handleSize?.d;
  const handleScene = useMemo(() => {
    const clone = handleGltf.scene.clone();
    clone.traverse(child => {
      if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).material = materials.backPanel;
    });
    if (fullWidth !== undefined && fullHeight !== undefined && fullDepth !== undefined) {
      // Keep the existing local profile until the reference skeleton asset is
      // available; only its source part bounds and placement are verified.
      clone.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(clone);
      const size = bounds.getSize(new THREE.Vector3());
      clone.position.sub(bounds.getCenter(new THREE.Vector3()));
      const group = new THREE.Group();
      group.add(clone);
      group.scale.set(fullWidth / size.x, fullHeight / size.y, fullDepth / size.z);
      return group;
    }
    // Keep the native rear wing (-Z) and front grip (+Z) orientation.
    // Align the 1.5 mm mounting wing's inner face with the front panel back.
    clone.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    clone.position.sub(new THREE.Vector3(center.x, bounds.max.y - .05, bounds.min.z + .15 + (front?.d ?? thickness) / 2));
    const group = new THREE.Group();
    group.add(clone);
    return group;
  }, [handleGltf.scene, materials.backPanel, fullWidth, fullHeight, fullDepth, front?.d, thickness]);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = placement.z + (isOpen ? Math.min(reference.openDistance, rail ? rail.nominalLengthMm / 10 : Infinity) : 0);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, target, 1 - Math.exp(-10 * delta));
  });
  return <>
  {rail && bottom && <MoventoDrawerRails drawer={groupRef}
    origin={[placement.x, placement.y, placement.z]} width={placement.compartmentWidth}
    bottomUnder={bottom.y - bottom.h / 2} front={frontBack} />}
  <group ref={groupRef} position={[placement.x, placement.y, placement.z]}>
    {reference.parts.map(part => part.name === 'front' || part.name === 'back'
      ? <DrawerFront key={part.name} w={part.w} h={part.h} d={part.d} position={[part.x, part.y, part.z]} materials={materials} />
      : <Panel key={part.name} w={part.w} h={part.h} d={part.d} position={[part.x, part.y, part.z]}
          matType={part.name === 'bottom' ? 'horizontalBase' : 'verticalBase'} materials={materials} castShadow={false} />)}
    <primitive object={handleScene} position={[reference.handle.x, reference.handle.y, reference.handle.z]} />
  </group></>;
}

function LegacyDrawer({ placement, materials, isOpen, thickness }: DrawerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetZ = useRef(0);

  const { compartmentWidth, rowHeight, drawerDepth } = placement;

  // 타겟 Z 위치 업데이트 (열림: 25cm 앞으로)
  useEffect(() => {
    targetZ.current = placement.z + (isOpen ? 25 : 0);
  }, [isOpen, placement.z]);

  // 부드러운 슬라이드 애니메이션
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const current = groupRef.current.position.z;
    const target = targetZ.current;
    const diff = target - current;

    if (Math.abs(diff) > 0.01) {
      const speed = 5;
      groupRef.current.position.z = THREE.MathUtils.lerp(
        current,
        target,
        1 - Math.exp(-speed * 2 * delta),
      );
    }
  });

  // GLTF 핸들 로드
  const handleGltf = useGLTF('/models/handle_drawer_unit.glb');

  // 핸들 클론에 재질 적용
  const handleScene = useMemo(() => {
    const clone = handleGltf.scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = materials.backPanel.clone();
        (child as THREE.Mesh).receiveShadow = true;
      }
    });
    return clone;
  }, [handleGltf.scene, materials.backPanel]);

  // 서랍 내부 치수 계산 (v1 createDrawerGrid 이식)
  const dims = useMemo(() => {
    const bottomW = compartmentWidth - thickness - 4;
    const bottomH = thickness - 0.5;
    const bottomD = drawerDepth - 3.5;
    const bottomY = -(rowHeight - thickness) / 2 + 2.5;
    const bottomZ = drawerDepth / 2 + 3.75 - 1;

    const backW = compartmentWidth - 6;
    const backH = rowHeight - 4.5;
    const backD = thickness - 0.5;
    const backY = 0.25;
    const backZ = thickness + 2.75 - 2;

    const frontW = compartmentWidth - 2 - DRAWER_GAP * 2;
    const frontH = rowHeight - 2 - DRAWER_GAP * 2;
    const frontD = thickness;
    const frontY = -1;
    const frontZ = drawerDepth + thickness / 2;

    const sideH = rowHeight - 2.5;
    const sideD = drawerDepth - 2;
    const sideW = thickness - 0.5;
    const sideY = -1.25 + 0.5;
    const sideZ = drawerDepth / 2 + thickness / 2;

    const leftX = -(compartmentWidth / 2) + 3 - 0.25 + 0.5 + 1;
    const rightX = (compartmentWidth / 2) - thickness / 2 + 0.25 - 0.5 - 1 + 2;

    // 핸들 위치
    const handleScaleX = frontW;
    const handleY = rowHeight / 2 - 1.9 - DRAWER_GAP;
    const handleZ = drawerDepth + 1;

    return {
      bottom: { w: bottomW, h: bottomH, d: bottomD, y: bottomY, z: bottomZ },
      back: { w: backW, h: backH, d: backD, y: backY, z: backZ },
      front: { w: frontW, h: frontH, d: frontD, y: frontY, z: frontZ },
      side: { w: sideW, h: sideH, d: sideD, y: sideY, z: sideZ },
      leftX,
      rightX,
      handleScaleX,
      handleY,
      handleZ,
    };
  }, [compartmentWidth, rowHeight, drawerDepth, thickness]);

  const railFront = dims.front.z - dims.front.d / 2;
  const rail = selectBefunMovento(placement.z + railFront, thickness, dims.side.d);

  return (
    <>
    {rail && <MoventoDrawerRails drawer={groupRef}
      origin={[placement.x, placement.y, placement.z]} width={compartmentWidth}
      bottomUnder={dims.bottom.y - dims.bottom.h / 2} front={railFront} />}
    <group ref={groupRef} position={[placement.x, placement.y, placement.z]}>
      <Panel w={dims.bottom.w} h={dims.bottom.h} d={dims.bottom.d} position={[0, dims.bottom.y, dims.bottom.z]}
        matType="horizontalBase" materials={materials} castShadow={false} />
      <DrawerFront w={dims.back.w} h={dims.back.h} d={dims.back.d} position={[0, dims.back.y, dims.back.z]} materials={materials} />
      <DrawerFront w={dims.front.w} h={dims.front.h} d={dims.front.d} position={[0, dims.front.y, dims.front.z]} materials={materials} />
      <Panel w={dims.side.w} h={dims.side.h} d={dims.side.d} position={[dims.leftX, dims.side.y, dims.side.z]}
        matType="verticalBase" materials={materials} castShadow={false} />
      <Panel w={dims.side.w} h={dims.side.h} d={dims.side.d} position={[dims.rightX, dims.side.y, dims.side.z]}
        matType="verticalBase" materials={materials} castShadow={false} />

      {/* 서랍 손잡이 */}
      <primitive
        object={handleScene}
        position={[0, dims.handleY, dims.handleZ]}
        scale={[dims.handleScaleX, 1, 1]}
      />
    </group>
    </>
  );
}
