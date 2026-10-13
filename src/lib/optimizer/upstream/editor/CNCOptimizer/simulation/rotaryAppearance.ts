import * as THREE from 'three';

/** 표시 회전은 벽시계 기준이다. 공정 배속·탐색이 날의 회전 위상을 뛰게 하지 않는다. */
export function rotaryAppearance(phase: number, rpm: number, teeth: number, deltaSeconds: number, playing: boolean) {
  const delta = Math.min(.1, Math.max(0, deltaSeconds));
  const turns = playing ? rpm / 60 * delta : 0;
  return {
    phase: (phase + turns * Math.PI * 2) % (Math.PI * 2),
    // 한 프레임에 반 톱니 이상 이동하면 정지/역회전처럼 보이므로 회전 잔상으로 표시한다.
    blurred: playing && rpm / 60 * teeth * Math.max(delta, 1 / 120) >= .5,
  };
}

/** 톱날 회전 잔상의 몸판/톱니 띠. 절삭 계산은 원래 지름·톱폭을 그대로 사용한다. */
export function sawRotationEnvelope(diameter: number, kerf: number, bore: number, gullet: number) {
  const ring = (inner: number, outer: number) => new THREE.LatheGeometry([
    [inner, -kerf / 2], [outer, -kerf / 2], [outer, kerf / 2], [inner, kerf / 2], [inner, -kerf / 2],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 128);
  const root = diameter / 2 - gullet;
  return { body: ring(bore / 2, root), rim: ring(root, diameter / 2) };
}
