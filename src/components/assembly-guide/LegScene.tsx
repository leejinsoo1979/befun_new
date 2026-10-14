'use client';

import { useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Material } from 'three';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { createLongLegInstance } from '@/components/three/furniture-hardware/legs/longLegInstance';
import { LONG_LEG_ASSET, longLegSceneScale, longLegHeight } from '@/components/three/furniture-hardware/legs/longLegContract';
import { createMetalLegMaterial } from '@/lib/three/leg-material';
import { legInspectionShot } from '@/lib/assembly-guide/legs';
import { createCameraRig, updateCameraRig } from './cameraRig';
import type { SceneProps } from './GuideScene';

/** Provider factory + loader-owned geometry. R3F detaches this primitive on unmount.
 * No effect removes it during React StrictMode's setup/cleanup/setup cycle.
 */
function SharedLeg({ material }: { material: Material }) {
  const { scene } = useGLTF(LONG_LEG_ASSET.url);
  const instance = useMemo(() => createLongLegInstance(scene, material), [scene, material]);
  return <group scale={longLegSceneScale('mm')} dispose={null}><primitive object={instance} dispose={null} /></group>;
}

/** Exact shared rigid asset; unmeasured screw/pin/keyhole/travel is not fabricated. */
export function LegScene({ onTick, onManual, onUpdate }: SceneProps) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const cameraRig = useMemo(() => createCameraRig(), []);
  const material = useMemo(() => createMetalLegMaterial('black'), []);
  useEffect(() => () => material.dispose(), [material]);
  const report = useRef(0);
  const published = useRef({ progress: -1, playing: false });
  useFrame(({ camera, size }, delta) => {
    const state = onTick(delta);
    report.current += delta;
    if ((report.current >= .1 || state.progress === 1) && (published.current.progress !== state.progress || published.current.playing !== state.playing)) {
      report.current = 0; published.current = { progress: state.progress, playing: state.playing }; onUpdate(state.progress, state.playing);
    }
    if (!state.manual && controls.current) updateCameraRig(camera, controls.current, cameraRig, legInspectionShot(size.width / Math.max(1, size.height), state.overview, state.rear), state.revision, delta);
    else if (controls.current) controls.current.enableDamping = true;
  });
  return <>
    <group name="leg-guide-rigid-source" position={[0, 0, 0]} dispose={null}><SharedLeg material={material} /></group>
    <mesh position={[0, -.15, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[5000, 5000]} /><shadowMaterial transparent opacity={.16} /></mesh>
    {/* Mount anchor is y=longLegHeight('mm'), +Y. No guessed panel hardware. */}
    <OrbitControls ref={controls} makeDefault enableDamping minDistance={longLegHeight('mm') * .4} maxDistance={1800} maxPolarAngle={Math.PI * .8} onStart={onManual} />
  </>;
}
