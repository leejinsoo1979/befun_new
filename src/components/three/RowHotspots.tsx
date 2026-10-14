'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useUIStore } from '@/stores/useUIStore';
import styles from './RowHotspots.module.css';

/** 가구 우측 끝에서 핫스팟까지 띄우는 거리(cm) */
const HOTSPOT_GAP = 7;
/** 핫스팟 오른쪽에서 팝업까지 간격(px) */
const POPUP_GAP = 12;

const pinTopLeft = (): [number, number] => [0, 0];

/** 행 팝업 열기: 이전 행 도어/서랍을 닫고 새 행을 연다. x/y는 캔버스 기준 px(모바일은 하단 고정이라 무시됨). */
export function openRowPopup(row: number, x: number, y: number) {
  const { selectedRow } = useUIStore.getState();
  const { setDoorOpen, setDrawerOpen } = useHardwareStore.getState();
  if (selectedRow !== null && selectedRow !== row) {
    setDoorOpen(selectedRow, false);
    setDrawerOpen(selectedRow, false);
  }
  setDoorOpen(row, true);
  setDrawerOpen(row, true);
  useUIStore.setState({ selectedRow: row, hoveredRow: row, floatingBoxX: x, floatingBoxY: y });
}

export function closeRowPopup() {
  const { selectedRow } = useUIStore.getState();
  if (selectedRow !== null) {
    const { setDoorOpen, setDrawerOpen } = useHardwareStore.getState();
    setDoorOpen(selectedRow, false);
    setDrawerOpen(selectedRow, false);
  }
  useUIStore.setState({ selectedRow: null, hoveredRow: null, isFloatingBoxHovered: false });
}

/**
 * 가구 우측의 행별 핫스팟. 클릭하면 해당 행의 행 설정 팝업(FloatingBox)을 연다(다시 누르면 닫힘).
 * 팝업은 카메라가 움직여도 선택된 핫스팟 옆을 따라간다.
 */
export function RowHotspots({ rows, width, depth }: { rows: { index: number; y: number }[]; width: number; depth: number }) {
  const selectedRow = useUIStore((s) => s.selectedRow);
  const gl = useThree((s) => s.gl);
  const anchor = useRef<THREE.Group>(null);
  const buttons = useRef(new Map<number, HTMLButtonElement>());
  const point = useRef(new THREE.Vector3());

  const anchorOf = (el: HTMLElement) => {
    const canvas = gl.domElement.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.right - canvas.left + POPUP_GAP, y: r.top + r.height / 2 - canvas.top };
  };

  // 매 프레임 현재 카메라로 화면 위치를 계산해 핫스팟을 배치하고, 열린 팝업이 핫스팟 옆을 따라가게 한다.
  useFrame(({ camera }) => {
    const group = anchor.current;
    if (!group) return;
    const w = gl.domElement.clientWidth, h = gl.domElement.clientHeight;
    for (const r of rows) {
      const el = buttons.current.get(r.index);
      if (!el) continue;
      const p = point.current.set(width / 2 + HOTSPOT_GAP, r.y, depth).applyMatrix4(group.matrixWorld).project(camera);
      el.style.transform = `translate3d(${((p.x + 1) / 2) * w}px, ${((1 - p.y) / 2) * h}px, 0) translate(-50%, -50%)`;
      el.style.visibility = p.z < 1 ? 'visible' : 'hidden';
    }
    const { selectedRow: row, floatingBoxX, floatingBoxY } = useUIStore.getState();
    const el = row === null ? undefined : buttons.current.get(row);
    if (!el) return;
    const { x, y } = anchorOf(el);
    if (Math.abs(x - floatingBoxX) > 0.5 || Math.abs(y - floatingBoxY) > 0.5) {
      useUIStore.setState({ floatingBoxX: x, floatingBoxY: y });
    }
  });

  // Html은 DOM 루트로만 쓰고(캔버스 좌상단 고정) 각 버튼 위치는 위 useFrame에서 현재 카메라로 직접 계산한다.
  return (
    <group ref={anchor}>
      <Html calculatePosition={pinTopLeft} zIndexRange={[9, 0]} style={{ pointerEvents: 'none' }}>
      {rows.map((r) => {
        const active = selectedRow === r.index;
        return (
          <button
            key={r.index}
            ref={(el) => { if (el) buttons.current.set(r.index, el); else buttons.current.delete(r.index); }}
            type="button"
            data-row-hotspot
            aria-label={`아래에서 ${r.index + 1}번째 칸 설정`}
            aria-expanded={active}
            // 캔버스(R3F 이벤트 소스)로 전파되면 터치 시 '빈 곳 탭'으로 처리돼 바로 닫히므로 막는다.
            onPointerEnter={() => useUIStore.setState({ hoveredRow: r.index })}
            onPointerLeave={() => {
              const { selectedRow, hoveredRow } = useUIStore.getState();
              if (hoveredRow === r.index) useUIStore.setState({ hoveredRow: selectedRow });
            }}
            onFocus={() => useUIStore.setState({ hoveredRow: r.index })}
            onBlur={() => {
              const { selectedRow, hoveredRow } = useUIStore.getState();
              if (hoveredRow === r.index) useUIStore.setState({ hoveredRow: selectedRow });
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (active) closeRowPopup();
              else { const { x, y } = anchorOf(e.currentTarget); openRowPopup(r.index, x, y); }
            }}
            style={{ position: 'absolute', left: 0, top: 0, visibility: 'hidden', pointerEvents: 'auto' }}
            className={`${styles.hotspot} ${active ? styles.active : ''} flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-solid transition-colors`}
          >
            <span className={`${styles.dot} block h-2.5 w-2.5 rounded-full`} />
          </button>
        );
      })}
      </Html>
    </group>
  );
}
