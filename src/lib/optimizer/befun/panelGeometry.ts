import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import type { PanelBoringData } from '@/lib/optimizer/upstream/domain/boring/types';
import type { CncPanelBox } from './toCncPanels';

type Vec3 = [number, number, number];

const FACE_DIRECTION: Record<string, Vec3> = {
  top: [0, 0, -1], bottom: [0, 0, 1], left: [1, 0, 0], right: [-1, 0, 0], front: [0, 1, 0], back: [0, -1, 0],
};
const PAD = 0.05; // mm, 입구 면 바깥 여유(공면 CSG 방지)

const evaluator = new Evaluator();
evaluator.useGroups = false;

/** 원형 구멍: surface(가공면 위 중심)에서 direction으로 depth만큼 */
function holeCutter(surface: Vec3, direction: Vec3, diameter: number, depth: number): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(diameter / 2, diameter / 2, depth + PAD, 48);
  g.translate(0, (depth - PAD) / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...direction)));
  g.translate(...surface);
  return g;
}

/** 키홀 슬롯: 가공면 위 from→to 경로(공구 중심), 폭 = 공구 지름, direction으로 depth만큼 */
function slotCutter(from: Vec3, to: Vec3, direction: Vec3, width: number, depth: number): THREE.BufferGeometry {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), axis = new THREE.Vector3(...direction);
  const length = a.distanceTo(b), r = width / 2;
  if (length < 1e-6) return holeCutter(from, direction, width, depth);
  const along = b.clone().sub(a).normalize();
  const shape = new THREE.Shape();
  shape.moveTo(0, -r);
  shape.lineTo(length, -r);
  shape.absarc(length, 0, r, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(0, r);
  shape.absarc(0, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  shape.closePath();
  // 로컬 Z(돌출) = 가공 방향. 오른손 좌표계: along × across = axis
  const g = new THREE.ExtrudeGeometry(shape, { depth: depth + PAD, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -PAD);
  const across = axis.clone().cross(along).normalize();
  g.applyMatrix4(new THREE.Matrix4().makeBasis(along, across, axis).setPosition(a));
  return g;
}

/**
 * 판재 하나의 메시 형상(판재 좌표 mm: x=폭, y=높이, z=두께, 원점=하면 모서리)에 MPR 가공 원본(manufacturingBoring)의
 * 보링·커넥터 슬롯을 실제로 파낸다. 시뮬레이션(removal.ts)과 같은 three-bvh-csg 차감.
 */
export function machinedPanelGeometry(data: PanelBoringData): THREE.BufferGeometry {
  let base: THREE.BufferGeometry = new THREE.BoxGeometry(data.width, data.height, data.thickness);
  base.translate(data.width / 2, data.height / 2, data.thickness / 2);
  const t = data.thickness;
  const cutters: THREE.BufferGeometry[] = [];

  for (const b of data.borings) {
    const direction = FACE_DIRECTION[b.face];
    const surface: Vec3 = [b.x, b.y, b.face === 'top' ? t : b.face === 'bottom' ? 0 : (b.z ?? t / 2)];
    cutters.push(holeCutter(surface, direction, b.diameter, b.depth));
  }
  for (const s of data.connectorSlots ?? []) {
    const direction = FACE_DIRECTION[s.face];
    const z = s.face === 'top' ? t : s.face === 'bottom' ? 0 : (s.z ?? t / 2);
    cutters.push(slotCutter([s.x1, s.y1, z], [s.x2, s.y2, z], direction, s.width, s.depth));
  }

  for (const cutter of cutters) {
    const a = new Brush(base), c = new Brush(cutter);
    a.updateMatrixWorld(true); c.updateMatrixWorld(true);
    const next = evaluator.evaluate(a, c, SUBTRACTION).geometry;
    base.dispose(); cutter.dispose();
    base = next;
  }
  base.computeVertexNormals();
  return base;
}

/**
 * 판재 좌표(mm) → Befun 3D 좌표(cm). 판재 x·y·z 축을 박스 frame의 u·v·n 축에 놓고 박스 최소 모서리로 옮긴다.
 * u·v·n이 홀수 순열이면 반사 변환이라 삼각형 감김이 뒤집히므로 재질은 양면으로 그린다.
 */
export function panelToWorldMatrix(box: CncPanelBox): THREE.Matrix4 {
  const size = [box.w, box.h, box.d], center = [box.x, box.y, box.z];
  const unit = (axis: number) => new THREE.Vector3().setComponent(axis, 0.1);
  const min = new THREE.Vector3(...[0, 1, 2].map((i) => center[i] - size[i] / 2));
  return new THREE.Matrix4().makeBasis(unit(box.frame.u), unit(box.frame.v), unit(box.frame.n)).setPosition(min);
}
