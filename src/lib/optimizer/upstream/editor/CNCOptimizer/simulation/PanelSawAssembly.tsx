import React, { useLayoutEffect, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { Group, InstancedMesh, Matrix4 } from 'three';
import { useFrame } from '@react-three/fiber';
import type { MachiningProgram, Point3 } from './program';
import type { ReplayMotion } from './replayMotion';
import { rotatedBounds } from './stockTransform';

/** 제조사 CAD가 없는 상태의 컷쏘 참조 외형. 외형 비례는 제조 치수로 내보내지 않는다. */
function Body({ size, at, color = '#d2dadd', alpha = 1, metal = false }: { size: Point3; at: Point3; color?: string; alpha?: number; metal?: boolean }) {
  return <RoundedBox args={size} position={at} radius={Math.min(5, ...size.map(v => v / 6))} smoothness={2} castShadow receiveShadow>
    <meshStandardMaterial color={color} metalness={metal ? .8 : .25} roughness={metal ? .27 : .47} transparent={alpha < 1} opacity={alpha} depthWrite={alpha === 1} />
  </RoundedBox>;
}
function Cylinder({ at, radius, length, color = '#a2b0b8', axis = 'z' }: { at: Point3; radius: number; length: number; color?: string; axis?: 'x' | 'y' | 'z' }) {
  return <mesh position={at} rotation={axis === 'z' ? [Math.PI / 2, 0, 0] : axis === 'x' ? [0, 0, Math.PI / 2] : [0, 0, 0]} castShadow>
    <cylinderGeometry args={[radius, radius, length, 24]} /><meshStandardMaterial color={color} metalness={.8} roughness={.3} />
  </mesh>;
}
/** 같은 볼 50개를 같은 형상·위치로 한 번에 그려 이동 중 draw call을 줄인다. */
const TransferBalls = React.memo(function TransferBalls({ length, depth }: { length: number; depth: number }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const matrix = new Matrix4();
    for (let x = 0; x < 5; x++) for (let y = 0; y < 10; y++) {
      mesh.current.setMatrixAt(x * 10 + y, matrix.makeTranslation((x - 2) * length / 18, (y - 4.5) * depth / 11, -1));
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [length, depth]);
  return <instancedMesh ref={mesh} args={[undefined, undefined, 50]}>
    <sphereGeometry args={[3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#bcc6ca" metalness={.85} roughness={.3} />
  </instancedMesh>;
});
export const PanelSawAssembly = React.memo(function PanelSawAssembly({ program, motion, cutaway }: { program: MachiningProgram; motion: ReplayMotion; cutaway: boolean }) {
  const pose = motion.pose(), setup = program.setup!;
  const beam = useRef<Group>(null), fenceGroup = useRef<Group>(null), carriage = useRef<Group>(null);
  const grips = useRef<Array<Group | null>>([]), pads = useRef<Array<Group | null>>([]);
  const length = setup.cuttingLength, depth = setup.tableDepth, t = program.stocks[0].size[2];
  const stock = program.stocks.find(s => s.id === pose.step?.stockId) ?? program.stocks[0];
  const i = program.stocks.indexOf(stock), p = pose.positions[i], b = rotatedBounds(stock.size, pose.angles[i]);
  const fence = pose.fence ?? { y: p[1] + b.maxY + 26, minX: p[0] + b.minX, maxX: p[0] + b.maxX };
  const fenceY = fence.y;
  const beamZ = t + (1 - pose.clamp) * 125;
  const activeSaw = pose.tool?.kind === 'saw';
  useFrame(() => {
    const frame = motion.pose(), stock = program.stocks.find(s => s.id === frame.step?.stockId) ?? program.stocks[0];
    const index = program.stocks.indexOf(stock), p = frame.positions[index], bounds = rotatedBounds(stock.size, frame.angles[index]);
    const fence = frame.fence ?? { y: p[1] + bounds.maxY + 26, minX: p[0] + bounds.minX, maxX: p[0] + bounds.maxX };
    if (beam.current) beam.current.position.z = t + (1 - frame.clamp) * 125;
    if (fenceGroup.current) fenceGroup.current.position.y = fence.y;
    [.15, .5, .85].forEach((fraction, i) => {
      if (grips.current[i]) grips.current[i]!.position.x = Math.max(20, Math.min(length - 20, fence.minX + (fence.maxX - fence.minX) * fraction));
      if (pads.current[i]) pads.current[i]!.position.z = t + (frame.fence ? 7 : 28);
    });
    if (carriage.current) { carriage.current.visible = frame.tool?.kind === 'saw' && !!frame.position; carriage.current.position.x = frame.position?.[0] ?? 0; }
  });
  return <group name="panel-saw-fixed-cutting-line">
    {/* 앞뒤 테이블 사이가 유일한 절단선이다. 라우터 작업대와 구분한다. */}
    <Body size={[length + 450, 430, 270]} at={[length / 2, 0, -220]} color="#20303c" alpha={cutaway ? .16 : 1} />
    <Body size={[length + 350, 180, 25]} at={[length / 2, -130, -16]} color="#89979f" metal />
    <Body size={[length + 350, depth, 36]} at={[length / 2, depth / 2 + 25, -20]} color="#64727b" />
    {[0, 1, 2].map(n => <group key={n} position={[(n + .5) * length / 3, -depth / 2 - 150, 0]}>
      <Body size={[length / 3 - 22, depth + 220, 40]} at={[0, 0, -22]} color="#626d74" />
      <TransferBalls length={length} depth={depth} />
      {[-1, 1].map(y => <group key={y}>
        <Body size={[70, 80, 370]} at={[0, y * depth * .35, -225]} color="#d3dadd" />
        <Cylinder at={[0, y * depth * .35, -422]} radius={30} length={18} color="#17232b" />
      </group>)}
    </group>)}
    {[-260, length + 260].map(x => <group key={x}>
      <Body size={[115, depth + 300, 95]} at={[x, depth / 2, -95]} color="#d0d6da" />
      <Body size={[22, depth + 200, 14]} at={[x, depth / 2, -38]} color="#a4b1b9" metal />
      <Body size={[130, 260, 440]} at={[x, 0, 140]} color="#d7dddf" alpha={cutaway ? .12 : 1} />
      <Cylinder at={[x, 0, 145]} radius={18} length={250} />
      <Body size={[90, 55, 10]} at={[x, -135, 260]} color="#15909d" />
    </group>)}
    {/* 압력빔은 톱날 공간을 남기고 양쪽 고무 패드로 눌러 고정한다. */}
    <group ref={beam} name="pressure-beam" position={[0, 0, beamZ]}>
      <Body size={[length + 650, 160, 92]} at={[length / 2, 0, 132]} color="#dce0e1" alpha={cutaway ? .3 : 1} />
      {[-62, 62].map(y => <group key={y}>
        <Body size={[length + 140, 36, 92]} at={[length / 2, y, 48]} alpha={cutaway ? .12 : 1} />
        <Body size={[length + 120, 38, 4]} at={[length / 2, y, 2]} color="#151e23" alpha={cutaway ? .22 : 1} />
      </group>)}
      <Body size={[length + 120, 3, 8]} at={[length / 2, -82, 145]} color="#13a2ad" />
    </group>
    {/* 프로그램 펜스와 집게는 절단선에 수직으로만 이송한다. */}
    <group ref={fenceGroup} name="program-fence" position={[0, fenceY, 0]}>
      <Body size={[length + 160, 80, 75]} at={[length / 2, 40, 38]} color="#d2dadf" />
      {[.15, .5, .85].map((f, i) => {
        const x = Math.max(20, Math.min(length - 20, fence.minX + (fence.maxX - fence.minX) * f));
        return <group ref={group => { grips.current[i] = group; }} key={f} position={[x, 0, 0]}>
          <Body size={[50, 110, 16]} at={[0, -15, 10]} color="#697e8a" metal />
          <group ref={group => { pads.current[i] = group; }} position={[0, 0, t + (pose.fence ? 7 : 28)]}><Body size={[45, 95, 13]} at={[0, -22, 0]} color="#83959e" metal /></group>
          <Cylinder at={[0, 28, 65]} radius={11} length={50} />
        </group>;
      })}
    </group>
    {/* 톱 캐리지의 선형 레일. 톱 구동부는 실제 공구 좌표에 달린다. */}
    {[-90, 90].map(y => <Body key={y} size={[length + 450, 22, 20]} at={[length / 2, y, -230]} color="#a4b3be" metal />)}
    <group ref={carriage} visible={activeSaw && !!pose.position} position={[pose.position?.[0] ?? 0, 0, 0]}><Body size={[150, 230, 20]} at={[0, 0, -215]} color="#728591" metal /></group>
    <group position={[length + 360, -250, 0]}>
      <Body size={[70, 70, 470]} at={[0, 0, -130]} color="#bbc5ca" />
      <Body size={[230, 55, 170]} at={[0, 0, 140]} color="#1c2b35" />
      <Body size={[205, 3, 141]} at={[0, -29, 140]} color="#344d5d" />
      <Cylinder at={[85, -36, 25]} radius={13} length={12} color="#c73e38" axis="y" />
    </group>
  </group>;
});
