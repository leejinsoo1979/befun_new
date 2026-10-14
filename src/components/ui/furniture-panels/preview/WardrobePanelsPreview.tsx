'use client';

/**
 * PREVIEW 하네스 — 패널이 intent를 내보내고 새 view를 받아 다시 그리는 흐름을 확인하기 위한 것.
 * `applyPreviewIntent`는 관찰 사례의 결과를 재생하는 최소 시뮬레이션이며 리더의 상태 전이/clamp/생성기를 대신하지 않는다.
 * 실제 서비스 연결은 리더가 FurniturePanelView 계산과 intent 적용을 제공한 뒤 한다.
 */
import { useState } from 'react';
import { FurniturePanel } from '../FurniturePanel';
import type { FurnitureEditIntent } from '../types';
import { EDGE_INITIAL, TONE_INITIAL, edgeView, toneView, type EdgePreviewState, type TonePreviewState } from './wardrobeFixtures';

function applyEdge(state: EdgePreviewState, intent: FurnitureEditIntent): EdgePreviewState {
  if (intent.type !== 'set') return state;
  const v = intent.value;
  if (intent.target.scope === 'section') {
    const id = intent.target.sectionId;
    // 대상 구획만 바꾼다. 다른 구획은 그대로.
    return { ...state, sections: state.sections.map((s) => s.id !== id ? s : {
      ...s,
      ...(intent.controlId === 'layout' && { layout: String(v) }),
      ...(intent.controlId === 'facade' && { facade: v as typeof s.facade }),
      ...(intent.controlId === 'doorDirection' && { door: v as typeof s.door }),
      ...(intent.controlId === 'sectionHeight' && { heightCm: Number(v) }),
      ...(intent.controlId === 'sectionDepth' && { depthCm: Number(v) as typeof s.depthCm }),
    }) };
  }
  switch (intent.controlId) {
    case 'width': return { ...state, widthCm: Number(v) };
    case 'height': return { ...state, heightCm: Number(v) };
    case 'depth': return { ...state, depthCm: Number(v) as EdgePreviewState['depthCm'] };
    case 'topEdge': return { ...state, topEdge: v as EdgePreviewState['topEdge'] };
    case 'finish': return { ...state, finish: v as EdgePreviewState['finish'] };
    case 'color': return { ...state, color: String(v) };
  }
  return state;
}

function applyTone(state: TonePreviewState, intent: FurnitureEditIntent): TonePreviewState {
  if (intent.type === 'heightMode') {
    // tone-001→002: 높이+ → 238 / tone-002→003: 기본 → 237 (관찰값)
    return intent.to === 'extended'
      ? { ...state, heightMode: 'extended', heightPreset: null, heightCm: 238 }
      : { ...state, heightMode: 'presets', heightPreset: '237', heightCm: 237 };
  }
  if (intent.type !== 'set') return state;
  const v = intent.value;
  switch (intent.controlId) {
    case 'width': return { ...state, widthCm: Number(v) };
    case 'height': return typeof v === 'string'
      ? { ...state, heightPreset: v as TonePreviewState['heightPreset'], heightCm: Number(v) }
      : { ...state, heightCm: v };
    case 'depth': return { ...state, depthCm: Number(v) };
    case 'lighting': return { ...state, lighting: v as TonePreviewState['lighting'] };
    case 'outerColor': return { ...state, outer: String(v) };
    case 'innerColor': return { ...state, inner: String(v) };
    case 'layout': return { ...state, layout: String(v) };
    case 'drawers': return { ...state, drawers: v as TonePreviewState['drawers'] };
  }
  return state;
}

export function WardrobePanelsPreview({ onLog }: { onLog?: (line: string) => void }) {
  const [edge, setEdge] = useState(EDGE_INITIAL);
  const [edgeSection, setEdgeSection] = useState('s2');
  const [tone, setTone] = useState(TONE_INITIAL);
  const log = (name: string, intent: FurnitureEditIntent) => onLog?.(`${name} ${JSON.stringify(intent)}`);
  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <section aria-label="Edge 옷장 패널" style={{ width: 'min(400px, 100%)' }} data-testid="edge-panel">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Edge 옷장</h3>
        <FurniturePanel view={edgeView(edge, edgeSection)} onSelectSection={setEdgeSection}
          onIntent={(i) => { log('edge', i); setEdge((s) => applyEdge(s, i)); }} />
      </section>
      <section aria-label="Tone 옷장 패널" style={{ width: 'min(400px, 100%)' }} data-testid="tone-panel">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Tone 옷장</h3>
        <FurniturePanel view={toneView(tone)} onIntent={(i) => { log('tone', i); setTone((s) => applyTone(s, i)); }} />
      </section>
    </div>
  );
}
