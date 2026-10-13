import * as THREE from 'three';

/** 절삭 계산과 별개인 공구 외형. 치수·날 수·비틀림은 외부 규격에서 명시한다. */
export interface FlutedToolProfile {
  diameter: number;
  length: number;
  cuttingLength: number;
  shankDiameter: number;
  coreDiameter: number;
  flutes: number;
  helixAngleDeg: number;
  fluteOpeningDeg: number;
}

export function validFlutedToolProfile(profile: FlutedToolProfile): boolean {
  const { diameter, length, cuttingLength, shankDiameter, coreDiameter, flutes, helixAngleDeg, fluteOpeningDeg } = profile;
  return !(![diameter, length, cuttingLength, shankDiameter, coreDiameter, fluteOpeningDeg].every(v => Number.isFinite(v) && v > 0)
    || cuttingLength >= length || coreDiameter >= diameter || !Number.isInteger(flutes) || flutes < 1
    || !Number.isFinite(helixAngleDeg) || Math.abs(helixAngleDeg) >= 80 || fluteOpeningDeg >= 360 / flutes);
}

/** 원통 위에 선을 얹지 않고 날 여유면·칩 배출 홈을 가진 비틀린 단면을 만든다. */
export function flutedToolGeometry(profile: FlutedToolProfile): THREE.BufferGeometry {
  if (!validFlutedToolProfile(profile)) throw new Error('공구 외형 규격이 유효하지 않습니다.');
  const { diameter, length, cuttingLength, shankDiameter, coreDiameter, flutes, helixAngleDeg, fluteOpeningDeg } = profile;
  const radial = Math.max(256, flutes * 96), axial = 100;
  const positions: number[] = [], indices: number[] = [];
  const radius = diameter / 2, core = coreDiameter / 2;
  const opening = fluteOpeningDeg / (360 / flutes);
  const twist = Math.tan(THREE.MathUtils.degToRad(helixAngleDeg)) / radius;
  // 절삭부에서 홈이 빠져나오고 생크로 이어지는 천이. 명시한 절삭 길이는 유지한다.
  const runout = Math.min(diameter, (length - cuttingLength) / 2);
  const levels = Array.from({ length: axial + 1 }, (_, i) => cuttingLength * i / axial)
    .concat([cuttingLength + runout * .25, cuttingLength + runout * .5, cuttingLength + runout, length]);
  for (const z of levels) {
    const mix = THREE.MathUtils.clamp((z - cuttingLength) / runout, 0, 1);
    for (let j = 0; j <= radial; j++) {
      const angle = j / radial * Math.PI * 2;
      const phase = (j / radial * flutes) % 1;
      const groove = phase < opening ? Math.sin(Math.PI * phase / opening) ** .65 : 0;
      const r = THREE.MathUtils.lerp(radius - (radius - core) * groove, shankDiameter / 2, mix);
      const a = angle + Math.min(z, cuttingLength) * twist;
      positions.push(Math.cos(a) * r, -z, Math.sin(a) * r);
    }
  }
  for (let i = 0; i < levels.length - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    indices.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const tip = positions.length / 3; positions.push(0, 0, 0);
  const top = positions.length / 3; positions.push(0, -length, 0);
  for (let j = 0; j < radial; j++) {
    indices.push(tip, j + 1, j);
    const a = (levels.length - 1) * (radial + 1) + j;
    indices.push(top, a, a + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingBox();
  return geometry;
}

/** 갈렛을 실제 외곽에서 따낸 원판. 가운데 축 구멍도 면의 구멍이다. */
export function sawPlateGeometry(diameter: number, thickness: number, teeth: number, boreDiameter: number, gulletDepth: number) {
  if (![diameter, thickness, boreDiameter, gulletDepth].every(v => Number.isFinite(v) && v > 0)
    || boreDiameter >= diameter - gulletDepth * 2 || !Number.isInteger(teeth) || teeth < 3) throw new Error('톱날 외형 규격이 유효하지 않습니다.');
  const shape = new THREE.Shape(), r = diameter / 2;
  const points: THREE.Vector2[] = [];
  for (let tooth = 0; tooth < teeth; tooth++) {
    for (const [fraction, depth] of [[0, 0], [.16, 0], [.28, gulletDepth * .25], [.42, gulletDepth], [.66, gulletDepth], [.88, gulletDepth * .2]]) {
      const a = (tooth + fraction) / teeth * Math.PI * 2;
      points.push(new THREE.Vector2(Math.cos(a) * (r - depth), Math.sin(a) * (r - depth)));
    }
  }
  shape.setFromPoints(points); shape.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 0, boreDiameter / 2, 0, Math.PI * 2, true); shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, steps: 1, curveSegments: 48 });
  geometry.translate(0, 0, -thickness / 2); geometry.rotateX(Math.PI / 2);
  return geometry;
}
