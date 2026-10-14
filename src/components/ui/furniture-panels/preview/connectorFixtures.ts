/**
 * PREVIEW 데이터 — 패널 접합 방식(OVVO / Tylko 클립) 선택. 기존 choice/notice view와 set intent만 사용한다.
 *
 * 구분해서 보여주는 세 가지
 *  1. 현재 방식: `connectorSystem` choice의 value (id·라벨은 공통 `@/types/connectors`).
 *  2. 검증된 모델 선택 가능 여부: OVVO는 옵티마이저 카탈로그(`OVVO_CONNECTORS`)의 autoApplicable을 그대로 option.enabled로 쓴다.
 *     Tylko 클립은 품번·치수가 미확정이라 모델 선택 컨트롤 자체를 비활성(사유 표시)으로 둔다.
 *  3. 가공 상태: notice. Tylko 클립은 공통 문구 `CLIP_SPEC_PENDING`(가공 미생성)을 그대로 쓴다.
 *
 * 방식을 바꿔도 스타일·치수·재질·이전 OVVO 모델 값은 지우지 않는다(숨김만). 실제 저장·가공 반영은 리더 상태 전이 소유.
 * 클립 색상(검정/주황/은색)은 공식 PDF connector-clip-003 p2 관찰. 색상별 잠금 역할·품번은 미확인.
 */
import type { FurnitureControl, FurniturePanelView } from '../types';
import { OVVO_CONNECTORS } from '@/lib/optimizer/connectors/ovvo';
import { CLIP_SPEC_PENDING, PANEL_CONNECTOR_SYSTEMS } from '@/types/connectors';
import { FAMILY_PRESETS, type FamilyPreset, type Values } from './familyFixtures';

const G = { scope: 'global' } as const;
const NONE = 'none';

const ovvoModel = (id: 'connectorBody' | 'connectorBack', label: string, value: string | number, visible: boolean): FurnitureControl => ({
  kind: 'choice', variant: 'pill', id, label, target: G, visible, enabled: true, value: String(value),
  options: [{ id: NONE, label: '없음' }, ...OVVO_CONNECTORS.map((c) => ({ id: c.model, label: c.model, enabled: c.autoApplicable }))],
  notice: OVVO_CONNECTORS.some((c) => !c.autoApplicable)
    ? `비활성 모델은 자동 배치 불가: ${OVVO_CONNECTORS.filter((c) => !c.autoApplicable).map((c) => c.model).join(', ')}`
    : undefined,
});

function connectorControls(v: Values): FurnitureControl[] {
  const ovvo = v.connectorSystem === 'ovvo';
  const picked = [v.connectorBody, v.connectorBack].filter((m) => m !== NONE);
  return [
    {
      kind: 'choice', variant: 'pill', id: 'connectorSystem', label: '접합 방식', target: G, visible: true, enabled: true,
      value: String(v.connectorSystem), options: PANEL_CONNECTOR_SYSTEMS.map((s) => ({ id: s.id, label: s.label })),
    },
    ovvoModel('connectorBody', '몸통 모델', v.connectorBody, ovvo),
    ovvoModel('connectorBack', '백패널 모델', v.connectorBack, ovvo),
    {
      kind: 'choice', variant: 'pill', id: 'clipModel', label: '클립 모델', target: G, visible: !ovvo, enabled: false,
      disabledReason: '검증된 클립 모델 없음 — 품번·치수 미확정', value: null,
      options: [{ id: 'black', label: '검정' }, { id: 'orange', label: '주황(구형)' }, { id: 'silver', label: '은색' }],
    },
    {
      kind: 'notice', id: 'machiningStatus', label: '가공 상태', target: G, visible: true, enabled: true,
      text: ovvo
        ? (picked.length ? `${picked.join(' · ')} 가공 생성 대상(옵티마이저 기준)` : '모델 미선택 — 접합 가공 없음')
        : `가공 미확정: ${CLIP_SPEC_PENDING}`,
    },
  ];
}

const base = FAMILY_PRESETS.find((p) => p.id === 'original-row')!;

export const CONNECTOR_PRESET: FamilyPreset = {
  id: 'connector-system',
  title: '패널 접합 방식 (OVVO / Tylko 클립)',
  initial: { ...base.initial, connectorSystem: 'ovvo', connectorBody: 'V-1230R', connectorBack: NONE },
  view: (v): FurniturePanelView => {
    const view = base.view(v);
    return {
      ...view,
      panelProfileId: 'preview:connector-system',
      preview: { caseIds: ['connector-clip-003', ...(view.preview?.caseIds ?? [])], note: '접합 방식 선택 미리보기 — 실제 저장·가공 반영은 리더 연결 후' },
      tabs: view.tabs.map((t) => ({ ...t, controls: [...t.controls, ...connectorControls(v)] })),
    };
  },
};
