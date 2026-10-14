'use client';

import { Suspense, memo, useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import { BufferGeometry, DoubleSide, Group, MeshStandardMaterial, Path, Plane, Shape, ShapeGeometry, Vector3 } from 'three';
import { OvvoPH, OvvoRH, OvvoPC, OvvoRC, guideMounts } from '@/components/three/furniture-hardware/ovvo';
import { ovvoGuideModel } from '@/lib/assembly-guide/ovvoMounts';
import { inspectionShot, type JointInspection } from '@/lib/assembly-guide/inspectionShot';
import { jointExample, jointPose, type ConnectorModel, type GuideTopic } from '@/lib/assembly-guide/sequence';
import { cinematicJointShot } from '@/lib/assembly-guide/cinematicShot';
import { createColorMaterials, disposeMaterialSet } from '@/lib/three/materials';
import { createCameraRig, updateCameraRig } from './cameraRig';
import { GuideEnvironment } from './GuideEnvironment';
import { JointSectionCaps } from './JointSectionCaps';
import type { LegAction } from '@/lib/assembly-guide/legs';
import { LegScene } from './LegScene';
import { BackPanelScene } from './BackPanelScene';
import { TylkoClipScene } from './TylkoClipScene';
import type { ClipColourVersion } from '@/lib/assembly-guide/tylkoClip';
import styles from './guide.module.css';

export interface GuidePlayback {
  model: ConnectorModel;
  topic: GuideTopic;
  step: number;
  progress: number;
  playing: boolean;
  speed: number;
  overview: boolean;
  rear: boolean;
  manual: boolean;
  revision: number;
  inspection: JointInspection;
  continuous: boolean;
  reference: boolean;
  legAction: LegAction;
}

export type SceneProps = {
  onTick: (delta: number) => GuidePlayback;
  onManual: () => void;
  model: ConnectorModel;
  topic: GuideTopic;
  step: number;
  inside: boolean;
  clipColourVersion: ClipColourVersion;
  onUpdate: (progress: number, playing: boolean) => void;
};

function pocketSurface(width: number, depth: number) {
  const shape = new Shape();
  shape.moveTo(-width / 2, -depth / 2);
  shape.lineTo(width / 2, -depth / 2);
  shape.lineTo(width / 2, depth / 2);
  shape.lineTo(-width / 2, depth / 2);
  shape.closePath();
  const radius = jointExample.slotWidth / 2;
  const travel = (jointExample.slotLength - jointExample.slotWidth) / 2;
  for (const center of jointExample.centers) {
    const hole = new Path();
    hole.moveTo(-radius, center - travel);
    hole.lineTo(-radius, center + travel);
    hole.absarc(0, center + travel, radius, Math.PI, 0, true);
    hole.lineTo(radius, center - travel);
    hole.absarc(0, center - travel, radius, 0, -Math.PI, true);
    shape.holes.push(hole);
  }
  // Only the observed mouth outline. No invented straight or undercut interior walls.
  return new ShapeGeometry(shape, 32);
}

function Board({ upright, inside }: { upright?: boolean; inside: boolean }) {
  const width = upright ? jointExample.thickness : jointExample.width;
  const height = upright ? jointExample.height : jointExample.thickness;
  const surface = useMemo(() => pocketSurface(width, jointExample.depth), [width]);
  const outlines = useMemo(() => jointExample.centers.map(center => {
    const radius = jointExample.slotWidth / 2;
    const straight = (jointExample.slotLength - jointExample.slotWidth) / 2;
    const points: Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = i / 64 * Math.PI * 2;
      points.push(new Vector3(radius * Math.cos(angle), 0, center + radius * Math.sin(angle) + (Math.sin(angle) >= 0 ? straight : -straight)));
    }
    return new BufferGeometry().setFromPoints(points);
  }), []);
  useEffect(() => () => { surface.dispose(); outlines.forEach(outline => outline.dispose()); }, [surface, outlines]);
  const direction = upright ? 1 : -1;
  const remaining = height - jointExample.slotDepth;
  const paint = useMemo(() => createColorMaterials('#e4e7eb', '#cdd2d9'), []);
  useEffect(() => () => disposeMaterialSet(paint), [paint]);
  const material = { color: paint.horizontalBase.color, map: paint.horizontalBase.map, roughnessMap: paint.horizontalBase.roughnessMap, roughness: .46, transparent: inside, opacity: inside ? .08 : 1, depthWrite: !inside };
  return <group>
    <mesh geometry={surface} rotation={[Math.PI / 2, 0, 0]} receiveShadow={!inside} dispose={null}>
      <meshStandardMaterial {...material} side={DoubleSide} key={inside ? 'inside' : 'solid'} />
    </mesh>
    <mesh position={[0, direction * (jointExample.slotDepth + remaining / 2), 0]} castShadow={!inside} receiveShadow={!inside}>
      <boxGeometry args={[width, remaining, jointExample.depth]} />
      <meshStandardMaterial {...material} key={inside ? 'inside' : 'solid'} />
    </mesh>
    {/* Outer board edges are known. The pocket-depth interval is an explicit cutaway;
        its interior profile is unmeasured, so there are no pretend wood sidewalls. */}
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * width / 2, direction * jointExample.slotDepth / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[jointExample.depth, jointExample.slotDepth]} /><meshStandardMaterial {...material} side={DoubleSide} />
      </mesh>
      <mesh position={[0, direction * jointExample.slotDepth / 2, side * jointExample.depth / 2]}>
        <planeGeometry args={[width, jointExample.slotDepth]} /><meshStandardMaterial {...material} side={DoubleSide} />
      </mesh>
    </group>)}
    {outlines.map((outline, index) => <lineLoop key={index} geometry={outline} position={[0, direction * .03, 0]} dispose={null}>
      <lineBasicMaterial color="#9ca5b0" transparent opacity={inside ? .3 : .7} />
    </lineLoop>)}
  </group>;
}

function DirectionArrow({ direction }: { direction: 'down' | 'up' | 'slide' }) {
  return <group rotation={direction === 'slide' ? [-Math.PI / 2, 0, 0] : direction === 'up' ? [0, 0, 0] : [Math.PI, 0, 0]}>
    <Line points={[[0, 0, 0], [0, 14, 0]]} color="#517545" lineWidth={1.3} />
    <Line points={[[-1.7, 11, 0], [0, 14, 0], [1.7, 11, 0]]} color="#517545" lineWidth={1.3} />
  </group>;
}

function JointScene({ onTick, onManual, model, step, inside, onUpdate }: SceneProps) {
  const gl = useThree(state => state.gl);
  const sectionPlanes = useRef([new Plane(new Vector3(-1, 0, 0), 0)]);
  useEffect(() => () => { gl.clippingPlanes = []; gl.shadowMap.enabled = true; }, [gl]);
  const panel = useRef<Group>(null);
  const baseHardware = useRef<Group>(null);
  const endHardware = useRef<Group>(null);
  const connectors = useRef<Group>(null);
  const capSources = useMemo(() => [baseHardware, endHardware, connectors], []);
  const capActive = useRef(false);
  const arrow = useRef<Group>(null);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const report = useRef(0);
  const published = useRef({ progress: -1, playing: false });
  const cameraRig = useMemo(() => createCameraRig(), []);
  const materials = useMemo(() => ({
    housing: new MeshStandardMaterial({ color: '#b9bec6', roughness: .28, metalness: .06, side: DoubleSide }),
    connector: new MeshStandardMaterial({ color: '#22262c', roughness: .38, metalness: .02, side: DoubleSide }),
  }), []);
  useEffect(() => () => { materials.housing.dispose(); materials.connector.dispose(); }, [materials]);
  const mounts = useMemo(() => jointExample.centers.map(center => guideMounts(ovvoGuideModel(model), model === 'V-1230P' ? 'pressed' : 'locked', center)), [model]);

  useFrame(({ camera, size, gl }, delta) => {
    const state = onTick(delta);
    const reveal = state.continuous && state.model === 'V-1230R' && state.step === 6 && state.inspection === 'auto' && !state.overview && !state.manual;
    const amount = Math.min(1, Math.max(0, state.progress / .2));
    sectionPlanes.current[0].constant = reveal ? 6 * (1 - amount * amount * (3 - 2 * amount)) : 0;
    const cut = state.inspection === 'section' && !state.manual || reveal;
    capActive.current = cut;
    gl.clippingPlanes = cut ? sectionPlanes.current : [];
    gl.shadowMap.enabled = !cut;
    if (state.manual) { camera.up.set(0, 1, 0); if (controls.current) controls.current.enableDamping = true; }
    report.current += delta;
    if ((report.current > .1 || state.progress === 1) && (published.current.progress !== state.progress || published.current.playing !== state.playing)) {
      report.current = 0;
      published.current = { progress: state.progress, playing: state.playing };
      onUpdate(state.progress, state.playing);
    }
    const pose = jointPose(state.model, state.step, state.progress);
    panel.current?.position.set(0, pose.panelGap, pose.panelSlide);
    if (baseHardware.current) { baseHardware.current.position.y = pose.baseHousingOffset; baseHardware.current.visible = pose.baseHousingsVisible; }
    if (endHardware.current) { endHardware.current.position.y = pose.endHousingOffset; endHardware.current.visible = pose.endHousingsVisible; }
    if (connectors.current) { connectors.current.position.y = pose.connectorOffset; connectors.current.visible = pose.connectorsVisible; }
    if (arrow.current) {
      arrow.current.visible = state.step >= 1 && state.progress < 1 && !pose.complete;
      const y = state.step === 1 ? pose.baseHousingOffset + 20 : state.step === 2 ? pose.panelGap + pose.endHousingOffset - 18 : state.step === 3 ? pose.panelGap + pose.connectorOffset - 28 : pose.panelGap + 18;
      arrow.current.position.set(cut ? -16 : 16, y, jointExample.centers[0] + (state.step > 1 ? pose.panelSlide : 0));
    }
    if (!state.manual && controls.current) {
      const aspect = size.width / Math.max(1, size.height);
      const inspection = state.inspection ?? 'auto';
      const target: [number, number, number] = [0, state.step === 2 || state.step === 3 ? pose.panelGap + 3 : -5, jointExample.centers[0] + (state.step === 2 || state.step === 3 ? pose.panelSlide : 0)];
      const shot = inspection === 'auto' ? cinematicJointShot(state.model, state.step, state.progress, aspect, state.overview, state.rear) : inspectionShot(inspection, target, aspect);
      updateCameraRig(camera, controls.current, cameraRig, shot, state.revision, delta, inspection !== 'auto');
    }
  }, -1);

  return <>
    <mesh position={[0, -18.15, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={!inside}><planeGeometry args={[5000, 5000]} /><shadowMaterial transparent opacity={.16} /></mesh>
    <Board inside={inside} />
    <group ref={baseHardware}>
      {mounts.map((mount, index) => <group key={index} {...mount.baseHousing} dispose={null}>{model === 'V-1230P' ? <OvvoPH material={materials.housing} /> : <OvvoRH material={materials.housing} />}</group>)}
      {step === 1 && <Html position={[14, 8, jointExample.centers[0]]} center className={styles.partLabel}>{model === 'V-1230R' ? 'V-1230RH' : 'V-1230PH'} · A의 홈</Html>}
    </group>
    <group ref={panel}>
      <Board upright inside={inside} />
      <group ref={endHardware}>
        {mounts.map((mount, index) => <group key={index} {...mount.endHousing} dispose={null}><OvvoPH material={materials.housing} /></group>)}
        {step === 2 && <Html position={[17, -5, jointExample.centers[0]]} center className={styles.partLabel}>V-1230PH · B의 아래 끝</Html>}
      </group>
      <group ref={connectors}>
        {mounts.map((mount, index) => <group key={index} {...mount.connector} dispose={null}>{model === 'V-1230P' ? <OvvoPC material={materials.connector} /> : <OvvoRC material={materials.connector} />}</group>)}
        {step === 3 && <Html position={[18, -7, jointExample.centers[0]]} center className={styles.partLabel}>{model === 'V-1230R' ? 'V-1230RC' : 'V-1230PC'} · 연결부가 아래로</Html>}
      </group>
      {step === 0 && <Html position={[13, 95, 70]} center className={styles.partLabel}><span>B</span> 세로판 · 아래 끝에 홈</Html>}
    </group>
    {step === 0 && <Html position={[47, 1, 67]} center className={styles.partLabel}><span>A</span> 받침판 · 홈이 위로</Html>}
    <group ref={arrow}><DirectionArrow direction={step === 2 || step === 3 ? 'up' : model === 'V-1230R' && step === 6 ? 'slide' : 'down'} /></group>
    <JointSectionCaps sources={capSources} active={capActive} planes={sectionPlanes} model={model} />
    <OrbitControls ref={controls} makeDefault enableDamping minDistance={35} maxDistance={1800} maxPolarAngle={Math.PI * .8} onStart={onManual} />
  </>;
}

export const GuideScene = memo(function GuideScene(props: SceneProps) {
  return <Canvas shadows dpr={[1, 1.5]} camera={{ position: [280, 240, 320], fov: 40, near: 1, far: 8000 }} gl={{ antialias: true, stencil: true }} onCreated={({ gl }) => { gl.localClippingEnabled = true; }}>
    <color attach="background" args={['#edf0f3']} />
    <GuideEnvironment />
    {props.topic === 'tylko-clip' ? <TylkoClipScene {...props} /> : props.topic === 'back-panel' ? <BackPanelScene {...props} /> : props.topic === 'legs' ? <Suspense fallback={null}><LegScene {...props} /></Suspense> : <JointScene {...props} />}
  </Canvas>;
});
