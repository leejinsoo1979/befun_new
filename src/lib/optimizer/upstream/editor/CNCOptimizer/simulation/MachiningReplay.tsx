import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Pause, Play, RotateCcw, SkipBack, SkipForward, Box, Clapperboard, ChevronDown, PanelRightClose, PanelRightOpen, Volume2, VolumeX } from 'lucide-react';
import * as THREE from 'three';
import { useTheme } from '@/lib/optimizer/upstream/contexts/ThemeContext';
import { cursorAt, ReplayClock, validateProgram, type MachiningProgram, type Point3, type ReplayTool } from './program';
import { RemovalReplay } from './removal';
import { flutedToolGeometry, sawPlateGeometry } from './toolGeometry';
import { replayPose } from './replayPose';
import { MachineAssembly, SawArbor, SawDrive, SpindleHolder } from './MachineAssembly';
import styles from './MachiningReplay.module.css';
import { useReplayPanels } from './useReplayPanels';
import ReplayLayout from './ReplayLayout';
import { PanelSawAssembly } from './PanelSawAssembly';
import type { OptimizedResult } from '../types';
import { replayCameraFrame, blendCameraFrame, cameraNearPlane, followCameraTranslation, type CameraFrame, type ReplayView } from './replayCamera';
import { ReplayMotion, updateStockMotion } from './replayMotion';
import { rotaryAppearance, sawRotationEnvelope } from './rotaryAppearance';
import { EdgeBanderAssembly, ReplayEdgeBands } from './EdgeBanderAssembly';
import { bandingAt } from './edgeBandingProcess';
import { replayPhases } from './replayPhases';
import { lookTexture, sheetUv, stockLooks } from './replayAppearance';
import { useCncSfxStore, useMachiningSfx } from './machiningSfx';

interface ReplayProps {
  program: MachiningProgram;
  autoPlay?: boolean;
  onComplete?: () => void;
  layoutResult?: OptimizedResult;
  playbackSpeed?: number;
  onPlaybackSpeedChange?: (speed: number) => void;
  suspended?: boolean;
}

type ViewRequest = { kind: ReplayView; serial: number };
export function ViewControls({ extent, request, program, pose, motion, suspended, onManual, onReady }: {
  extent: number; request: ViewRequest; program: MachiningProgram; pose: ReturnType<typeof replayPose>;
  motion?: ReplayMotion; suspended: boolean; onManual: () => void; onReady?: () => void;
}) {
  const { camera, gl, invalidate, size } = useThree();
  const controls = useRef<OrbitControls | undefined>(undefined);
  const allowAutomatic = useRef(true), initialized = useRef(false);
  const manual = useRef(onManual); manual.current = onManual;
  const goal = useRef<CameraFrame | undefined>(undefined);
  const previousTracking = useRef<{ stockId: string; target: Point3 } | undefined>(undefined);
  goal.current = replayCameraFrame(program, pose, request.kind, size.width / Math.max(1, size.height));
  useEffect(() => {
    camera.up.set(0, 0, 1);
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.minDistance = 30; orbit.maxDistance = extent * 12;
    const onChange = () => invalidate();
    const onStart = () => {
      // OrbitControls의 실제 포인터/휠 진입에서 동기적으로 추적을 놓는다.
      allowAutomatic.current = false; orbit.enableDamping = true; manual.current();
    };
    controls.current = orbit;
    orbit.addEventListener('change', onChange); orbit.addEventListener('start', onStart);
    onReady?.();
    return () => { orbit.removeEventListener('change', onChange); orbit.removeEventListener('start', onStart); orbit.dispose(); controls.current = undefined; initialized.current = false; };
  }, [camera, gl, extent, invalidate, onReady]);
  useEffect(() => {
    allowAutomatic.current = true; previousTracking.current = undefined;
    if (controls.current) controls.current.enableDamping = false;
    invalidate();
  }, [request, invalidate]);
  useFrame((_, delta) => {
    if (motion) goal.current = replayCameraFrame(program, motion.pose(), request.kind, size.width / Math.max(1, size.height));
    const orbit = controls.current, target = goal.current;
    if (!orbit || !target) return;
    if (allowAutomatic.current && !suspended) {
      let current: CameraFrame = { target: orbit.target.toArray() as Point3, offset: camera.position.clone().sub(orbit.target).toArray() as Point3, label: target.label };
      const step = motion?.pose().step;
      const tracking = motion?.clock.playing && request.kind === 'cinematic' && step?.station === 'edgebander'
        && (step.kind === 'position' || step.kind === 'turn');
      if (tracking && previousTracking.current?.stockId === step.stockId) {
        current = followCameraTranslation(current, previousTracking.current.target, target.target);
      }
      previousTracking.current = tracking ? { stockId: step.stockId, target: target.target } : undefined;
      const error = new THREE.Vector3(...target.target).distanceTo(orbit.target) + new THREE.Vector3(...target.offset).distanceTo(new THREE.Vector3(...current.offset));
      const next = !initialized.current || error < .1 ? target : blendCameraFrame(current, target, delta);
      initialized.current = true;
      orbit.target.set(...next.target); camera.position.set(...next.target).add(new THREE.Vector3(...next.offset));
      if (error >= .1) invalidate();
    }
    if (camera instanceof THREE.PerspectiveCamera) {
      // mm 장면에서 near=.5 고정은 멀리 볼 때 수 mm 떨어진 면도 같은 깊이로 양자화한다.
      const near = cameraNearPlane(camera.position.distanceTo(orbit.target));
      if (Math.abs(camera.near - near) > .01) { camera.near = near; camera.updateProjectionMatrix(); }
    }
    orbit.update();
  });
  return null;
}

/** 위치는 공정 시계, 회전 잔상은 화면 시계를 사용해 배속 변경의 회전 깜빡임을 막는다. */
export const RotaryTool = React.memo(function RotaryTool({ tool, motion }: { tool: ReplayTool; motion: ReplayMotion }) {
  const root = useRef<THREE.Group>(null);
  const rotating = useRef<THREE.Group>(null);
  const detailed = useRef<THREE.Group>(null), blurred = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const envelope = useMemo(() => tool.kind === 'saw' && tool.appearance
    ? sawRotationEnvelope(tool.diameter, tool.kerf, tool.appearance.boreDiameter, tool.appearance.gulletDepth) : null, [tool]);
  useEffect(() => () => { envelope?.body.dispose(); envelope?.rim.dispose(); }, [envelope]);
  const cuttingGeometry = useMemo(() => {
    if (tool.kind === 'drill' && tool.appearance && tool.tipLength === 0) return flutedToolGeometry({ ...tool.appearance, diameter: tool.diameter, length: tool.length });
    if (tool.kind === 'saw' && tool.appearance) return sawPlateGeometry(tool.diameter, tool.kerf, tool.teeth, tool.appearance.boreDiameter, tool.appearance.gulletDepth);
    return null;
  }, [tool]);
  useEffect(() => () => cuttingGeometry?.dispose(), [cuttingGeometry]);
  useFrame((_, delta) => {
    const pose = motion.pose();
    if (!root.current || !pose.position) return;
    root.current.position.set(...pose.position);
    if (tool.kind === 'saw') root.current.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(pose.direction[1], pose.direction[0]) - Math.PI / 2);
    else root.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...pose.direction));
    const frame = rotaryAppearance(phase.current, tool.rpm, tool.kind === 'saw' ? tool.teeth : 2, delta, motion.clock.playing);
    phase.current = frame.phase;
    if (rotating.current) rotating.current.rotation.y = frame.phase;
    if (detailed.current) detailed.current.visible = !envelope || !frame.blurred;
    if (blurred.current) blurred.current.visible = !!envelope && frame.blurred;
  });
  return <group ref={root}>
    {tool.kind === 'drill' ? <SpindleHolder tool={tool} /> : <SawDrive tool={tool} />}
    <group ref={rotating}>
      {tool.kind === 'saw' && <SawArbor tool={tool} />}
      <group ref={detailed} name="rotary-tool-detail">
      {cuttingGeometry ? <mesh geometry={cuttingGeometry} castShadow><meshStandardMaterial color="#b9c3cc" metalness={0.95} roughness={0.24} /></mesh> : tool.kind === 'saw' ? <>
        <mesh castShadow><cylinderGeometry args={[tool.diameter / 2, tool.diameter / 2, tool.kerf, 96]} /><meshStandardMaterial color="#bac4cc" metalness={0.95} roughness={0.19} /></mesh>
      </> : <>
        <mesh position={[0, -(tool.length + tool.tipLength) / 2, 0]} castShadow><cylinderGeometry args={[tool.diameter / 2, tool.diameter / 2, tool.length - tool.tipLength, 48]} /><meshStandardMaterial color="#b8bbc0" metalness={0.95} roughness={0.19} /></mesh>
        {tool.tipLength > 0 && <mesh position={[0, -tool.tipLength / 2, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[tool.diameter / 2, tool.tipLength, 48]} /><meshStandardMaterial color="#b8bbc0" metalness={0.95} roughness={0.19} /></mesh>}
      </>}
      </group>
      {envelope && <group ref={blurred} name="rotary-tool-blur" visible={false}>
        <mesh geometry={envelope.body} castShadow><meshStandardMaterial color="#b9c3cc" metalness={.9} roughness={.36} /></mesh>
        <mesh geometry={envelope.rim}><meshStandardMaterial color="#b9c3cc" metalness={.8} roughness={.42} transparent opacity={.58} depthWrite={false} /></mesh>
      </group>}
    </group>
  </group>;
});

/**
 * 판재 모서리 윤곽선 — 절삭 형상이 바뀐 프레임에만 다시 만든다(부모 메시의 geometry 가 바뀌었는지로 본다).
 * 흰 작업대·밝은 판재가 겹치는 구도에서 판재 경계와 톱길·홈 모서리를 읽게 한다. 형상·치수는 건드리지 않는다.
 */
function StockEdges() {
  const lines = useRef<THREE.LineSegments>(null);
  const last = useRef<THREE.BufferGeometry | null>(null);
  useFrame(() => {
    const line = lines.current, parent = line?.parent as THREE.Mesh | null | undefined;
    if (!line || !parent?.geometry || parent.geometry === last.current) return;
    last.current = parent.geometry;
    const old = line.geometry;
    line.geometry = new THREE.EdgesGeometry(parent.geometry, 28);
    old.dispose();
  });
  useEffect(() => () => { lines.current?.geometry.dispose(); }, []);
  return <lineSegments ref={lines} name="replay-stock-edges" raycast={() => null}>
    <lineBasicMaterial color="#262b30" transparent opacity={.5} depthWrite={false} />
  </lineSegments>;
}

/** 외형을 바꾸지 않고 절삭으로 노출된 내부만 목재 단면 색으로 구분한다. */
function materialGroups(g: THREE.BufferGeometry, size: Point3, origin: Point3 = [0, 0, 0]) {
  const p = g.getAttribute('position'), old = g.getIndex(), faces: number[][] = [[], []];
  const count = old?.count ?? p.count, eps = Math.max(...size) * 1e-6;
  for (let i = 0; i < count; i += 3) {
    const ids = [0, 1, 2].map(j => old ? old.getX(i + j) : i + j);
    const outer = [0, 1, 2].some(axis => [0, size[axis]].some(bound => ids.every(id => Math.abs(p.getComponent(id, axis) + origin[axis] - bound) < eps)));
    faces[outer ? 0 : 1].push(...ids);
  }
  g.setIndex(faces.flat()); g.clearGroups();
  if (faces[0].length) g.addGroup(0, faces[0].length, 0);
  if (faces[1].length) g.addGroup(faces[0].length, faces[1].length, 1);
  return g;
}

export const ReplayScene = React.memo(function ReplayScene({ program, clock, replay, view, machineVisible, cutaway, cameraSuspended, onManual, fixedFrame = false, onCameraReady }: { program: MachiningProgram; clock: ReplayClock; replay: RemovalReplay; view: ViewRequest; machineVisible: boolean; cutaway: boolean; cameraSuspended: boolean; onManual: () => void; seekTime?: number; fixedFrame?: boolean; onCameraReady?: () => void }) {
  const { theme } = useTheme();
  const sceneBackground = theme.mode === 'dark' ? '#242424' : '#ededea';
  const elapsedMs = clock.elapsedMs;
  const [, redrawGeometry] = useReducer(n => n + 1, 0);
  const lastGeometryFrame = useRef(-Infinity);
  const motion = useMemo(() => new ReplayMotion(program, clock), [program, clock]);
  // 판재 겉면 = 실제 설계 재질(재질 선택창의 같은 견본 색·실물 타일 그림). 정보가 없으면 종전 표시색
  const looks = useMemo(() => stockLooks(program), [program]);
  /** 절삭 형상 → (그림이 있으면 원장 좌표 UV) → 겉면/단면 두 재질 칸. 입력 형상은 여기서 넘겨받아 해제한다 */
  const shaped = (stock: MachiningProgram['stocks'][number], g: THREE.BufferGeometry) => {
    const look = looks.get(stock.id);
    if (look?.texture) { const uv = sheetUv(g, look.texture.tileMm, stock.sourceOrigin); g.dispose(); g = uv; }
    return materialGroups(g, stock.sourceSize ?? stock.size, stock.sourceOrigin);
  };
  const stockMeshes = useRef<Array<THREE.Mesh | null>>([]);
  const movingGeometries = useRef(new Map<number, THREE.BufferGeometry>());
  const pose = replayPose(program, elapsedMs);
  const renderedStep = useRef(pose.cursor.index);
  const { station, visible, position: toolPosition, tool } = pose;
  // React의 오래된 렌더 시각으로 프레임 이동을 덮어쓰지 않는다. 새 메시/seek도 같은 pose로 배치한다.
  useLayoutEffect(() => { updateStockMotion(motion, stockMeshes.current, view.kind === 'layout'); });
  useFrame(() => {
    const current = motion.pose();
    updateStockMotion(motion, stockMeshes.current, view.kind === 'layout');
    // 공구/판재의 등장·퇴장은 단계 경계에서만 React에 반영한다.
    if (!fixedFrame && renderedStep.current !== current.cursor.index) {
      renderedStep.current = current.cursor.index; redrawGeometry();
    }
    const now = performance.now();
    if (!fixedFrame && !replay.disposed && clock.playing && now - lastGeometryFrame.current >= 32 && (current.step?.kind === 'saw' || current.step?.kind === 'drill' || current.step?.kind === 'mill' || current.step?.kind === 'band')) {
      lastGeometryFrame.current = now;
      const stockIds = current.step.kind === 'band'
        ? bandingAt(program, clock.elapsedMs).filter(s => s.active && s.millCenter > -40).map(s => s.stock.id)
        : [current.step.stockId];
      // 한 이송 단계의 후속 판재도 실제 프리밀링 진행 중에 형상을 갱신한다.
      for (const stockId of stockIds) {
        const i = program.stocks.findIndex(stock => stock.id === stockId), stock = program.stocks[i], mesh = stockMeshes.current[i];
        if (mesh) {
          const next = shaped(stock, replay.geometry(stock.id, clock.elapsedMs));
          mesh.geometry = next;
          movingGeometries.current.get(i)?.dispose(); movingGeometries.current.set(i, next);
        }
      }
    }
  });
  const size = program.stocks[0].size;
  const disposed = replay.disposed;
  // 이동·회전 중에는 직전 절삭 끝의 형상을 재사용한다.
  let materialTime = 0, stepTime = 0;
  for (const s of program.steps) {
    if (stepTime > elapsedMs) break;
    if (s.kind === 'saw' || s.kind === 'drill' || s.kind === 'mill' || s.kind === 'band') materialTime = Math.min(elapsedMs, stepTime + s.durationMs);
    stepTime += s.durationMs;
  }
  const geometries = useMemo(() => {
    // Fast Refresh/프로그램 교체에서 Canvas가 이전 effect 정리 뒤 한 번 더 렌더할 수 있다.
    if (disposed) return [];
    const pose = replayPose(program, materialTime);
    return program.stocks.map((s, i) => pose.visible[i] ? shaped(s, replay.geometry(s.id, materialTime)) : null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, replay, disposed, materialTime, looks]);
  useLayoutEffect(() => {
    const moving = movingGeometries.current;
    return () => { geometries.forEach(g => g?.dispose()); moving.forEach(g => g.dispose()); moving.clear(); };
  }, [geometries]);
  const extent = Math.max(600, ...program.stocks.map(s => Math.max(s.size[0], s.size[1])));
  return <>
    <color attach="background" args={[sceneBackground]} />
    <Environment files="/hdri/studio_small_09.hdr" environmentIntensity={0.8} />
    <ambientLight intensity={0.3} />
    <hemisphereLight args={['#e6f0ff', '#45505b', .8]} />
    <directionalLight position={[extent, -extent / 2, extent * 2]} intensity={2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-extent * 2} shadow-camera-right={extent * 2} shadow-camera-top={extent * 2} shadow-camera-bottom={-extent * 2} shadow-camera-near={1} shadow-camera-far={extent * 6} shadow-bias={-0.0001} shadow-normalBias={2} shadow-radius={2} />
    {machineVisible && view.kind !== 'layout' && (station === 'edgebander' && program.setup?.bander ? <EdgeBanderAssembly program={program} motion={motion} cutaway={cutaway} /> : program.setup && station === 'saw' ? <PanelSawAssembly program={program} motion={motion} cutaway={cutaway} /> : <group position={program.setup?.routerOrigin ?? [0, 0, 0]}><MachineAssembly size={size} tool={tool} motion={motion} flatBed={!!program.setup} /></group>)}
    {machineVisible && view.kind !== 'layout' && station !== 'edgebander' && toolPosition && tool && (!program.setup || (station === 'saw' ? tool.kind === 'saw' : tool.kind === 'drill')) && <RotaryTool tool={tool} motion={motion} />}
    {/* 기계 앞 상판은 PanelSawAssembly만 그린다. 대기대는 기계 옆의 별도 영역이다. */}
    {machineVisible && view.kind !== 'layout' && program.setup?.stagingTables?.map((table, i) =>
      <mesh key={i} position={[table.position[0] + table.size[0] / 2, table.position[1] + table.size[1] / 2, -26]} receiveShadow>
        <boxGeometry args={[table.size[0] + 40, table.size[1] + 40, 48]} /><meshStandardMaterial color="#626d74" roughness={.7} />
      </mesh>)}
    <mesh position={[size[0] / 2, size[1] / 2, -435]} receiveShadow><planeGeometry args={[extent * 12, extent * 12]} /><shadowMaterial transparent opacity={theme.mode === 'dark' ? .2 : .12} /></mesh>
    {/* 배치도는 Y가 아래로 증가한다. 대조 화면만 같은 방향으로 보여 주며 가공 좌표는 보존한다. */}
    <group position={[0, view.kind === 'layout' ? size[1] : 0, 0]} scale={[1, view.kind === 'layout' ? -1 : 1, 1]}>
    {program.stocks.map((stock, i) => visible[i] && geometries[i] && <mesh name={`replay-stock-${stock.id}`} ref={mesh => { stockMeshes.current[i] = mesh; }} key={stock.id} geometry={geometries[i]!} castShadow receiveShadow>
      <meshStandardMaterial attach="material-0" color={looks.get(stock.id)?.color ?? stock.color} map={looks.get(stock.id)?.texture ? lookTexture(looks.get(stock.id)!.texture!.url) : null} roughness={0.65} />
      <meshStandardMaterial attach="material-1" color="#b79769" roughness={0.88} />
      <StockEdges />
    </mesh>)}
    {program.setup?.bander && <ReplayEdgeBands motion={motion} layout={view.kind === 'layout'} />}
    </group>
    <ViewControls onReady={onCameraReady} extent={extent} request={view} program={program} pose={pose} motion={motion} suspended={cameraSuspended} onManual={onManual} />
  </>;
});

function Replay({ program, autoPlay = false, onComplete, layoutResult, playbackSpeed, onPlaybackSpeedChange, suspended = false }: ReplayProps) {
  const panels = useReplayPanels();
  const sidebarId = useId();
  const [replay, setReplay] = useState<RemovalReplay | null>(null);
  useEffect(() => {
    const resource = new RemovalReplay(program); setReplay(resource);
    return () => resource.dispose();
  }, [program]);
  const total = program.steps.reduce((v, s) => v + s.durationMs, 0);
  const clock = useMemo(() => new ReplayClock(program.steps.reduce((sum, step) => sum + step.durationMs, 0)), [program]);
  const [view, setView] = useState<ViewRequest>({ kind: 'cinematic', serial: 0 });
  const [cameraSuspended, setCameraSuspended] = useState(false);
  const onManual = useCallback(() => setCameraSuspended(true), []);
  const [machineVisible, setMachineVisible] = useState(true);
  const [cutaway, setCutaway] = useState(true);
  const [time, setTime] = useState(0), [playing, setPlaying] = useState(autoPlay), [localSpeed, setLocalSpeed] = useState(1);
  const speed = playbackSpeed ?? localSpeed;
  useEffect(() => { clock.setSpeed(speed); }, [clock, speed]);
  useEffect(() => { setTime(0); setPlaying(autoPlay); setCameraSuspended(false); setView(v => ({ kind: 'cinematic', serial: v.serial + 1 })); }, [program, autoPlay]);
  useEffect(() => { if (suspended) { clock.pause(); setPlaying(false); setTime(clock.elapsedMs); } }, [suspended, clock]);
  useMachiningSfx(program, clock, playing && !suspended);   // 가공 효과음(마마 지시 2026-09-28)
  const sfxMuted = useCncSfxStore(s => s.muted), setSfxMuted = useCncSfxStore(s => s.setMuted);
  const completeRef = useRef(onComplete); completeRef.current = onComplete;
  useEffect(() => {
    let frame = 0, lastRender = -Infinity;
    if (playing) clock.play(); else clock.pause();
    const animate = (now: number) => {
      const next = clock.tick(now);
      // 숫자·작업 목록/SVG는 10Hz. 3D 이동은 화면 프레임, 절삭 형상은 Scene에서 별도로 갱신한다.
      if (now - lastRender >= 100 || !clock.playing) { setTime(next); lastRender = now; }
      if (clock.playing) frame = requestAnimationFrame(animate); else { setPlaying(false); if (next >= total) completeRef.current?.(); }
    };
    if (playing) frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); clock.pause(); };
  }, [clock, playing, total]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { clock.pause(); setPlaying(false); setTime(clock.elapsedMs); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [clock]);
  const cursor = cursorAt(program, time), current = program.steps[cursor.index];
  const currentStepRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { currentStepRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); }, [cursor.index]);
  const pose = replayPose(program, time);
  const changeView = (kind: ViewRequest['kind']) => { setCameraSuspended(false); setView(v => ({ kind, serial: v.serial + 1 })); };
  const cameraLabel = cameraSuspended ? '직접 보기' : replayCameraFrame(program, pose, view.kind, 1).label;
  const { phases, offsets } = useMemo(() => replayPhases(program), [program]);
  const phase = phases.find(p => cursor.index >= p.first && cursor.index < p.end) ?? phases.at(-1);
  const seek = (ms: number) => { clock.pause(); setPlaying(false); clock.seek(ms); setTime(clock.elapsedMs); };
  const extent = Math.max(600, ...program.stocks.map(s => Math.max(s.size[0], s.size[1])));
  return <section className={styles.root} aria-label="3D 가공 재생">
    {!layoutResult && <div className={styles.header}><strong>가공 시뮬레이션</strong><span>{program.source.machineModel} · {program.source.label}</span></div>}
    <div className={styles.phaseBar}>
    <nav className={styles.phases} aria-label="가공 공정">
      {phases.map((p, i) => <button key={p.first} aria-current={p === phase ? 'step' : undefined}
        onClick={() => seek(p.startMs)}><span className={styles.phaseNumber}>{i + 1}</span>{p.label}
        <small>{p.end - p.first}단계</small></button>)}
    </nav>
      <button className={styles.panelToggle} onClick={panels.toggle} aria-expanded={panels.open} aria-controls={sidebarId}
        aria-label={panels.open ? '우측 패널 접기' : '우측 패널 펼치기'} title={panels.open ? '우측 패널 접기' : '우측 패널 펼치기'}>
        {panels.open ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}<span>패널 레이아웃</span>
      </button>
    </div>
    <div ref={panels.contentRef} className={`${styles.content} ${panels.dragging ? styles.resizing : ''}`}
      style={{ gridTemplateColumns: panels.open ? `minmax(0, ${100 - panels.width}fr) 8px minmax(0, ${panels.width}fr)` : 'minmax(0, 1fr)' }}>
      <div className={styles.viewport}>
        <Canvas frameloop={playing ? 'always' : 'demand'} shadows camera={{ position: [extent * 1.7, -extent * 1.4, extent * 1.25], up: [0, 0, 1], near: 0.5, far: extent * 15, fov: 40 }} dpr={[1, 1.5]}>{replay?.program === program && <ReplayScene program={program} clock={clock} seekTime={playing ? undefined : time} replay={replay} view={view} machineVisible={machineVisible} cutaway={cutaway} cameraSuspended={cameraSuspended} onManual={onManual} />}</Canvas>
        <div className={styles.viewportBar}>
          <div className={styles.viewTools} role="group" aria-label="카메라 보기">
            <button className={styles.cinematicButton} onClick={() => changeView('cinematic')} aria-pressed={view.kind === 'cinematic' && !cameraSuspended}><Clapperboard size={16} />{cameraSuspended ? '자동 카메라 재개' : '시네마틱'}</button>
            <button onClick={() => changeView('machine')} aria-pressed={view.kind === 'machine' && !cameraSuspended} title="기계 전체"><Box size={15} />전체</button>
            <details className={styles.cameraMenu}><summary>상세 보기<ChevronDown size={13} /></summary><div>
              <button onClick={() => changeView('stock')} aria-pressed={view.kind === 'stock'}>판재 확대</button>
              <button onClick={() => changeView('top')} aria-pressed={view.kind === 'top'}>평면</button>
              {program.layoutAudit && <button onClick={() => changeView('layout')} aria-pressed={view.kind === 'layout'}>배치 대조</button>}
              {program.layoutAudit && <button onClick={() => { seek(total); changeView('layout'); }}>완료 판재 보기</button>}
              <button onClick={() => changeView('tool')} aria-pressed={view.kind === 'tool'} disabled={!pose.position}>공구 확대</button>
            </div></details>
          </div>
          <label className={styles.machineToggle}><input type="checkbox" checked={machineVisible} onChange={e => setMachineVisible(e.target.checked)} />기계 표시</label>
          <button className={styles.machineToggle} onClick={() => setSfxMuted(!sfxMuted)} aria-label={sfxMuted ? '가공 효과음 켜기' : '가공 효과음 끄기'} title={sfxMuted ? '효과음 켜기' : '효과음 끄기'}>{sfxMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}효과음</button>
          {program.setup && <label className={styles.machineToggle}><input type="checkbox" checked={cutaway} onChange={e => setCutaway(e.target.checked)} />가공부 투시</label>}
        </div>
        <div className={styles.cameraStatus} aria-label="카메라 상태"><span className={!cameraSuspended && view.kind === 'cinematic' ? styles.autoIndicator : ''} />{view.kind === 'cinematic' && !cameraSuspended ? '자동 · ' : ''}{cameraLabel}</div>
        {program.layoutAudit && <div className={styles.pieceCount} aria-label="재단 완료 판재 수">재단 완료 {program.stocks.filter((s, i) => s.purpose === 'panel' && pose.visible[i]).length} / {program.layoutAudit.panelPieces?.length ?? 0}개{view.kind === 'layout' && ' · 원래 배치로 대조'}</div>}
        <div className={styles.stockSize} aria-label="원장 치수">{program.stocks[0].name} · {program.stocks[0].size.map(v => v.toLocaleString()).join(' × ')} mm</div>
        <div className={styles.coordinates} aria-label="공구 좌표">
          <small>판재 기준 · mm</small>{['X', 'Y', 'Z'].map((axis, i) => <span key={axis}><b>{axis}</b><output>{pose.local ? pose.local[i].toFixed(2) : '—'}</output></span>)}
        </div>
        <div className={styles.caption}><strong>{(view.kind === 'layout' ? '원본 배치 대조 · 현재까지 절단된 실제 형상' : current?.label) ?? (program.layoutAudit?.uncutEdges.length ? '목록 재생 종료 · 추가 재단 필요' : '가공 재생 완료')}</strong><span>{view.kind === 'cinematic' && !cameraSuspended ? '공정에 따라 자동 전환 · 드래그하면 직접 보기' : '드래그로 회전 · 스크롤로 확대'}</span></div>
      </div>
      <div hidden={!panels.open} className={styles.divider} role="separator" tabIndex={panels.open ? 0 : -1}
        aria-label="좌우 화면 크기 조절" aria-orientation="vertical" aria-controls={sidebarId}
        aria-valuemin={Math.round(100 - panels.max)} aria-valuemax={Math.round(100 - panels.min)} aria-valuenow={Math.round(100 - panels.width)}
        aria-valuetext={`왼쪽 ${Math.round(100 - panels.width)}%, 오른쪽 ${Math.round(panels.width)}%`}
        title="드래그 또는 방향키로 폭 조절 · 두 번 클릭하면 기본 폭" {...panels.dividerProps}><span /></div>
      <aside id={sidebarId} hidden={!panels.open} className={styles.sidebar}>
        {program.stocks[0].layout && <ReplayLayout program={program} time={time} result={layoutResult} clock={clock} />}
        <details className={styles.steps} open={program.stocks[0].layout ? undefined : true}><summary className={styles.listTitle}>{phase?.label ?? '작업'} 순서 <span>{Math.min(cursor.index + 1, program.steps.length)} / {program.steps.length}</span></summary><ol>
        {program.steps.slice(phase?.first ?? 0, phase?.end).map((step, n) => { const i = (phase?.first ?? 0) + n; return <li key={step.id}><button ref={i === cursor.index ? currentStepRef : undefined} aria-current={i === cursor.index ? 'step' : undefined} onClick={() => seek(offsets[i])}><span className={styles.order}>{i + 1}</span><span>{step.label}<small>{program.stocks.find(s => s.id === step.stockId)?.name} · {(step.durationMs / 1000).toFixed(1)}초</small></span></button></li>; })}
      </ol></details><div className={styles.toolCard} aria-label="현재 공구">
        <small>현재 공구</small><strong>{pose.station === 'edgebander' ? '엣지밴더 · 연속 접착·마감' : pose.tool?.id ?? '공구 없음'}</strong>
        <dl><dt>지름</dt><dd>{pose.tool ? `Ø ${pose.tool.diameter} mm` : '—'}</dd><dt>회전수</dt><dd>{pose.tool ? `${pose.tool.rpm.toLocaleString()} rpm` : '—'}</dd>
        <dt>{pose.tool?.kind === 'saw' ? '절단 폭' : '가공 깊이'}</dt><dd>{pose.tool?.kind === 'saw' ? `${pose.tool.kerf} mm` : pose.step?.kind === 'mill' ? `${pose.step.depth} mm` : pose.step?.kind === 'drill' ? `${(pose.step.depth * cursor.progress).toFixed(2)} / ${pose.step.depth} mm` : '—'}</dd></dl>
        </div></aside>
    </div>
    <div className={styles.footer}>
      <input aria-label="가공 진행 위치" type="range" min={0} max={total} step={1} value={time} style={{ background: `linear-gradient(to right, var(--theme-primary) ${total ? time / total * 100 : 0}%, var(--theme-border) 0%)` }} onChange={e => seek(Number(e.target.value))} />
      <div className={styles.transport}>
        <button aria-label="처음으로" onClick={() => seek(0)}><RotateCcw size={18} /></button>
        <button aria-label="이전 단계" onClick={() => seek(offsets[Math.max(0, cursor.index - 1)] ?? 0)}><SkipBack size={18} /></button>
        <button className={styles.play} aria-label={playing ? '일시정지' : '재생'} onClick={() => { if (playing) { clock.pause(); setTime(clock.elapsedMs); } setPlaying(!playing); }}>{playing ? <Pause size={21} /> : <Play size={21} />}</button>
        <button aria-label="다음 단계" onClick={() => seek(offsets[cursor.index + 1] ?? total)}><SkipForward size={18} /></button>
        <output aria-label="재생 시간">{(time / 1000).toFixed(1)} / {(total / 1000).toFixed(1)}초</output>
        <label>재생 속도 <select value={speed} onChange={e => { const value = Number(e.target.value); clock.setSpeed(value); setLocalSpeed(value); onPlaybackSpeedChange?.(value); }}>{[0.25, 0.5, 1, 2, 4, 8, 16].map(s => <option key={s} value={s}>{s}×</option>)}</select></label>
      </div>
    </div>
  </section>;
}

export default function MachiningReplay({ program, ...props }: ReplayProps) {
  const errors = useMemo(() => validateProgram(program), [program]);
  if (errors.length) return <div role="alert">가공 경로를 재생할 수 없습니다.<ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>;
  return <Replay program={program} {...props} />;
}
