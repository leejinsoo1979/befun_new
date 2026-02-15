'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
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

/**
 * 조절발: 선반 하단 바닥판 아래에 세로 칸막이 위치마다 배치
 * 양쪽 끝(좌/우 모서리) + 내부 세로 칸막이 위치
 */
export function LevelingFeet() {
  const width = useShelfStore((s) => s.width);
  const depth = useShelfStore((s) => s.depth);
  const thickness = useShelfStore((s) => s.thickness);
  const style = useShelfStore((s) => s.style);
  const density = useShelfStore((s) => s.density);

  const footPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const y = -1; // 바닥판 아래 = 조절발 높이만큼 내려서 바닥면(y=0 world)에 닿도록
    const inset = 3; // 전면/후면에서 안쪽으로 동일한 거리
    const frontZ = depth - inset; // 앞쪽
    const backZ = inset; // 뒤쪽

    // 양쪽 끝
    const leftX = -width / 2 + thickness / 2 + 1;
    const rightX = width / 2 - thickness / 2 - 1;

    positions.push([leftX, y, frontZ]);
    positions.push([leftX, y, backZ]);
    positions.push([rightX, y, frontZ]);
    positions.push([rightX, y, backZ]);

    // 내부 세로 칸막이 위치에 조절발 추가 (넓은 선반에서)
    // 간격 기준: 약 60cm마다 하나씩
    const innerWidth = width - thickness * 2;
    const footSpacing = 60;
    const innerFootCount = Math.floor(innerWidth / footSpacing);

    if (innerFootCount >= 1 && width > 80) {
      const actualSpacing = innerWidth / (innerFootCount + 1);
      for (let i = 1; i <= innerFootCount; i++) {
        const x = -width / 2 + thickness + actualSpacing * i;
        positions.push([x, y, frontZ]);
        positions.push([x, y, backZ]);
      }
    }

    return positions;
  }, [width, depth, thickness, style, density]);

  return (
    <group>
      {footPositions.map((pos, i) => (
        <Foot key={`foot-${i}`} position={pos} />
      ))}
    </group>
  );
}
