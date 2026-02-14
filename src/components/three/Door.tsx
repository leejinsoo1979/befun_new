'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { MaterialSet } from '@/lib/three/materials';
import type { DoorPlacement } from '@/lib/three/hardware';

// GLTF 모델 프리로드
useGLTF.preload('/models/handle_door.glb');
useGLTF.preload('/models/hinge_right_fe.glb');
useGLTF.preload('/models/hinge_right.glb');

interface DoorProps {
  placement: DoorPlacement;
  materials: MaterialSet;
  isOpen: boolean;
  thickness: number;
}

export function Door({ placement, materials, isOpen, thickness }: DoorProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hingeTopRef = useRef<THREE.Group>(null);
  const hingeBottomRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);

  // GLTF 모델 로드
  const handleGltf = useGLTF('/models/handle_door.glb');
  const hingeFeGltf = useGLTF('/models/hinge_right_fe.glb');
  const hingeGltf = useGLTF('/models/hinge_right.glb');

  // 도어 지오메트리 (pivot offset 적용)
  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(placement.width, placement.height, thickness);
    geo.translate(placement.pivotOffsetX, 0, 0);
    return geo;
  }, [placement.width, placement.height, placement.pivotOffsetX, thickness]);

  // 타겟 각도 업데이트
  useEffect(() => {
    targetRotation.current = isOpen ? Math.PI / 2 : 0;
  }, [isOpen]);

  // 부드러운 회전 애니메이션 (GSAP 대체 — useFrame 기반)
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const current = groupRef.current.rotation.y;
    const target = targetRotation.current;
    const diff = target - current;

    if (Math.abs(diff) > 0.001) {
      // ease 적용: 열 때 power2.out, 닫을 때 power2.in 느낌
      const speed = isOpen ? 4 : 5;
      const newRotation = THREE.MathUtils.lerp(current, target, 1 - Math.pow(1 - speed * delta, 2));
      groupRef.current.rotation.y = newRotation;

      // 힌지 역회전
      if (hingeTopRef.current) hingeTopRef.current.rotation.y = -newRotation;
      if (hingeBottomRef.current) hingeBottomRef.current.rotation.y = -newRotation;
    }
  });

  // 핸들 클론에 재질 적용
  const handleScene = useMemo(() => {
    const clone = handleGltf.scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = materials.backPanel.clone();
      }
    });
    return clone;
  }, [handleGltf.scene, materials.backPanel]);

  // 힌지(암) 클론
  const hingeFeTopScene = useMemo(() => hingeFeGltf.scene.clone(), [hingeFeGltf.scene]);
  const hingeFeBottomScene = useMemo(() => hingeFeGltf.scene.clone(), [hingeFeGltf.scene]);

  // 힌지(수) 클론
  const hingeTopScene = useMemo(() => hingeGltf.scene.clone(), [hingeGltf.scene]);
  const hingeBottomScene = useMemo(() => hingeGltf.scene.clone(), [hingeGltf.scene]);

  return (
    <group
      ref={groupRef}
      position={[placement.x, placement.y, placement.z]}
      rotation={[0, 0, 0]}
    >
      {/* 도어 패널 */}
      <mesh
        geometry={geometry}
        material={materials.backPanel}
        castShadow={false}
        receiveShadow={true}
      />

      {/* 손잡이 */}
      <primitive
        object={handleScene}
        position={[-placement.width + 7.5, placement.height / 2 - 0.15, 1.1]}
        scale={[1, 1, 1]}
      />

      {/* 힌지(암) - 상단/하단 */}
      <primitive
        object={hingeFeTopScene}
        position={[0, placement.height / 2 - 6, -2]}
        scale={[1, 1, 1]}
      />
      <primitive
        object={hingeFeBottomScene}
        position={[0, -placement.height / 2 + 6, -2]}
        scale={[1, 1, 1]}
      />

      {/* 힌지(수) - 상단/하단 (역회전 적용) */}
      <group ref={hingeTopRef} position={[0, placement.height / 2 - 6, -2]}>
        <primitive object={hingeTopScene} scale={[1, 1, 1]} />
      </group>
      <group ref={hingeBottomRef} position={[0, -placement.height / 2 + 6, -2]}>
        <primitive object={hingeBottomScene} scale={[1, 1, 1]} />
      </group>
    </group>
  );
}
