'use client';

import { useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { latheLegGeometry } from './legGeometry';

export interface LatheLegProps {
  /** 외곽 프로파일 [반지름mm, 높이mm], 바닥(0)부터 위로 오름차순 */
  profile: [number, number][];
  /** 주입 재질 — 소유하지 않으므로 dispose하지 않는다 */
  material: THREE.Material;
  radialSegments?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * 회전체 다리 (단위 mm)
 * 로컬 원점 = 몸체에 닿는 상부 체결 기준점(contracts.md §2 anchorMm). 형상은 원점에서 아래(-y)로 생성.
 * 배치·개수·지지 판재는 리더 결과(FurnitureHardwareInstance)를 따른다. cm 장면에는 리더 어댑터(×0.1) 안에서 렌더.
 */
export function LatheLeg({ profile, material, radialSegments = 32, castShadow = true, receiveShadow = false }: LatheLegProps) {
  const geometry = useMemo(() => latheLegGeometry(profile, radialSegments), [profile, radialSegments]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} castShadow={castShadow} receiveShadow={receiveShadow} />;
}
