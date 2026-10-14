import { guideShot, guideSteps, jointExample, jointPose, type ConnectorModel, type Point3 } from './sequence';

const fitDistance = (radius: number, aspect: number) => radius / Math.sin(Math.atan(Math.tan(Math.PI / 9) * Math.min(1, Math.max(.2, aspect))));

/** Camera choreography only. Supplier anchors and hardware scale stay unchanged. */
export function cinematicJointShot(model: ConnectorModel, step: number, progress: number, aspect: number, overview: boolean, rear: boolean) {
  if (overview || guideSteps(model)[step]?.view === 'overview') {
    const shot = guideShot(model, step, progress, aspect, true, rear);
    // A small orbital reveal; the established overview framing remains conservative.
    const angle = (Math.min(1, Math.max(0, progress)) - .5) * .14;
    const x = shot.position[0] - shot.target[0], z = shot.position[2] - shot.target[2];
    return { ...shot, position: [shot.target[0] + x * Math.cos(angle) - z * Math.sin(angle), shot.position[1], shot.target[2] + x * Math.sin(angle) + z * Math.cos(angle)] as Point3 };
  }
  const pose = jointPose(model, step, progress);
  let target: Point3;
  let radius: number;
  if (step === 1) {
    target = [0, pose.baseHousingOffset - 5, jointExample.centers[0]];
    radius = 25;
  } else if (step === 2) {
    target = [0, pose.panelGap + pose.endHousingOffset + 5, jointExample.centers[0] + pose.panelSlide];
    radius = 25;
  } else if (step === 3) {
    const lower = pose.panelGap + pose.connectorOffset - 11, upper = pose.panelGap + 11;
    target = [0, (lower + upper) / 2, jointExample.centers[0] + pose.panelSlide];
    radius = Math.max(25, (upper - lower) / 2 + 14);
  } else {
    target = [0, pose.panelGap / 2, jointExample.centers[0] + pose.panelSlide / 2];
    radius = Math.hypot(5, pose.panelGap / 2 + 11, 15 + pose.panelSlide / 2) + 6;
  }
  const angle = (Math.min(1, Math.max(0, progress)) - .5) * .16;
  const below = step === 2 || step === 3;
  const cutaway = model === 'V-1230R' && step === 6;
  const azimuth = (cutaway ? .24 : .62) + angle;
  const direction: Point3 = [Math.cos(azimuth), below ? -.32 : cutaway ? .28 : .42, Math.sin(azimuth) * (rear ? -1 : 1)];
  const distance = fitDistance(radius, aspect) / Math.hypot(...direction);
  return { target, position: target.map((value, index) => value + direction[index] * distance) as Point3, up: [0, 1, 0] as Point3 };
}
