'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { Shelf } from '@/components/three/Shelf';
import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { getColorCategory } from '@/lib/three/materials';
import type { StyleType } from '@/types/shelf';

/**
 * 개발용 가구 렌더러(/render-shelf). 컨피규레이터와 같은 Shelf·재질·톤매핑으로 가구만 투명 배경에 그린다.
 * 파라미터: style, color, width, height 또는 rows(행 높이 쉼표), depth, density, back(1), doors/drawers(행 번호 쉼표), yaw/pitch(도), fov, w/h(px)
 */
function Studio() {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={1.9}>
      <Lightformer form="rect" intensity={2} position={[0, 6, 3]} rotation-x={Math.PI / 2} scale={[12, 8, 1]} />
      <Lightformer form="rect" intensity={1.2} position={[-6, 2, 4]} rotation-y={Math.PI / 3} scale={[5, 7, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[6, 2, 4]} rotation-y={-Math.PI / 3} scale={[5, 7, 1]} />
      <Lightformer form="rect" intensity={0.6} position={[0, 1.5, 7]} scale={[10, 4, 1]} />
    </Environment>
  );
}

function FitCamera({ yaw, pitch }: { yaw: number; pitch: number }) {
  const { camera, size } = useThree();
  const width = useShelfStore((s) => s.width);
  const height = useShelfStore((s) => s.height);
  const depth = useShelfStore((s) => s.depth);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const center = new THREE.Vector3(0, height / 2 + 1, depth / 2);
    const radius = Math.hypot(width, height, depth) / 2;
    const fov = THREE.MathUtils.degToRad(cam.fov);
    const aspect = size.width / size.height;
    const fit = radius / Math.sin(Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * aspect)) / 2) * 1.02;
    const dir = new THREE.Vector3(Math.sin(THREE.MathUtils.degToRad(yaw)) * Math.cos(THREE.MathUtils.degToRad(pitch)),
      Math.sin(THREE.MathUtils.degToRad(pitch)), Math.cos(THREE.MathUtils.degToRad(yaw)) * Math.cos(THREE.MathUtils.degToRad(pitch)));
    cam.position.copy(center.clone().addScaledVector(dir, fit));
    cam.lookAt(center);
    cam.updateProjectionMatrix();
  }, [camera, size, width, height, depth, yaw, pitch]);
  return null;
}

export default function ShelfRender() {
  const params = useSearchParams();
  const [ready, setReady] = useState(false);
  const num = (key: string, fallback: number) => (params.get(key) !== null ? Number(params.get(key)) : fallback);
  const layers = (key: string) => (params.get(key) ?? '').split(',').filter(Boolean).map(Number);

  useEffect(() => {
    const shelf = useShelfStore.getState();
    shelf.setStyle((params.get('style') ?? 'grid') as StyleType);
    shelf.setWidth(num('width', 120));
    const rows = (params.get('rows') ?? '').split(',').filter(Boolean).map(Number);
    if (rows.length) {
      shelf.setHeight(2 + rows.reduce((total, row) => total + row + 2, 0));
      shelf.setRowHeights(rows);
    } else shelf.setHeight(num('height', 113));
    shelf.setDepth(num('depth', 32));
    shelf.setDensity(num('density', 50));
    shelf.setHasBackPanel(params.get('back') === '1');
    const color = params.get('color') ?? 'S_Midnight Blue';
    useMaterialStore.getState().setColor(color, getColorCategory(color));
    const hardware = useHardwareStore.getState();
    layers('doors').forEach((l) => hardware.addDoorLayer(l));
    layers('drawers').forEach((l) => hardware.addDrawerLayer(l));
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const w = num('w', 1600), h = num('h', 1600);
  return (
    <div style={{ width: w, height: h, background: 'transparent' }} data-ready={ready ? '1' : '0'} id="shelf-render">
      <Canvas
        shadows
        dpr={1}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.NeutralToneMapping; gl.toneMappingExposure = num('exposure', 1.15); gl.setClearColor(0x000000, 0); }}
        camera={{ fov: num('fov', 30), near: 1, far: 5000 }}
      >
        <Studio />
        <directionalLight position={[-160, 320, 300]} intensity={num('key', 2.2)} />
        <hemisphereLight args={['#ffffff', '#d8d2c8', num('fill', 0.6)]} />
        <Suspense fallback={null}>
          <Shelf presentation />
        </Suspense>
        <FitCamera yaw={num('yaw', -18)} pitch={num('pitch', 8)} />
      </Canvas>
    </div>
  );
}
