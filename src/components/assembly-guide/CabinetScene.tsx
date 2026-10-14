'use client';

import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type RefObject } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Edges, Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Box3, DirectionalLight, Euler, Group, PerspectiveCamera, Quaternion, TextureLoader, Vector3 } from 'three';
import { cabinetPartPose, type CabinetPart, type CabinetPlan, type CabinetState, type CabinetPhase } from '@/lib/assembly-guide/cabinet';
import { birchEdgeTexture } from '@/lib/assembly-guide/panelMaterials';
import { befunColorLook } from '@/lib/optimizer/befun/colors';
import { cabinetFilmShot } from '@/lib/assembly-guide/cabinetFilm';
import { cabinetRender, cabinetShadowBounds } from '@/lib/assembly-guide/cabinetRender';
import { cabinetDoorHinge, cabinetHingeTarget, isCabinetDoor } from '@/lib/assembly-guide/cabinetDoor';
import { CabinetPanel } from './CabinetPanel';
import { createCameraRig, updateCameraRig } from './cameraRig';
import { GuideEnvironment } from './GuideEnvironment';
import styles from './cabinet.module.css';

export type CabinetView = 'overview' | 'part' | 'joint';
interface Props {
  plan: CabinetPlan; state: RefObject<CabinetState>; preview: boolean; inside: boolean; doorOpen: boolean;
  step: number; phase: CabinetPhase;
  view: CabinetView; revision: number; onTick: (seconds: number) => void;
  cinematic: boolean; reducedMotion: boolean;
  onSelect: (id: string) => void; onPlace: () => void; onLost: () => void;
}

const Part = memo(function Part({ part, plan, state, preview, inside, doorOpen, finish, onSelect }: {
  part: CabinetPart; plan: CabinetPlan; state: RefObject<CabinetState>; preview: boolean; inside: boolean; doorOpen: boolean; finish: string; onSelect: (id: string) => void;
}) {
  const root = useRef<Group>(null), label = useRef<HTMLButtonElement>(null);
  const rotation = useMemo(() => new Quaternion().setFromEuler(new Euler(...part.animation.rotation)), [part]);
  const identity = useMemo(() => new Quaternion(), []);
  const labelAt: [number, number, number] = [0, 0, 0];
  labelAt[part.box.frame.n] = (part.box.frame.n === 2 ? -1 : 1) * ([part.box.w, part.box.h, part.box.d][part.box.frame.n] * 5 + 18);
  useFrame(() => {
    const pose = cabinetPartPose(part, state.current, preview);
    root.current?.position.set(...pose.position.map(value => value * 10) as [number, number, number]);
    root.current?.quaternion.copy(rotation).slerp(identity, pose.rotationProgress);
    if (pose.tilt) root.current?.rotateX(pose.tilt);
    if (label.current) {
      const laidOut = !preview && part.number - 1 >= state.current.step && state.current.phase !== 'complete';
      label.current.style.visibility = !state.current.automatic && laidOut && (part.number - 1 !== state.current.step || !['placing', 'spring-press', 'spring-seat', 'spring-lock', 'check'].includes(state.current.phase) && !state.current.phase.startsWith('hinge-')) ? 'visible' : 'hidden';
      label.current.dataset.expected = String(part.number - 1 === state.current.step);
    }
  }, -.5);
  return <group ref={root} onClick={event => { event.stopPropagation(); if (!preview) onSelect(part.id); }}>
    <CabinetPanel part={part} plan={plan} inside={inside} finish={finish} state={state} preview={preview} doorOpen={doorOpen} />
    <Html position={labelAt} center zIndexRange={[3, 0]}>
      <button type="button" ref={label} className={styles.partNumber} aria-label={`${part.number}번 ${part.label} 선택`} onClick={() => onSelect(part.id)}>{String(part.number).padStart(2, '0')}</button>
    </Html>
  </group>;
});

function AssemblyWorld(props: Props) {
  const { plan, state, preview, view, inside, doorOpen, onSelect, onPlace, onTick, revision } = props;
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const light = useRef<DirectionalLight>(null);
  const shadow = useMemo(() => cabinetShadowBounds(plan), [plan]);
  useEffect(() => {
    const value = light.current;
    if (!value) return;
    value.target.position.set(...shadow.target);
    value.target.updateMatrixWorld();
    return () => value.shadow.dispose();
  }, [shadow]);
  const manual = useRef(false);
  const previous = useRef(-1);
  const cameraRig = useMemo(() => createCameraRig(), []);
  const focus = useMemo(() => ({ target: new Vector3(), q: new Quaternion(), identity: new Quaternion() }), []);
  const finished = props.phase === 'complete';
  const overviewBounds = useMemo(() => {
    const bounds = new Box3();
    for (const part of plan.parts) {
      const placed = preview || finished || part.number - 1 < props.step;
      const at = placed ? part.animation.anchor : part.animation.floor;
      const rotation = new Quaternion().setFromEuler(new Euler(...(placed ? [0, 0, 0] as const : part.animation.rotation)));
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
        bounds.expandByPoint(new Vector3(x * part.box.w * 5, y * part.box.h * 5, z * part.box.d * 5).applyQuaternion(rotation).add(new Vector3(...at).multiplyScalar(10)));
      }
    }
    return { center: bounds.getCenter(new Vector3()), radius: bounds.getSize(new Vector3()).length() * .5 };
  }, [plan, preview, props.step, finished]);
  const finish = befunColorLook(plan.design.color).surface;
  useFrame(({ camera, size }, seconds) => {
    onTick(seconds);
    const active = plan.parts[state.current.step];
    const key = revision * 100 + state.current.step + (state.current.phase === 'complete' ? 20 : 0) + (doorOpen ? 40 : 0);
    if (previous.current !== key) { manual.current = false; previous.current = key; }
    if (manual.current || !controls.current) return;
    if (props.cinematic) {
      const shot = cabinetFilmShot(plan, state.current, size.width / Math.max(1, size.height), props.reducedMotion);
      if (camera instanceof PerspectiveCamera && Math.abs(camera.fov - shot.fov) > .01) {
        camera.fov = shot.fov;
        camera.updateProjectionMatrix();
      }
      updateCameraRig(camera, controls.current, cameraRig, shot, key, seconds, true);
      return;
    }
    if (camera instanceof PerspectiveCamera && camera.fov !== 42) {
      camera.fov = 42;
      camera.updateProjectionMatrix();
    }
    let radius: number;
    if (view === 'overview') {
      const assembled = preview || state.current.phase === 'complete';
      if (assembled) {
        focus.target.set(0, plan.design.height * 5 + 10, plan.design.depth * 5);
        radius = Math.hypot(plan.design.width, plan.design.height, plan.design.depth) * 5 + 50;
        if (doorOpen) { radius *= 1.22; focus.target.setZ(focus.target.z + 100); }
      } else {
        focus.target.copy(overviewBounds.center);
        radius = overviewBounds.radius + 40;
      }
    } else {
      const pose = cabinetPartPose(active, state.current, preview);
      focus.target.set(...pose.position.map(value => value * 10) as [number, number, number]);
      if (view === 'joint' && isCabinetDoor(active)) {
        focus.target.copy(cabinetHingeTarget(plan, active, state.current.phase === 'hinge-bottom'));
        radius = 80;
      } else if (view === 'joint' && (active.hardware.length || active.pinCenters.length)) {
        focus.q.setFromEuler(new Euler(...active.animation.rotation)).slerp(focus.identity, pose.rotationProgress);
        focus.q.multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pose.tilt));
        const at = active.hardware[0]?.at ?? [active.pinCenters[0], active.box.h * 5, 0];
        focus.target.add(new Vector3(...at).applyQuaternion(focus.q));
        radius = 72;
      } else radius = Math.hypot(active.box.w, active.box.h, active.box.d) * 5 + 55;
      focus.target.setY(focus.target.y + 10);
    }
    const aspect = size.width / Math.max(1, size.height);
    const distance = radius / Math.sin(Math.atan(Math.tan(21 * Math.PI / 180) * Math.min(1, aspect)));
    const direction = new Vector3(1, .85, 1.65).normalize();
    if (view === 'joint' && active.hardware.length) {
      const normal = new Vector3(0, 0, 1).applyQuaternion(new Quaternion(...active.hardware[0].quaternion)).applyQuaternion(focus.q);
      direction.copy(normal).multiplyScalar(1.5).add(new Vector3(.3, .5, .7)).normalize();
    } else if (view === 'joint' && active.pinCenters.length) direction.set(.7, -.25, -1.2).normalize();
    const position = direction.multiplyScalar(distance).add(focus.target);
    updateCameraRig(camera, controls.current, cameraRig, { target: focus.target.toArray() as [number, number, number], position: position.toArray() as [number, number, number] }, key, seconds);
  }, -1);
  const active = plan.parts[props.step];
  const showTarget = !preview && !props.cinematic && props.phase === 'ready';
  const springDetail = props.cinematic && props.phase.startsWith('spring-');
  const targetDoor = isCabinetDoor(active) ? cabinetDoorHinge(plan, active) : null;
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[14000, 14000]} /><shadowMaterial transparent opacity={.18} /></mesh>
    <directionalLight ref={light} position={shadow.position} intensity={1.5} castShadow={view !== 'joint' && !inside} shadow-mapSize={[cabinetRender.mapSize, cabinetRender.mapSize]} shadow-radius={cabinetRender.radius} shadow-blurSamples={cabinetRender.blurSamples}
      shadow-camera-left={shadow.left} shadow-camera-right={shadow.right} shadow-camera-top={shadow.top} shadow-camera-bottom={shadow.bottom} shadow-camera-near={shadow.near} shadow-camera-far={shadow.far} shadow-bias={-.0008} shadow-normalBias={.35} />
    <group position={[0, 10, 0]}>
      {plan.parts.map(part => <Part key={part.id} part={part} plan={plan} state={state} preview={preview} inside={inside || springDetail && (part.id === active.id || part.box.kind === 'horizontal' && !part.feet)} doorOpen={doorOpen} finish={finish} onSelect={onSelect} />)}
      {showTarget && <group position={[active.box.x * 10, active.box.y * 10, active.box.z * 10]}>
        <group position={targetDoor?.pivot ?? [0, 0, 0]} rotation-y={targetDoor ? -targetDoor.sign * Math.PI / 2 : 0}>
          <mesh position={targetDoor ? targetDoor.pivot.map(value => -value) as [number, number, number] : [0, 0, 0]} onClick={event => { event.stopPropagation(); onPlace(); }}>
            <boxGeometry args={[active.box.w * 10, active.box.h * 10, active.box.d * 10]} />
            <meshBasicMaterial color="#fff" transparent opacity={.14} depthWrite={false} />
            <Edges color="#41484f" />
          </mesh>
        </group>
        <Html position={[0, active.box.h * 5 + 45, active.box.d * 5 + 15]} center zIndexRange={[3, 0]}>
          <button type="button" className={styles.targetButton} onClick={onPlace}>{targetDoor ? '문을 받쳐 경첩 맞추기' : `여기에 ${active.box.kind === 'horizontal' ? '놓기' : '끼우기'}`}</button>
        </Html>
      </group>}
    </group>
    <OrbitControls ref={controls} makeDefault minDistance={70} maxDistance={18000} maxPolarAngle={Math.PI * .75} enableDamping onStart={() => { manual.current = true; if (props.cinematic) props.onLost(); }} />
  </>;
}

function ContextGuard({ onLost }: { onLost: () => void }) {
  const gl = useThree(value => value.gl);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onLost]);
  return null;
}
function PreparedScene(props: Props) {
  useLoader(TextureLoader, birchEdgeTexture);
  useGLTF('/models/handle_door.glb');
  const [generation, setGeneration] = useState(0), [lost, setLost] = useState(false);
  const onLost = useCallback(() => { props.onLost(); setLost(true); }, [props]);
  return <>
    <Canvas key={generation} shadows={{ type: cabinetRender.shadowType }} dpr={cabinetRender.dpr} camera={{ fov: 42, near: 1, far: 25000 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#edf0f3']} />
      <ContextGuard onLost={onLost} />
      <GuideEnvironment lightingScale={4} shadows={false} />
      <AssemblyWorld {...props} />
    </Canvas>
    {lost && <div className={styles.recovery}><p>현재 단계에서 3D 화면을 다시 불러올 수 있습니다.</p><button type="button" onClick={() => { setGeneration(value => value + 1); setLost(false); }}>다시 불러오기</button></div>}
  </>;
}
export const CabinetScene = memo(function CabinetScene(props: Props) {
  return <Suspense fallback={<div className={styles.loading} role="status">캐비넷 부품을 준비하고 있습니다…</div>}><PreparedScene {...props} /></Suspense>;
});
