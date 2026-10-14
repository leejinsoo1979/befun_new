'use client';

/**
 * 원본 장다리 표시 어댑터 (R3-HW). 형상 복제·비균일 늘이기 없이 원본 GLB 노드 TRS를 그대로 쓰고
 * 장면 단위 스케일만 부모 group에 한 번 적용한다. 계약: ./longLegContract.ts
 *
 *   import { LongLeg } from '@/components/three/furniture-hardware/legs/LongLeg';
 *   <group position={anchorCm} rotation={[0, yaw, 0]}><LongLeg unit="cm" material={legMaterial} /></group>
 *
 * 원점 = 접지점(몸통 축, y=0), 장착면 = y = longLegHeight(unit), 법선 +Y.
 * 몸통과 장착판은 한 메시 → 분리 동작은 이 컴포넌트 전체(group)를 움직인다. 나사·핀은 포함되지 않음.
 */
import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type * as THREE from 'three';
import { LONG_LEG_ASSET, longLegSceneScale, type LegSceneUnit } from './longLegContract';
import { createLongLegInstance, releaseLongLegInstance } from './longLegInstance';

export interface LongLegProps {
  /** 소비 장면 단위. 가구 장면 = 'cm', 조립 안내 = 'mm' */
  unit: LegSceneUnit;
  /** 호출자 소유 재질 (dispose 책임 호출자). 생략 시 GLB 기본 재질 */
  material?: THREE.Material;
  shadows?: boolean;
}

export function LongLeg({ unit, material, shadows = true }: LongLegProps) {
  const { scene } = useGLTF(LONG_LEG_ASSET.url);
  const instance = useMemo(() => createLongLegInstance(scene, material, shadows), [scene, material, shadows]);
  useEffect(() => () => releaseLongLegInstance(instance), [instance]);
  return (
    <group scale={longLegSceneScale(unit)} dispose={null}>
      <primitive object={instance} dispose={null} />
    </group>
  );
}

