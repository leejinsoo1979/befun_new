'use client';

import { useLocale } from '@/lib/commerce/useLocale';
import styles from './row-controls.module.css';
import { useMemo } from 'react';
import { calculateGridPanels } from '@/lib/three/styles/grid';
import { calculateSlantPanels } from '@/lib/three/styles/slant';
import { calculatePixelPanels } from '@/lib/three/styles/pixel';
import { calculateGradientPanels } from '@/lib/three/styles/gradient';
import { calculatePatternPanels } from '@/lib/three/styles/pattern';
import { calculateMosaicPanels } from '@/lib/three/styles/mosaic';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useShelfStore } from '@/stores/useShelfStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useUIStore } from '@/stores/useUIStore';
import { hardwareModes, type HardwareMode } from '@/lib/three/hardware-state';
import type { RowHeight } from '@/types/shelf';

const ROW_HEIGHTS: RowHeight[] = [18, 28, 38];

// Reference: 300mm row pitch for doors; drawers from 320mm depth below 1578mm.
const MIN_DOOR_HEIGHT = 28;
const MIN_DRAWER_DEPTH = 32;

export function RowControls() {
  const { t } = useLocale();
  const category = useMaterialStore(s => s.colorCategory);
  const family = category === 'classic' || category === 'natural' ? 'type01' as const : 'type02' as const;
  const hasBackPanel = useShelfStore(s => s.hasBackPanel);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const depth = useShelfStore((s) => s.depth);
  const setRowHeight = useShelfStore((s) => s.setRowHeight);
  const doorsCreatedLayers = useHardwareStore((s) => s.doorsCreatedLayers);
  const drawersCreatedLayers = useHardwareStore((s) => s.drawersCreatedLayers);
  const rowStyles = useHardwareStore((s) => s.rowStyles);
  const setMode = useHardwareStore((s) => s.setMode);
  const selectedRow = useUIStore((s) => s.selectedRow);
  const width = useShelfStore((s) => s.width);
  const height = useShelfStore((s) => s.height);
  const style = useShelfStore((s) => s.style);
  const density = useShelfStore((s) => s.density);
  const numRows = useShelfStore((s) => s.numRows);
  const thickness = useShelfStore((s) => s.thickness);
  const compartmentCount = useMemo(() => {
    if (selectedRow === null) return Infinity;
    const input = { width,height,depth,thickness,density,rowHeights,numRows,hasBackPanel,hardwareRowStyles:rowStyles,family };
    const generators = { grid: calculateGridPanels, slant: calculateSlantPanels, pixel: calculatePixelPanels,
      gradient: calculateGradientPanels, pattern: calculatePatternPanels, mosaic: calculateMosaicPanels };
    const cells = style === 'mosaic' ? calculateMosaicPanels(input).cells : generators[style](input).openings;
    if (!cells) return Infinity;
    const spans = cells.filter(c => c.rowIndex <= selectedRow && c.rowIndex+c.rowSpan > selectedRow);
    return new Set(spans.map(c => `${c.x}:${c.width}`)).size;
  }, [selectedRow,style,width,height,depth,thickness,density,rowHeights,numRows,rowStyles,family,hasBackPanel]);

  // V1에서는 floating box가 3D 뷰어 위에 나타남
  // V2에서는 선택된 행이 있을 때만 해당 행 컨트롤을 표시
  if (selectedRow === null) return null;

  const i = selectedRow;
  const rh = rowHeights[i] ?? 32;
  const fallback = drawersCreatedLayers.includes(i) ? (doorsCreatedLayers.includes(i) ? 22 : 21) : doorsCreatedLayers.includes(i) ? 12 : 11;
  const modes = hardwareModes(rowStyles[i] ?? fallback);
  const canAddDoor = rh >= MIN_DOOR_HEIGHT;
  const rowTop = rowHeights.slice(0,i+1).reduce((sum,h)=>sum+h+2,0);
  const canAddDrawer = depth >= MIN_DRAWER_DEPTH && rowTop <= 157.8;

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <span className={styles.rowNumber}>{String(i + 1).padStart(2, '0')}</span>
        <h3>{t('칸 설정')}</h3>
      </header>
      <section className={styles.section}>
        <p className={styles.label}>{t('칸 높이')}</p>
        <div className={styles.segment} role="group" aria-label={t('칸 높이')}>
          {ROW_HEIGHTS.map(h => <button type="button" key={h} aria-pressed={rh === h}
            onClick={() => setRowHeight(i, h)}>
            {h}<span className={styles.unit}>cm</span>
          </button>)}
        </div>
      </section>
      {(['doors', 'drawers'] as const).map(kind => {
        const enabled = kind === 'doors' ? canAddDoor : canAddDrawer;
        const label = t(kind === 'doors' ? '도어' : '서랍');
        return <section className={styles.section} key={kind}>
          <p className={styles.label}>{label}</p>
          <div className={styles.segment} role="group" aria-label={label}>
            {(['none', 'some', 'max'] as HardwareMode[]).map(mode => {
              const disabled = mode !== 'none' && (!enabled || (mode === 'some' && compartmentCount <= 1));
              return <button type="button" key={mode} disabled={disabled} aria-pressed={modes[kind] === mode}
                onClick={() => setMode(i, kind, mode)}>
                {t(mode === 'none' ? '없음' : mode === 'some' ? '일부' : '전체')}
              </button>;
            })}
          </div>
          {!enabled && <p className={styles.hint}>{t(
            kind === 'doors' ? '칸 높이 28cm부터 도어 장착 가능'
              : depth < MIN_DRAWER_DEPTH ? '깊이 32cm부터 서랍 장착 가능'
                : '서랍은 행 상단 높이 157.8cm 이하에서 장착 가능'
          )}</p>}
        </section>;
      })}
    </div>
  );
}
