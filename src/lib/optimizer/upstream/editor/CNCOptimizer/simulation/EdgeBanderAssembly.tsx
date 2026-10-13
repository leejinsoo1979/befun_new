import { applyStockDisplayPose } from './stockTransform';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Group, InstancedMesh, Matrix4, Mesh, Shape, ExtrudeGeometry } from 'three';
import { bandPasses, type MachiningProgram, type Point3 } from './program';
import type { ReplayMotion } from './replayMotion';
import { banderReference as station, bandingAt, bandTapeRange } from './edgeBandingProcess';
import { BandMachining } from './bandMachining';
import { createFeedTapeGeometry, tapeFeed } from './feedTapeGeometry';

/** 공정 설명용 단면 자동 밴더. 공개 외형 길이 외 내부 비례는 CAD 인증 치수가 아니다. */
function Casing({ at, size, color = '#e4e6e5', alpha = 1 }: { at: Point3; size: Point3; color?: string; alpha?: number }) {
  return <RoundedBox position={at} args={size} radius={Math.min(8, ...size.map(n => n / 5))} smoothness={2} castShadow receiveShadow>
    <meshStandardMaterial color={color} metalness={.28} roughness={.48} transparent={alpha < 1} opacity={alpha} depthWrite={alpha === 1} />
  </RoundedBox>;
}
function Roller({ at, radius, height, rubber = false, axis = 'z' }: { at: Point3; radius: number; height: number; rubber?: boolean; axis?: 'y' | 'z' }) {
  return <group position={at} rotation={axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
    <mesh castShadow><cylinderGeometry args={[radius, radius, height, 40]} /><meshStandardMaterial color={rubber ? '#30383a' : '#a7b2b7'} roughness={rubber ? .8 : .26} metalness={rubber ? 0 : .85} /></mesh>
    {[-1, 1].map(s => <mesh key={s} position={[0, s * (height / 2 + 4), 0]}><cylinderGeometry args={[radius * .34, radius * .34, 8, 24]} /><meshStandardMaterial color="#59656b" metalness={.75} roughness={.32} /></mesh>)}
  </group>;
}

/** 코일에서 압착 롤러로 공급되는 실제 폭의 띠. 화면 픽셀 선으로 대신하지 않는다. */
function FeedTape({ color, height, thickness }: { color: string; height: number; thickness: number }) {
  const geometry = useMemo(() => createFeedTapeGeometry(height, thickness), [height, thickness]);
  React.useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} name="bander-feed-ribbon" castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={.42} />
  </mesh>;
}

/** 연속 트랙 패드. 판재의 이송 거리와 같은 거리만큼 순환한다. */
function FeedTrack({ motion, top = false }: { motion: ReplayMotion; top?: boolean }) {
  const pads = useRef<InstancedMesh>(null);
  const matrix = useMemo(() => new Matrix4(), []);
  const update = () => {
    if (!pads.current) return;
    const pose = motion.pose(), step = pose.step;
    const stock = motion.program.stocks.find(s => s.id === step?.stockId);
    const travelled = motion.program.steps.reduce((sum, s, i) => sum + (s.kind === 'band' && i <= pose.cursor.index
      ? (s.to[0] - s.from[0]) * (i === pose.cursor.index ? pose.cursor.progress : 1) : 0), 0);
    const pitch = 70, length = pitch * 56, distance = travelled % pitch;
    for (let i = 0; i < 56; i++) {
      const x = 320 + (i * pitch + distance) % length;
      matrix.makeTranslation(x, 100, top ? (stock?.size[2] ?? 18) + 14 : -14);
      pads.current.setMatrixAt(i, matrix);
    }
    pads.current.instanceMatrix.needsUpdate = true;
  };
  useLayoutEffect(update, [motion, top, matrix]);
  useFrame(update);
  return <instancedMesh name={top ? 'bander-upper-pressure-track' : 'bander-feed-track'} ref={pads} args={[undefined, undefined, 56]} castShadow receiveShadow>
    <boxGeometry args={[62, 140, 28]} /><meshStandardMaterial color={top ? '#3a4547' : '#283033'} roughness={.88} />
  </instancedMesh>;
}

/** 각 장치가 맞닿는 위치는 bandingAt과 공유한다. 장치를 통과하기 전에 완성 엣지를 그리지 않는다. */
export const EdgeBanderAssembly = React.memo(function EdgeBanderAssembly({ program, motion, cutaway }: { program: MachiningProgram; motion: ReplayMotion; cutaway: boolean }) {
  const setup = program.setup!.bander!;
  const head = useRef<Group>(null), endFront = useRef<Group>(null), endRear = useRef<Group>(null);
  const cutters = useRef<Array<Group | null>>([]), coil = useRef<Group>(null), tape = useRef<Group>(null);
  const initialStep = motion.pose().step;
  const [selection, setSelection] = useState({ stockId: initialStep?.stockId, bandIndex: initialStep?.kind === 'band' ? initialStep.bandIndex : 0 });
  const stock = program.stocks.find(s => s.id === selection.stockId);
  const band = stock?.edgeBands?.[selection.bandIndex];
  const color = band?.color ?? '#d9d7cc', tapeThickness = band?.thickness ?? 1;
  const height = stock?.size[2] ?? 18, tapeHeight = height + 6;
  const coilGeometry = useMemo(() => {
    const shape = new Shape(); shape.absarc(0, 0, tapeFeed.coil.radius, 0, Math.PI * 2, false);
    const inner = new Shape(); inner.absarc(0, 0, 70, 0, Math.PI * 2, true); shape.holes.push(inner);
    return new ExtrudeGeometry(shape, { depth: tapeHeight, bevelEnabled: false, curveSegments: 128 });
  }, [tapeHeight]);
  React.useEffect(() => () => coilGeometry.dispose(), [coilGeometry]);
  useFrame((_, delta) => {
    const frame = motion.pose(), states = bandingAt(program, motion.clock.elapsedMs), active = states.filter(p => p.active);
    const bandIndex = frame.step?.kind === 'band' ? frame.step.bandIndex : 0;
    if (frame.step?.stockId !== selection.stockId || bandIndex !== selection.bandIndex) setSelection({ stockId: frame.step?.stockId, bandIndex });
    const stock = program.stocks.find(s => s.id === frame.step?.stockId), thickness = stock?.size[2] ?? 18;
    if (head.current) head.current.position.z = thickness;
    // 코일 접선 방향으로 풀린 길이만큼 회전한다. 배속/정지/되감기도 판재와 같은 시각을 쓴다.
    if (coil.current) coil.current.rotation.z = states.reduce((sum, s) => sum + s.glued, 0) / tapeFeed.coil.radius;
    if (tape.current) tape.current.visible = active.some(p => p.leading >= station.glue && p.leading <= station.pressure + p.length);
    // 끝단 톱은 앞/뒤 끝을 따라 짧게 동행한 후 빠진다. 둘을 동시에 판재 속에 두지 않는다.
    const front = active.find(p => Math.abs(p.leading - station.endTrim) < 75);
    const rear = active.find(p => Math.abs(p.leading - p.length - station.endTrim) < 75);
    for (const [group, point, idleOffset] of [[endFront.current, front?.leading, -90], [endRear.current, rear ? rear.leading - rear.length : undefined, 90]] as const) {
      if (!group) continue;
      const engaged = point !== undefined && Math.abs(point - station.endTrim) < 75;
      group.position.x = engaged ? point : station.endTrim + idleOffset;
      group.position.y = engaged ? -3 : -90;
    }
    if (motion.clock.playing && active.length) cutters.current.forEach(g => { if (g) g.rotation.z = (g.rotation.z + delta * 25) % (Math.PI * 2); });
  });
  return <group position={setup.origin} name="single-sided-edge-bander">
    <Casing at={[setup.length / 2, -400, -340]} size={[setup.length, 840, 610]} color="#d7dcd9" />
    <Casing at={[setup.length / 2, -815, -200]} size={[setup.length - 80, 12, 140]} color="#313d40" />
    {[350, 1280, 2210, 3140, 4200].map(x => <group key={x}>
      <Casing at={[x, -828, -315]} size={[740, 15, 370]} />
      <Casing at={[x + 270, -840, -245]} size={[8, 16, 100]} color="#5b6769" />
      {[-640, -40].map(y => <Roller key={y} at={[x, y, -678]} radius={45} height={40} rubber />)}
    </group>)}
    {/* 외함을 투시해도 벨트·롤러·공구는 불투명하게 남는다. */}
    <Casing at={[setup.length / 2 + 160, -440, 380]} size={[setup.length - 420, 650, 650]} alpha={cutaway ? .08 : 1} />
    <Casing at={[setup.length / 2, -105, 445]} size={[setup.length - 250, 18, 70]} color="#635bcb" alpha={cutaway ? .25 : 1} />
    <Casing at={[setup.length / 2, -80, -35]} size={[setup.length + 800, 170, 45]} color="#8e9a9f" />
    <FeedTrack motion={motion} /><FeedTrack motion={motion} top />
    <group ref={head} position={[0, 0, stock?.size[2] ?? 18]}>
      <Casing at={[setup.length / 2, 100, 90]} size={[setup.length - 300, 200, 120]} color="#dde2e1" alpha={cutaway?.18:1} />
      {[650, 1800, 3200, 4100].map(x => <Roller key={x} at={[x, 100, 270]} radius={19} height={310} />)}
    </group>
    {/* 폭이 넓은 판재를 지지하는 바깥 롤러 레일. */}
    {[450, 1000, 1550, 2100, 2650, 3200, 3750, 4300].map(x => <group key={x}>
      <Roller at={[x, 850, -26]} radius={24} height={1600} axis="y" />
      <Casing at={[x, 850, -100]} size={[35, 1600, 55]} color="#667578" />
    </group>)}
    <group position={[tapeFeed.coil.x, tapeFeed.coil.y, -3]}>
      <Roller at={[0, 0, -13]} radius={238} height={18} />
      <group ref={coil}><mesh geometry={coilGeometry} name="bander-tape-coil"><meshStandardMaterial color={color} roughness={.5} /></mesh>
        {[85, 110, 140, 170, 195].map(r => <mesh key={r} position={[0, 0, tapeHeight + .03]}><ringGeometry args={[r, r + .65, 96]} /><meshStandardMaterial color="#727974" roughness={.6} /></mesh>)}
      </group><Roller at={[0, 0, 20]} radius={30} height={95} />
    </group>
    <group ref={tape}>
      <FeedTape color={color} height={height} thickness={tapeThickness} />
    </group>
    {/* 프리밀링 — 1mm 제거 후 같은 두께의 테이프가 원래 외곽까지 채운다. */}
    <group position={[station.preMill,-40+(stock?.edgeBands?.[0]?.thickness??1),18]}>
      <Roller at={[0,0,90]} radius={52} height={145} />
      <group ref={g=>{cutters.current[2]=g;}}>
        <Roller at={[0,0,0]} radius={36} height={60} />
        {[0,1,2,3].map(n=><group key={n} rotation={[0,0,n*Math.PI/2]}><mesh position={[38,0,0]}><boxGeometry args={[4,8,60]} /><meshStandardMaterial color="#aab5ba" metalness={.85} roughness={.3} /></mesh></group>)}
      </group>
      <Casing at={[0,-95,60]} size={[150,90,145]} color="#829094" alpha={cutaway?.25:1} />
    </group>
    {/* 공급 가이드/접착 롤러/용융 접착제 탱크와 압착 구간. */}
    <Roller at={[tapeFeed.guide.x, tapeFeed.guide.y, 30]} radius={tapeFeed.guide.radius} height={80} rubber />
    <Casing at={[station.glue, -350, 40]} size={[220, 250, 150]} color="#546369" />
    <Casing at={[station.glue, -350, 124]} size={[240, 270, 18]} color="#b0b8b9" />
    <Roller at={[station.glue, -30+(stock?.edgeBands?.[0]?.thickness??1), 18]} radius={30} height={60} />
    {[station.pressure, station.pressure+125, station.pressure+245, station.pressure+365].map((x,i) => <group key={x}>
      <Roller at={[x, i ? -38 : -59, 24]} radius={i ? 38 : 59} height={80} rubber />
      <Casing at={[x, -140, 70]} size={[40, 200, 25]} color="#a7b2b7" />
    </group>)}
    {/* 앞/뒤 끝단 절단 — 수직 원판과 추종 슬라이드 두 벌. */}
    {[endFront,endRear].map((ref,i) => <group ref={ref} key={i} position={[station.endTrim,-90,0]}>
      <Casing at={[0,-190,90+i*65]} size={[85,300,65]} color="#6e7e83" />
      <mesh position={[0,-40,18]} rotation={[Math.PI/2,0,Math.PI/2]}><cylinderGeometry args={[65,65,2.5,72]} /><meshStandardMaterial color="#bdc6c9" metalness={.85} roughness={.28} /></mesh>
      <Roller at={[0,-90,18]} radius={24} height={105} axis="y" />
    </group>)}
    {/* 위아래 다듬기 커터와 가이드 베어링. */}
    {[-1,1].map((sign,i) => <group key={sign} position={[station.trim,-37,sign<0?-12.5:(stock?.size[2]??18)+12.5]}>
      <Roller at={[0,0,sign*65]} radius={47} height={95} />
      <group ref={g=>{cutters.current[i]=g;}}>
        <Roller at={[0,0,0]} radius={40} height={25} />
        {[0,1,2,3].map(n=><group key={n} rotation={[0,0,n*Math.PI/2]}><mesh position={[39,0,0]}><boxGeometry args={[6,8,25]} /><meshStandardMaterial color="#c7ced0" metalness={.9} roughness={.25} /></mesh></group>)}
      </group>
      <Roller at={[0,12,sign<0?30:-30]} radius={22} height={12} />
    </group>)}
    {[station.scrape,station.buff].map((x,i)=><group key={x}>
      <Casing at={[x,-210,110]} size={[100,290,50]} color="#809095" />
      {i===0 ? <>
        <Casing at={[x,-6,(stock?.size[2]??18)+1]} size={[70,16,5]} color="#c2c9cb" />
        <Casing at={[x,-6,-1]} size={[70,16,5]} color="#c2c9cb" />
      </> : [-1,1].map(s=><Roller key={s} at={[x,-35,s<0?-14:(stock?.size[2]??18)+14]} radius={42} height={28} rubber />)}
    </group>)}
    {/* 집진 덕트와 고정 외함, 조작 화면·비상 정지. */}
    {[station.endTrim,station.trim,station.scrape].map(x=><Roller key={x} at={[x,-440,660]} radius={65} height={400} />)}
    <Casing at={[-150,-530,380]} size={[250,75,195]} color="#2d393f" />
    <Casing at={[-150,-486,390]} size={[214,8,132]} color="#42555d" />
    <Roller at={[-210,-475,290]} radius={17} height={18} rubber axis="y" />
    <mesh position={[-210,-461,290]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[15,15,12,24]} /><meshStandardMaterial color="#c94639" /></mesh>
  </group>;
});

/** 판재에 붙은 테이프: 압착된 길이만 생성하고 상하 여분은 커터를 지난 부분만 제거한다. */
export function ReplayEdgeBands({ motion, layout }: { motion: ReplayMotion; layout: boolean }) {
  const groups = useRef(new Map<string, Group>()), strips = useRef(new Map<string, Mesh>());
  const program = motion.program;
  const passes = useMemo(() => bandPasses(program), [program]);
  const tapeMachining = useMemo(() => new BandMachining(program), [program]);
  useLayoutEffect(() => () => tapeMachining.dispose(), [tapeMachining]);
  const update = () => {
    const pose = motion.pose(), all = bandingAt(program, motion.clock.elapsedMs), states = new Map(all.map(s => [s.id,s]));
    for (const step of passes) {
      const state = states.get(step.id), group = groups.current.get(step.id);
      if (!group) continue;
      group.visible = !!state && state.pressed > 0;
      if (!state) continue;
      const index = program.stocks.indexOf(state.stock);
      // bandingAt의 stock은 program 배열의 원본 객체다.
      applyStockDisplayPose(group, state.stock.size, layout ? state.stock.sourceOrigin ?? state.stock.position : pose.positions[index], layout ? 0 : pose.angles[index], layout ? 0 : pose.flips[index]);
      const {stock,band}=state, [w,h,t]=stock.size;
      const clipped = bandTapeRange(state, all);
      const range = (a:number,b:number,height:number,z:number,mesh:Mesh|undefined) => {
        if(!mesh)return;
        // 뒤 공정 프리밀링에 잘린 앞 공정 테이프는 그 순간부터 남기지 않는다.
        if (clipped.start > 0) a = Math.max(a, clipped.start);
        if (clipped.end < state.length) b = Math.min(b, clipped.end);
        mesh.visible=b>a;
        const center=(a+b)/2, length=Math.max(.0001,b-a), d=band.thickness;
        if(band.edge==='bottom'||band.edge==='top') {
          mesh.position.set(band.edge==='bottom'?w-center:center,band.edge==='bottom'?d/2:h-d/2,z);
          mesh.scale.set(length,d,height);
        } else {
          mesh.position.set(band.edge==='left'?d/2:w-d/2,band.edge==='right'?h-center:center,z);
          mesh.scale.set(d,length,height);
        }
      };
      const finish = strips.current.get(`${step.id}-finish`);
      if (finish) {
        const geometry = tapeMachining.geometry(state, all, motion.clock.elapsedMs);
        finish.visible = !!geometry?.getAttribute('position').count;
        if (geometry) { finish.geometry = geometry; finish.position.set(0,0,0); finish.scale.set(1,1,1); }
      }
      range(state.trimmed,state.pressed,t+6,t/2,strips.current.get(`${step.id}-rough`));
      range(state.frontCut?0:-3,0,t+6,t/2,strips.current.get(`${step.id}-front`));
      range(state.length,state.backCut||state.pressed<state.length?state.length:state.length+3,t+6,t/2,strips.current.get(`${step.id}-rear`));
    }
  };
  useLayoutEffect(update,[motion,layout,program,tapeMachining,passes]); useFrame(update);
  return <group name="applied-edge-tape">{passes.map(step=>{
    const stock=program.stocks.find(s=>s.id===step.stockId)!,band=stock.edgeBands![step.bandIndex];
    return <group key={step.id} name={`tape-${step.id}`} visible={false} ref={node=>{if(node)groups.current.set(step.id,node);else groups.current.delete(step.id);}}>
      {['finish','rough','front','rear'].map(part=><mesh key={part} name={`tape-${step.id}-${part}`} visible={false} ref={node=>{const key=`${step.id}-${part}`;if(node)strips.current.set(key,node);else strips.current.delete(key);}} castShadow receiveShadow>
        <boxGeometry args={[1,1,1]} /><meshStandardMaterial color={band.color} roughness={.38} />
      </mesh>)}
    </group>;
  })}</group>;
}
