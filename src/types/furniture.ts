/**
 * 공통 UI 계약 R1.3 — 소유자: 리더(codex-analysis).
 * UI view/intent의 단일 정의. 제품군 생성기·저장 스키마·적용 함수 구현을 의미하지 않는다.
 * 기존 furniture-panels/types.ts(R1.2 preview)와 필드 호환을 유지한다.
 * UI 담당은 해당 파일을 이 모듈의 type re-export로 교체한다.
 *
 * 컨트롤 값은 unit에 명시된 표시 단위다. mm 설계 상태와의 변환은 리더 어댑터가 맡는다.
 * sectionId는 안정 ID이며 배열 index로 대체하지 않는다. 탭·선택 구획은 UI 상태다.
 * unknown step은 null이다. step='any'를 제조 정밀도로 해석하지 않는다.
 * ID 값은 아직 registry가 없으므로 string을 유지한다. 이 타입만으로 지원 제품을 판정하지 않는다.
 */

/** 컨트롤이 바꾸는 대상: 전역(가구 전체) 또는 특정 구획(안정 ID). */
export type ControlTarget = { scope: 'global' } | { scope: 'section'; sectionId: string };

export interface ControlBase {
  /** 제어 ID — 리더 registry의 문자열. UI는 그대로 intent에 싣는다. */
  id: string;
  label: string;
  target: ControlTarget;
  /** false면 렌더하지 않는다(값 삭제 여부와 무관). */
  visible: boolean;
  /** false면 비활성으로 렌더하고 intent를 내보내지 않는다. */
  enabled: boolean;
  disabledReason?: string;
  /** 라벨 옆 (?) 도움말 */
  help?: string;
  /** 컨트롤 아래 안내 문구(예: 천장 높이 안내, 조명 후면 4cm 안내) */
  notice?: string;
}

export interface SliderControl extends ControlBase {
  kind: 'slider';
  value: number;
  min: number;
  max: number;
  /** null = 미확인. 근거 없는 step을 만들지 않는다(입력은 'any'). */
  step: number | null;
  unit: string;
  /** 슬라이더 위 점 표시(예: Edge 높이의 행 경계). 같은 단위. */
  markers?: number[];
  /**
   * 표시 문자열. value가 표시값과 다를 때 리더가 지정(예: Original 행 높이는 인덱스 0–9, 표시는 163cm).
   * null이면 값 pill을 숨긴다(예: Desk 다리 공간 위치 — 관찰 화면에 값 표시 없음).
   */
  displayValue?: string | null;
  /** 숫자 직접 입력 칸(Tone 계열 spinbutton) */
  numberInput?: boolean;
}

/** −/+ 스테퍼. 증감 가능 여부는 리더가 계산한다(Edge 구획, Desk 수납 구획, Tone14 구획 수). */
export interface StepperControl extends ControlBase {
  kind: 'stepper';
  value: number;
  canDecrement: boolean;
  canIncrement: boolean;
}

export interface ChoiceOption {
  id: string;
  label: string;
  /** 타일형 선택지 아이콘 */
  icon?: ChoiceIcon;
  /** 아이콘 이미지(스타일 아이콘 등). 선택 시 activeImageUrl이 있으면 그것을 쓴다. */
  imageUrl?: string;
  activeImageUrl?: string;
  enabled?: boolean;
}

export type ChoiceIcon =
  | 'facade-open' | 'facade-middle-open' | 'facade-bottom-open' | 'facade-closed'
  | 'door-left' | 'door-right'
  | 'drawer-internal' | 'drawer-external'
  | 'style-minimal' | 'style-hanging' | 'style-legs'
  | 'handle-grip' | 'handle-push';

export interface ChoiceControl extends ControlBase {
  kind: 'choice';
  /** pill = 둥근 버튼 그룹, tile = 아이콘 타일 */
  variant: 'pill' | 'tile';
  options: ChoiceOption[];
  value: string | null;
}

export interface SwatchOption {
  id: string;
  label: string;
  /** CSS color 또는 이미지 URL(둘 중 하나) */
  color?: string;
  imageUrl?: string;
}

export interface SwatchControl extends ControlBase {
  kind: 'swatch';
  options: SwatchOption[];
  value: string | null;
}

/**
 * Tone 높이: 고정 프리셋 버튼(200/237) + "높이+" 확장. 확장 모드에서는 Standard 버튼 + 범위 슬라이더.
 * 확장 진입·Standard 복귀 시 실제 값(238/237)은 리더의 상태 전이 결과로 받는다.
 */
export interface HeightModeControl extends ControlBase {
  kind: 'heightMode';
  mode: 'presets' | 'extended';
  presets: { id: string; label: string }[];
  selectedPresetId: string | null;
  extendLabel: string;
  standardLabel: string;
  /** mode === 'extended'일 때만 사용 */
  range: { value: number; min: number; max: number; step: number | null; unit: string } | null;
}

export interface ActionControl extends ControlBase {
  kind: 'action';
  actionLabel: string;
}

export interface NoticeControl extends ControlBase {
  kind: 'notice';
  text: string;
  link?: { label: string; href: string };
}

/** 내부 배치 썸네일. 그림은 관찰 기반 간이 도식(레일·선반·서랍) 또는 이미지. */
export interface LayoutOption {
  id: string;
  label: string;
  glyph?: LayoutGlyph;
  imageUrl?: string;
}

/** 0(바닥)~1(천장) 상대 위치의 간이 도식 요소 */
export interface LayoutGlyph {
  rails?: number[];
  shelves?: number[];
  drawers?: { from: number; to: number; count: number }[];
}

export interface LayoutControl extends ControlBase {
  kind: 'layout';
  options: LayoutOption[];
  value: string | null;
}

export type FurnitureControl =
  | SliderControl
  | ChoiceControl
  | SwatchControl
  | HeightModeControl
  | ActionControl
  | NoticeControl
  | LayoutControl
  | StepperControl;

export interface PanelSection {
  id: string;
  label: string;
}

export interface PanelTab {
  id: string;
  label: string;
  /** 이 탭이 구획 선택을 사용하는지(Edge 내부 구성) */
  usesSections?: boolean;
  /** 표시 순서 그대로 렌더한다(UI가 재정렬하지 않음). */
  controls: FurnitureControl[];
  /** steps 레이아웃에서 섹션 제목(예: "스타일 선택") */
  heading?: string;
  /** 구획 정보 요약(Tone 내부 구성: 구획 너비/전체 너비) */
  sectionSummary?: { title: string; value: string; caption?: string };
}

/** 리더가 상태에서 계산해 넘기는 패널 view(공통 계약 FurniturePanelView에 대응). */
export interface FurniturePanelView {
  panelProfileId: string;
  /**
   * tabs = 탭 전환(Edge 외형/내부 구성), steps = 한 화면에 단계별 섹션 + 단계 이동 버튼(Tone 스타일/크기/색상/배치/요약),
   * single = 탭 없이 한 목록(Original·Desk·Vinyl). 생략 시 tabs.
   */
  layout?: 'tabs' | 'steps' | 'single';
  tabs: PanelTab[];
  sections: PanelSection[];
  selectedSectionId: string | null;
  /** preview 데이터 여부 — 실제 3D 미연결 상태를 화면에 표시한다. */
  preview?: { caseIds: string[]; note: string };
}

/** 사용자 변경 의도(공통 계약 FurnitureEditIntent에 대응). 리더가 검증·적용한다. */
export type FurnitureEditIntent =
  | { type: 'set'; controlId: string; target: ControlTarget; value: number | string }
  | { type: 'action'; controlId: string; target: ControlTarget }
  | { type: 'heightMode'; controlId: string; target: ControlTarget; to: 'extended' | 'standard' }
  | { type: 'applyPreset'; presetId: string };
