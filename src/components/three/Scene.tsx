'use client';

import { Suspense, useState } from 'react';
import { ConfiguratorLoading } from '@/components/ui/ConfiguratorLoading';
import { SceneReady } from './SceneReady';
import { Canvas } from '@react-three/fiber';
import { ReferenceStudio } from './ReferenceStudio';
import * as THREE from 'three';
import { Shelf } from './Shelf';
import { Background } from './Background';
import { Effects } from './Effects';
import { AssemblyFloor } from './display/AssemblyFloor';
import { DisplayModel } from './display/DisplayModel';
import { ViewCamera } from './display/ViewCamera';
import { ViewToolbar, type ViewToolbarActions } from './display/ViewToolbar';
import { useDisplayStore } from './display/displayStore';
import { ARController } from './ar/ARController';
import { useARStore, SHELF_ROOT_NAME } from './ar/arStore';
import { MeasureMode } from './measure/MeasureMode';
import { useShelfStore } from '@/stores/useShelfStore';
import { useUIStore } from '@/stores/useUIStore';

export default function Scene(actions: ViewToolbarActions) {
  const [ready, setReady] = useState(false);
  const width = useShelfStore((s) => s.width);
  const depth = useShelfStore((s) => s.depth);
  const height = useShelfStore((s) => s.height);
  const showDimensions = useUIStore((s) => s.showDimensions);
  // 안드로이드 WebXR 중에는 룸/궤도 카메라/후처리를 끄고 카메라 영상 위에 선반만 그린다
  const ar = useARStore((s) => s.webxrActive);
  const exploded = useDisplayStore((s) => s.exploded);
  const view = useDisplayStore((s) => s.view);
  const appearance = useDisplayStore((s) => s.appearance);
  const studio = appearance === 'realistic' && !exploded && (view === 'front' || view === 'standard');

  return (
    <>
    {!ar && <ConfiguratorLoading ready={ready} />}
    {!ar && <ViewToolbar {...actions} />}
    <Canvas
      shadows // PCF shadows for the reference studio preset
      dpr={[1, 1.5]} // 2배는 GTAO 후처리까지 픽셀 수가 1.8배라 Retina 노트북에서 프레임 저하
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        // Preserve highlight detail under the reference lights without lifting dark albedos.
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
      camera={{
        position: [0, 50, 350],
        fov: 40,
        near: 1, // cm 단위 — 0.1이면 원거리 깊이 정밀도가 부족해 바닥/접지그림자가 z-fighting
        far: 5000,
      }}
      style={{ background: '#E4E6E6' }}
    >
      <Suspense fallback={null}>
      <SceneReady onReady={setReady} />
      {/* 조명: 환경광 + 그림자용 키 라이트 */}
      <ReferenceStudio width={width} height={height} shadows={!ar} background={!ar}/>

      {!ar && (
        <>
          {/* 배경 (바닥 + 실루엣) */}
          <Suspense fallback={null}>
            {studio && <Background shelfWidth={width} shelfHeight={height} shelfDepth={depth} />}
          </Suspense>

          {/* 가구 + 치수 오버레이 (Shelf group 내부에서 footHeight 오프셋 공유) */}
          <DisplayModel name={SHELF_ROOT_NAME}>
            <Shelf showDimensions={showDimensions && !exploded} exploded={exploded} presentation />
          </DisplayModel>

          <AssemblyFloor />

          {/* 측정 모드: 그리드 판재 + hover 치수 화살표 (화면 전용) */}
          <MeasureMode />

          {/* 오토 포커스 카메라 */}
          <ViewCamera />

          {/* 후처리: AO + 톤매핑 출력 (WebXR과 호환되지 않음) */}
          <Effects />
        </>
      )}

      {/* AR: 안드로이드 WebXR 배치 / 아이폰 USDZ 내보내기 */}
      <ARController />
      </Suspense>
    </Canvas>
    </>
  );
}
