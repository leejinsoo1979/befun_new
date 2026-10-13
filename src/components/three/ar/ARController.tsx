'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Shelf } from '../Shelf';
import { ContactShadowDecal } from '../Background';
import { useShelfStore } from '@/stores/useShelfStore';
import { useARStore, SHELF_ROOT_NAME } from './arStore';
import { exportShelfToUSDZ } from './exportUSDZ';

const CM_TO_M = 0.01;

/**
 * Canvas 내부 AR 제어
 * - 안드로이드 WebXR: 세션 시작/종료, 바닥 히트 테스트(레티클), 탭한 위치에 선반 배치(사용자를 향하게)
 *   선반은 일반 모드와 같은 <Shelf/>를 m 단위로 축소해 렌더 → 스토어 변경이 AR에서도 즉시 반영
 * - 아이폰: 현재 씬의 선반을 USDZ로 내보내는 함수 등록
 */
export function ARController() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const width = useShelfStore((s) => s.width);
  const depth = useShelfStore((s) => s.depth);
  const active = useARStore((s) => s.webxrActive);
  const placed = useARStore((s) => s.placed);

  const reticleRef = useRef<THREE.Group>(null);
  const placeRef = useRef<THREE.Group>(null);
  const hitSourceRef = useRef<XRHitTestSource | null>(null);

  // 제어 함수 등록
  useEffect(() => {
    const onSelect = () => {
      // 탭(UI 밖) → 레티클 위치로 선반 이동, 사용자를 향하도록 회전
      const reticle = reticleRef.current;
      const group = placeRef.current;
      if (!reticle?.visible || !group) return;
      const pos = new THREE.Vector3().setFromMatrixPosition(reticle.matrix);
      const cam = new THREE.Vector3().setFromMatrixPosition(gl.xr.getCamera().matrixWorld);
      group.position.copy(pos);
      group.rotation.set(0, Math.atan2(cam.x - pos.x, cam.z - pos.z), 0);
      useARStore.setState({ placed: true });
    };

    const cleanup = () => {
      hitSourceRef.current?.cancel();
      hitSourceRef.current = null;
      useARStore.setState({ webxrActive: false, placed: false, surfaceFound: false });
    };

    const startWebXR = async (overlayRoot: HTMLElement) => {
      if (!navigator.xr) throw new Error('WebXR 미지원');
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: overlayRoot },
      });
      // 씬 구성을 AR용으로 바꾼 뒤 세션 연결
      useARStore.setState({ webxrActive: true, placed: false, surfaceFound: false });
      gl.xr.enabled = true;
      gl.xr.setReferenceSpaceType('local');
      await gl.xr.setSession(session);

      const viewerSpace = await session.requestReferenceSpace('viewer');
      hitSourceRef.current = (await session.requestHitTestSource?.({ space: viewerSpace })) ?? null;

      session.addEventListener('select', onSelect);
      session.addEventListener('end', () => {
        session.removeEventListener('select', onSelect);
        cleanup();
      }, { once: true });
    };

    const endWebXR = () => {
      gl.xr.getSession()?.end();
    };

    const rotateShelf = (radians: number) => {
      placeRef.current?.rotateY(radians);
    };

    const exportUSDZ = async () => {
      const root = scene.getObjectByName(SHELF_ROOT_NAME);
      if (!root) throw new Error('선반을 찾을 수 없습니다');
      return exportShelfToUSDZ(root, useShelfStore.getState().depth);
    };

    useARStore.setState({ startWebXR, endWebXR, rotateShelf, exportUSDZ });
    return () => {
      useARStore.setState({ startWebXR: null, endWebXR: null, rotateShelf: null, exportUSDZ: null });
    };
  }, [gl, scene]);

  // 바닥 히트 테스트 → 레티클
  useFrame((_, __, frame?: XRFrame) => {
    const reticle = reticleRef.current;
    if (!active || !reticle) return;
    const source = hitSourceRef.current;
    const refSpace = gl.xr.getReferenceSpace();
    const hit = frame && source && refSpace ? frame.getHitTestResults(source)[0] : undefined;
    const pose = hit?.getPose(refSpace!);
    reticle.visible = !!pose;
    if (pose) reticle.matrix.fromArray(pose.transform.matrix);
    if (!!pose !== useARStore.getState().surfaceFound) useARStore.setState({ surfaceFound: !!pose });
  });

  if (!active) return null;

  return (
    <>
      {/* 바닥 레티클 (히트 포즈 행렬을 그룹에 직접 적용, 링은 바닥면에 눕힘) */}
      <group ref={reticleRef} matrixAutoUpdate={false} visible={false}>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.1, 0.12, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 배치된 선반 (cm → m, 바닥 중심이 원점) */}
      <group ref={placeRef} visible={placed}>
        <group scale={CM_TO_M}>
          <group position={[0, 0, -depth / 2]}>
            <Shelf showDimensions={false} />
            <ContactShadowDecal shelfWidth={width} shelfDepth={depth} />
          </group>
        </group>
      </group>
    </>
  );
}
