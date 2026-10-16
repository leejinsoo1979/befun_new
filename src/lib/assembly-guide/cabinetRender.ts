import { Box3, Matrix4, Vector3, VSMShadowMap } from 'three';
import type { CabinetPlan } from './cabinet';

/** Stable separable blur: no stochastic five-tap PCF grain and no temporal accumulation. */
export const cabinetRender = { shadowType: VSMShadowMap, mapSize: 4096, blurSamples: 16, radius: 6, dpr: [1, 2] as [number, number] };
export function cabinetShadowBounds(plan: CabinetPlan) {
  const bounds = new Box3();
  for (const part of plan.parts) {
    for (const at of [part.animation.floor, part.animation.anchor]) {
      const r = Math.hypot(part.box.w, part.box.h, part.box.d) * 5;
      bounds.expandByPoint(new Vector3(at[0] * 10 - r, 0, at[2] * 10 - r));
      bounds.expandByPoint(new Vector3(at[0] * 10 + r, at[1] * 10 + r + 180, at[2] * 10 + r));
    }
  }
  const target = bounds.getCenter(new Vector3()).setY(0);
  const direction = new Vector3(-.7, 1.7, 1.1).normalize();
  const position = target.clone().addScaledVector(direction, 4000);
  const view = new Matrix4().lookAt(position, target, new Vector3(0, 1, 0)).setPosition(position).invert();
  const projected = new Box3();
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const corner = new Vector3(x, y, z);
    projected.expandByPoint(corner.clone().applyMatrix4(view));
    projected.expandByPoint(corner.addScaledVector(direction, -y / direction.y).applyMatrix4(view));
  }
  return { position: position.toArray() as [number, number, number], target: target.toArray() as [number, number, number],
    left: projected.min.x - 35, right: projected.max.x + 35, top: projected.max.y + 35, bottom: projected.min.y - 35,
    near: Math.max(1, -projected.max.z - 100), far: -projected.min.z + 100 };
}
