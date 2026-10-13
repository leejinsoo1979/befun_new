/**
 * 확정되지 않은 가공이 실린 판재의 생산 파일 내보내기 차단.
 *
 * 원천은 판재 계산부다(선택 제품이 있는 가구의 판재에 `manufacturingReady: false`와 사유를 단다).
 * 이 파일은 그 표시를 **읽기만** 한다 — 지우거나 true로 바꾸지 않고, 없는 값을 만들어 내지도 않는다.
 *
 * 규칙:
 * - 필드가 없으면(`undefined`) 기존 동작 그대로 통과시킨다. 옛 판재를 막지 않는다.
 * - `manufacturingReady === false`가 하나라도 있으면 **배치 전체**를 막는다.
 *   일부만 빼고 내보내면 옆판 레일공이 빠진 채로 가공 파일이 나간다.
 * - 판재 자신뿐 아니라 함께 실린 `manufacturingBoring`도 본다. 변환 단계에서 표시가
 *   한쪽에만 남는 경우를 놓치지 않기 위해서다.
 * - `true` 승인값은 계약에 없다. `false`만 차단 신호로 읽는다.
 */

/** 차단 표시를 실을 수 있는 모든 판재 타입의 공통 부분. */
export interface ManufacturingBlockFields {
  manufacturingReady?: false;
  manufacturingBlockReasons?: string[];
}

export interface ManufacturingBlockSummary {
  blocked: boolean;
  /** 중복을 제거한 사유. 원천이 준 문장을 그대로 쓴다. */
  reasons: string[];
  /** 차단된 판재 이름. 이름이 없으면 식별자를 쓴다. */
  panelNames: string[];
}

/** 생산 파일 생성을 막았음을 알린다. 문자열·blob을 반환하는 내보내기에서 던진다. */
export class ManufacturingBlockedError extends Error {
  readonly code = 'manufacturing-blocked';
  readonly reasons: string[];
  readonly panelNames: string[];

  constructor(summary: ManufacturingBlockSummary, format: string) {
    super(formatManufacturingBlockMessage(summary, format));
    this.name = 'ManufacturingBlockedError';
    this.reasons = summary.reasons;
    this.panelNames = summary.panelNames;
  }
}

const MAX_LISTED_PANELS = 10;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function resolvePanelName(panel: Record<string, unknown>): string {
  for (const key of ['panelName', 'name', 'label', 'panelId', 'id']) {
    const value = panel[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '(이름 없는 판재)';
}

function readReasons(source: Record<string, unknown>): string[] {
  const reasons = source.manufacturingBlockReasons;
  if (!Array.isArray(reasons)) return [];
  return reasons.filter((reason): reason is string => typeof reason === 'string' && reason.trim().length > 0);
}

/** 판재 자신과 함께 실린 제조 좌표 중 어느 쪽에라도 차단 표시가 있으면 막는다. */
function collectFromPanel(panel: Record<string, unknown>): { blocked: boolean; reasons: string[] } {
  const sources = [panel, asRecord(panel.manufacturingBoring)].filter(
    (source): source is Record<string, unknown> => source != null);
  const blocked = sources.some(source => source.manufacturingReady === false);
  if (!blocked) return { blocked: false, reasons: [] };
  return { blocked: true, reasons: sources.flatMap(readReasons) };
}

/** 판재 목록에서 차단 표시를 모은다. 목록을 바꾸지 않는다. */
export function collectManufacturingBlock(panels: readonly unknown[] | null | undefined): ManufacturingBlockSummary {
  const reasons: string[] = [];
  const panelNames: string[] = [];
  for (const entry of panels ?? []) {
    const panel = asRecord(entry);
    if (!panel) continue;
    const found = collectFromPanel(panel);
    if (!found.blocked) continue;
    panelNames.push(resolvePanelName(panel));
    for (const reason of found.reasons) if (!reasons.includes(reason)) reasons.push(reason);
  }
  return { blocked: panelNames.length > 0, reasons, panelNames };
}

/**
 * 변환 단계에서 두 곳의 차단 표시를 합친다. 어느 한쪽이라도 `false`면 `false`를 남기고
 * 사유는 순서를 지켜 중복 없이 모은다. 변환은 **던지지 않는다** — 뷰어·미리보기가 멈추면 안 된다.
 */
export function mergeManufacturingBlock<T extends ManufacturingBlockFields>(
  target: T,
  ...sources: ReadonlyArray<ManufacturingBlockFields | null | undefined>
): T {
  const all = [target, ...sources].filter(
    (source): source is ManufacturingBlockFields => source != null);
  if (!all.some(source => source.manufacturingReady === false)) return target;
  const reasons: string[] = [];
  for (const source of all) {
    for (const reason of readReasons(source as Record<string, unknown>)) {
      if (!reasons.includes(reason)) reasons.push(reason);
    }
  }
  target.manufacturingReady = false;
  if (reasons.length) target.manufacturingBlockReasons = reasons;
  return target;
}

/**
 * 재동기화 키 조각. 차단 표시만 바뀐 갱신이 "내용 동일"로 걸러지면
 * 막힌 판재가 옛 상태로 남는다. 그래서 키에 이 값을 넣는다.
 */
export function manufacturingBlockKey(panel: ManufacturingBlockFields | null | undefined): string {
  if (!panel || panel.manufacturingReady !== false) return '';
  return `blocked:${(panel.manufacturingBlockReasons ?? []).join('\u00a7')}`;
}

/** 사용자에게 보여 줄 한 덩어리 문장. 사유가 없으면 사유가 없다는 사실을 적는다. */
export function formatManufacturingBlockMessage(summary: ManufacturingBlockSummary, format: string): string {
  const listed = summary.panelNames.slice(0, MAX_LISTED_PANELS).join(', ');
  const rest = summary.panelNames.length - MAX_LISTED_PANELS;
  const lines = [
    `${format} 내보내기를 중단했습니다. 확정되지 않은 가공이 있는 판재가 ${summary.panelNames.length}개 있습니다.`,
    summary.reasons.length
      ? `사유:\n${summary.reasons.map(reason => `- ${reason}`).join('\n')}`
      : '사유: 원천이 사유를 남기지 않았습니다.',
    `대상 판재: ${listed}${rest > 0 ? ` 외 ${rest}개` : ''}`,
  ];
  return lines.join('\n');
}

/**
 * 배치 전체를 검사한다. 하나라도 막히면 파일을 만들기 전에 던진다.
 * 결과 객체를 반환하는 내보내기는 자기 try/catch가 이 예외를 기존 실패 계약으로 옮긴다.
 */
export function assertManufacturingReady(panels: readonly unknown[] | null | undefined, format: string): void {
  const summary = collectManufacturingBlock(panels);
  if (summary.blocked) throw new ManufacturingBlockedError(summary, format);
}
