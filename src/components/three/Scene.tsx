'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { Shelf } from './Shelf';
import { Background } from './Background';
import { Effects } from './Effects';
import { AssemblyFloor } from './display/AssemblyFloor';
import { DisplayModel } from './display/DisplayModel';
import { ViewCamera } from './display/ViewCamera';
import { ViewToolbar } from './display/ViewToolbar';
import { useDisplayStore } from './display/displayStore';
import { ARController } from './ar/ARController';
import { useARStore, SHELF_ROOT_NAME } from './ar/arStore';
import { useShelfStore } from '@/stores/useShelfStore';
import { useUIStore } from '@/stores/useUIStore';

/**
 * 스튜디오 환경광 — 외부 HDR 없이 Lightformer로 소프트박스 구성
 * 면 방향별 밝기 차이와 은은한 반사를 만들어 입체감을 준다.
 */
const ENV_BACKGROUND = 0.35;

function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={1.9}>
      {/* 균일한 밝은 스튜디오 배경 — Tylko처럼 어두운 단색도 은은한 반사(F0≈4%)로 들뜨게 한다.
          측정: Tylko 화면 Midnight Blue 정면 #393943, Black #414141 (재질값 대비 linear +0.03~0.04) */}
      <color attach="background" args={[ENV_BACKGROUND, ENV_BACKGROUND, ENV_BACKGROUND]} />
      {/* 상단 대형 소프트박스 (주 광원) */}
      <Lightformer form="rect" intensity={2} position={[0, 6, 3]} rotation-x={Math.PI / 2} scale={[12, 8, 1]} />
      {/* 좌측 창가 느낌의 넓은 빛 / 우측 흰 벽 반사광 (빛 반대쪽 면이 너무 어두워지지 않게) */}
      <Lightformer form="rect" intensity={1.2} position={[-6, 2, 4]} rotation-y={Math.PI / 3} scale={[5, 7, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[6, 2, 4]} rotation-y={-Math.PI / 3} scale={[5, 7, 1]} />
      {/* 정면 (카메라 쪽) 은은한 채움광 */}
      <Lightformer form="rect" intensity={0.6} position={[0, 1.5, 7]} scale={[10, 4, 1]} />
      {/* 바닥/벽 반사광 (따뜻한 회색) */}
      <Lightformer form="rect" intensity={0.3} position={[0, -3, 2]} rotation-x={-Math.PI / 2} scale={[14, 14, 1]} />
    </Environment>
  );
}

export default function Scene() {
  const width = useShelfStore((s) => s.width);
  const depth = useShelfStore((s) => s.depth);
  const showDimensions = useUIStore((s) => s.showDimensions);
  // 안드로이드 WebXR 중에는 룸/궤도 카메라/후처리를 끄고 카메라 영상 위에 선반만 그린다
  const ar = useARStore((s) => s.webxrActive);
  const exploded = useDisplayStore((s) => s.exploded);
  const view = useDisplayStore((s) => s.view);
  const freeOrbit = useDisplayStore((s) => s.freeOrbit);
  const appearance = useDisplayStore((s) => s.appearance);
  const studio = appearance === 'realistic' && !freeOrbit && !exploded && (view === 'front' || view === 'standard');

  return (
    <>
    {!ar && <ViewToolbar />}
    <Canvas
      shadows="variance" // VSM: 벽에 떨어지는 부드러운 그림자
      dpr={[1, 2]}
      gl={{
        antialias: true,
      }}
      onCreated={({ gl }) => {
        // 제품 색 재현을 위해 Khronos PBR Neutral 톤매핑 사용 (ACES보다 색조 왜곡이 적음)
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 0.85;
      }}
      camera={{
        position: [0, 50, 350],
        fov: 40,
        near: 1, // cm 단위 — 0.1이면 원거리 깊이 정밀도가 부족해 바닥/접지그림자가 z-fighting
        far: 5000,
      }}
      style={{ background: '#e6e4e0' }}
    >
      {/* 조명: 환경광 + 그림자용 키 라이트 */}
      <StudioEnvironment />
      <directionalLight
        position={[-160, 320, 300]}
        intensity={1.2}
        castShadow={!ar} // AR에서는 cm 기준 그림자 범위가 맞지 않아 접지 데칼만 사용
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={1000}
        shadow-camera-left={-320}
        shadow-camera-right={320}
        shadow-camera-top={320}
        shadow-camera-bottom={-320}
        shadow-radius={14}
        shadow-blurSamples={16}
        shadow-bias={-0.0004}
      />

      {!ar && (
        <>
          {/* 배경 (바닥 + 실루엣) */}
          <Suspense fallback={null}>
            {studio && <Background shelfWidth={width} shelfDepth={depth} />}
          </Suspense>

          {/* 가구 + 치수 오버레이 (Shelf group 내부에서 footHeight 오프셋 공유) */}
          <DisplayModel name={SHELF_ROOT_NAME}>
            <Shelf showDimensions={showDimensions && !exploded} exploded={exploded} presentation />
          </DisplayModel>

          <AssemblyFloor />

          {/* 오토 포커스 카메라 */}
          <ViewCamera />

          {/* 후처리: AO + 톤매핑 출력 (WebXR과 호환되지 않음) */}
          <Effects />
        </>
      )}

      {/* AR: 안드로이드 WebXR 배치 / 아이폰 USDZ 내보내기 */}
      <ARController />
    </Canvas>
    </>
  );
}
