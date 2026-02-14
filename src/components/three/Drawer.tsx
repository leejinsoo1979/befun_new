'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { MaterialSet } from '@/lib/three/materials';
import type { DrawerPlacement } from '@/lib/three/hardware';

// GLTF 모델 프리로드
useGLTF.preload('/models/handle_drawer_unit.glb');

const DRAWER_GAP = 0.3;

interface DrawerProps {
  placement: DrawerPlacement;
  materials: MaterialSet;
  isOpen: boolean;
  thickness: number;
}

export function Drawer({ placement, materials, isOpen, thickness }: DrawerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetZ = useRef(0);

  const { compartmentWidth, rowHeight, drawerDepth } = placement;

  // 타겟 Z 위치 업데이트 (열림: 25cm 앞으로)
  useEffect(() => {
    targetZ.current = isOpen ? 25 : 0;
  }, [isOpen]);

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
        1 - Math.pow(1 - speed * delta, 2),
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

  const mat = materials.verticalBase;

  return (
    <group ref={groupRef} position={[placement.x, placement.y, placement.z]}>
      {/* 바닥 */}
      <mesh position={[0, dims.bottom.y, dims.bottom.z]} material={mat} castShadow={false} receiveShadow>
        <boxGeometry args={[dims.bottom.w, dims.bottom.h, dims.bottom.d]} />
      </mesh>

      {/* 뒷면 */}
      <mesh position={[0, dims.back.y, dims.back.z]} material={mat} castShadow={false} receiveShadow>
        <boxGeometry args={[dims.back.w, dims.back.h, dims.back.d]} />
      </mesh>

      {/* 앞면 */}
      <mesh position={[0, dims.front.y, dims.front.z]} material={mat} castShadow={false} receiveShadow>
        <boxGeometry args={[dims.front.w, dims.front.h, dims.front.d]} />
      </mesh>

      {/* 왼쪽면 */}
      <mesh position={[dims.leftX, dims.side.y, dims.side.z]} material={mat} castShadow={false} receiveShadow>
        <boxGeometry args={[dims.side.w, dims.side.h, dims.side.d]} />
      </mesh>

      {/* 오른쪽면 */}
      <mesh position={[dims.rightX, dims.side.y, dims.side.z]} material={mat} castShadow={false} receiveShadow>
        <boxGeometry args={[dims.side.w, dims.side.h, dims.side.d]} />
      </mesh>

      {/* 서랍 손잡이 */}
      <primitive
        object={handleScene}
        position={[0, dims.handleY, dims.handleZ]}
        scale={[dims.handleScaleX, 1, 1]}
      />
    </group>
  );
}
