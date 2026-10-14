import { Euler, Quaternion, Vector3 } from 'three';
import type { AssemblyPartPlan, Vec3 } from './assemblyPlan';

/** Screen identification only: these numbers are not manufacturing or connector codes. */
export function partLabelLayout(part: AssemblyPartPlan) {
  const match = /^panel-(\d+)$/.exec(part.id);
  if (!match || !part.size) return null;
  const quaternion = new Quaternion().setFromEuler(new Euler(...part.rotation)).invert()
    .multiply(new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0)));
  const u = new Vector3(1, 0, 0).applyQuaternion(quaternion);
  const v = new Vector3(0, 1, 0).applyQuaternion(quaternion);
  const normal = new Vector3(0, 0, 1).applyQuaternion(quaternion);
  const projected = (axis: Vector3) => axis.toArray().reduce((sum, n, i) => sum + Math.abs(n) * part.size![i], 0);
  const faceWidth = projected(u), faceHeight = projected(v);
  const width = Math.min(12, faceWidth * .65, faceHeight * 1.6);
  const height = width / 3;
  const margin = Math.min(2, faceWidth * .08, faceHeight * .08);
  const position = normal.multiplyScalar(projected(normal) / 2 + .035)
    .addScaledVector(u, -faceWidth / 2 + margin + width / 2)
    .addScaledVector(v, faceHeight / 2 - margin - height / 2);
  return {
    code: `P${String(Number(match[1]) + 1).padStart(2, '0')}`,
    name: part.kind === 'horizontal' ? '가로판' : part.kind === 'back' ? '후면판' : '세로판',
    position: position.toArray() as Vec3,
    quaternion: quaternion.toArray() as [number, number, number, number], width, height,
  };
}
