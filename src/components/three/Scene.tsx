'use client';

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Shelf } from './Shelf';
import { Background } from './Background';
import { DimensionOverlay } from './DimensionOverlay';
import { useShelfStore } from '@/stores/useShelfStore';
import { useUIStore } from '@/stores/useUIStore';

/**
 * Auto-focus camera: tylko 스타일 시점
 * - 선반 크기에 따라 카메라 거리 자동 조절
 * - 약간 위에서 비스듬히 내려다보는 시점
 * - 부드러운 전환 (lerp)
 */
function AutoFocusCamera() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const width = useShelfStore((s) => s.width);
  const height = useShelfStore((s) => s.height);
  const depth = useShelfStore((s) => s.depth);

  // 목표 카메라 위치/타겟을 ref로 관리
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const animating = useRef(false);
  const userInteracting = useRef(false);

  useEffect(() => {
    const centerY = height / 2;
    const maxDim = Math.max(width, height);
    const fovRad = THREE.MathUtils.degToRad(38 / 2);
    const dist = (maxDim / 2) / Math.tan(fovRad) * 2.2;

    targetPos.current.set(0, centerY, dist);
    targetLookAt.current.set(0, centerY, 0);

    // 사용자가 조작 중이 아닐 때만 애니메이션
    if (!userInteracting.current) {
      animating.current = true;
    }
  }, [width, height, depth, camera]);

  // 첫 로드 시 즉시 세팅
  useEffect(() => {
    camera.position.copy(targetPos.current);
    if (controlsRef.current) {
      controlsRef.current.target.copy(targetLookAt.current);
      controlsRef.current.update();
    }
    animating.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 부드러운 카메라 전환 (크기 변경 시에만, 사용자 조작 시 중단)
  useFrame(() => {
    if (!animating.current) return;
    const controls = controlsRef.current;
    if (!controls) return;

    camera.position.lerp(targetPos.current, 0.05);
    controls.target.lerp(targetLookAt.current, 0.05);
    controls.update();

    // 충분히 가까우면 애니메이션 종료
    if (camera.position.distanceTo(targetPos.current) < 0.5) {
      animating.current = false;
    }
  });

  // 사용자 조작 감지 → 애니메이션 중단
  const onControlStart = () => {
    userInteracting.current = true;
    animating.current = false;
  };
  const onControlEnd = () => {
    userInteracting.current = false;
  };

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      enableDamping={true}
      dampingFactor={0.08}
      minDistance={50}
      maxDistance={900}
      minPolarAngle={0.3}
      maxPolarAngle={Math.PI / 2 - 0.05}
      onStart={onControlStart}
      onEnd={onControlEnd}
    />
  );
}

export default function Scene() {
  const width = useShelfStore((s) => s.width);
  const showDimensions = useUIStore((s) => s.showDimensions);

  return (
    <Canvas
      shadows
      legacy
      flat
      gl={{
        antialias: true,
      }}
      camera={{
        position: [0, 70, 600],
        fov: 38,
        near: 0.1,
        far: 2000,
      }}
      style={{ background: '#e9eaea' }}
    >
      {/* 조명 — light.js 이식 (Three.js r182 physically-correct lighting 보정: intensity * PI) */}
      <ambientLight intensity={0.1 * Math.PI} />
      <directionalLight
        position={[-100, 200, 300]}
        intensity={0.3 * Math.PI}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={700}
        shadow-camera-left={-400}
        shadow-camera-right={400}
        shadow-camera-top={400}
        shadow-camera-bottom={-400}
        shadow-radius={2}
        shadow-bias={-0.005}
      />
      <directionalLight
        position={[100, 200, 300]}
        intensity={0.2 * Math.PI}
      />

      {/* 배경 (바닥 + 실루엣) */}
      <Suspense fallback={null}>
        <Background shelfWidth={width} />
      </Suspense>

      {/* 가구 */}
      <Shelf />

      {/* 치수 오버레이 */}
      {showDimensions && <DimensionOverlay />}

      {/* 오토 포커스 카메라 */}
      <AutoFocusCamera />
    </Canvas>
  );
}
