'use client';

import { useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { phGeometry, pcGeometry, rcGeometry, rhGeometry } from './ovvoGeometry';
import { panelAPose, type OvvoModel, type OvvoPhaseP, type OvvoPhaseR } from './ovvoContract';

/** 부품 하나 — geometry는 자체 소유·dispose, 재질은 주입(소유하지 않음). 단위 mm */
function Part({ make, material }: { make: () => THREE.BufferGeometry; material: THREE.Material }) {
  const geo = useMemo(() => make(), [make]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={material} castShadow receiveShadow />;
}

/** 판 홈 좌표 S에 착좌한 하우징 (설명용 단면). 판 A에 둘 때는 리더가 S_A 변환을 적용 */
export const OvvoPH = ({ material }: { material: THREE.Material }) => <Part make={phGeometry} material={material} />;
export const OvvoRH = ({ material }: { material: THREE.Material }) => <Part make={rhGeometry} material={material} />;
/** 접합 좌표 J 기준 커넥터 (+z 절반 = 판 A 쪽) */
export const OvvoPC = ({ material }: { material: THREE.Material }) => <Part make={pcGeometry} material={material} />;
export const OvvoRC = ({ material }: { material: THREE.Material }) => <Part make={rcGeometry} material={material} />;

interface OvvoJointProps {
  model: OvvoModel;
  phase: OvvoPhaseP | OvvoPhaseR;
  approachGapMm?: number;
  housingMaterial: THREE.Material;
  connectorMaterial: THREE.Material;
  rhMaterial?: THREE.Material;
}

/**
 * 설명용 결합 (J 좌표, mm). 판재는 그리지 않는다.
 * P: PH(B) + PH(A, X축 π) + PC. R: RH(B) + PH(A) + RC. 판 A와 커넥터는 panelAPose(단계)로 함께 이동.
 */
export function OvvoJoint({ model, phase, approachGapMm, housingMaterial, connectorMaterial, rhMaterial }: OvvoJointProps) {
  const pose = panelAPose(model, phase, approachGapMm);
  return (
    <group>
      {model === 'P' ? <OvvoPH material={housingMaterial} /> : <OvvoRH material={rhMaterial ?? housingMaterial} />}
      <group position={pose.position} rotation={pose.rotation}>
        <OvvoPH material={housingMaterial} />
      </group>
      <group position={pose.position}>
        {model === 'P' ? <OvvoPC material={connectorMaterial} /> : <OvvoRC material={connectorMaterial} />}
      </group>
    </group>
  );
}
