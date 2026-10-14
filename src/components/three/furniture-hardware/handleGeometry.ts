import * as THREE from 'three';

/**
 * 단면 윤곽 [x, z](mm)을 높이 방향(y)으로 압출. 결과는 y=-h/2..h/2 중앙 정렬, 단위 mm.
 * 로컬 원점: x=0 채널 바닥(문 모서리 면), z=0 문 두께 중심, y=0 손잡이 높이 중심.
 */
export function extrudedHandleGeometry(section: [number, number][], heightMm: number): THREE.ExtrudeGeometry {
  if (section.length < 3) throw new Error('section needs at least 3 points');
  if (!(heightMm > 0)) throw new Error('heightMm must be positive');
  const shape = new THREE.Shape(section.map(([x, z]) => new THREE.Vector2(x, z)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: heightMm, bevelEnabled: false, curveSegments: 1 });
  // 압출축 +Z → +Y로: rotateX(+90°)는 (x, y, z) → (x, -z, y). 단면 y(=관찰 z)는 z로, 압출 0..h는 y 0..-h
  geo.rotateX(Math.PI / 2);
  geo.translate(0, heightMm / 2, 0);
  return geo;
}
