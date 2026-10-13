import { applyStockDisplayPose } from './stockTransform';
import { replayPose } from './replayPose';
import type { MachiningProgram, ReplayClock } from './program';
import type { Object3D } from 'three';

/** 한 화면 프레임의 판재·기계·공구·카메라는 같은 시각/pose 객체를 쓴다. */
export class ReplayMotion {
  private time = NaN;
  private value: ReturnType<typeof replayPose> | undefined;
  constructor(readonly program: MachiningProgram, readonly clock: ReplayClock) {}
  pose() {
    if (this.time !== this.clock.elapsedMs || !this.value) {
      this.time = this.clock.elapsedMs;
      this.value = replayPose(this.program, this.time);
    }
    return this.value;
  }
}

/** React/CSG를 다시 만들지 않고 이미 있는 판재 메시의 변환만 갱신한다. */
export function updateStockMotion(motion: ReplayMotion, meshes: Array<Object3D | null>, layout: boolean) {
  const pose = motion.pose();
  meshes.forEach((mesh, i) => {
    if (!mesh) return;
    const stock = motion.program.stocks[i];
    applyStockDisplayPose(mesh, stock.size, layout ? stock.sourceOrigin ?? stock.position : pose.positions[i], layout ? 0 : pose.angles[i], layout ? 0 : pose.flips[i]);
  });
}
