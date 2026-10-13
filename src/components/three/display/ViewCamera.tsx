'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useShelfStore } from '@/stores/useShelfStore';
import { CAMERA_RESET_EVENT } from '../cameraEvents';
import { useDisplayStore } from './displayStore';
import { assemblyPlayback, cinematicShot } from './cinematic';
import { fitView } from './viewMath';

export function ViewCamera() {
  const projection = useDisplayStore((s) => s.projection);
  return <>
    {projection === 'orthographic'
      ? <OrthographicCamera makeDefault position={[0, 100, 500]} near={0.1} far={10000} />
      : <PerspectiveCamera makeDefault position={[0, 100, 500]} fov={40} near={0.1} far={10000} />}
    <CameraControls />
  </>;
}

function CameraControls() {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const width = useShelfStore((s) => s.width);
  const height = useShelfStore((s) => s.height);
  const depth = useShelfStore((s) => s.depth);
  const rows = useShelfStore((s) => s.rowHeights);
  const numRows = useShelfStore((s) => s.numRows);
  const thickness = useShelfStore((s) => s.thickness);
  const view = useDisplayStore(s=>s.view);
  const exploded = useDisplayStore(s=>s.exploded);
  const revision = useDisplayStore(s=>s.revision);
  const stageBounds = useDisplayStore(s=>s.stageBounds);
  const wasCinematic=useRef(false);
  const goal = useRef({ position: new THREE.Vector3(), target: new THREE.Vector3(), halfHeight: 100, active: false, camera: null as THREE.Camera | null });
  // Some presets carry a nominal height differing from the sum of their rows.
  // The store retains up to 12 row heights, including inactive rows.
  const bodyHeight = Math.max(height,
    rows.slice(0, numRows).reduce((sum, rowHeight) => sum + rowHeight, 0) + thickness * (numRows + 1));

  useLayoutEffect(() => {
    const bounds = exploded ? stageBounds : null;
    const aspect = size.width / Math.max(1, size.height);
    const frame = fitView(bounds?.width ?? width, bounds?.height ?? bodyHeight + 10, bounds?.depth ?? depth + 30, aspect, view);
    const target = bounds ? new THREE.Vector3(...bounds.center) : new THREE.Vector3(0, bodyHeight / 2, depth / 2);
    const destination = goal.current;
    destination.position.copy(target).addScaledVector(frame.direction, frame.distance);
    destination.target.copy(target);
    destination.halfHeight = frame.halfHeight;
    camera.up.copy(frame.up);
    if (destination.camera !== camera) {
      camera.position.copy(destination.position);
      configureProjection(camera, frame.halfHeight, aspect);
      controls.current?.target.copy(target);
      camera.lookAt(target);
      destination.camera = camera;
    }
    destination.active = true;
  }, [camera, width, bodyHeight, depth, view, exploded, revision, stageBounds, size.width, size.height]);

  useFrame((_, delta) => {
    const state=useDisplayStore.getState();
    const tracking=state.cinematic && assemblyPlayback.active && !!stageBounds && camera instanceof THREE.PerspectiveCamera;
    if(tracking && controls.current && stageBounds) {
      wasCinematic.current=true;
      if(state.paused) return;
      const shot=cinematicShot({phase:state.phase,progress:assemblyPlayback.elapsed/assemblyPlayback.duration,outro:assemblyPlayback.outro,
        width,height:bodyHeight,depth,aspect:size.width/Math.max(1,size.height),focus:assemblyPlayback.focus,kind:assemblyPlayback.kind,beat:assemblyPlayback.beat,stage:stageBounds});
      const blend=1-Math.exp(-Math.min(delta,.05)*1.7);
      camera.up.set(0,1,0);
      camera.position.lerp(new THREE.Vector3(...shot.position),blend);
      controls.current.target.lerp(new THREE.Vector3(...shot.target),blend);
      controls.current.update();
      return;
    }
    if(wasCinematic.current) {
      wasCinematic.current=false;
      // Hold the closing shot instead of snapping back to the generic preset.
      if(state.phase==='assembled' && state.progress===1) goal.current.active=false;
    }
    const destination = goal.current;
    if (!destination.active || !controls.current) return;
    const alpha = 1 - Math.exp(-Math.min(delta, 0.05) * 4.5);
    camera.position.lerp(destination.position, alpha);
    controls.current.target.lerp(destination.target, alpha);
    if (camera instanceof THREE.OrthographicCamera) {
      configureProjection(camera, THREE.MathUtils.lerp(camera.top, destination.halfHeight, alpha), size.width / Math.max(1, size.height));
    }
    controls.current.update();
    if (camera.position.distanceTo(destination.position) < 0.02 && controls.current.target.distanceTo(destination.target) < 0.02) destination.active = false;
  });

  useEffect(() => {
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    if(reduced.matches) useDisplayStore.getState().setCinematic(false);
    const reset = () => useDisplayStore.getState().selectView('front');
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      if (e.code !== 'Space' || e.repeat || (target instanceof HTMLElement &&
        (target.isContentEditable || target.closest('input,textarea,select,button,a,[role="button"]')))) return;
      e.preventDefault();
      reset();
    };
    window.addEventListener(CAMERA_RESET_EVENT, reset);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(CAMERA_RESET_EVENT, reset);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return <OrbitControls ref={controls} makeDefault camera={camera} enableDamping={false}
    onStart={() => { goal.current.active = false; useDisplayStore.setState({ freeOrbit: true, cinematic: false }); }}
    minDistance={15} maxDistance={4000} minZoom={0.1} maxZoom={10} />;
}

/** Three.js cameras are imperative objects owned by the renderer. */
function configureProjection(camera: THREE.Camera, halfHeight: number, aspect: number) {
  if (!(camera instanceof THREE.OrthographicCamera)) return;
  camera.zoom = 1;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.left = -halfHeight * aspect;
  camera.right = halfHeight * aspect;
  camera.updateProjectionMatrix();
}
