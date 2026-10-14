import type { GuideStep, Point3 } from './sequence';
import { LONG_LEG_GEOMETRY_MM, LONG_LEG_PARTS, LONG_LEG_UNKNOWN } from '@/components/three/furniture-hardware/legs/longLegContract';

export type LegAction = 'disassemble' | 'assemble';
export const legVideoSource = 'https://www.youtube.com/watch?v=y_6rMHwOIzo';
export const legManualSource = 'https://tylko.com/EN_Disassembly_low_furniture.pdf';

const removal: readonly GuideStep[] = [
  { title: '중앙 은색 핀 찾기', instruction: '장착판 가운데의 작은 은색 핀을 찾으세요. 나사 3개는 풀지 않습니다. 원본 설명서대로 문·서랍을 빼고 가구를 보호판 위에 눕힌 상태에서 진행하세요.', check: '중앙 핀과 나사 3개를 구분했어요', duration: 2.4, view: 'leg-mount' },
  { title: '중앙 핀 누르기', instruction: '드라이버 같은 도구로 중앙 은색 핀을 누릅니다. 나사를 돌리는 동작이 아닙니다. 다음 슬라이드 동안 누른 상태를 유지하세요.', check: '중앙 핀을 누르고 있어요', duration: 3.2, view: 'leg-mount' },
  { title: '누른 채 장착판 밀기', instruction: '핀을 누른 채 장착판과 다리 몸통을 함께 밑판과 평행하게 밀어 주세요. 큰 입구가 나사머리와 맞는 방향입니다. 정확한 이동거리는 미측정입니다.', check: '핀을 누른 채 큰 입구까지 밀었어요', duration: 3.2, view: 'leg-mount' },
  { title: '큰 입구에서 다리 분리', instruction: '나사머리 3개가 키홀의 큰 입구와 맞았는지 확인한 뒤 핀을 놓고 장착판·다리를 판재에서 함께 빼냅니다.', check: '입구 정렬 후 장착판·다리를 함께 뺐어요', duration: 3.2, view: 'leg-mount' },
  { title: '판재에 남은 부품 확인', instruction: '분리 후 나사 3개와 중앙 은색 핀은 판재에 그대로 남습니다. 장착판과 몸통이 함께 빠졌는지 원본 장면과 비교하세요.', check: '판재에 나사 3개와 중앙 핀이 남아 있어요', duration: 2.4, view: 'overview' },
];
const installation: readonly GuideStep[] = [
  { title: '판재와 장착판 확인', instruction: '판재의 나사 3개·중앙 핀과 다리의 장착판을 확인하세요. 출고된 부품을 사용하며 이 안내로 새 타공 위치를 정하지 않습니다.', check: '판재 부품과 장착판을 확인했어요', duration: 2.4, view: 'overview' },
  { title: '큰 입구와 나사머리 맞추기', instruction: '공식 영상처럼 장착판 입구를 판재의 고정 부품에 맞춥니다. 몸통과 장착판은 한 덩어리로 잡으세요.', check: '장착판 입구와 고정 부품을 맞췄어요', duration: 3.2, view: 'leg-mount' },
  { title: '장착판을 체결 위치로', instruction: '영상에서 다리가 체결되는 장면을 확인하세요. 큰 입구에서 좁은 홈 쪽으로 미는 상세 순서는 분리의 역순 추정이며 이동거리는 미측정입니다.', check: '장착판이 체결 위치에 들어갔어요', duration: 3.2, view: 'leg-mount' },
  { title: '중앙 핀 잠금 확인', instruction: '중앙 은색 핀이 잠금 위치에 있고 장착판이 다시 미끄러져 빠지지 않는지 확인하세요. 잠금 확인 전에는 조립 완료로 표시하지 않습니다. 내부 잠금 구조는 미확정입니다.', check: '중앙 핀 잠금과 장착판 고정을 확인했어요', duration: 3.2, view: 'leg-mount' },
  { title: '장착된 다리 확인', instruction: '몸통과 장착판이 함께 고정된 상태를 확인하세요. 이 화면은 다리 한 곳의 안내이며 가구 전체 조립 완료를 뜻하지 않습니다.', check: '이 다리의 장착 상태를 확인했어요', duration: 2.4, view: 'overview' },
];
export function legSteps(action: LegAction): readonly GuideStep[] { return action === 'disassemble' ? removal : installation; }

export const legGuideContract = {
  parts: LONG_LEG_PARTS,
  unknown: LONG_LEG_UNKNOWN,
  slideTravelMm: LONG_LEG_UNKNOWN.slideTravelMm,
  pinTravelMm: LONG_LEG_UNKNOWN.pinProtrusionMm,
  movement: 'plate-and-shaft-rigid' as const,
  fixedModelAvailable: LONG_LEG_PARTS.filter(part => part.role === 'fixed').every(part => part.inAsset),
};

/** Sequence state only. No invented mm positions for the absent pin, screws or travel. */
export function legPhase(action: LegAction, step: number, progress: number) {
  const index = Math.min(4, Math.max(0, Math.floor(Number.isFinite(step) ? step : 0)));
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  return action === 'disassemble' ? {
    pinPressed: index === 1 ? p === 1 : index === 2,
    pinReleased: index >= 3,
    openingAligned: index > 2 || index === 2 && p === 1,
    removed: index > 3 || index === 3 && p === 1,
    locked: index === 0 || index === 1 && p === 0,
  } : {
    pinPressed: false, pinReleased: true, openingAligned: index < 2,
    removed: index === 0,
    locked: index > 3 || index === 3 && p === 1,
  };
}

/** Follow mode confirms physical prerequisites; watch mode describes source material only. */
export function canConfirmLeg(action: LegAction, step: number, progress: number, confirmed: ReadonlySet<number>) {
  if (progress < 1) return false;
  for (let index = 0; index < step; index++) if (!confirmed.has(index)) return false;
  const phase = legPhase(action, step, progress);
  return step !== 4 || (action === 'assemble' ? phase.locked && confirmed.has(3) : phase.removed && confirmed.has(1) && confirmed.has(2) && confirmed.has(3));
}

export type LegFrame = 'align' | 'seat' | 'locked' | 'press' | 'slide' | 'entry' | 'removed';
/** Discrete original frames; no synthetic interpolation of hardware. */
export function legReferenceFrame(action: LegAction, step: number, progress: number): LegFrame {
  if (action === 'assemble') return (['removed', 'align', 'seat', 'locked', 'locked'] as const)[Math.max(0, Math.min(4, step))];
  if (step <= 0) return 'locked';
  if (step === 1) return progress < .5 ? 'locked' : 'press';
  if (step === 2) return progress < .25 ? 'press' : progress < .75 ? 'slide' : 'entry';
  if (step === 3) return progress < .5 ? 'entry' : 'removed';
  return 'removed';
}

/** Inspect the exact shared static asset. Motion uses original video until travel/anchors exist. */
export function legInspectionShot(aspect: number, overview: boolean, rear: boolean) {
  const h = LONG_LEG_GEOMETRY_MM.totalHeight;
  const target: Point3 = overview ? [-12, h * .55, 12] : [-17, h - 4, 17];
  const direction: Point3 = overview ? [1, .35, 1.5] : [1, -.7, 1.3];
  if (rear) direction[0] *= -1;
  const radius = overview ? h * .75 : h * .37;
  const fit = radius / Math.sin(Math.atan(Math.tan(Math.PI / 9) * Math.min(1, Math.max(.2, aspect))));
  const length = Math.hypot(...direction);
  return { target, position: target.map((v, i) => v + direction[i] / length * fit) as Point3, up: [0, 1, 0] as Point3 };
}
