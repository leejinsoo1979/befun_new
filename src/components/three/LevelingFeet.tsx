'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useShelfStore } from '@/stores/useShelfStore';
import { calculateSlantSpacing } from '@/lib/three/styles/slant';
import { calculateInternalWidths } from '@/lib/three/styles/gradient';
import { calculateGaps } from '@/lib/three/styles/pixel';
import { limitPanelSpacingGrid } from '@/lib/three/styles/grid';

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

    // 양쪽 끝 조절발은 스타일 관계없이 항상 배치
    const leftX = -width / 2 + thickness / 2 + 1;
    const rightX = width / 2 - thickness / 2 - 1;
    positions.push([leftX, y, frontZ]);
    positions.push([leftX, y, backZ]);
    positions.push([rightX, y, frontZ]);
    positions.push([rightX, y, backZ]);

    if (style === 'slant' && width >= 44) {
      // Slant: 1행(j=0, 짝수행) 세로 패널 위치에 배치 (양끝 10cm 이내는 스킵)
      const slantMargin = width >= 78 ? 24 : 14;
      const adjustedWidth = width - slantMargin;
      const { panelCount, panelSpacing } = calculateSlantSpacing(width, adjustedWidth, thickness, density);
      const baseMargin = (width - adjustedWidth) / 2;
      const maxOffset = baseMargin - thickness;
      const slantOffset = Math.min(adjustedWidth / panelCount / 4, maxOffset);

      for (let i = 0; i < panelCount; i++) {
        const baseX = -adjustedWidth / 2 + i * panelSpacing;
        const x = baseX - slantOffset;
        if (Math.abs(x - leftX) < 10 || Math.abs(x - rightX) < 10) continue;
        positions.push([x, y, frontZ]);
        positions.push([x, y, backZ]);
      }
    } else if (style === 'pixel' && width >= 78) {
      // Pixel: 홀수행(index 1) 기준 세로 패널 위치에 배치 (모든 패널 있음)
      const gaps = calculateGaps(width, density, thickness);
      let px = -width / 2 + thickness / 2;
      for (let i = 0; i <= gaps.length; i++) {
        const panelX = px - thickness / 2;
        if (i > 0 && i < gaps.length) {
          // 양끝 세로 패널은 이미 leftX/rightX로 배치됨, 내부만
          if (Math.abs(panelX - leftX) < 10 || Math.abs(panelX - rightX) < 10) {
            if (i < gaps.length) px += gaps[i] + thickness;
            continue;
          }
          positions.push([panelX, y, frontZ]);
          positions.push([panelX, y, backZ]);
        }
        if (i < gaps.length) px += gaps[i] + thickness;
      }
    } else if (style === 'gradient' && width >= 60) {
      // Gradient: 가변 폭 세로 패널 위치에 배치
      const columnCount = Math.floor((width - thickness) / 40) + 1;
      const internalWidths = calculateInternalWidths(columnCount, width - 2 * thickness, density, thickness);
      let px = -width / 2 + thickness / 2;
      for (let i = 0; i < internalWidths.length; i++) {
        px += internalWidths[i] + thickness;
        // 양끝 10cm 이내는 스킵
        if (Math.abs(px - leftX) < 10 || Math.abs(px - rightX) < 10) continue;
        positions.push([px, y, frontZ]);
        positions.push([px, y, backZ]);
      }
    } else {
      // Grid 등: 세로 패널 위치에 맞춰 배치
      const { panelCount: gridPanelCount, panelSpacing: gridPanelSpacing } = limitPanelSpacingGrid(width, thickness, density);
      for (let i = 1; i < gridPanelCount - 1; i++) {
        const x = -width / 2 + i * gridPanelSpacing;
        if (Math.abs(x - leftX) < 10 || Math.abs(x - rightX) < 10) continue;
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
