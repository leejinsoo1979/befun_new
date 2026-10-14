'use client';

import { useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { Group } from 'three';
import { createBoredBox } from '@/lib/three/blum/geometry';
import { backExample, backPanelPose, backPanelShot } from '@/lib/assembly-guide/backPanel';
import type { Bore } from '@/lib/three/blum/boring';
import type { SceneProps } from './GuideScene';
import styles from './guide.module.css';
import { GuidePanel } from './GuidePanel';
import { createCameraRig, updateCameraRig } from './cameraRig';
import { SpringDowel } from './SpringDowel';

function Horizontal({ upper, inside }: { upper?: boolean; inside: boolean }) {
  const geometry = useMemo(() => {
    const holes: Bore[] = backExample.pinCenters.map((x, index) => ({
      id: `example-pin-${index}`, kind: 'plate-fixing', center: [x, upper ? -9 : 9, -52], direction: [0, upper ? 1 : -1, 0], diameter: 7, depth: 10,
    }));
    return createBoredBox(21.6, 1.8, 11.6, holes).scale(10, 10, 10);
  }, [upper]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <GuidePanel source={geometry} size={[216, 18, 116]} axis={1} position={[0, upper ? backExample.height + 9 : -9, 52]} inside={inside} />;
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
    {[-1, 1].map(side => <GuidePanel key={side} size={[18, 220, 116]} axis={0} position={[side * 99, 110, 52]} inside={inside} />)}
    <group ref={panel}>
      <GuidePanel size={[backExample.width, backExample.height, backExample.thickness]} axis={2} position={[0, 110, 0]} inside={inside} />
      {backExample.pinCenters.map((x, index) => <group key={x} position={[x, 0, 0]}>
        <mesh position={[0, -backExample.pinLength / 2, 0]}><cylinderGeometry args={[1.5, 1.5, backExample.pinLength, 24]} /><meshStandardMaterial color="#b8c1bd" metalness={.7} roughness={.3} /></mesh>
        <group position={[0, backExample.height, 0]}><SpringDowel extension={index === 0 ? leftPin : rightPin} /></group>
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
