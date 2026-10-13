'use client';

import { footPanelIndex } from './display/assemblyPlan';
import type { PanelData } from '@/types/shelf';
import { calculateShortFeet } from '@/lib/three/reference-feet';
import { useMemo } from 'react';
import { useShelfStore } from '@/stores/useShelfStore';

/**
 * 조절발 1개: 지름 25mm(반지름 1.25cm), 높이 10mm(1cm)
 */
function Foot({ position }: { position: [number, number, number] }) {
  const radius = 1.25; // 지름 25mm / 2
  const height = 1;    // 높이 10mm

  return (
    <group position={position}>
      {/* 몸체: 검은색 원통 — 상단이 position.y에 맞닿음 */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius * 1.08, height, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* 윗부분: 살짝 볼록한 캡 */}
      <mesh position={[0, height + 0.05, 0]}>
        <cylinderGeometry args={[radius * 0.95, radius, 0.15, 16]} />
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* 드라이버 홈 */}
      <mesh position={[0, height + 0.13, 0]}>
        <boxGeometry args={[radius * 0.8, 0.06, 0.15]} />
        <meshStandardMaterial color="#111" roughness={0.8} metalness={0} />
      </mesh>
    </group>
  );
}

/** Feet follow the rendered bottom structure, including non-uniform styles. */
export function LevelingFeet({ panels, panelIndex }: { panels: PanelData[]; panelIndex?: number }) {
  const depth = useShelfStore((s) => s.depth);
  const style = useShelfStore((s) => s.style);
  const footPositions = useMemo(() => calculateShortFeet(panels, depth, style === 'mosaic' || style === 'pixel'),
    [panels, depth, style]);
  return <group>{footPositions.filter(position => panelIndex === undefined || footPanelIndex(panels, position) === panelIndex).map((position, index) => <Foot key={index} position={position} />)}</group>;
}
