'use client';

import type * as THREE from 'three';
import { LatheLeg } from './LatheLeg';
import { OBSERVED_LEG_PROFILES } from './specs/observedHardware';

interface LegProps {
  material: THREE.Material;
  castShadow?: boolean;
}

/** Original 기본 조절발 (Tylko short_leg 관찰 치수: Ø16 패드 8mm + 스템, 총 22.5mm). 원점 = 상부 앵커 */
export function ShortLeg({ material, castShadow }: LegProps) {
  return <LatheLeg profile={OBSERVED_LEG_PROFILES.short_leg} material={material} castShadow={castShadow} />;
}

/** 원기둥 다리 (Tylko plane_leg 관찰 치수: Ø15 × 30mm). 원점 = 상부 앵커 */
export function PlaneLeg({ material, castShadow }: LegProps) {
  return <LatheLeg profile={OBSERVED_LEG_PROFILES.plane_leg} material={material} castShadow={castShadow} />;
}
