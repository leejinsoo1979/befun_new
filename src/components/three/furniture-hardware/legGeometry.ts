import * as THREE from 'three';

/**
 * 회전체 다리 프로파일 [반지름mm, 높이mm](바닥→위) → 위가 원점(앵커)인 LatheGeometry.
 * 바닥·윗면 중심점을 넣어 닫힌 형상으로 만든다. 단위 mm.
 */
export function latheLegGeometry(profile: [number, number][], radialSegments = 32): THREE.LatheGeometry {
  if (profile.length < 2) throw new Error('profile needs at least 2 points');
  const top = profile[profile.length - 1][1];
  const pts = [
    new THREE.Vector2(0, profile[0][1] - top), // 바닥 중심
    ...profile.map(([r, y]) => new THREE.Vector2(r, y - top)),
    new THREE.Vector2(0, 0), // 윗면 중심 = 앵커
  ];
  return new THREE.LatheGeometry(pts, radialSegments);
}
