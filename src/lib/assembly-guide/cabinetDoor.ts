import { Vector3 } from 'three';
import type { CabinetPart, CabinetPlan, CabinetState, CabinetVector } from './cabinet';

const smooth = (value: number) => { const p = Math.max(0, Math.min(1, value)); return p * p * (3 - 2 * p); };
export const isCabinetDoor = (part: { box: { kind: string } }) => part.box.kind === 'door';
export const doorAssemblyPhases = ['hinge-hook', 'hinge-top', 'hinge-bottom', 'hinge-test'] as const;
/** Demonstration clearance/stance, not supplier hinge travel or a machining dimension. */
export const cabinetDoorDisplay = { angle: Math.PI / 2, approach: [1.2, 0, 1.8] as CabinetVector, clipLift: .25 };
export function cabinetDoorGap(part: CabinetPart, state: CabinetState): CabinetVector {
  if (part.number - 1 !== state.step) return [0, 0, 0];
  const amount = state.phase === 'placing' ? 1 : state.phase === 'hinge-hook' ? 1 - smooth(state.progress) : 0;
  const side = part.hingeSide === 'left' ? -1 : 1;
  return cabinetDoorDisplay.approach.map((value, axis) => value * amount * (axis === 0 ? side : 1)) as CabinetVector;
}
export function cabinetDoorAngle(part: CabinetPart, state: CabinetState) {
  if (part.number - 1 !== state.step) return 0;
  const angle = cabinetDoorDisplay.angle * (part.hingeSide === 'left' ? -1 : 1);
  if (state.phase === 'placing') return angle * smooth(state.progress / .65);
  if (['hinge-hook', 'hinge-top', 'hinge-bottom'].includes(state.phase)) return angle;
  if (state.phase === 'hinge-test') {
    const p = state.progress;
    // Close, reopen to check both catches, then close gently before the reveal.
    return angle * (p < .4 ? 1 - smooth(p / .4) : p < .67 ? smooth((p - .4) / .27) : 1 - smooth((p - .67) / .33));
  }
  return 0;
}
export function cabinetHingePress(state: CabinetState, index: number, part: CabinetPart, preview = false) {
  if (preview || state.phase === 'complete' || state.phase === 'reveal' || part.number - 1 < state.step || part.number - 1 === state.step && ['hinge-test', 'check'].includes(state.phase)) return 1;
  if (part.number - 1 !== state.step) return 0;
  if (state.phase === 'hinge-bottom' && index === 0) return 1;
  return state.phase === (index === 0 ? 'hinge-top' : 'hinge-bottom') ? smooth(Math.min(1, state.progress / .72)) : 0;
}
export function cabinetDoorHinge(plan: CabinetPlan, part: CabinetPart) {
  const index = Number(part.animation.id.slice(5)), door = plan.model.doors[index], hinge = plan.hinges[index];
  const sign = hinge?.side === 'left' ? 1 : -1;
  const pivot: CabinetVector = [-sign * door.width * 5, -(door.reference?.frontOffsetY ?? 0) * 10, -part.box.d * 5];
  const order = hinge.cups.map((_, i) => i).sort((a, b) => hinge.cups[b][1] - hinge.cups[a][1]);
  return { door, hinge, sign, pivot, order };
}
export function cabinetHingeTarget(plan: CabinetPlan, part: CabinetPart, lower = false): Vector3 {
  const { hinge, order, sign } = cabinetDoorHinge(plan, part);
  const mount = hinge.mounts[order[lower ? order.length - 1 : 0]];
  return new Vector3((mount.position[0] + sign * .85) * 10, mount.position[1] * 10 + 10, mount.position[2] * 10);
}
