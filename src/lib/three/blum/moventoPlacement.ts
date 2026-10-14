import { selectMoventoDepth } from './moventoDepth';

/** Befun coordinates are centimetres; supplier glTF scene coordinates are metres. */
export function moventoCadPose(widthMm: number, bottomUnderMm: number, frontMm: number, hand: 'left' | 'right') {
  return { scale: 100, position: [
    (hand === 'left' ? -1 : 1) * widthMm / 20,
    (bottomUnderMm + 9.5) / 10, (frontMm - 37) / 10,
  ] as [number, number, number] };
}

/** Only the unscaled 350mm original assets are installed in this application. */
export function selectBefunMovento(frontWorldCm: number, rearObstacleCm: number, boxDepthCm: number) {
  const result = selectMoventoDepth({ application: 'standard',
    availableInstallationDepthMm: (frontWorldCm - rearObstacleCm) * 10,
    requestedDrawerLengthMm: boxDepthCm * 10,
  });
  return result.candidates.find(candidate => candidate.nominalLengthMm === 350) ?? null;
}
