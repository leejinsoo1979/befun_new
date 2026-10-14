import type { ComponentRef } from 'react';
import type { OrbitControls } from '@react-three/drei';
import { Vector3, type Camera } from 'three';
import type { Point3 } from '@/lib/assembly-guide/sequence';

export function createCameraRig() {
  return { revision: -1, elapsed: 0, position: new Vector3(), target: new Vector3(), destination: new Vector3(), focus: new Vector3() };
}

/** 650ms eased camera transition, then exact tracking rather than perpetual lag. */
export function updateCameraRig(camera: Camera, controls: ComponentRef<typeof OrbitControls>, rig: ReturnType<typeof createCameraRig>, shot: { position: Point3; target: Point3; up?: Point3 }, revision: number, delta: number, fixed = false) {
  const up: Point3 = shot.up ?? [0, 1, 0];
  camera.up.set(...up);
  rig.destination.set(...shot.position); rig.focus.set(...shot.target);
  const initial = rig.revision === -1;
  if (rig.revision !== revision) {
    rig.revision = revision; rig.elapsed = 0;
    rig.position.copy(camera.position); rig.target.copy(controls.target);
  }
  if (initial) { rig.position.copy(rig.destination); rig.target.copy(rig.focus); rig.elapsed = .65; }
  rig.elapsed = Math.min(.65, rig.elapsed + Math.max(0, delta));
  const p = rig.elapsed / .65;
  const blend = initial || fixed ? 1 : p * p * (3 - 2 * p);
  camera.position.lerpVectors(rig.position, rig.destination, blend);
  controls.target.lerpVectors(rig.target, rig.focus, blend);
  controls.enableDamping = false;
  if (fixed) camera.lookAt(rig.focus); else controls.update();
}
