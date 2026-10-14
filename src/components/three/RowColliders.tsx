'use client';

import { useRef, useCallback, useMemo } from 'react';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useShelfStore } from '@/stores/useShelfStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useUIStore } from '@/stores/useUIStore';
import { RowHotspots, openRowPopup, closeRowPopup } from './RowHotspots';

/**
 * V1 interactionHandler.js 이식:
 * 각 행(row)에 투명한 콜라이더를 배치하고,
 * 마우스 오버 시 도어/서랍만 열어 보여준다(하이라이트·팝업은 우측 핫스팟에서 제어).
 * 행 설정 팝업은 가구 우측 핫스팟(RowHotspots) 클릭으로 연다.
 * 터치: hover가 없으므로 행 탭으로도 열고(같은 행·빈 곳 탭 시 닫힘), 드래그(궤도 회전)는 무시
 */
const TAP_MAX_MOVE_PX = 8;
export function RowColliders() {
  const width = useShelfStore((s) => s.width);
  const depth = useShelfStore((s) => s.depth);
  const thickness = useShelfStore((s) => s.thickness);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const numRows = useShelfStore((s) => s.numRows);
  const setDoorOpen = useHardwareStore((s) => s.setDoorOpen);
  const setDrawerOpen = useHardwareStore((s) => s.setDrawerOpen);

  const { camera, gl } = useThree();
  const hoveredIndex = useUIStore(s => s.hoveredRow);
  const prevLayerRef = useRef<number | null>(null);

  // 행별 콜라이더 위치 계산 (V1 createRowColliders 이식)
  const colliders = useMemo(() => {
    const list: { index: number; y: number; height: number }[] = [];
    let currentY = 0;
    for (let i = 0; i < numRows; i++) {
      const rh = rowHeights[i] ?? 32;
      list.push({ index: i, y: currentY + rh / 2 + thickness, height: rh });
      currentY += rh + thickness;
    }
    return list;
  }, [numRows, rowHeights, thickness]);

  // 팝업이 열려 있으면 hover는 무시한다(선택된 행의 하이라이트·열린 도어 유지).
  const handlePointerOver = useCallback((layerIndex: number) => {
    if (useUIStore.getState().selectedRow !== null) return;
    if (prevLayerRef.current !== null && prevLayerRef.current !== layerIndex) {
      setDoorOpen(prevLayerRef.current, false);
      setDrawerOpen(prevLayerRef.current, false);
    }
    prevLayerRef.current = layerIndex;
    // V1: 마우스 오버시 해당 행 도어/서랍 열기
    setDoorOpen(layerIndex, true);
    setDrawerOpen(layerIndex, true);
  }, [setDoorOpen, setDrawerOpen]);

  const handlePointerOut = useCallback((layerIndex: number) => {
    if (useUIStore.getState().selectedRow !== null) return;
    setDoorOpen(layerIndex, false);
    setDrawerOpen(layerIndex, false);
    prevLayerRef.current = null;
  }, [setDoorOpen, setDrawerOpen]);

  const handleTap = useCallback((e: ThreeEvent<MouseEvent>, layerIndex: number) => {
    const pointerType = (e.nativeEvent as PointerEvent).pointerType;
    if (pointerType !== 'touch' && pointerType !== 'pen') return; // 마우스는 핫스팟으로 연다
    if (e.delta > TAP_MAX_MOVE_PX) return; // 궤도 회전 드래그
    e.stopPropagation();
    // 닫기 버튼으로도 닫힐 수 있으므로 스토어의 현재 선택 행 기준으로 토글
    if (useUIStore.getState().selectedRow === layerIndex) {
      closeRowPopup();
      return;
    }
    const col = colliders.find((c) => c.index === layerIndex);
    if (!col) return;
    // 가구 우측 끝 정면 좌표를 화면 좌표로 변환(태블릿 가로 등 데스크톱 레이아웃용)
    const p = new THREE.Vector3(width / 2 + 5, col.y, 0).project(camera);
    const rect = gl.domElement.getBoundingClientRect();
    openRowPopup(layerIndex, ((p.x + 1) / 2) * rect.width + 15, ((-p.y + 1) / 2) * rect.height);
  }, [camera, gl, width, colliders]);

  const isTouch = (e: ThreeEvent<PointerEvent>) => e.pointerType === 'touch' || e.pointerType === 'pen';

  return (
    <group
      onPointerMissed={(e) => {
        // 터치로 빈 곳을 탭하면 열린 행 닫기
        if ((e as PointerEvent).pointerType === 'touch' && useUIStore.getState().selectedRow !== null) closeRowPopup();
      }}
    >
      {colliders.map((c) => (
        <mesh
          key={`collider-${c.index}`}
          position={[0, c.y, depth / 2]}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (isTouch(e)) return;
            handlePointerOver(c.index);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            if (isTouch(e)) return;
            handlePointerOut(c.index);
          }}
          onClick={(e) => handleTap(e, c.index)}
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
      <RowHotspots rows={colliders} width={width} depth={depth} />
    </group>
  );
}
