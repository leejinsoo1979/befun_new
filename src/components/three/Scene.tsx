'use client';

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Shelf } from './Shelf';
import { Background } from './Background';
import { useShelfStore } from '@/stores/useShelfStore';
import { useUIStore } from '@/stores/useUIStore';

/**
 * Auto-focus camera: V1 스타일 정면 시점
 * - 선반 크기에 따라 카메라 거리 자동 조절 (V1 adjustCameraPosition 로직)
 * - 정면에서 수직으로 바라보는 시점
 * - 부드러운 전환 (lerp)
 */
function AutoFocusCamera() {
  const controlsRef = useRef<any>(null);
  const { camera, size } = useThree();

  const width = useShelfStore((s) => s.width);
  const height = useShelfStore((s) => s.height);
  const depth = useShelfStore((s) => s.depth);

  // 목표 카메라 위치/타겟을 ref로 관리
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const animating = useRef(false);
  const userInteracting = useRef(false);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const centerY = height / 2 - 10;
    // Canvas의 실제 렌더링 영역 크기로 aspect ratio 계산
    const aspect = size.width / size.height;
    const fovRad = 40 * (Math.PI / 180);
    const halfFovV = fovRad / 2;
    const halfFovH = Math.atan(Math.tan(halfFovV) * aspect);

    // 세로/가로 각각 필요한 거리 계산 후 큰 값 사용
    const distForHeight = (height / 2 + 20) / Math.tan(halfFovV);
    const distForWidth = (width / 2 + 20) / Math.tan(halfFovH);
    let cameraZ = Math.max(distForHeight, distForWidth);
    // 가구 크기에 따라 마진 조절: 작을수록 여유 있게, 클수록 딱 맞게
    const maxDim = Math.max(width, height);
    const margin = maxDim < 150 ? 1.5 : maxDim < 300 ? 1.3 : 1.15;
    cameraZ *= margin;
    cameraZ = Math.max(cameraZ, 250);

    // 정면 수직 시점: 카메라가 선반 정면에서 바라봄
    targetPos.current.set(0, centerY, cameraZ);
    targetLookAt.current.set(0, centerY, 0);

    if (isInitialLoad.current) {
      // 첫 로드: 즉시 세팅 (애니메이션 없음)
      camera.position.copy(targetPos.current);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetLookAt.current);
        controlsRef.current.update();
      }
      isInitialLoad.current = false;
    } else if (!userInteracting.current) {
      // 크기 변경 시: 부드러운 전환
      animating.current = true;
    }
  }, [width, height, depth, camera, size.width, size.height]);

  // 부드러운 카메라 전환 (크기 변경 시에만, 사용자 조작 시 중단)
  useFrame(() => {
    if (!animating.current) return;
    const controls = controlsRef.current;
    if (!controls) return;

    camera.position.lerp(targetPos.current, 0.08);
    controls.target.lerp(targetLookAt.current, 0.08);
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
      enableDamping={false}
      dampingFactor={0}
      minDistance={200}
      maxDistance={600}
      minPolarAngle={0}
      maxPolarAngle={Math.PI * 2 / 3}
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
      shadows="soft"
      legacy
      flat
      gl={{
        antialias: true,
      }}
      camera={{
        position: [0, 50, 350],
        fov: 40,
        near: 0.1,
        far: 1000,
      }}
      style={{ background: '#efefef' }}
    >
      {/* 조명 */}
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[-100, 200, 300]}
        intensity={0.5}
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
        intensity={0.4}
      />

      {/* 배경 (바닥 + 실루엣) */}
      <Suspense fallback={null}>
        <Background shelfWidth={width} />
      </Suspense>

      {/* 가구 + 치수 오버레이 (Shelf group 내부에서 footHeight 오프셋 공유) */}
      <Shelf showDimensions={showDimensions} />

      {/* 오토 포커스 카메라 */}
      <AutoFocusCamera />
    </Canvas>
  );
}
