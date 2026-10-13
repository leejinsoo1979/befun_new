import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Point3, ReplayTool } from './program';
import type { ReplayMotion } from './replayMotion';

/**
 * 기종 미확정 시의 참조 외형. 아래 비례는 화면 모델링에만 사용한다.
 * 축 한계·충돌·클램프 안전 판정·가공 좌표·공구 규격에는 사용하지 않는다.
 * 실제 장비 CAD/축 구성이 들어오면 이 외형을 교체한다.
 */
const paint = '#cbd3d8', graphite = '#25333e', steel = '#9aa9b4', accent = '#178b97';
type PartProps = { size: Point3; position?: Point3; color?: string; metal?: boolean; radius?: number };
function Casing({ size, position = [0, 0, 0], color = paint, metal = false, radius = 3 }: PartProps) {
  return <RoundedBox args={size} radius={Math.min(radius, Math.min(...size) * .2)} smoothness={2} position={position} castShadow receiveShadow>
    <meshStandardMaterial color={color} metalness={metal ? .85 : .25} roughness={metal ? .26 : .43} />
  </RoundedBox>;
}
function Shaft({ r, length, position = [0, 0, 0], color = steel, radial = 48 }: { r: number; length: number; position?: Point3; color?: string; radial?: number }) {
  return <mesh position={position} castShadow receiveShadow><cylinderGeometry args={[r, r, length, radial]} /><meshStandardMaterial color={color} metalness={.88} roughness={.26} /></mesh>;
}
function Fastener({ position, size = 3 }: { position: Point3; size?: number }) {
  return <group position={position} rotation={[Math.PI / 2, 0, 0]}><Shaft r={size * 1.5} length={size * .3} /><Shaft r={size} length={size} color={graphite} radial={6} /></group>;
}
function Rail({ length, position }: { length: number; position: Point3 }) {
  return <group position={position}>
    <Casing size={[16, length, 12]} metal radius={1} />
    <Casing size={[8, length, 2]} position={[0, 0, 7]} metal color="#e3e7eb" radius={.3} />
    {Array.from({ length: 9 }, (_, i) => <Fastener key={i} position={[0, (i / 8 - .5) * (length - 30), 9]} size={2} />)}
  </group>;
}
function Pod({ position }: { position: Point3 }) {
  return <group position={position}>
    <Casing size={[82, 76, 14]} position={[0, 0, -57]} color={graphite} />
    <group rotation={[Math.PI / 2, 0, 0]}><Shaft r={24} length={44} position={[0, -31, 0]} /></group>
    <Casing size={[75, 68, 12]} position={[0, 0, -8]} color={graphite} radius={7} />
    <Casing size={[65, 58, 4]} position={[0, 0, -2]} color="#171e22" radius={6} />
    <group position={[40, 0, -42]} rotation={[0, 0, Math.PI / 2]}><Shaft r={4} length={12} color="#e6b85c" /></group>
  </group>;
}

/** Z축 방향의 주름 덮개. 산과 골을 번갈아 만들어 레일 보호 주름을 표현한다. */
function Bellows({ size, position }: { size: Point3; position: Point3 }) {
  const count = Math.max(4, Math.ceil(size[2] / 10));
  return <group position={position}>{Array.from({ length: count }, (_, i) => <Casing key={i}
    size={[size[0], size[1] + (i % 2 ? 0 : 7), size[2] / count * .75]}
    position={[0, 0, (i / count - .5) * size[2]]} color="#1c252c" radius={1} />)}</group>;
}

/** 공구 끝이 원점이고 +Y가 가공 방향인 홀더. 공구 규격 자체는 바꾸지 않는다. */
export function SpindleHolder({ tool }: { tool: Extract<ReplayTool, { kind: 'drill' }> }) {
  const shank = tool.appearance?.shankDiameter ?? tool.diameter;
  const r = Math.max(24, shank * .85), length = tool.length;
  const lathe = useMemo(() => {
    const points = [[0, -length - 172], [r * .8, -length - 172], [r, -length - 165], [r, -length - 55],
      [r * .82, -length - 47], [r * .82, -length - 30], [r * .62, -length - 24], [r * .62, -length - 12],
      [shank * .56, -length - 5], [shank * .5, -length - 5], [shank * .5, -length - 22], [0, -length - 22]];
    return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), 64);
  }, [r, shank, length]);
  useEffect(() => () => lathe.dispose(), [lathe]);
  return <group>
    <mesh geometry={lathe} castShadow><meshStandardMaterial color="#aab8c4" metalness={.9} roughness={.24} /></mesh>
    <Shaft r={r * 1.02} length={17} position={[0, -length - 52, 0]} color={graphite} />
    <Shaft r={Math.max(shank * .67, r * .67)} length={22} position={[0, -length - 18, 0]} color="#465361" radial={12} />
    {Array.from({ length: 8 }, (_, i) => <group key={i} rotation={[0, i * Math.PI / 4, 0]}>
      <Casing size={[2, 14, 2]} position={[0, -length - 14, Math.max(shank * .67, r * .67)]} color="#151d24" radius={.3} />
    </group>)}
    {[0, 1, 2, 3, 4].map(i => <Shaft key={i} r={r + 1.5} length={3} position={[0, -length - 80 - i * 15, 0]} color="#687b8b" />)}
    <Casing size={[r * 1.6, 94, r * .5]} position={[0, -length - 113, -r * .85]} color={graphite} />
    {[0, 1].map(i => <Shaft key={i} r={4} length={25} position={[(i ? 1 : -1) * r * .45, -length - 183, 0]} color={i ? '#e1b25b' : '#668eb2'} />)}
  </group>;
}

/** 축 구멍을 관통하는 회전축, 누름 플랜지와 육각 너트. 톱날 중심과 회전축을 일치시킨다. */
export function SawArbor({ tool }: { tool: Extract<ReplayTool, { kind: 'saw' }> }) {
  const bore = tool.appearance?.boreDiameter ?? tool.diameter * .15;
  const r = Math.min(bore * .75, tool.diameter * .09);
  return <group>
    <Shaft r={bore * .495} length={tool.kerf + 30} />
    {[-1, 1].map(side => <group key={side}>
      <Shaft r={r} length={5} position={[0, side * (tool.kerf / 2 + 2.5), 0]} />
      <Shaft r={bore * .57} length={5} position={[0, side * (tool.kerf / 2 + 7.5), 0]} color={graphite} radial={6} />
    </group>)}
    <Shaft r={bore * .49} length={60} position={[0, -45, 0]} />
  </group>;
}

/** 각 축을 독립 슬라이드로 표시한다. 헤드 높이에 따라 기둥 길이를 늘이지 않는다. */
export const MachineAssembly = React.memo(function MachineAssembly({ size, tool, position, direction = [0, 0, -1], flatBed = false, motion }: { size: Point3; tool?: ReplayTool; position?: Point3; direction?: Point3; flatBed?: boolean; motion?: ReplayMotion }) {
  const posts = useRef<Array<THREE.Group | null>>([]), beam = useRef<THREE.Group>(null), slide = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null), bellows = useRef<THREE.Group>(null);
  const initial = motion?.pose();
  if (initial) { position = initial.position && [initial.position[0] - (motion?.program.setup?.routerOrigin[0] ?? 0), initial.position[1], initial.position[2]]; direction = initial.direction; }
  const scale = 1;
  const width = size[0] + 420, depth = size[1] + 300;
  const centerX = size[0] / 2, centerY = size[1] / 2;
  const mount = tool?.kind === 'drill' && position ? position.map((v, i) => v - direction[i] * (tool.length + 113)) as Point3 : position;
  const gantryY = tool?.kind === 'drill' && mount ? mount[1] : size[1] * .85;
  const headX = tool?.kind === 'drill' && mount ? mount[0] : size[0] * .75;
  const headZ = tool?.kind === 'drill' && mount ? mount[2] : 350 * scale;
  const beamZ = 660 * scale;
  useFrame(() => {
    if (!motion) return;
    const frame = motion.pose();
    if (frame.tool?.kind !== 'drill' || !frame.position) return;
    const mountOffset = frame.tool.length + 113;
    const mount = frame.position.map((v, i) => v - frame.direction[i] * mountOffset) as Point3;
    mount[0] -= motion.program.setup?.routerOrigin[0] ?? 0;
    posts.current.forEach(post => { if (post) post.position.y = mount[1] - centerY; });
    if (beam.current) beam.current.position.y = mount[1];
    if (slide.current) slide.current.position.x = mount[0] - centerX;
    if (head.current) head.current.position.set(...mount);
    if (bellows.current) {
      const length = Math.max(20, beamZ - mount[2] - 85);
      bellows.current.scale.z = length / 100;
      bellows.current.position.z = -(beamZ - mount[2] - 85) / 2 - 70;
    }
  });
  return <group name="reference-machine-not-machine-cad">
    <Casing size={[width, depth, 120 * scale]} position={[centerX, centerY, -230 * scale]} color={graphite} radius={10} />
    <Casing size={[width - 14, 24, 60 * scale]} position={[centerX, centerY - depth / 2 - 2, -220 * scale]} color={paint} radius={4} />
    <Casing size={[width - 70, 3, 9]} position={[centerX, centerY - depth / 2 - 15, -210 * scale]} color={accent} radius={.5} />
    {[-1, 1].flatMap(x => [-1, 1].map(y => <group key={`${x}-${y}`} position={[centerX + x * (width / 2 - 65), centerY + y * (depth / 2 - 70), -330 * scale]}>
      <Casing size={[95, 95, 110 * scale]} color={graphite} radius={7} />
      <group rotation={[Math.PI / 2, 0, 0]}><Shaft r={16} length={35} position={[0, -65 * scale, 0]} /><Shaft r={38} length={12} position={[0, -85 * scale, 0]} color="#121a20" /></group>
    </group>))}
    {Array.from({ length: Math.max(4, Math.ceil(size[0] / 450)) }, (_, i) => .08 + i / (Math.max(4, Math.ceil(size[0] / 450)) - 1) * .84).map(x => <group key={x} position={[size[0] * x, centerY, 0]}>
      <Casing size={[85, depth - 60, 48]} position={[0, 0, -100]} metal radius={3} />
      {[-26, 26].map(side => <Rail key={side} length={depth - 80} position={[side, 0, -69]} />)}
      {!flatBed && [.12, .85].map(y => <Pod key={y} position={[0, size[1] * y - centerY, 0]} />)}
    </group>)}
    {flatBed && <group name="router-vacuum-spoilboard"><Casing size={[size[0] + 60, size[1] + 60, 70]} position={[centerX, centerY, -65]} color={graphite} /><Casing size={[size[0] + 40, size[1] + 40, 30]} position={[centerX, centerY, -15]} color="#a89069" radius={1} /></group>}
    {[-1, 1].map((side, i) => <group key={side} position={[centerX + side * (width / 2 - 48), centerY, 0]}>
      <Casing size={[100, depth - 10, 50]} position={[0, 0, -142]} color={paint} />
      <Rail length={depth - 30} position={[0, 0, -110]} />
      <group ref={group => { posts.current[i] = group; }} position={[0, gantryY - centerY, 0]}>
        <Casing size={[100, 160, 45]} position={[0, 0, -81]} metal />
        <Casing size={[92, 115, beamZ + 65]} position={[0, 0, (beamZ - 65) / 2]} color={paint} radius={7} />
        <Casing size={[42, 3, beamZ * .8]} position={[0, -59, beamZ * .45]} color={graphite} />
        {[100, 260, 420, 560].map(z => <Fastener key={z} position={[24, -62, z * scale]} size={3} />)}
      </group>
    </group>)}
    <group ref={beam} position={[centerX, gantryY, beamZ]}>
      <Casing size={[width, 115, 120]} color={paint} radius={6} />
      <Casing size={[width - 40, 4, 12]} position={[0, -60, 30]} color={accent} radius={.5} />
      {[-32, 32].map(z => <group key={z} position={[0, -67, z]} rotation={[0, 0, Math.PI / 2]}><Rail length={width - 100} position={[0, 0, 0]} /></group>)}
      <group ref={slide} position={[headX - centerX, -75, 0]}>
        <Casing size={[160, 70, 170]} color={graphite} radius={5} />
        {[-47, 47].map(x => <group key={x} position={[x, -53, -170]} rotation={[Math.PI / 2, 0, 0]}><Rail length={420 * scale} position={[0, 0, 0]} /></group>)}
        <group ref={bellows} position={[0, 0, -(beamZ - headZ - 85) / 2 - 70]} scale={[1, 1, Math.max(20, beamZ - headZ - 85) / 100]}><Bellows size={[120, 28, 100]} position={[0, -50, 0]} /></group>
      </group>
    </group>
    {tool?.kind === 'drill' && position && <group ref={head} position={[headX, gantryY, headZ]}>
      <Casing size={[125, 30, 155]} position={[0, -125, 0]} color={graphite} />
      <Casing size={[100, 130, 28]} position={[0, -66, 33]} metal />
      <Casing size={[100, 130, 28]} position={[0, -66, -40]} metal />
      {[-1, 1].flatMap(x => [-1, 1].map(z => <Fastener key={`${x}-${z}`} position={[x * 43, -141, z * 59]} size={3} />))}
    </group>}
  </group>;
});

/** 참조 톱 캐리지: 회전축과 아래 모터를 벨트로 잇는다. 가공 공간 충돌 검증 모델은 아니다. */
export function SawDrive({ tool }: { tool: Extract<ReplayTool, { kind: 'saw' }> }) {
  const r = tool.diameter * .14, drop = tool.diameter * .65;
  return <group>
    <Casing size={[r * 3.8, 70, drop + r * 2.2]} position={[0, -75, -drop / 2]} color={graphite} radius={7} />
    <Casing size={[r * 3.5, 5, drop + r * 1.8]} position={[0, -37, -drop / 2]} color={paint} radius={6} />
    <Shaft r={r * .8} length={8} position={[0, -32, 0]} />
    <Shaft r={r} length={100} position={[0, -80, -drop]} />
    {Array.from({ length: 7 }, (_, i) => <Shaft key={i} r={r + 4} length={3} position={[0, -40 - i * 12, -drop]} color={graphite} />)}
    <Casing size={[r * 4.5, 140, 15]} position={[0, -75, -drop - r - 11]} metal />
    {[-1, 1].map(x => <Casing key={x} size={[8, 7, drop]} position={[x * r * .65, -30, -drop / 2]} color="#161d23" radius={1} />)}
  </group>;
}
