'use client';

import { useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import { ExtrudeGeometry, Group, Path, Shape } from 'three';
import { TylkoClip, TylkoClipPin, createClipMaterials } from '@/components/three/furniture-hardware/connectors/TylkoClip';
import { clipBodyExtent } from '@/components/three/furniture-hardware/connectors/clipContract';
import { clipColours, clipExample, tylkoClipPose, tylkoClipShot } from '@/lib/assembly-guide/tylkoClip';
import type { SceneProps } from './GuideScene';
import styles from './guide.module.css';
import { GuidePanel } from './GuidePanel';
import { createCameraRig, updateCameraRig } from './cameraRig';
import { MotionArrow } from './MotionArrow';

const colourNames = { black: '검정', orange: '주황', silver: '은색' };

function panelEndGeometry() {
  const { height, thickness, clip, centers } = clipExample;
  const shape = new Shape();
  shape.moveTo(-height / 2, -thickness / 2); shape.lineTo(height / 2, -thickness / 2);
  shape.lineTo(height / 2, thickness / 2); shape.lineTo(-height / 2, thickness / 2); shape.closePath();
  const { startX, endX } = clipBodyExtent(clip);
  const r = clip.widthMm / 2;
  for (const center of centers) {
    const hole = new Path();
    hole.moveTo(center + startX + r, -r); hole.lineTo(center + endX - r, -r);
    hole.absarc(center + endX - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
    hole.lineTo(center + startX + r, r);
    hole.absarc(center + startX + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
    shape.holes.push(hole);
  }
  const geometry = new ExtrudeGeometry(shape, { depth: clip.depthMm, bevelEnabled: false, curveSegments: 32 });
  geometry.translate(0, 0, -clip.depthMm);
  return geometry;
}

function MovingBoard({ inside }: { inside: boolean }) {
  const end = useMemo(() => panelEndGeometry(), []);
  useEffect(() => () => end.dispose(), [end]);
  return <group>
    <GuidePanel source={end} size={[clipExample.height, clipExample.thickness, clipExample.clip.depthMm]} axis={1} inside={inside} />
    <GuidePanel size={[clipExample.height, clipExample.thickness, clipExample.depth - clipExample.clip.depthMm]} axis={1} position={[0, 0, -(clipExample.depth + clipExample.clip.depthMm) / 2]} inside={inside} />
  </group>;
}

/** Hardware geometry is imported from R1-VISUAL; this component only places panels and samples motion. */
export function TylkoClipScene({ onTick, onManual, onUpdate, step, inside, clipColourVersion }: SceneProps) {
  const panel = useRef<Group>(null);
  const arrow = useRef<Group>(null);
  const arrowProgress = useRef(0);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const cameraRig = useMemo(() => createCameraRig(), []);
  const sent = useRef({ elapsed: 0, progress: -1, playing: false });
  const colours = clipColours(clipColourVersion);
  const materials = useMemo(() => clipColours(clipColourVersion).map(colour => {
    const value = createClipMaterials(colour);
    if (inside && step >= 2) {
      value.body.transparent = true; value.body.opacity = .3; value.body.depthWrite = false;
      value.cavity.transparent = true; value.cavity.opacity = .1; value.cavity.depthWrite = false;
    }
    return value;
  }), [clipColourVersion, inside, step]);
  useEffect(() => () => materials.forEach(value => Object.values(value).forEach(material => material.dispose())), [materials]);

  useFrame(({ camera, size }, delta) => {
    const state = onTick(delta);
    const pose = tylkoClipPose(state.step, state.progress);
    arrowProgress.current = state.progress;
    panel.current?.position.set(...pose.panelOffset);
    if (arrow.current) {
      arrow.current.visible = (state.step === 2 || state.step === 3) && state.progress < 1;
      arrow.current.position.set(clipExample.centers[1] + pose.panelOffset[0] + (state.step === 2 ? -12 : 6), -20, pose.panelOffset[2]);
      arrow.current.rotation.y = state.step === 2 ? Math.PI / 2 : 0;
    }
    sent.current.elapsed += delta;
    if (sent.current.elapsed > .1 && (sent.current.progress !== state.progress || sent.current.playing !== state.playing)) {
      onUpdate(state.progress, state.playing);
      sent.current = { elapsed: 0, progress: state.progress, playing: state.playing };
    }
    if (!state.manual && controls.current) {
      const shot = tylkoClipShot(state.step, state.progress, size.width / Math.max(1, size.height), state.overview, state.rear);
      updateCameraRig(camera, controls.current, cameraRig, shot, state.revision, delta);
    } else if (controls.current) {
      controls.current.enableDamping = true;
    }
  });

  return <>
    <group rotation={[0, 0, Math.PI / 2]}>
      <GuidePanel size={[clipExample.height, clipExample.width, clipExample.thickness]} axis={2} position={[0, 0, clipExample.thickness / 2]} inside={inside} />
      {clipExample.centers.map((x, i) => <group key={`${x}-${colours[i]}`} position={[x + clipExample.clip.travelMm, 0, 0]} rotation={[Math.PI, 0, 0]} dispose={null}>
        <TylkoClipPin dims={clipExample.pin} material={materials[i].pin} />
      </group>)}
      <group ref={panel}>
        <MovingBoard inside={inside} />
        {clipExample.centers.map((x, i) => <group key={`${x}-${colours[i]}`} position={[x, 0, 0]} dispose={null}>
          <TylkoClip dims={clipExample.clip} bodyMaterial={materials[i].body} cavityMaterial={materials[i].cavity} />
          {step === 0 && <Html position={[0, -40, -4]} center className={styles.partLabel}>{colourNames[colours[i]]} ↔ {colourNames[colours[i]]}</Html>}
        </group>)}
        {step === 4 && <>
          <Line points={[[clipExample.height / 2 + .3, -9, -40], [clipExample.height / 2 + .3, -9, 18]]} color="#438637" lineWidth={2} />
          <Line points={[[clipExample.height / 2 + .3, -27, 0], [clipExample.height / 2 + .3, -27, -18], [clipExample.height / 2 + .3, -9, -18]]} color="#438637" lineWidth={2} />
          <Html position={[clipExample.height / 2 + 8, -18, -12]} center className={styles.partLabel}>끝선 · 직각 확인</Html>
        </>}
      </group>
      <group ref={arrow} scale={.65}><MotionArrow direction="left" progress={arrowProgress} /></group>
    </group>
    <OrbitControls ref={controls} makeDefault enableDamping minDistance={22} maxDistance={1800} onStart={onManual} />
  </>;
}
