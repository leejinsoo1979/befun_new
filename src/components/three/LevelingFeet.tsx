'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useShelfStore } from '@/stores/useShelfStore';

/**
 * 조절발 1개: 검은색 원통 + 윗부분 볼록 + 드라이버 홈
 */
function Foot({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* 몸체: 검은색 원통 */}
      <mesh position={[0, -1.2, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.4, 2.4, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* 윗부분: 살짝 볼록한 캡 */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.3, 1.2, 0.4, 16]} />
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* 드라이버 홈 */}
      <mesh position={[0, 0.32, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.1, 0.25]} />
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
    const y = -0.5; // 바닥판 바로 아래
    const frontZ = depth - 2; // 앞쪽
    const backZ = 3; // 뒤쪽

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
