'use client';

/**
 * 측정 모드 — 판재를 cm 그리드(모눈) 재질로 바꾸고, 마우스를 올린 판재의 가로(X)·세로(Y)·깊이(Z)를
 * 화살표와 숫자로 표시한다(formbar Measure 참고). 화면 전용이며 설계·가공 데이터를 바꾸지 않는다.
 * 판재 식별: Panel mesh의 userData[PANEL_DIMENSIONS_KEY] = {w,h,d}(cm).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SHELF_ROOT_NAME } from '../ar/arStore';
import { PANEL_DIMENSIONS_KEY, useMeasureStore, type PanelDimensions } from './measureStore';

const GRID_VERTEX = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  void main() {
    vLocal = position;
    vLocalNormal = normal;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// 판 면 방향에 맞는 두 축으로 1cm 가는 선 + 10cm 굵은 선. fwidth로 거리와 무관하게 선 굵기 유지.
const GRID_FRAGMENT = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uLine;
  uniform float uHighlight;
  varying vec3 vLocal;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  float grid(vec2 p, float spacing, float width) {
    vec2 q = p / spacing;
    vec2 g = abs(fract(q - 0.5) - 0.5) / max(fwidth(q), vec2(1e-4));
    return 1.0 - min(min(g.x, g.y) / width, 1.0);
  }
  void main() {
    vec3 n = abs(vLocalNormal);
    vec2 uv = n.x > n.y && n.x > n.z ? vLocal.zy : (n.y > n.z ? vLocal.xz : vLocal.xy);
    float fine = grid(uv, 1.0, 0.6) * 0.35;
    float major = grid(uv, 10.0, 1.1) * 0.75;
    float light = 0.62 + 0.38 * max(dot(normalize(vWorldNormal), normalize(vec3(0.35, 0.85, 0.55))), 0.0);
    vec3 base = mix(uBase, vec3(0.80, 0.93, 0.78), uHighlight) * light;
    vec3 color = mix(base, uLine, max(fine, major));
    gl_FragColor = vec4(color, 1.0);
  }
`;

function makeGridMaterial(highlight: boolean) {
  return new THREE.ShaderMaterial({
    vertexShader: GRID_VERTEX,
    fragmentShader: GRID_FRAGMENT,
    uniforms: {
      uBase: { value: new THREE.Color('#d6d6d4') },
      uLine: { value: new THREE.Color('#7d7d7b') },
      uHighlight: { value: highlight ? 1 : 0 },
    },
  });
}

const fmt = (v: number) => `${Math.round(v * 10) / 10}`;
/** 이보다 짧은 변(판 두께 등)은 화살표 대신 요약 칩에만 표시 */
const MIN_ARROW = 4;
const OFFSET = 3;
const ARROW_COLOR = '#1d1e1f';

function Arrow({ from, to, label }: { from: THREE.Vector3; to: THREE.Vector3; label: string }) {
  // WebGL 선은 1px로 고정되므로 얇은 원통 축 + 원뿔 머리로 그린다(항상 앞에 보이도록 depthTest 끔)
  const parts = useMemo(() => {
    const dir = to.clone().sub(from);
    const length = dir.length();
    dir.normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const along = new THREE.Quaternion().setFromUnitVectors(up, dir);
    const back = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().negate());
    return {
      shaft: { p: from.clone().add(to).multiplyScalar(0.5), q: along, len: Math.max(length - 4, 0.1) },
      heads: [{ p: from.clone().addScaledVector(dir, 1.2), q: back }, { p: to.clone().addScaledVector(dir, -1.2), q: along }],
    };
  }, [from, to]);
  return (
    <group>
      <mesh position={parts.shaft.p} quaternion={parts.shaft.q} renderOrder={10000}>
        <cylinderGeometry args={[0.22, 0.22, parts.shaft.len, 8]} />
        <meshBasicMaterial color={ARROW_COLOR} depthTest={false} transparent />
      </mesh>
      {parts.heads.map((h, i) => (
        <mesh key={i} position={h.p} quaternion={h.q} renderOrder={10000}>
          <coneGeometry args={[0.9, 2.4, 14]} />
          <meshBasicMaterial color={ARROW_COLOR} depthTest={false} transparent />
        </mesh>
      ))}
      <Html position={parts.shaft.p} center zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.95)', color: ARROW_COLOR, font: '700 13px/1.4 system-ui, sans-serif', whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>{label}</span>
      </Html>
    </group>
  );
}

function PanelAnnotation({ mesh, dims }: { mesh: THREE.Mesh; dims: PanelDimensions }) {
  const group = useRef<THREE.Group>(null);
  // 판재의 현재 월드 변환을 그대로 따른다(분해·조립 연출·높이 변화 포함)
  useFrame(() => {
    if (!group.current) return;
    mesh.updateWorldMatrix(true, false);
    group.current.matrix.copy(mesh.matrixWorld);
  });
  const { w, h, d } = dims;
  const [x, y, z] = [w / 2, h / 2, d / 2];
  const v = (a: number, b: number, c: number) => new THREE.Vector3(a, b, c);
  return (
    <group ref={group} matrixAutoUpdate={false}>
      {w >= MIN_ARROW && <Arrow from={v(-x, y + OFFSET, z)} to={v(x, y + OFFSET, z)} label={`${fmt(w)} cm`} />}
      {h >= MIN_ARROW && <Arrow from={v(x + OFFSET, -y, z)} to={v(x + OFFSET, y, z)} label={`${fmt(h)} cm`} />}
      {d >= MIN_ARROW && <Arrow from={v(x + OFFSET, y + OFFSET, -z)} to={v(x + OFFSET, y + OFFSET, z)} label={`${fmt(d)} cm`} />}
      <Html position={[0, -y - OFFSET - 4, z]} center zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
        <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 12, background: '#1d1e1f', color: '#fff', font: '600 12px/1.4 system-ui, sans-serif', whiteSpace: 'nowrap' }}
          aria-live="polite">가로 {fmt(w)} × 세로 {fmt(h)} × 깊이 {fmt(d)} cm</span>
      </Html>
    </group>
  );
}

const panelDims = (o: THREE.Object3D) => o.userData?.[PANEL_DIMENSIONS_KEY] as PanelDimensions | undefined;

export function MeasureMode() {
  const enabled = useMeasureStore((s) => s.enabled);
  const { scene, camera, gl, raycaster } = useThree();
  const materials = useMemo(() => ({ grid: makeGridMaterial(false), hover: makeGridMaterial(true) }), []);
  const originals = useRef(new Map<THREE.Mesh, THREE.Material | THREE.Material[]>());
  const pointer = useRef<{ x: number; y: number; dirty: boolean } | null>(null);
  const [hovered, setHovered] = useState<THREE.Mesh | null>(null);

  useEffect(() => () => { materials.grid.dispose(); materials.hover.dispose(); }, [materials]);

  // 포인터 위치만 기록하고, 레이캐스트는 프레임당 1회로 제한
  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1, dirty: true };
    };
    const leave = () => { pointer.current = null; setHovered(null); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [enabled, gl]);

  const restoreAll = () => {
    originals.current.forEach((material, mesh) => {
      if (mesh.material === materials.grid || mesh.material === materials.hover) mesh.material = material;
    });
    originals.current.clear();
  };

  useEffect(() => {
    if (!enabled) { restoreAll(); setHovered(null); }
    return () => restoreAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useFrame(() => {
    if (!enabled) return;
    const root = scene.getObjectByName(SHELF_ROOT_NAME);
    if (!root) return;
    const panels: THREE.Mesh[] = [];
    root.traverse((o) => { if ((o as THREE.Mesh).isMesh && panelDims(o) && o.visible) panels.push(o as THREE.Mesh); });

    if (pointer.current?.dirty) {
      pointer.current.dirty = false;
      raycaster.setFromCamera(new THREE.Vector2(pointer.current.x, pointer.current.y), camera);
      const hit = raycaster.intersectObjects(panels, false)[0]?.object as THREE.Mesh | undefined;
      if ((hit ?? null) !== hovered) setHovered(hit ?? null);
    }

    // 판재 재질을 그리드로 유지(React가 원래 재질을 다시 넣으면 그 값을 새 원본으로 기록)
    for (const mesh of panels) {
      const want = mesh === hovered ? materials.hover : materials.grid;
      if (mesh.material === want) continue;
      if (mesh.material !== materials.grid && mesh.material !== materials.hover) originals.current.set(mesh, mesh.material);
      mesh.material = want;
    }
    // 사라진 판재의 기록 정리
    originals.current.forEach((_, mesh) => { if (!mesh.parent) originals.current.delete(mesh); });
  });

  if (!enabled || !hovered) return null;
  const dims = panelDims(hovered);
  return dims ? <PanelAnnotation mesh={hovered} dims={dims} /> : null;
}
