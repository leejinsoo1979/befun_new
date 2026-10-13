import { Object3D, Quaternion, Vector3 } from 'three';
import type { Point3 } from './program';

export function rotatePoint(p: Point3, angle: number): Point3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
}
export const addPoint = (a: Point3, b: Point3): Point3 => a.map((v, i) => v + b[i]) as Point3;
export const subtractPoint = (a: Point3, b: Point3): Point3 => a.map((v, i) => v - b[i]) as Point3;
export const worldPoint = (p: Point3, position: Point3, angle: number) => addPoint(rotatePoint(p, angle), position);
export const localPoint = (p: Point3, position: Point3, angle: number) => rotatePoint(subtractPoint(p, position), -angle);
export function rotatedBounds(size: Point3, angle: number) {
  const corners = [0, size[0]].flatMap(x => [0, size[1]].map(y => rotatePoint([x, y, 0], angle)));
  return { minX: Math.min(...corners.map(p => p[0])), maxX: Math.max(...corners.map(p => p[0])),
    minY: Math.min(...corners.map(p => p[1])), maxY: Math.max(...corners.map(p => p[1])) };
}

/** 판재 중심을 기준으로 수동 반전한다. 들어 올리는 양은 작업대 관통을 피하는 표시용 기하값이다. */
export function flipPoint(p: Point3, size: Point3, angle: number, direction = false): Point3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  const y = p[1] - (direction ? 0 : size[1] / 2), z = p[2] - (direction ? 0 : size[2] / 2);
  return [p[0], c*y-s*z+(direction ? 0 : size[1]/2), s*y+c*z+(direction ? 0 : size[2]/2 + Math.abs(s)*size[1]/2)];
}
export const flippedWorldPoint = (p: Point3, size: Point3, flip: number, position: Point3, angle: number) => worldPoint(flipPoint(p,size,flip),position,angle);
export function stockDisplayPose(size: Point3, position: Point3, angle: number, flip: number) {
  const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0,0,1),angle)
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),flip));
  return { position: flippedWorldPoint([0,0,0],size,flip,position,angle), quaternion };
}
export function applyStockDisplayPose(object: Object3D, size: Point3, position: Point3, angle: number, flip: number) {
  const display = stockDisplayPose(size,position,angle,flip);
  object.position.set(...display.position); object.quaternion.copy(display.quaternion);
}
