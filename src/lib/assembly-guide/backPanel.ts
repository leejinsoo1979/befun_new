import type { GuideStep, Point3 } from './sequence';

export const backPanelSource = 'https://tylko.elevio.help/en/articles/32-back-panels-and-supports';
// Illustrative dimensions: the source establishes pin roles and assembly order,
// not pin diameters, spring stiffness, production tolerances or required force.
export const backExample = { width: 178, height: 220, thickness: 12, pinLength: 5, pinCenters: [-65, 65], tilt: Math.PI / 8 } as const;
// Display-only running clearance. The shared model has zero fit clearance;
// this is not a measured tolerance and must never enter CNC/order data.
export const rearDisplayClearance = .6;
export const backPanelSteps: readonly GuideStep[] = [
  { title: '위·아래 핀 구분하기', instruction: '아래쪽은 고정핀, 위쪽은 눌렀다가 돌아오는 스프링핀입니다. 위아래 방향부터 확인하세요.', check: '하단 고정핀과 상단 스프링핀을 구분했습니다.', duration: 2, view: 'overview' },
  { title: '하단 고정핀을 홀에 맞추기', instruction: '가구 뒤쪽에서 백패널을 약간 기울여 아래쪽 두 고정핀을 받침판의 구멍 위에 맞춥니다. 두 위치를 함께 확인하세요.', check: '아래쪽 두 고정핀과 받침판 구멍이 맞습니다.', duration: 2.8, view: 'back-bottom' },
  { title: '아래쪽 핀 먼저 끼우기', instruction: '아래쪽 고정핀을 받침판 구멍에 먼저 넣습니다. 하단을 지지한 상태에서 상단을 맞출 준비를 하세요.', check: '아래쪽 두 핀이 구멍에 들어갔습니다.', duration: 2.8, view: 'back-bottom' },
  { title: '상단 스프링핀 눌림 확인', instruction: '상단이 들어갈 때 스프링핀이 눌려 들어가는 모습을 확인하세요. 내부 보기로 핀의 움직임을 가까이 볼 수 있습니다.', check: '상단 핀이 눌려 들어가는 방향을 확인했습니다.', duration: 2.8, view: 'back-top' },
  { title: '상단을 개구부 안으로 밀기', instruction: '아래쪽 핀을 받침점으로 유지하면서 백패널 상단을 개구부 안으로 밀어 넣습니다. 위쪽 핀과 구멍을 맞추세요.', check: '패널이 바로 서고 위쪽 핀과 구멍이 맞습니다.', duration: 3.2, view: 'back-top' },
  { title: '스프링핀 복귀·잠금 확인', instruction: '구멍에 맞으면 눌렸던 스프링핀이 위로 돌아와 잠깁니다. 양쪽 핀이 구멍으로 들어가는 모습을 확인하세요.', check: '양쪽 상단 스프링핀이 잠기는 모습을 확인했습니다.', duration: 3.2, view: 'back-top' },
  { title: '네 핀과 판재면 확인', instruction: '아래 고정핀 두 개와 위 스프링핀 두 개를 확인합니다. 판재가 주변 가구면과 나란히 맞는지도 살펴보세요.', check: '하단·상단 핀과 판재가 맞는 모습을 확인했습니다.', duration: 2, view: 'overview' },
];

const eased = (value: number) => {
  const t = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return t * t * (3 - 2 * t);
};

export function backPanelPose(step: number, progress: number) {
  const phase = (at: number) => step > at ? 1 : step === at ? eased(progress) : 0;
  const align = phase(1), insert = phase(2), turn = phase(4);
  const tilt = backExample.tilt * (1 - turn);
  const mouthY = backExample.pinLength * Math.cos(backExample.tilt);
  const mouthZ = backExample.pinLength * Math.sin(backExample.tilt);
  return {
    // Rotate on the lower rear corner, keeping the board thickness out of the base.
    pivot: [0, backExample.thickness / 2 * Math.sin(tilt) + 30 * (1 - align) + mouthY * (1 - insert),
      backExample.thickness / 2 * (Math.cos(tilt) - 1) - 145 * (1 - align) - mouthZ * (1 - insert)] as Point3,
    tilt: tilt ? -tilt : 0,
    springExtension: backExample.pinLength * (1 - phase(3) + phase(5)),
    complete: step === backPanelSteps.length - 1,
  };
}

export function backPanelShot(step: number, progress: number, aspect: number, overview: boolean, rear: boolean) {
  const pose = backPanelPose(step, progress);
  const top = backPanelSteps[step]?.view === 'back-top';
  const pinY = backExample.height - rearDisplayClearance;
  const y = top ? pinY * Math.cos(pose.tilt) + pose.pivot[1] : pose.pivot[1];
  const z = top ? pinY * Math.sin(pose.tilt) + pose.pivot[2] : pose.pivot[2];
  const target: Point3 = overview ? [0, 110, 65] : [backExample.pinCenters[0], y, z];
  const direction: Point3 = overview ? [.65, .45, -1] : [.85, top ? -.25 : .65, -1];
  if (rear) direction[2] *= -1;
  const radius = overview ? 245 : 25;
  const distance = radius / Math.sin(Math.atan(Math.tan(Math.PI / 9) * Math.min(1, Math.max(.2, aspect))));
  const length = Math.hypot(...direction);
  return { target, position: target.map((value, index) => value + direction[index] / length * distance) as Point3 };
}
