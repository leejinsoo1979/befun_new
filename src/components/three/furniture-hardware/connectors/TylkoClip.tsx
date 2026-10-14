'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { clipBodyGeometry, clipCavityGeometry, clipPinGeometry } from './clipGeometry';
import { pinPositionInClip, type ClipColor, type ClipJointPhase, type TylkoClipDimensions, type TylkoClipPinDimensions } from './clipContract';

/** 사진/PDF 기준 외형 색 (외관 근사, 소재·품번 아님) */
export const CLIP_APPEARANCE: Record<ClipColor, { color: string; roughness: number; metalness: number }> = {
  black: { color: '#1d1d1f', roughness: 0.55, metalness: 0 },
  orange: { color: '#e2601e', roughness: 0.5, metalness: 0 },
  silver: { color: '#b9bec5', roughness: 0.3, metalness: 0.85 },
};

/**
 * 색상별 클립/핀 재질 생성 — 호출자가 소유하고 dispose한다(부품은 재질을 소유하지 않음).
 */
export function createClipMaterials(color: ClipColor) {
  const a = CLIP_APPEARANCE[color];
  return {
    body: new THREE.MeshStandardMaterial({ color: a.color, roughness: a.roughness, metalness: a.metalness }),
    cavity: new THREE.MeshStandardMaterial({ color: '#0b0b0c', roughness: 0.9, metalness: 0 }),
    pin: new THREE.MeshStandardMaterial({ color: a.color, roughness: 0.35, metalness: color === 'silver' ? 0.85 : 0.1 }), // PDF p2: 핀은 같은 색 커넥터와 짝
  };
}

interface TylkoClipProps {
  dims: TylkoClipDimensions;
  bodyMaterial: THREE.Material;
  cavityMaterial: THREE.Material;
}

/** 단면 매입 클립. 원점=입구 중심(접합면), +X=체결 슬라이드, +Z=접합면 바깥. 단위 mm (clipContract.ts) */
export function TylkoClip({ dims, bodyMaterial, cavityMaterial }: TylkoClipProps) {
  const body = useMemo(() => clipBodyGeometry(dims), [dims]);
  const cavity = useMemo(() => clipCavityGeometry(dims), [dims]);
  useEffect(() => () => { body.dispose(); cavity.dispose(); }, [body, cavity]);
  return (
    <group>
      <mesh geometry={body} material={bodyMaterial} castShadow receiveShadow />
      <mesh geometry={cavity} material={cavityMaterial} />
    </group>
  );
}

interface TylkoClipPinProps {
  dims: TylkoClipPinDimensions;
  material: THREE.Material;
}

/** 상대 핀. 원점=판 면, +Z=핀 축. 단위 mm */
export function TylkoClipPin({ dims, material }: TylkoClipPinProps) {
  const geo = useMemo(() => clipPinGeometry(dims), [dims]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={material} castShadow />;
}

interface ClipJointProps {
  clip: TylkoClipDimensions;
  pin: TylkoClipPinDimensions;
  phase: ClipJointPhase;
  /** 정렬 단계에서 두 접합면 간격 mm */
  approachGapMm?: number;
  materials: ReturnType<typeof createClipMaterials>;
}

/**
 * 설명용 결합 표현: 클립 좌표계에 핀을 단계별 위치로 배치(핀 +Z = 클립 -Z).
 * 실제 접합점 자세·이동 방향은 리더 connector plan을 따른다. 판재는 포함하지 않는다.
 */
export function TylkoClipJoint({ clip, pin, phase, approachGapMm = 0, materials }: ClipJointProps) {
  const p = pinPositionInClip(clip, phase, approachGapMm);
  return (
    <group>
      <TylkoClip dims={clip} bodyMaterial={materials.body} cavityMaterial={materials.cavity} />
      <group position={p} rotation={[Math.PI, 0, 0]}>
        <TylkoClipPin dims={pin} material={materials.pin} />
      </group>
    </group>
  );
}
