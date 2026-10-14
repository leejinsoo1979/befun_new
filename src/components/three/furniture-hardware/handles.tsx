'use client';

import { useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { extrudedHandleGeometry } from './handleGeometry';
import { OBSERVED_FULL_HANDLE_30_SECTION } from './specs/observedHardware';

interface FullHeightHandleProps {
  /** 손잡이 길이(문 높이 방향) mm — 값은 리더 배치 결과에서 받는다 */
  heightMm: number;
  /** 주입 재질 — dispose하지 않음 */
  material: THREE.Material;
  castShadow?: boolean;
}

/**
 * Type01 전체 높이 손잡이 (Tylko vertical_handle_30 관찰 단면, 폭 29.1 × 두께 18.9mm).
 * 문 모서리를 채널(폭 16.7mm)에 끼우는 형태. 원점·축은 handleGeometry.ts 참고.
 * 좌/우 문은 리더가 x 미러(scale.x=-1)로 배치한다. vertical_handle_50(단면 폭 50)은 미구현.
 */
export function FullHeightHandle30({ heightMm, material, castShadow = true }: FullHeightHandleProps) {
  const geometry = useMemo(() => extrudedHandleGeometry(OBSERVED_FULL_HANDLE_30_SECTION, heightMm), [heightMm]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} castShadow={castShadow} />;
}
