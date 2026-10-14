/**
 * MOVENTO 760H BLUMOTION S / 40kg 길이 선정. 단위 mm.
 * 출처: Blum Catalogue 2024/25 인쇄 412(품번), 413(설치도).
 * https://publications.blum.com/2024/catalogue/en/412/
 * https://publications.blum.com/2024/catalogue/en/413/
 * 길이 적합성만 계산한다. CAD·설치 높이·가공·장착 적합성을 승인하지 않는다.
 */
export const MOVENTO_40KG_RUNNERS = [
  { nominalLengthMm: 250, partNumber: '760H2500S' },
  { nominalLengthMm: 270, partNumber: '760H2700S' },
  { nominalLengthMm: 300, partNumber: '760H3000S' },
  { nominalLengthMm: 320, partNumber: '760H3200S' },
  { nominalLengthMm: 350, partNumber: '760H3500S' },
  { nominalLengthMm: 380, partNumber: '760H3800S' },
  { nominalLengthMm: 400, partNumber: '760H4000S' },
  { nominalLengthMm: 420, partNumber: '760H4200S' },
  { nominalLengthMm: 450, partNumber: '760H4500S' },
  { nominalLengthMm: 480, partNumber: '760H4800S' },
  { nominalLengthMm: 500, partNumber: '760H5000S' },
  { nominalLengthMm: 520, partNumber: '760H5200S' },
  { nominalLengthMm: 550, partNumber: '760H5500S' },
  { nominalLengthMm: 600, partNumber: '760H6000S' },
] as const;

export type MoventoDepthInput = {
  /** 사용자가 허용한 최대 서랍 길이. 일반은 SKL, 속서랍은 앞판 포함 ISKL. */
  requestedDrawerLengthMm: number;
  /** 공식 도면의 몸통 앞 기준 → 내부 뒤쪽 장애물까지. 몸통 외경 깊이가 아니다. */
  availableInstallationDepthMm: number;
  sideStabilisation?: boolean;
} & ({ application: 'standard' } | {
  application: 'inner';
  frontThicknessMm: number;
  depthAdjustment?: boolean;
});

export interface MoventoDepthCandidate {
  partNumber: typeof MOVENTO_40KG_RUNNERS[number]['partNumber'];
  nominalLengthMm: number;
  /** 일반 서랍 길이 SKL = NL - 10. 속서랍의 앞판 X는 포함하지 않는다. */
  boxLengthMm: number;
  drawerLengthMm: number;
  requiredInstallationDepthMm: number;
}

export type MoventoDepthResult =
  | { status: 'invalid-input'; candidates: []; selected: null }
  | { status: 'no-fitting-size'; candidates: []; selected: null }
  | { status: 'depth-fit'; candidates: MoventoDepthCandidate[]; selected: MoventoDepthCandidate };

/**
 * 입력 길이와 설치 여유를 모두 넘지 않는 가장 긴 기성 규격을 제안한다.
 * 입력값은 수정하지 않는다. 요청값/제안값을 UI에서 구분해 적용해야 한다.
 * 레일 모델을 늘이거나 줄이는 축척값을 반환하지 않는다.
 */
export function selectMoventoDepth(input: MoventoDepthInput): MoventoDepthResult {
  const positive = (value: number) => Number.isFinite(value) && value > 0;
  if (!positive(input.requestedDrawerLengthMm) || !positive(input.availableInstallationDepthMm)
    || (input.application === 'inner' && !positive(input.frontThicknessMm))) {
    return { status: 'invalid-input', candidates: [], selected: null };
  }
  const front = input.application === 'inner' ? input.frontThicknessMm : 0;
  const adjustment = input.application === 'inner' && input.depthAdjustment ? 3 : 0;
  const stabilisation = input.sideStabilisation ? 12 : 0;
  const candidates: MoventoDepthCandidate[] = MOVENTO_40KG_RUNNERS.map(runner => ({
    ...runner,
    boxLengthMm: runner.nominalLengthMm - 10,
    drawerLengthMm: runner.nominalLengthMm - 10 + front,
    requiredInstallationDepthMm: runner.nominalLengthMm + front + 3 + adjustment + stabilisation,
  })).filter(runner => runner.drawerLengthMm <= input.requestedDrawerLengthMm
    && runner.requiredInstallationDepthMm <= input.availableInstallationDepthMm);
  const selected = candidates.at(-1);
  return selected ? { status: 'depth-fit', candidates, selected }
    : { status: 'no-fitting-size', candidates: [], selected: null };
}
