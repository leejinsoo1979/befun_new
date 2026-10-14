'use client';

/**
 * 측정 모드 — 가구(판재·도어·서랍·손잡이 등, 소품 제외)를 cm 모눈 재질로 바꾸고,
 * 마우스가 가리키는 지점에서 실시간으로 사방을 스캔해 치수를 표시한다(formbar Measure 참고).
 *  - 면 위 두 방향(예: 칸 안쪽 너비·높이): 지점에서 양쪽으로 쏜 광선이 처음 만나는 가구면까지의 거리 합
 *  - 면 바깥 방향(깊이): 다음 가구면까지, 없으면 가구 전체 범위까지("최대")
 * 화면 전용이며 설계·가공 데이터를 바꾸지 않는다. 단위: 장면 좌표 = cm.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SHELF_ROOT_NAME } from '../ar/arStore';
import { useMeasureStore } from './measureStore';

const GRID_VERTEX = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vWorldNormal;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
// 월드 좌표(cm) 기준 1cm 가는 선 + 10cm 굵은 선. 면 방향에 맞는 두 축을 고르고 fwidth로 굵기 유지.
const GRID_FRAGMENT = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uLine;
  uniform float uHighlight;
  varying vec3 vWorld;
  varying vec3 vWorldNormal;
  float grid(vec2 p, float spacing, float width) {
    vec2 q = p / spacing;
    vec2 g = abs(fract(q - 0.5) - 0.5) / max(fwidth(q), vec2(1e-4));
    return 1.0 - min(min(g.x, g.y) / width, 1.0);
  }
  void main() {
    vec3 n = normalize(vWorldNormal);
    vec3 a = abs(n);
    vec2 uv = a.x > a.y && a.x > a.z ? vWorld.zy : (a.y > a.z ? vWorld.xz : vWorld.xy);
    float fine = grid(uv, 1.0, 0.6) * 0.3;
    float major = grid(uv, 10.0, 1.1) * 0.7;
    float light = 0.62 + 0.38 * max(dot(n, normalize(vec3(0.35, 0.85, 0.55))), 0.0);
    vec3 base = mix(uBase, vec3(0.80, 0.93, 0.78), uHighlight) * light;
    gl_FragColor = vec4(mix(base, uLine, max(fine, major)), 1.0);
  }
`;
const makeGridMaterial = (highlight: boolean) => new THREE.ShaderMaterial({
  vertexShader: GRID_VERTEX,
  fragmentShader: GRID_FRAGMENT,
  side: THREE.DoubleSide,
  uniforms: { uBase: { value: new THREE.Color('#d6d6d4') }, uLine: { value: new THREE.Color('#7d7d7b') }, uHighlight: { value: highlight ? 1 : 0 } },
});

const ARROW_COLOR = '#1d1e1f';
/** 면에서 살짝 띄운 위치에서 광선을 쏜다(자기 면 재충돌 방지) */
const LIFT = 0.3;
const fmt = (v: number) => `${Math.round(v * 10) / 10}`;
const AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];

interface Span { from: THREE.Vector3; to: THREE.Vector3; length: number; max: boolean; axis: number }
/** 화살표가 커서에서 교차하므로 축마다 라벨을 다른 쪽으로 비켜 놓는다(X 위, Y 오른쪽, Z 왼쪽 아래) */
const LABEL_SHIFT = ['translate(0,-18px)', 'translate(38px,0)', 'translate(-40px,18px)'];

function isFurnitureMesh(o: THREE.Object3D): o is THREE.Mesh {
  if (!(o as THREE.Mesh).isMesh || !o.visible) return false;
  const material = (o as THREE.Mesh).material;
  const list = Array.isArray(material) ? material : [material];
  // 투명 콜라이더·치수 라벨(MeshBasic)·숨김 재질 제외. 이미 그리드로 바꾼 것은 포함.
  if (!list.every((m) => m instanceof THREE.ShaderMaterial || ((m instanceof THREE.MeshStandardMaterial) && m.opacity > 0 && m.visible))) return false;
  for (let p: THREE.Object3D | null = o; p; p = p.parent) {
    if (p.userData?.displayDecor || !p.visible) return false;
  }
  return true;
}

function Arrow({ span }: { span: Span }) {
  const parts = useMemo(() => {
    const dir = span.to.clone().sub(span.from).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const along = new THREE.Quaternion().setFromUnitVectors(up, dir);
    const back = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().negate());
    const head = Math.min(2.4, span.length / 3);
    return {
      mid: span.from.clone().add(span.to).multiplyScalar(0.5), q: along, len: Math.max(span.length - head * 2, 0.05), head,
      heads: [{ p: span.from.clone().addScaledVector(dir, head / 2), q: back }, { p: span.to.clone().addScaledVector(dir, -head / 2), q: along }],
    };
  }, [span]);
  return (
    <group>
      <mesh position={parts.mid} quaternion={parts.q} renderOrder={10000}>
        <cylinderGeometry args={[0.2, 0.2, parts.len, 8]} />
        <meshBasicMaterial color={ARROW_COLOR} depthTest={false} transparent />
      </mesh>
      {parts.heads.map((h, i) => (
        <mesh key={i} position={h.p} quaternion={h.q} renderOrder={10000}>
          <coneGeometry args={[parts.head * 0.38, parts.head, 14]} />
          <meshBasicMaterial color={ARROW_COLOR} depthTest={false} transparent />
        </mesh>
      ))}
      <Html position={parts.mid} center zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
        <span style={{ transform: LABEL_SHIFT[span.axis], display: 'inline-block', padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.95)', color: ARROW_COLOR, font: '700 13px/1.4 system-ui, sans-serif', whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
          {fmt(span.length)} cm{span.max ? ' (최대)' : ''}
        </span>
      </Html>
    </group>
  );
}

export function MeasureMode() {
  const enabled = useMeasureStore((s) => s.enabled);
  const { scene, camera, gl, raycaster } = useThree();
  const materials = useMemo(() => ({ grid: makeGridMaterial(false), hover: makeGridMaterial(true) }), []);
  const originals = useRef(new Map<THREE.Mesh, THREE.Material | THREE.Material[]>());
  const pointer = useRef<{ x: number; y: number; dirty: boolean } | null>(null);
  const hoveredMesh = useRef<THREE.Mesh | null>(null);
  const [spans, setSpans] = useState<Span[]>([]);
  const probe = useRef(new THREE.Raycaster());

  useEffect(() => () => { materials.grid.dispose(); materials.hover.dispose(); }, [materials]);

  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1, dirty: true };
    };
    const leave = () => { pointer.current = null; hoveredMesh.current = null; setSpans([]); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [enabled, gl]);

  useEffect(() => {
    const saved = originals.current;
    const restore = () => {
      saved.forEach((material, mesh) => { if (mesh.material === materials.grid || mesh.material === materials.hover) mesh.material = material; });
      saved.clear();
    };
    if (!enabled) { restore(); hoveredMesh.current = null; }
    return restore;
  }, [enabled, materials]);

  useFrame(() => {
    if (!enabled) return;
    const root = scene.getObjectByName(SHELF_ROOT_NAME);
    if (!root) return;
    const parts: THREE.Mesh[] = [];
    root.traverse((o) => { if (isFurnitureMesh(o)) parts.push(o); });

    // 그리드 재질 유지(React가 원래 재질을 다시 넣으면 새 원본으로 기록)
    for (const mesh of parts) {
      const want = mesh === hoveredMesh.current ? materials.hover : materials.grid;
      if (mesh.material === want) continue;
      if (mesh.material !== materials.grid && mesh.material !== materials.hover) originals.current.set(mesh, mesh.material);
      mesh.material = want;
    }
    originals.current.forEach((_, mesh) => { if (!mesh.parent) originals.current.delete(mesh); });

    if (!pointer.current?.dirty) return;
    pointer.current.dirty = false;
    raycaster.setFromCamera(new THREE.Vector2(pointer.current.x, pointer.current.y), camera);
    // 몸통 범위: 깊이 방향으로 전체 깊이의 절반 이상 걸친 부재(측판·가로판)만 — 도어/서랍 전면 돌출 제외
    const all = new THREE.Box3(), boxes = new Map<THREE.Mesh, THREE.Box3>();
    for (const p of parts) { const b = new THREE.Box3().setFromObject(p); boxes.set(p, b); all.union(b); }
    const bounds = new THREE.Box3();
    const fullDepth = all.max.z - all.min.z;
    boxes.forEach((b) => { if (b.max.z - b.min.z > fullDepth * 0.5) bounds.union(b); });
    if (bounds.isEmpty()) bounds.copy(all);
    const hit = raycaster.intersectObjects(parts, false)[0];
    let point: THREE.Vector3, normal: THREE.Vector3;
    if (hit?.face) {
      hoveredMesh.current = hit.object as THREE.Mesh;
      point = hit.point.clone();
      normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      if (normal.dot(raycaster.ray.direction) > 0) normal.negate();
    } else {
      // 뒷판 없는 칸처럼 가구면에 닿지 않아도 가구 안을 지나가면, 가구 뒷면 평면에서 칸을 잰다
      hoveredMesh.current = null;
      const back = new THREE.Plane(new THREE.Vector3(0, 0, 1), -bounds.min.z);
      const onBack = raycaster.ray.intersectPlane(back, new THREE.Vector3());
      const inside = onBack && onBack.x > bounds.min.x && onBack.x < bounds.max.x && onBack.y > bounds.min.y && onBack.y < bounds.max.y;
      if (!onBack || !inside || bounds.isEmpty()) { setSpans([]); return; }
      point = onBack;
      normal = new THREE.Vector3(0, 0, 1);
    }
    const origin = point.clone().addScaledVector(normal, LIFT);
    const next: Span[] = [];
    // 바깥면(도어·서랍 전면, 상판 윗면, 측판 바깥면 등)을 가리키면 그 부재 면의 가로·세로와 두께를 잰다
    const own = hoveredMesh.current ? boxes.get(hoveredMesh.current) : undefined;
    if (own && !bounds.clone().expandByScalar(-0.01).containsPoint(origin)) {
      AXES.forEach((axis, i) => {
        const k = (['x', 'y', 'z'] as const)[i];
        const length = own.max[k] - own.min[k];
        if (length < 0.5) return;
        const from = point.clone(), to = point.clone();
        from[k] = own.min[k]; to[k] = own.max[k];
        if (Math.abs(axis.dot(normal)) <= 0.7) { from.addScaledVector(normal, LIFT); to.addScaledVector(normal, LIFT); }
        next.push({ from, to, length, max: false, axis: i });
      });
      setSpans(next);
      return;
    }

    const cast = (dir: THREE.Vector3) => {
      probe.current.set(origin, dir);
      probe.current.far = 1000;
      return probe.current.intersectObjects(parts, false)[0]?.distance ?? null;
    };
    // 가구 전체 범위까지 거리(광선이 아무것도 만나지 않을 때)
    const toBounds = (dir: THREE.Vector3) => {
      const target = new THREE.Vector3();
      return new THREE.Ray(origin, dir).intersectBox(bounds, target) ? origin.distanceTo(target) : 0;
    };
    AXES.forEach((axis, i) => {
      const along = Math.abs(axis.dot(normal)) > 0.7;
      if (along) {
        // 면 바깥 방향: 다음 면까지(또는 가구 끝까지 = 최대)
        const out = normal.clone();
        const d = cast(out);
        const length = (d ?? toBounds(out)) + LIFT;
        if (length > 0.5) next.push({ from: point.clone(), to: point.clone().addScaledVector(out, length), length, max: d === null, axis: i });
      } else {
        const plus = cast(axis), minus = cast(axis.clone().negate());
        const dp = plus ?? toBounds(axis), dm = minus ?? toBounds(axis.clone().negate());
        const length = dp + dm;
        if (length > 0.5) next.push({ from: origin.clone().addScaledVector(axis, -dm), to: origin.clone().addScaledVector(axis, dp), length, max: plus === null || minus === null, axis: i });
      }
    });
    setSpans(next);
  });

  if (!enabled || !spans.length) return null;
  return <group>{spans.map((s, i) => <Arrow key={i} span={s} />)}</group>;
}
