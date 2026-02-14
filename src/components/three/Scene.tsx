'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Shelf } from './Shelf';
import { Background } from './Background';
import { useShelfStore } from '@/stores/useShelfStore';

export default function Scene() {
  const width = useShelfStore((s) => s.width);

  return (
    <Canvas
      shadows
      legacy
      flat
      gl={{
        antialias: true,
      }}
      camera={{
        position: [0, 120, 350],
        fov: 40,
        near: 0.1,
        far: 1000,
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

      {/* 카메라 컨트롤 */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={100}
        maxDistance={800}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, 60, 0]}
      />
    </Canvas>
  );
}
