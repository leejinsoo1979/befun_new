'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiShare } from 'react-icons/fi';
import { TbAugmentedReality2 } from 'react-icons/tb';
import { useDisplayStore, type ViewDirection } from './displayStore';
import { useUIStore } from '@/stores/useUIStore';
import { useMeasureStore } from '../measure/measureStore';
import styles from './display.module.css';
import { AssemblyTransport } from './AssemblyTransport';

// Befun 브랜드 그린 (globals.css --green). SVG fill 속성은 CSS 변수 호환이 불안정해 hex로 둔다
const ACCENT = '#339922';

const views: [ViewDirection, string][] = [['back', '후면'], ['standard', '입체']];

function CubeIcon({ face, split = false }: { face?: ViewDirection; split?: boolean }) {
  const color = ACCENT;
  return <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
    <path d={split ? 'M14 1 24 6 14 11 4 6Z' : 'M14 3 24 8 14 13 4 8Z'} fill={face === 'top' || face === 'standard' ? color : 'white'} />
    <path d={split ? 'M2 11 12 16 12 27 2 22Z' : 'M4 8 14 13 14 25 4 20Z'} fill={face === 'front' || face === 'left' || face === 'standard' ? color : 'white'} />
    <path d={split ? 'M26 11 16 16 16 27 26 22Z' : 'M24 8 14 13 14 25 24 20Z'} fill={face === 'right' || face === 'back' || face === 'standard' ? color : 'white'} />
    {face === 'bottom' && <path d="m4 20 10-5 10 5-10 5Z" fill={color} />}
    {(face === 'back' || face === 'left') && <path d="M14 3v12L4 20m10-5 10 5" strokeDasharray="2 2" />}
  </svg>;
}

export interface ViewToolbarActions {
  onShare?: () => void;
  onAR?: () => void;
  actionsDisabled?: boolean;
}

export function ViewToolbar({ onShare, onAR, actionsDisabled = false }: ViewToolbarActions = {}) {
  const router = useRouter();
  // Keep the product view clear; every tool remains available under the View toggle.
  const [expanded, setExpanded] = useState(false);
  const { showDecor, toggleDecor, boringSummary, showBores, toggleBores, phase, view, projection, appearance, setAppearance, exploded, freeOrbit, selectView, setProjection, toggleExploded } = useDisplayStore();
  const dimensions = useUIStore((s) => s.showDimensions);
  const setDimensions = useUIStore((s) => s.setShowDimensions);
  const measuring = useMeasureStore((s) => s.enabled);
  const toggleMeasure = useMeasureStore((s) => s.toggle);
  const moving = phase === 'assembling' || phase === 'disassembling';
  return <><div className={styles.toolbar} onKeyDown={(event) => { if (event.key === 'Escape') { setExpanded(false); event.currentTarget.querySelector<HTMLButtonElement>('button[aria-controls]')?.focus(); } }}>
    <button className={styles.menu} aria-expanded={expanded} aria-controls="viewer-display-options" title={expanded ? '보기 도구 접기' : '보기 도구 펼치기'} onClick={() => setExpanded(!expanded)}>
      <CubeIcon face="standard" /> 보기 <span aria-hidden="true" className={styles.chevron}>{expanded ? '⌃' : '⌄'}</span>
    </button>
    <div id="viewer-display-options" role="group" aria-label="선반 보기 모드" className={`${styles.options} ${expanded ? styles.expanded : ''}`}>
      <div className={styles.views}>
        {views.map(([key, label]) => <button key={key} title={`${label} 보기`} aria-label={`${label} 보기`} aria-pressed={!freeOrbit && view === key}
          onClick={() => selectView(key)}><CubeIcon face={key} /><span>{label}</span></button>)}
      </div>
      <div className={styles.actions}>
        <button title={showDecor ? '소품 숨기기' : '소품 표시'} aria-label="소품 표시" aria-pressed={showDecor} onClick={toggleDecor}>
          <svg viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M2 24h24M4 8h4v15H4zm5-3h4v18H9zm5 4 3-1 3 14-3 1zM22 12v-2h3v2c0 3 2 4 2 7 0 2-1 4-3.5 4S20 21 20 19c0-3 2-4 2-7Z"/><path d="M5 11h2m3-3h2m11 7h3"/></svg><span>소품</span>
        </button>
        <button title="투시도: 가까운 물체는 크게, 먼 물체는 작게 표시" aria-label="투시도" aria-pressed={projection === 'perspective'} onClick={() => setProjection('perspective')}>
          <svg viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M3 4h15v21H3Z"/><path d="m18 4 7 5v11l-7 5M3 4l9 5h13M3 25l9-5h13M12 9v11" stroke={ACCENT}/></svg>
          <span>투시도</span>
        </button>
        <button title="평행 투영: 원근 왜곡 없이 표시" aria-label="평행 투영" aria-pressed={projection === 'orthographic'} onClick={() => setProjection('orthographic')}>
          <svg viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="9" width="16" height="16"/><rect x="9" y="3" width="16" height="16" stroke={ACCENT}/><path d="m3 9 6-6m10 22 6-6M3 25l6-6"/></svg>
          <span>평행 투영</span>
        </button>
        <button title={exploded ? '조립 시뮬레이션 시작' : '부품을 바닥에 펼치기'} aria-label={phase === 'laidOut' ? '조립' : '분해'} disabled={moving} aria-pressed={exploded} onClick={() => { useUIStore.setState({ hoveredRow: null, selectedRow: null }); toggleExploded(); }}><CubeIcon split /><span>{phase === 'laidOut' ? '조립' : moving ? '재생 중' : '분해'}</span></button>
        <button title="Tylko 클립·OVVO·백패널의 단계별 3D 조립 예시" aria-label="커넥터 조립 안내 예시" onClick={() => router.push('/assembly-guide')}><CubeIcon split /><span>조립 안내</span></button>
        <button title="경첩을 숨기고 실제 컵홀과 측판 보링을 확인" aria-label="보링 보기" aria-pressed={showBores} onClick={toggleBores}>
          <svg viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="3" width="22" height="22" rx="2"/><circle cx="14" cy="12" r="6"/><circle cx="6.5" cy="18" r="1.5"/><circle cx="21.5" cy="18" r="1.5"/></svg><span>보링</span>
        </button>
        <button title="치수 표시" aria-pressed={dimensions} disabled={exploded} onClick={() => setDimensions(!dimensions)}>
          <svg viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M3 9h22v10H3Zm4 0v6m4-6v4m4-4v6m4-6v4"/></svg><span>치수</span>
        </button>
        <button title="판재에 마우스를 올려 가로·세로·깊이 측정" aria-label="측정" aria-pressed={measuring} disabled={exploded} onClick={toggleMeasure}>
          <svg viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 4h20v20H4Z"/><path d="M9 4v20M14 4v20M19 4v20M4 9h20M4 14h20M4 19h20" strokeWidth=".7"/><path d="m8 22 12-12" stroke={ACCENT} strokeWidth="1.6"/></svg><span>측정</span>
        </button>
      </div>
      {(onShare || onAR) && <div className={styles.actions} role="group" aria-label="공유 및 AR">
        {onShare && <button type="button" aria-label="디자인 공유" disabled={actionsDisabled} onClick={onShare}><FiShare size={24} aria-hidden="true" /><span>공유</span></button>}
        {onAR && <button type="button" aria-label="내 공간에서 보기 AR" disabled={actionsDisabled} onClick={onAR}><TbAugmentedReality2 size={24} aria-hidden="true" /><span>AR</span></button>}
      </div>}
      <div className={styles.appearance} role="group" aria-label="표시 방식">
        <button aria-label="실사 모드" aria-pressed={appearance === 'realistic'} onClick={() => setAppearance('realistic')}><CubeIcon face="standard" /><span>실사</span></button>
        <button aria-label="반투명 모드" aria-pressed={appearance === 'transparent'} onClick={() => setAppearance('transparent')}>
          <svg viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M14 3 25 9v12l-11 5L3 20V8Z" fill="#8cb4c8" fillOpacity=".3"/><path d="m3 8 11 6 11-5M14 14v12M14 3v12L3 20m11-5 11 6" strokeDasharray="2 2"/></svg><span>반투명</span>
        </button>
        <button aria-label="와이어프레임 모드" aria-pressed={appearance === 'wireframe'} onClick={() => setAppearance('wireframe')}>
          <svg viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M14 3 25 9v12l-11 5L3 20V8Zm0 0v12L3 20m11-5 11 6M3 8l11 6 11-5M14 14v12"/></svg><span>와이어프레임</span>
        </button>
      </div>
    </div>
  </div>
  {showBores && <aside className={styles.boringInfo} aria-label="Blum 보링 정보">
    <strong>Blum 71B3790 · 174H7100E</strong>
    <span>컵 Ø35 × 13mm · INSERTA Ø8 · 플레이트 Ø5 × 11.5mm</span>
    <span>{boringSummary.doors ? `도어 ${boringSummary.doors}개 · 보링 ${boringSummary.holes}개` : '도어를 추가하면 타공 위치가 표시됩니다.'}</span>
    {boringSummary.issues.map(issue=><span key={issue} role="status">{issue}</span>)}
  </aside>}
  <AssemblyTransport /></>;
}
