import { sampleOvvoRelease } from './ovvoMotion';
import type { GuideStep, Point3 } from './sequence';

export type JointAction = 'assemble' | 'disassemble';
export const releaseSteps: readonly GuideStep[] = [
  { title: '결합부와 해제 방향 확인', instruction: 'V-1230R의 두 결합 위치를 확인하세요. 받침판 A를 지지하고 세로판 B를 조립할 때와 반대 방향으로 밀 준비를 합니다.', check: '받침판을 지지하고 두 결합부를 확인했습니다.', duration: 2, view: 'overview' },
  { title: '15mm 밀어 잠금 해제', instruction: 'B를 화살표 방향으로 15mm 밀어 잠금을 해제합니다. 이 단계에서는 위로 들어 올리지 마세요. 단면 보기로 두 연결부가 해제 위치로 이동하는 모습을 확인하세요.', check: '두 연결부를 해제 위치까지 밀었습니다.', duration: 3.2, view: 'joint' },
  { title: '세로판 들어 분리', instruction: '슬라이드 해제를 마친 뒤 B를 위로 들어 분리합니다. 커넥터는 B의 하우징에 끼워진 상태로 함께 올라갑니다.', check: '잠금 해제 후 B를 들어 분리했습니다.', duration: 3.2, view: 'joint' },
  { title: '분리된 패널 확인', instruction: 'A에는 하우징이, B에는 하우징과 커넥터가 남습니다. 앞뒤 라미네이트 면과 자작나무 엣지를 돌려 보면서 분리된 상태를 확인하세요.', check: '하우징과 커넥터가 각 패널에 남아 있습니다.', duration: 2, view: 'overview' },
];

export function canConfirmRelease(step: number, progress: number, completed: ReadonlySet<number>) {
  return progress === 1 && Array.from({ length: step }, (_, index) => index).every(index => completed.has(index));
}

export function releasePose(step: number, progress: number) {
  const index = Math.max(0, Math.min(3, Math.floor(Number.isFinite(step) ? step : 0)));
  const phase = index === 0 ? 'seated' : index === 1 ? 'release-slide' : 'lift';
  const movement = sampleOvvoRelease('V-1230R', phase, index === 3 ? 1 : progress, 80);
  return { baseHousingOffset: 0, endHousingOffset: 0, connectorOffset: 0, panelGap: movement.normalGapMm, panelSlide: movement.slideOffsetMm, baseHousingsVisible: true, endHousingsVisible: true, connectorsVisible: true, complete: index === 3 };
}

export function releaseShot(step: number, progress: number, aspect: number, overview: boolean, rear: boolean) {
  const pose = releasePose(step, progress);
  const wide = overview || step === 0 || step === 3;
  const target: Point3 = wide ? [0, 70, 0] : [0, pose.panelGap / 2, -105 + pose.panelSlide / 2];
  const radius = wide ? 210 : Math.hypot(pose.panelGap / 2 + 14, 25);
  const angle = (Math.max(0, Math.min(1, progress)) - .5) * .12;
  const direction: Point3 = wide ? [1, .65, 1.25] : [Math.cos(.24 + angle), .3, Math.sin(.24 + angle)];
  if (rear) { direction[0] *= -1; direction[2] *= -1; }
  const distance = radius / Math.sin(Math.atan(Math.tan(Math.PI / 9) * Math.min(1, Math.max(.2, aspect)))) / Math.hypot(...direction);
  return { target, position: target.map((v, i) => v + direction[i] * distance) as Point3, up: [0, 1, 0] as Point3 };
}
