'use client';
import { Suspense, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createElectronicMaterials, createSmallLamp } from '@/components/three/decor/electronics';

function ImportedProp({ name, position }: { name: 'macbook-open' | 'coffee' | 'phone'; position: [number, number, number] }) {
  const { scene } = useGLTF(`/models/desk/7987/${name}.glb?v=normals-3`);
  const instance = useMemo(() => {
    const clone = scene.clone(true);
    // Furniture-scale shadow maps cannot resolve these millimetre-thin surfaces.
    // Keep their tabletop shadows, but avoid self-shadow acne on imported props.
    clone.traverse(o => {
      if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = false; o.raycast = () => {}; }
    });
    return clone;
  }, [scene]);
  // Geometry/material/texture ownership stays with useGLTF's shared asset cache.
  return <primitive object={instance} position={position} dispose={null} />;
}

/** GLB coordinates are centimetres, tabletop contact y=0. Display-only, excluded from CNC. */
export function DeskAccessories({ width, depth, height, legroomX }: { width: number; depth: number; height: number; legroomX: number }) {
  const lamp = useMemo(() => {
    const materials = createElectronicMaterials();
    const root = createSmallLamp(materials);
    root.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; o.raycast = () => {}; } });
    return { root, materials };
  }, []);
  useEffect(() => () => {
    lamp.root.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
    Object.values(lamp.materials).forEach(m => m.dispose());
  }, [lamp]);
  const x = Math.max(-width / 2 + 20, Math.min(width / 2 - 20, legroomX));
  const side = x <= 0 ? 1 : -1;
  const coffeeX = Math.max(-width / 2 + 10, Math.min(width / 2 - 10, x + side * 28));
  const phoneX = Math.max(-width / 2 + 6, Math.min(width / 2 - 6, x - side * 24));
  return <group name="desk-styling" userData={{ decorative: true, excludeFromManufacturing: true }}>
    <primitive object={lamp.root} position={[side * (width / 2 - 13), height + .02, 11]} dispose={null} />
    <Suspense fallback={null}>
      <ImportedProp name="macbook-open" position={[x, height + .02, depth * .55]} />
      {depth >= 50 && <ImportedProp name="coffee" position={[coffeeX, height + .02, depth - 11]} />}
      {width >= 140 && depth >= 50 && <ImportedProp name="phone" position={[phoneX, height + .02, depth - 11]} />}
    </Suspense>
  </group>;
}
