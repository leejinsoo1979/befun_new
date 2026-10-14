'use client';

/**
 * 기존 선반 6개 제어(Style·Density·Width·Height(행 수)·Depth·Back panels). 실제 `useShelfStore`를 구독하고,
 * 변경은 공유 handler(actions.ts)로 실행한다. 상태를 복사·persist하지 않는다.
 * 표현은 운영 패널과 같은 legacy 전용 렌더러(LegacyControls). Feet·Finish/Colour·가격·저장은 범위 밖(기존 컴포넌트 유지).
 */
import { useMemo } from 'react';
import { useShelfStore } from '@/stores/useShelfStore';
import type { FurnitureEditIntent } from '../types';
import { applyLegacyShelfIntent, type LegacyControlId, type LegacyIntentResult } from './actions';
import { buildLegacyShelfView } from './view';
import { LegacyControls } from './LegacyControls';

export interface LegacyShelfPanelProps {
  /** 적용 결과 관찰용(거절 사유 로깅 등). 선택 사항. */
  onResult?: (intent: FurnitureEditIntent, result: LegacyIntentResult) => void;
  /** 일부 제어만 렌더(모바일 탭 분할·Feet 끼워넣기용). 생략 시 6개 전부, 순서는 view 순서 유지. */
  controls?: readonly LegacyControlId[];
}

export function LegacyShelfPanel({ onResult, controls }: LegacyShelfPanelProps) {
  // 원시값·기존 배열 참조만 개별 구독(매 렌더 새 객체 selector로 인한 재렌더 루프 방지)
  const width = useShelfStore((s) => s.width);
  const depth = useShelfStore((s) => s.depth);
  const thickness = useShelfStore((s) => s.thickness);
  const style = useShelfStore((s) => s.style);
  const density = useShelfStore((s) => s.density);
  const hasBackPanel = useShelfStore((s) => s.hasBackPanel);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const numRows = useShelfStore((s) => s.numRows);
  const baseType = useShelfStore((s) => s.baseType);

  const visible = useMemo(() => {
    const view = buildLegacyShelfView({ width, depth, thickness, style, density, hasBackPanel, rowHeights, numRows, baseType });
    const all = view.tabs[0].controls;
    return controls ? all.filter((c) => controls.includes(c.id as LegacyControlId)) : all;
  }, [width, depth, thickness, style, density, hasBackPanel, rowHeights, numRows, baseType, controls]);

  const onIntent = (intent: FurnitureEditIntent) => {
    const result = applyLegacyShelfIntent(intent);
    onResult?.(intent, result);
  };

  return <LegacyControls controls={visible} emit={onIntent} />;
}
