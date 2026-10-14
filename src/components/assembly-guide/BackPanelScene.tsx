'use client';

import { useEffect, useMemo, useRef, type ComponentRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { CatmullRomCurve3, Group, TubeGeometry, Vector3 } from 'three';
import { createBoredBox } from '@/lib/three/blum/geometry';
import { backExample, backPanelPose, backPanelShot } from '@/lib/assembly-guide/backPanel';
import type { Bore } from '@/lib/three/blum/boring';
import type { SceneProps } from './GuideScene';
import styles from './guide.module.css';
import { createCameraRig, updateCameraRig } from './cameraRig';

function Horizontal({ upper, inside }: { upper?: boolean; inside: boolean }) {
  const geometry = useMemo(() => {
    const holes: Bore[] = backExample.pinCenters.map((x, index) => ({
      id: `example-pin-${index}`, kind: 'plate-fixing', center: [x, upper ? -9 : 9, -52], direction: [0, upper ? 1 : -1, 0], diameter: 7, depth: 10,
    }));
    return createBoredBox(21.6, 1.8, 11.6, holes).scale(10, 10, 10);
  }, [upper]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={[0, upper ? backExample.height + 9 : -9, 52]} castShadow={!inside} receiveShadow={!inside} dispose={null}>
    <meshStandardMaterial key={inside ? 'inside' : 'solid'} color="#dfe2e7" roughness={.65} transparent={inside} opacity={inside ? .13 : 1} depthWrite={!inside} />
  </mesh>;
}

function SpringPin({ extension }: { extension: RefObject<Group | null> }) {
  const spring = useMemo(() => {
    const points = Array.from({ length: 129 }, (_, index) => {
      const angle = index / 128 * Math.PI * 12;
      return new Vector3(Math.cos(angle) * 2.2, index / 128 * 9, Math.sin(angle) * 2.2);
    });
    return new TubeGeometry(new CatmullRomCurve3(points), 128, .18, 8, false);
  }, []);
  useEffect(() => () => spring.dispose(), [spring]);
  return <group>
    <mesh position={[0, -7, 0]}><cylinderGeometry args={[2.7, 2.7, 14, 24]} /><meshStandardMaterial color="#718674" transparent opacity={.16} depthWrite={false} /></mesh>
    <group ref={extension}>
      <mesh position={[0, -6.5, 0]}><cylinderGeometry args={[1.9, 1.9, 13, 24]} /><meshStandardMaterial color="#b8c1bd" metalness={.75} roughness={.25} /></mesh>
      <mesh position={[0, -1.9, 0]}><sphereGeometry args={[1.9, 24, 12]} /><meshStandardMaterial color="#b8c1bd" metalness={.75} roughness={.25} /></mesh>
    </group>
    <mesh geometry={spring} position={[0, -13, 0]} name="example-spring" dispose={null}><meshStandardMaterial color="#c6a65e" metalness={.7} roughness={.35} /></mesh>
  </group>;
}

export function BackPanelScene({ onTick, onManual, inside, onUpdate, step }: SceneProps) {
  const panel = useRef<Group>(null);
  const leftPin = useRef<Group>(null), rightPin = useRef<Group>(null);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const report = useRef(0);
  const published = useRef({ progress: -1, playing: false });
  const cameraRig = useMemo(() => createCameraRig(), []);

  useFrame(({ camera, size }, delta) => {
    const state = onTick(delta);
    report.current += delta;
    if ((report.current > .1 || state.progress === 1) && (published.current.progress !== state.progress || published.current.playing !== state.playing)) {
      report.current = 0; published.current = { progress: state.progress, playing: state.playing }; onUpdate(state.progress, state.playing);
    }
    const pose = backPanelPose(state.step, state.progress);
    if (panel.current) {
      panel.current.position.set(...pose.pivot); panel.current.rotation.x = pose.tilt;
      for (const pin of [leftPin.current, rightPin.current]) if (pin) pin.position.y = pose.springExtension;
      panel.current.traverse(object => { if (object.name === 'example-spring') object.scale.y = .3 + pose.springExtension / backExample.pinLength * .7; });
    }
    if (!state.manual && controls.current) {
      const shot = backPanelShot(state.step, state.progress, size.width / Math.max(1, size.height), state.overview, state.rear);
      updateCameraRig(camera, controls.current, cameraRig, shot, state.revision, delta);
    } else if (controls.current) {
      controls.current.enableDamping = true;
    }
  });

  return <>
    <mesh position={[0, -18.15, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[5000, 5000]} /><shadowMaterial transparent opacity={.16} /></mesh>
    <Horizontal inside={inside} /><Horizontal upper inside={inside} />
    {[-1, 1].map(side => <mesh key={side} position={[side * 99, 110, 52]} castShadow={!inside} receiveShadow={!inside}>
      <boxGeometry args={[18, 220, 116]} /><meshStandardMaterial key={inside ? 'inside' : 'solid'} color="#dfe2e7" roughness={.65} transparent={inside} opacity={inside ? .13 : 1} depthWrite={!inside} />
    </mesh>)}
    <group ref={panel}>
      <mesh position={[0, 110, 0]} castShadow={!inside} receiveShadow={!inside}><boxGeometry args={[backExample.width, backExample.height, backExample.thickness]} /><meshStandardMaterial key={inside ? 'inside' : 'solid'} color="#cbd1d8" roughness={.68} transparent={inside} opacity={inside ? .17 : 1} depthWrite={!inside} /></mesh>
      {backExample.pinCenters.map((x, index) => <group key={x} position={[x, 0, 0]}>
        <mesh position={[0, -backExample.pinLength / 2, 0]}><cylinderGeometry args={[1.5, 1.5, backExample.pinLength, 24]} /><meshStandardMaterial color="#b8c1bd" metalness={.7} roughness={.3} /></mesh>
        <group position={[0, backExample.height, 0]}><SpringPin extension={index === 0 ? leftPin : rightPin} /></group>
      </group>)}
      {step === 0 && <>
        <Html position={[-68, -7, 15]} center className={styles.partLabel}>아래 · 고정핀</Html>
        <Html position={[-68, 226, 15]} center className={styles.partLabel}>위 · 스프링핀</Html>
        <Html position={[0, 110, 9]} center className={styles.partLabel}><span>W</span> 백패널</Html>
      </>}
      {(step === 3 || step === 5) && <Html position={[-87, 204, 6]} center className={styles.partLabel}>{step === 3 ? '스프링핀 ↓' : '스프링핀 ↑'}</Html>}
    </group>
    <OrbitControls ref={controls} makeDefault enableDamping minDistance={30} maxDistance={1800} maxPolarAngle={Math.PI * .8} onStart={onManual} />
  </>;
}
