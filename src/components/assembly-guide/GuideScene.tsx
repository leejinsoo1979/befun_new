'use client';

import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import { BoxGeometry, DoubleSide, Group, MeshStandardMaterial, Plane, PlaneGeometry, Shape, ShapeGeometry, TextureLoader, Vector3 } from 'three';
import { OvvoPH, OvvoRH, OvvoPC, OvvoRC, guideMounts } from '@/components/three/furniture-hardware/ovvo';
import { ovvoGuideModel } from '@/lib/assembly-guide/ovvoMounts';
import { inspectionShot, type JointInspection } from '@/lib/assembly-guide/inspectionShot';
import { jointExample, jointPose, type ConnectorModel, type GuideTopic } from '@/lib/assembly-guide/sequence';
import { cinematicJointShot } from '@/lib/assembly-guide/cinematicShot';
import { birchEdgeTexture, createMdfCutMaterial, mapPanelEdgeUvs } from '@/lib/assembly-guide/panelMaterials';
import { releasePose, releaseShot, type JointAction } from '@/lib/assembly-guide/disassembly';
import { capsuleMouth, createPocketInterior } from '@/lib/assembly-guide/panelPocket';
import type { PanelView } from '@/lib/assembly-guide/viewState';
import { usePanelMaterials } from './usePanelMaterials';
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
  jointAction: JointAction;
  panelView: PanelView;
}

export type SceneProps = {
  onTick: (delta: number) => GuidePlayback;
  onManual: () => void;
  model: ConnectorModel;
  topic: GuideTopic;
  step: number;
  jointAction: JointAction;
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
  for (const center of jointExample.centers) shape.holes.push(capsuleMouth(center, jointExample.slotWidth, jointExample.slotLength));
  // The mouth and recess use one capsule outline; detailed supplier undercut is not asserted.
  return new ShapeGeometry(shape, 32);
}

function Board({ upright, inside }: { upright?: boolean; inside: boolean }) {
  const width = upright ? jointExample.thickness : jointExample.width;
  const height = upright ? jointExample.height : jointExample.thickness;
  const surface = useMemo(() => {
    const geometry = pocketSurface(width, jointExample.depth);
    if (upright) {
      const p = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / jointExample.thickness + .5, p.getY(i) / 300 + .5);
    }
    return geometry;
  }, [width, upright]);
  useEffect(() => () => surface.dispose(), [surface]);
  const direction = upright ? 1 : -1;
  const remaining = height - jointExample.slotDepth;
  const material = usePanelMaterials(upright ? 0 : 1, inside);
  const cut = useMemo(() => createMdfCutMaterial(inside), [inside]);
  const pocket = useMemo(() => createPocketInterior(jointExample.centers, jointExample.slotWidth, jointExample.slotLength, jointExample.slotDepth, direction), [direction]);
  useEffect(() => () => { cut.material.dispose(); cut.texture.dispose(); }, [cut]);
  useEffect(() => () => { pocket.walls.dispose(); pocket.floor.dispose(); }, [pocket]);
  const bodyCenter = direction * (jointExample.slotDepth + remaining / 2);
  const geometry = useMemo(() => {
    const value = mapPanelEdgeUvs(new BoxGeometry(width, remaining, jointExample.depth), upright ? 0 : 1, jointExample.thickness, upright ? -width / 2 : -height, [0, bodyCenter, 0]);
    // Remove the internal slab face. Each visible pocket has its own MDF floor;
    // a full laminate plane here previously filled the recess with panel colour.
    const floorFace = upright ? 3 : 2;
    value.groups = value.groups.filter(group => group.materialIndex !== floorFace);
    return value;
  }, [upright, width, height, remaining, bodyCenter]);
  const edgePlanes = useMemo(() => {
    const x = new PlaneGeometry(jointExample.depth, jointExample.slotDepth);
    const z = new PlaneGeometry(width, jointExample.slotDepth);
    for (const plane of upright ? [z] : [x, z]) {
      const p = plane.getAttribute('position'), uv = plane.getAttribute('uv');
      for (let i = 0; i < p.count; i++) uv.setXY(i, upright ? p.getX(i) / width + .5 : (p.getY(i) + direction * jointExample.slotDepth / 2 + height) / height, (upright ? p.getY(i) : p.getX(i)) / 300 + .5);
    }
    return { x, z };
  }, [upright, width, height, direction]);
  useEffect(() => () => { geometry.dispose(); edgePlanes.x.dispose(); edgePlanes.z.dispose(); }, [geometry, edgePlanes]);
  return <group>
    <mesh geometry={surface} material={upright ? material.birch : material.laminate} rotation={[Math.PI / 2, 0, 0]} receiveShadow={!inside} dispose={null} />
    <mesh geometry={geometry} material={material.faces} position={[0, bodyCenter, 0]} castShadow={!inside} receiveShadow={!inside} dispose={null} />
    <mesh geometry={pocket.walls} material={cut.material} castShadow={!inside} receiveShadow={!inside} dispose={null} />
    <mesh geometry={pocket.floor} material={cut.material} receiveShadow={!inside} dispose={null} />
    {/* Basic recess envelope, not a measured undercut or a manufacturing profile. */}
    {[-1, 1].map(side => <group key={side}>
      <mesh geometry={edgePlanes.x} material={upright ? material.laminate : material.birch} position={[side * width / 2, direction * jointExample.slotDepth / 2, 0]} rotation={[0, Math.PI / 2, 0]} dispose={null} />
      <mesh geometry={edgePlanes.z} material={material.birch} position={[0, direction * jointExample.slotDepth / 2, side * jointExample.depth / 2]} dispose={null} />
    </group>)}

  </group>;
}

function DirectionArrow({ direction }: { direction: 'down' | 'up' | 'slide' }) {
  return <group rotation={direction === 'slide' ? [-Math.PI / 2, 0, 0] : direction === 'up' ? [0, 0, 0] : [Math.PI, 0, 0]}>
    <Line points={[[0, 0, 0], [0, 14, 0]]} color="#517545" lineWidth={1.3} />
    <Line points={[[-1.7, 11, 0], [0, 14, 0], [1.7, 11, 0]]} color="#517545" lineWidth={1.3} />
  </group>;
}

function JointScene({ onTick, onManual, model, step, jointAction, inside, onUpdate }: SceneProps) {
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
    housing: new MeshStandardMaterial({ color: '#b9bec6', roughness: .28, metalness: .06, side: DoubleSide, transparent: inside, opacity: inside ? .18 : 1, depthWrite: !inside }),
    connector: new MeshStandardMaterial({ color: '#22262c', roughness: .38, metalness: .02, side: DoubleSide }),
  }), [inside]);
  useEffect(() => () => { materials.housing.dispose(); materials.connector.dispose(); }, [materials]);
  const mounts = useMemo(() => jointExample.centers.map(center => guideMounts(ovvoGuideModel(model), model === 'V-1230P' ? 'pressed' : 'locked', center)), [model]);

  useFrame(({ camera, size, gl }, delta) => {
    const state = onTick(delta);
    const releasing = state.jointAction === 'disassemble';
    const reveal = state.panelView === 'auto' && state.continuous && state.model === 'V-1230R' && (releasing ? state.step === 1 : state.step === 6) && state.inspection === 'auto' && !state.overview && !state.manual;
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
    const pose = releasing ? releasePose(state.step, state.progress) : jointPose(state.model, state.step, state.progress);
    panel.current?.position.set(0, pose.panelGap, pose.panelSlide);
    if (baseHardware.current) { baseHardware.current.position.y = pose.baseHousingOffset; baseHardware.current.visible = pose.baseHousingsVisible; }
    if (endHardware.current) { endHardware.current.position.y = pose.endHousingOffset; endHardware.current.visible = pose.endHousingsVisible; }
    if (connectors.current) { connectors.current.position.y = pose.connectorOffset; connectors.current.visible = pose.connectorsVisible; }
    if (arrow.current) {
      arrow.current.visible = state.step >= 1 && state.progress < 1 && !pose.complete;
      const y = releasing ? pose.panelGap + 18 : state.step === 1 ? pose.baseHousingOffset + 20 : state.step === 2 ? pose.panelGap + pose.endHousingOffset - 18 : state.step === 3 ? pose.panelGap + pose.connectorOffset - 28 : pose.panelGap + 18;
      arrow.current.position.set(cut ? -16 : 16, y, jointExample.centers[0] + (state.step > 1 ? pose.panelSlide : 0));
    }
    if (arrow.current) arrow.current.rotation.x = releasing && state.step === 1 ? Math.PI : 0;
    if (!state.manual && controls.current) {
      const aspect = size.width / Math.max(1, size.height);
      const inspection = state.inspection ?? 'auto';
      const target: [number, number, number] = [0, state.step === 2 || state.step === 3 ? pose.panelGap + 3 : -5, jointExample.centers[0] + (state.step === 2 || state.step === 3 ? pose.panelSlide : 0)];
      const shot = inspection === 'auto' ? releasing ? releaseShot(state.step, state.progress, aspect, state.overview, state.rear) : cinematicJointShot(state.model, state.step, state.progress, aspect, state.overview, state.rear) : inspectionShot(inspection, target, aspect);
      updateCameraRig(camera, controls.current, cameraRig, shot, state.revision, delta, inspection !== 'auto');
    }
  }, -1);

  return <>
    <mesh position={[0, -18.15, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={!inside}><planeGeometry args={[5000, 5000]} /><shadowMaterial transparent opacity={.16} /></mesh>
    <Board inside={inside} />
    {jointAction === 'disassemble' && step === 1 && <Html position={[-20, 18, jointExample.centers[0]]} center className={styles.partLabel}>해제 방향 · 15mm</Html>}
    <group ref={baseHardware}>
      {mounts.map((mount, index) => <group key={index} {...mount.baseHousing} dispose={null}>{model === 'V-1230P' ? <OvvoPH material={materials.housing} /> : <OvvoRH material={materials.housing} />}</group>)}
      {jointAction === 'assemble' && step === 1 && <Html position={[14, 8, jointExample.centers[0]]} center className={styles.partLabel}>{model === 'V-1230R' ? 'V-1230RH' : 'V-1230PH'} · A의 홈</Html>}
    </group>
    <group ref={panel}>
      <Board upright inside={inside} />
      <group ref={endHardware}>
        {mounts.map((mount, index) => <group key={index} {...mount.endHousing} dispose={null}><OvvoPH material={materials.housing} /></group>)}
        {jointAction === 'assemble' && step === 2 && <Html position={[17, -5, jointExample.centers[0]]} center className={styles.partLabel}>V-1230PH · B의 아래 끝</Html>}
      </group>
      <group ref={connectors}>
        {mounts.map((mount, index) => <group key={index} {...mount.connector} dispose={null}>{model === 'V-1230P' ? <OvvoPC material={materials.connector} /> : <OvvoRC material={materials.connector} />}</group>)}
        {jointAction === 'assemble' && step === 3 && <Html position={[18, -7, jointExample.centers[0]]} center className={styles.partLabel}>{model === 'V-1230R' ? 'V-1230RC' : 'V-1230PC'} · 연결부가 아래로</Html>}
      </group>
      {jointAction === 'assemble' && step === 0 && <Html position={[13, 95, 70]} center className={styles.partLabel}><span>B</span> 세로판 · 아래 끝에 홈</Html>}
    </group>
    {jointAction === 'assemble' && step === 0 && <Html position={[47, 1, 67]} center className={styles.partLabel}><span>A</span> 받침판 · 홈이 위로</Html>}
    <group ref={arrow}><DirectionArrow direction={jointAction === 'disassemble' ? step === 1 ? 'slide' : 'up' : step === 2 || step === 3 ? 'up' : model === 'V-1230R' && step === 6 ? 'slide' : 'down'} /></group>
    <JointSectionCaps sources={capSources} active={capActive} planes={sectionPlanes} model={model} inside={inside} />
    <OrbitControls ref={controls} makeDefault enableDamping minDistance={35} maxDistance={1800} maxPolarAngle={Math.PI * .8} onStart={onManual} />
  </>;
}

function RendererLifecycle({ onLost }: { onLost: () => void }) {
  const gl = useThree(state => state.gl);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onLost]);
  return null;
}

function PreparedGuideScene(props: SceneProps) {
  // Resolve the image before creating Canvas. A cold loader must not suspend
  // an already mounted R3F root during StrictMode's setup/cleanup cycle.
  useLoader(TextureLoader, birchEdgeTexture);
  const { onTick, onUpdate } = props;
  const [generation, setGeneration] = useState(0);
  const [lost, setLost] = useState(false);
  const onLost = useCallback(() => {
    const state = onTick(0);
    state.playing = false;
    onUpdate(state.progress, false);
    setLost(true);
  }, [onTick, onUpdate]);
  return <>
  <Canvas key={generation} shadows dpr={[1, 1.5]} camera={{ position: [280, 240, 320], fov: 40, near: 1, far: 8000 }} gl={{ antialias: true, stencil: true }} onCreated={({ gl }) => { gl.localClippingEnabled = true; }}>
    <RendererLifecycle onLost={onLost} />
    <color attach="background" args={['#edf0f3']} />
    <GuideEnvironment />
    {props.topic === 'tylko-clip' ? <TylkoClipScene {...props} /> : props.topic === 'back-panel' ? <BackPanelScene {...props} /> : props.topic === 'legs' ? <Suspense fallback={null}><LegScene {...props} /></Suspense> : <JointScene {...props} />}
  </Canvas>
  {lost && <div className={styles.renderRecovery} role="status"><p>3D 표시가 중단되었습니다. 현재 단계에서 다시 불러올 수 있습니다.</p><button type="button" onClick={() => { setGeneration(value => value + 1); setLost(false); }}>3D 다시 불러오기</button></div>}
  </>;
}

export const GuideScene = memo(function GuideScene(props: SceneProps) {
  return <Suspense fallback={<div className={styles.loading} role="status">조립 장면을 준비하고 있습니다…</div>}><PreparedGuideScene {...props} /></Suspense>;
});
