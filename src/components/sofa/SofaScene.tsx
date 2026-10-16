'use client';
import { Suspense, useDeferredValue, useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { NeutralToneMapping, Vector3 } from 'three';
import type { OrbitControls as Controls } from 'three-stdlib';
import { sofaGeometry, type SofaDesign } from '@/lib/sofa/design';
import SofaSourceModel from './SofaSourceModel';
import SofaSelectionOutline from './SofaSelectionOutline';

function Camera({ width, depth, reset, zoom }: { width: number; depth: number; reset: number; zoom: number }) {
  const { camera, invalidate, size } = useThree();
  const controls = useRef<Controls>(null);
  useEffect(() => {
    const aspect = size.width / size.height;
    const distance = Math.max(width / Math.max(aspect, .6), depth * .9, 1.7) * 1.65;
    camera.position.set(-distance * .7, distance * .52, distance * 1.4);
    camera.lookAt(new Vector3(0, .35, 0));
    if (controls.current) { controls.current.target.set(0, .35, 0); controls.current.update(); }
    invalidate();
  }, [camera, width, depth, reset, invalidate, size.width, size.height]);
  const previousZoom = useRef(zoom);
  useEffect(() => {
    const change = zoom - previousZoom.current;
    previousZoom.current = zoom;
    const target = controls.current?.target;
    if (!change || !target) return;
    const offset = camera.position.clone().sub(target);
    offset.setLength(Math.max(1.4, Math.min(20, offset.length() * Math.pow(.85, change))));
    camera.position.copy(target).add(offset);
    controls.current?.update();
    invalidate();
  }, [zoom, camera, invalidate]);
  return <OrbitControls ref={controls} makeDefault enablePan minDistance={1.4} maxDistance={20} maxPolarAngle={Math.PI / 2 - .025} />;
}
type SceneProps = { design: SofaDesign; selected: number | null; onSelect: (index: number | null) => void; reset: number; zoom?: number };

// Keep the deferred value inside the Canvas React root so Suspense retains the assembled sofa while loading another module.
function Contents({ design, selected, onSelect, reset, zoom = 0 }: SceneProps) {
  const renderedDesign = useDeferredValue(design);
  const geometry = useMemo(() => sofaGeometry(renderedDesign), [renderedDesign]);
  return <>
    <Suspense fallback={null}>
      <Environment files="/three/sofa/environment/brown_photostudio_04_1k.hdr" />
      <SofaSourceModel design={renderedDesign} selected={selected} onSelect={onSelect} />
      <ContactShadows userData={{ sofaOutlineIgnore: true }} position={[0, 0, 0]} opacity={.55} scale={Math.max(8, geometry.width / 1000 + 2, geometry.totalDepth / 1000 + 2)} resolution={1024} blur={1.8} far={.8} frames={1} key={JSON.stringify(renderedDesign)} />
    </Suspense>
    <Camera width={geometry.width / 1000} depth={geometry.totalDepth / 1000} reset={reset} zoom={zoom} />
  </>;
}
export default function SofaScene(props: SceneProps) {
  return <Canvas shadows dpr={[1, 2]} gl={{ toneMapping: NeutralToneMapping, toneMappingExposure: 1 }} camera={{ fov: 35, near: .05, far: 80 }} frameloop="demand"
    onPointerMissed={event => { if (event.type === 'click' && event.button === 0) props.onSelect(null); }}>
    <color attach="background" args={['#e4e6e6']} />
    {/* Original sofaLighting + hdrIBLWithGrayBG, not the shelving light rig. */}
    <directionalLight position={[0, 3, 0]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-bias={-.0001} shadow-normalBias={.02} />
    <Contents {...props} />
    <SofaSelectionOutline />
  </Canvas>;
}
