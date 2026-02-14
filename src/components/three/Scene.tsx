'use client';

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
      gl={{
        antialias: true,
        toneMapping: THREE.NoToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      camera={{
        position: [0, 120, 350],
        fov: 45,
        near: 1,
        far: 2000,
      }}
      style={{ background: '#e9eaea' }}
    >
      {/* 조명 — light.js 이식 */}
      <ambientLight intensity={0.1} />
      <directionalLight
        position={[-100, 200, 300]}
        intensity={0.3}
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
        intensity={0.2}
      />

      {/* 배경 (바닥 + 실루엣) */}
      <Background shelfWidth={width} />

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
