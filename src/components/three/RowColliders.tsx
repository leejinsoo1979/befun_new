'use client';

import { useRef, useCallback, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useShelfStore } from '@/stores/useShelfStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useUIStore } from '@/stores/useUIStore';

/**
 * V1 interactionHandler.js 이식:
 * 각 행(row)에 투명한 콜라이더를 배치하고,
 * 마우스 오버 시 해당 행을 하이라이트 + floating box 위치 계산
 */
export function RowColliders() {
  const width = useShelfStore((s) => s.width);
  const depth = useShelfStore((s) => s.depth);
  const thickness = useShelfStore((s) => s.thickness);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const numRows = useShelfStore((s) => s.numRows);
  const setSelectedRow = useUIStore((s) => s.setSelectedRow);
  const setHoveredRow = useUIStore((s) => s.setHoveredRow);
  const setDoorOpen = useHardwareStore((s) => s.setDoorOpen);
  const setDrawerOpen = useHardwareStore((s) => s.setDrawerOpen);

  const { camera, gl } = useThree();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLayerRef = useRef<number | null>(null);

  // 행별 콜라이더 위치 계산 (V1 createRowColliders 이식)
  const colliders: { index: number; y: number; height: number }[] = [];
  let currentY = 0;
  for (let i = 0; i < numRows; i++) {
    const rh = rowHeights[i] ?? 32;
    const yPosition = currentY + rh / 2 + thickness;
    colliders.push({ index: i, y: yPosition, height: rh });
    currentY += rh + thickness;
  }

  const handlePointerOver = useCallback((layerIndex: number) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    // 이전 행 도어/서랍 닫기
    if (prevLayerRef.current !== null && prevLayerRef.current !== layerIndex) {
      setDoorOpen(prevLayerRef.current, false);
      setDrawerOpen(prevLayerRef.current, false);
    }

    setHoveredIndex(layerIndex);
    setHoveredRow(layerIndex);
    setSelectedRow(layerIndex);
    prevLayerRef.current = layerIndex;

    // V1: 마우스 오버시 해당 행 도어/서랍 열기
    setDoorOpen(layerIndex, true);
    setDrawerOpen(layerIndex, true);

    // 3D→2D 화면좌표 변환: 가구 우측 끝
    const col = colliders.find((c) => c.index === layerIndex);
    if (!col) return;

    // 가구 우측 끝 정면 좌표를 화면 좌표로 변환
    const worldPos = new THREE.Vector3(width / 2 + 5, col.y, 0);
    worldPos.project(camera);

    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    const screenX = ((worldPos.x + 1) / 2) * rect.width;
    const screenY = ((-worldPos.y + 1) / 2) * rect.height;

    useUIStore.setState({
      floatingBoxX: screenX + 15,
      floatingBoxY: screenY,
    });
  }, [camera, gl, width, depth, colliders, setHoveredRow, setSelectedRow, setDoorOpen, setDrawerOpen]);

  const handlePointerOut = useCallback((layerIndex: number) => {
    setDoorOpen(layerIndex, false);
    setDrawerOpen(layerIndex, false);

    hideTimeoutRef.current = setTimeout(() => {
      const { isFloatingBoxHovered } = useUIStore.getState();
      if (isFloatingBoxHovered) return;
      setHoveredIndex(null);
      setHoveredRow(null);
      setSelectedRow(null);
      prevLayerRef.current = null;
    }, 800);
  }, [setHoveredRow, setSelectedRow, setDoorOpen, setDrawerOpen]);

  return (
    <group>
      {colliders.map((c) => (
        <mesh
          key={`collider-${c.index}`}
          position={[0, c.y, depth / 2]}
          onPointerOver={(e) => {
            e.stopPropagation();
            handlePointerOver(c.index);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            handlePointerOut(c.index);
          }}
        >
          <boxGeometry args={[width - 2.5, c.height - 0.5, depth - 1]} />
          <meshBasicMaterial
            color={0x2a7a1a}
            transparent
            opacity={hoveredIndex === c.index ? 0.3 : 0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
