import { ILLUSTRATIVE_CLIP, ILLUSTRATIVE_PIN } from '@/components/three/furniture-hardware/connectors/illustrativeDimensions';
import { pinPositionInClip, type ClipColor } from '@/components/three/furniture-hardware/connectors/clipContract';
import type { GuideStep, Point3 } from './sequence';

export const tylkoClipSource = 'https://tylko.elevio.help/en/articles/34-aligning-horizontal-and-vertical-elements';
export type ClipColourVersion = 'black-orange' | 'black-silver';
export const clipColours = (version: ClipColourVersion): readonly ClipColor[] => ['black', version === 'black-orange' ? 'orange' : 'silver'];

/** Same illustrative dimensions/anchors as the hardware owner's model; never CNC/BOM data. */
export const clipExample = {
  clip: ILLUSTRATIVE_CLIP,
  pin: ILLUSTRATIVE_PIN,
  height: 180,
  depth: 160,
  width: 180,
  thickness: 18,
  centers: [-55, 55] as readonly number[],
  initialGap: 60,
  entryGap: 14,
  lateralOffset: 12,
  status: 'illustrative' as const,
};

export const tylkoClipSteps: readonly GuideStep[] = [
  { title: '같은 색끼리 대응', duration: 2.8, view: 'clip-colour', instruction: '검정 핀은 검정 클립에 맞춥니다. 구형 주황은 주황끼리, 은색은 은색끼리 맞춥니다. 색상만 보고 잠금 기능을 판단하지 마세요.', check: '핀과 클립의 색상 대응을 확인했어요' },
  { title: '핀과 입구 정렬', duration: 3, view: 'clip-entry', instruction: '패널 단면의 둥근 입구와 상대 판의 핀 머리를 맞추세요. 두 핀이 각각의 입구 앞에 오도록 패널을 지지하고 접합면 쪽으로 접근합니다.', check: '두 핀이 각각의 입구 앞에 맞춰졌어요' },
  { title: '핀을 입구에 진입', duration: 3.2, view: 'clip-entry', instruction: '정렬을 유지하면서 패널을 접합면 쪽으로 움직여 핀 머리를 둥근 입구 안에 넣습니다. 핀이 들어가기 전에는 패널을 슬라이드하지 마세요.', check: '두 핀이 둥근 입구 안에 들어갔어요' },
  { title: '클립 장축으로 슬라이드', duration: 3.4, view: 'clip-slide', instruction: '핀 진입을 확인한 뒤 패널을 클립의 긴 방향으로 밀어 체결 위치에 보냅니다. 확대 화면에서 핀 목이 입구에서 좁은 홈으로 이동하는 것을 확인하세요.', check: '핀 진입 후 장축 방향으로 체결했어요' },
  { title: '끝선과 직각 확인', duration: 3, view: 'clip-flush', instruction: '체결 위치와 함께 앞뒤 끝선이 어긋나지 않고 가로·세로 판이 직각인지 확인하세요. 정렬 조정은 공식 자료의 펠트 보호판·고무망치와 보조 인원 지침을 따르고, 벽 고정 전에 전체 정렬을 확인하세요.', check: '체결 위치·끝선·직각을 모두 확인했어요' },
];

const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** Sampling only changes joint-local axes. The scene places this joint in its own frame. */
export function tylkoClipPose(step: number, progress: number) {
  const index = Math.max(0, Math.min(tylkoClipSteps.length - 1, Math.floor(Number.isFinite(step) ? step : 0)));
  const phase = (at: number) => index > at ? 1 : index === at ? smooth(progress) : 0;
  const locked = pinPositionInClip(clipExample.clip, 'locked');
  const entry = pinPositionInClip(clipExample.clip, 'entered');
  const alignment = phase(1);
  const gap = clipExample.initialGap - (clipExample.initialGap - clipExample.entryGap) * alignment - clipExample.entryGap * phase(2);
  const relativeX = entry[0] + (locked[0] - entry[0]) * phase(3);
  const lateral = clipExample.lateralOffset * (1 - alignment);
  return {
    panelOffset: [locked[0] - relativeX, lateral, gap ? -gap : 0] as Point3,
    pinInClip: [relativeX, lateral ? -lateral : 0, gap] as Point3,
    entered: index > 2 || index === 2 && progress >= 1,
    seated: index > 3 || index === 3 && progress >= 1,
  };
}

/** Convert clip-local +X to scene +Y; surface +Z stays scene +Z. */
export function clipLocalToWorld(point: Point3): Point3 {
  return [-point[1], point[0], point[2]];
}

export function tylkoClipShot(step: number, progress: number, aspect: number, overview: boolean, rear: boolean): { target: Point3; position: Point3 } {
  const pose = tylkoClipPose(step, progress);
  const flush = step === 4;
  const local: Point3 = overview ? [0, 0, -65] : flush ? [clipExample.height / 2, 0, -1] : [clipExample.centers[1] + pose.panelOffset[0] + pose.pinInClip[0] * .5, 0, pose.panelOffset[2] * .5 - 3];
  const target = clipLocalToWorld(local);
  const direction: Point3 = overview ? [1.3, .8, -1.5] : [1, flush ? .7 : .18, rear ? .8 : -1];
  const radius = overview ? 205 : step === 0 ? 48 : flush ? 27 : 28 + pose.pinInClip[2] * .5;
  const fit = radius / Math.sin(Math.atan(Math.tan(Math.PI / 9) * Math.min(1, Math.max(.2, aspect))));
  const length = Math.hypot(...direction);
  return { target, position: target.map((value, i) => value + direction[i] / length * fit) as Point3 };
}
