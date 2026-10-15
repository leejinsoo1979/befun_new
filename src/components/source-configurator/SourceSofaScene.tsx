'use client';

import { Suspense, useDeferredValue, useEffect, useMemo, useRef } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { Mesh, MeshPhysicalMaterial, NeutralToneMapping } from 'three';
import type { OrbitControls as Controls } from 'three-stdlib';
import type { Part, Segment, Vec } from '@/lib/bookcase/types';
import type { SourceSnapshot } from '@/lib/catalog-entry/source-designs/types';
import { sofaSourceAssets, sourceFabric } from '@/lib/sofa/source-model';
import { createSourceMaterial } from '@/lib/sofa/source-material';
import { colorHex } from '@/lib/bookcase/material';
import SofaSelectionOutline from '@/components/sofa/SofaSelectionOutline';

const draco = new DRACOLoader().setDecoderPath('/three/sofa/draco/').setWorkerLimit(2);
const tuple = (v: Vec): [number, number, number] => [v.x, v.y, v.z];
const rotation = (part: Part | Segment): [number, number, number] => {
  const angles: [number, number, number] = [0, 0, 0];
  const value = ('rotation' in part ? part.rotation : null) as Part['rotation'];
  if (value) angles[['x', 'y', 'z'].indexOf(value.axis)] = value.angle;
  return angles;
};
function NativeMesh({ part, material }: { part: Part; material: MeshPhysicalMaterial }) {
  const asset = sofaSourceAssets[part.asset];
  const model = useLoader(GLTFLoader, asset.local, loader => { loader.setDRACOLoader(draco); });
  const instance = useMemo(() => {
    const scene = model.scene.clone(true);
    scene.traverse(object => { if (object instanceof Mesh) { object.material = material; object.castShadow = true; object.receiveShadow = false; } });
    return scene;
  }, [model, material]);
  const scale = tuple(part.size);
  if (part.mirror) scale[['x', 'y', 'z'].indexOf(part.mirror)] *= -1;
  return <group position={tuple(part.position)} rotation={rotation(part)} scale={scale}><primitive object={instance} dispose={null} /></group>;
}
function Metal({ part }: { part: Part }) {
  const material = useMemo(() => new MeshPhysicalMaterial({ color: colorHex(part.material?.colors.primary ?? 'black'), roughness: .43, metalness: .11, envMapIntensity: .94 }), [part.material]);
  useEffect(() => () => material.dispose(), [material]);
  return <NativeMesh part={part} material={material} />;
}
function Upholstery({ part, model }: { part: Part; model: 'uff' | 'smooth' }) {
  const { gl } = useThree();
  const color = part.material?.colors.primary;
  const fabric = useMemo(() => Array.from({ length: model === 'uff' ? 15 : 28 }, (_, id) => sourceFabric(model, id)).find(value => value?.color === color), [model, color]);
  if (!fabric) throw new Error(`Unknown source fabric: ${part.material?.colors.primary}`);
  const gi = model === 'uff' ? `${part.asset}_512` : part.asset.includes('_FR_') || part.asset.includes('_AR_') ? 'FOOT_AO_GI' : 'SEAT_AO_GI';
  const ids = [fabric.color, fabric.normal, gi, ...(fabric.sheenMap ? [fabric.sheenMap] : [])];
  const textures = useLoader(KTX2Loader, ids.map(id => sofaSourceAssets[id].local), loader => { loader.setTranscoderPath('/three/sofa/basis/').detectSupport(gl); });
  const material = useMemo(() => createSourceMaterial(fabric, textures, gl.capabilities.getMaxAnisotropy()), [fabric, textures, gl]);
  useEffect(() => () => {
    new Set([material.map, material.normalMap, material.sheenRoughnessMap, material.lightMap, material.aoMap]).forEach(texture => texture?.dispose());
    material.dispose();
  }, [material]);
  return <NativeMesh part={part} material={material} />;
}
function Module({ segment, model, index, selected, onSelect }: { segment: Segment; model: 'uff' | 'smooth'; index: number; selected: number | null; onSelect: (index: number | null) => void }) {
  return <group name={`source-sofa-${index}`} userData={{ sofaSelected: index === selected }} position={tuple(segment.position)} rotation={rotation(segment)} scale={tuple(segment.size)} onClick={event => { event.stopPropagation(); onSelect(index); }}>
    {segment.geometries.map((part, i) => part.material?.name === 'paintedMetal' ? <Metal key={`${part.asset}-${i}`} part={part} /> : <Upholstery key={`${part.asset}-${i}`} part={part} model={model} />)}
  </group>;
}
function Camera({ width, height, depth, reset, zoom }: { width: number; height: number; depth: number; reset: number; zoom: number }) {
  const { camera, invalidate, size } = useThree();
  const controls = useRef<Controls>(null);
  const targetY = Math.min(height / 2, .35);
  useEffect(() => {
    const distance = Math.max(width / Math.max(size.width / size.height, .6), depth * .9, height * 1.4, .8) * 1.65;
    camera.position.set(-distance * .7, targetY + distance * .52, distance * 1.4);
    camera.lookAt(0, targetY, 0);
    if (controls.current) { controls.current.target.set(0, targetY, 0); controls.current.update(); }
    invalidate();
  }, [camera, width, height, depth, reset, invalidate, size.width, size.height, targetY]);
  const previous = useRef(zoom);
  useEffect(() => {
    const delta = zoom - previous.current;
    previous.current = zoom;
    if (!delta || !controls.current) return;
    const target = controls.current.target;
    const offset = camera.position.clone().sub(target);
    offset.setLength(Math.max(.4, Math.min(25, offset.length() * Math.pow(.85, delta))));
    camera.position.copy(target).add(offset);
    controls.current.update();
    invalidate();
  }, [zoom, camera, invalidate]);
  return <OrbitControls ref={controls} makeDefault enablePan minDistance={.4} maxDistance={25} maxPolarAngle={Math.PI / 2 - .025} />;
}
function Contents({ snapshot, model, selected, onSelect, reset, zoom }: Props) {
  const current = useDeferredValue(snapshot);
  const geometry = current.geometry;
  const segments = current.schema.find(group => group.key === 'sofaParts')?.children ?? [];
  return <Suspense fallback={null}>
    <Environment files="/three/sofa/environment/brown_photostudio_04_1k.hdr" />
    <group position={[0, 0, -geometry.depth / 2000]}>{segments.map((segment, i) => <Module key={`${segment.name}-${i}`} segment={segment} model={model} index={i} selected={selected} onSelect={onSelect} />)}</group>
    <ContactShadows userData={{ sofaOutlineIgnore: true }} position={[0, 0, 0]} opacity={.55} scale={Math.max(8, geometry.width / 1000 + 2, geometry.depth / 1000 + 2)} resolution={1024} blur={1.8} far={.8} frames={1} key={JSON.stringify(current.preset)} />
    <Camera width={geometry.width / 1000} height={geometry.height / 1000} depth={geometry.depth / 1000} reset={reset} zoom={zoom} />
  </Suspense>;
}
interface Props { snapshot: SourceSnapshot; model: 'uff' | 'smooth'; selected: number | null; onSelect: (index: number | null) => void; reset: number; zoom: number }
export default function SourceSofaScene(props: Props) {
  return <Canvas shadows dpr={[1, 2]} gl={{ toneMapping: NeutralToneMapping, toneMappingExposure: 1 }} camera={{ fov: 35, near: .02, far: 80 }} frameloop="demand" onPointerMissed={event => { if (event.type === 'click' && event.button === 0) props.onSelect(null); }}>
    <color attach="background" args={['#e4e6e6']} />
    <directionalLight position={[0, 3, 0]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-bias={-.0001} shadow-normalBias={.02} />
    <Contents {...props} />
    <SofaSelectionOutline />
  </Canvas>;
}
