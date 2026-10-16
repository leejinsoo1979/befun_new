'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useShelfStore } from '@/stores/useShelfStore';
import { baseHeight } from '@/lib/three/furniture-base';
import { CAMERA_RESET_EVENT } from '../cameraEvents';
import { useDisplayStore } from './displayStore';
import { assemblyPlayback, cinematicShot } from './cinematic';
import { fitView } from './viewMath';

export function ViewCamera() {
  const projection = useDisplayStore((s) => s.projection);
  // Match Scene's cm-scale depth range so the default camera preserves close surfaces.
  return <>
    {projection === 'orthographic'
      ? <OrthographicCamera makeDefault position={[0, 100, 500]} near={1} far={5000} />
      : <PerspectiveCamera makeDefault position={[0, 100, 500]} fov={40} near={1} far={5000} />}
    <CameraControls />
  </>;
}

function CameraControls() {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const baseType = useShelfStore(s=>s.baseType);
  const footHeight = baseHeight(baseType);
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
  const appearance = useDisplayStore(s=>s.appearance);
  const wasCinematic=useRef(false);
  const shotPosition = useMemo(() => new THREE.Vector3(), []);
  const shotTarget = useMemo(() => new THREE.Vector3(), []);
  const goal = useRef({ position: new THREE.Vector3(), target: new THREE.Vector3(), halfHeight: 100, active: false, camera: null as THREE.Camera | null });
  // Some presets carry a nominal height differing from the sum of their rows.
  // The store retains up to 12 row heights, including inactive rows.
  const bodyHeight = Math.max(height,
    rows.slice(0, numRows).reduce((sum, rowHeight) => sum + rowHeight, 0) + thickness * (numRows + 1));

  // 시점 프리셋이 바뀐 경우(보기 선택·재설정·분해)에만 방향을 프리셋으로 돌린다.
  // 폭/높이/깊이·화면 크기만 바뀌면 사용자가 돌려 둔 현재 방향을 유지하고 거리·중심만 다시 맞춘다.
  const lastPreset = useRef('');
  useLayoutEffect(() => {
    const bounds = exploded ? stageBounds : null;
    const aspect = size.width / Math.max(1, size.height);
    // 스튜디오 배경(인물 포함)이 보이는 정면/기본 시점은 왼쪽 인물(가구 왼쪽 56cm, 키 약 175cm)까지 담는다.
    // 가구는 화면 가운데에 두기 위해 좌우 대칭으로 폭을 넓힌다.
    const withPerson = !bounds && appearance === 'realistic' && (view === 'front' || view === 'standard');
    const frameHeight = withPerson ? Math.max(bodyHeight + footHeight + 10, 185) : bodyHeight + footHeight + 10;
    const frame = fitView(bounds?.width ?? (withPerson ? width + 2 * (56 + 40) : width), bounds?.height ?? frameHeight, bounds?.depth ?? depth + 30, aspect, view);
    const target = bounds ? new THREE.Vector3(...bounds.center) : new THREE.Vector3(0, withPerson ? (frameHeight - 10) / 2 : (bodyHeight + footHeight) / 2, depth / 2);
    const destination = goal.current;
    const presetKey = `${view}|${revision}|${exploded}`;
    const presetChanged = lastPreset.current !== presetKey;
    lastPreset.current = presetKey;
    const direction = frame.direction.clone();
    if (!presetChanged && destination.camera === camera && controls.current) {
      const current = camera.position.clone().sub(controls.current.target);
      if (current.lengthSq() > 1e-6) direction.copy(current.normalize());
    }
    destination.position.copy(target).addScaledVector(direction, frame.distance);
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
  }, [camera, width, bodyHeight, footHeight, depth, view, exploded, revision, stageBounds, appearance, size.width, size.height]);

  useFrame((_, delta) => {
    const state=useDisplayStore.getState();
    const tracking=state.cinematic && !state.freeOrbit && assemblyPlayback.active && !!stageBounds && camera instanceof THREE.PerspectiveCamera;
    if(tracking && controls.current && stageBounds) {
      wasCinematic.current=true;
      goal.current.active=false;
      if(state.paused) return;
      const shot=cinematicShot({phase:assemblyPlayback.phase,progress:assemblyPlayback.elapsed/assemblyPlayback.duration,outro:assemblyPlayback.outro,
        width,height:bodyHeight+footHeight,depth,aspect:size.width/Math.max(1,size.height),focus:assemblyPlayback.focus,kind:assemblyPlayback.kind,beat:assemblyPlayback.beat,extent:assemblyPlayback.extent,elapsed:assemblyPlayback.elapsed,layout:assemblyPlayback.layout ?? undefined,stage:stageBounds});
      const blend=1-Math.exp(-Math.min(delta,.05)*4.8);
      camera.up.set(0,1,0);
      camera.position.lerp(shotPosition.set(...shot.position),blend);
      controls.current.target.lerp(shotTarget.set(...shot.target),blend);
      controls.current.update();
      return;
    }
    if(wasCinematic.current) {
      wasCinematic.current=false;
      // Hold the closing shot instead of snapping back to the generic preset.
      if(state.progress===1 || state.freeOrbit) goal.current.active=false;
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

  return <OrbitControls ref={controls} makeDefault camera={camera} enableDamping={false} zoomToCursor
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
