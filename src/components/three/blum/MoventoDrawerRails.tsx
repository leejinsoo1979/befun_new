'use client';

import { Suspense, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import MoventoDrawerCad from './MoventoDrawerCad';

/** Sibling of the moving drawer: cabinet remains fixed, runner and locks follow the actual drawer. */
export function MoventoDrawerRails({ drawer, origin, width, bottomUnder, front }: {
  drawer: RefObject<Group | null>; origin: [number, number, number];
  width: number; bottomUnder: number; front: number;
}) {
  const middle = useRef<Group>(null), runner = useRef<Group>(null);
  useFrame(() => {
    const travel = (drawer.current?.position.z ?? origin[2]) - origin[2];
    if (middle.current) middle.current.position.z = travel / 2;
    if (runner.current) runner.current.position.z = travel;
  });
  const common = { nominalLengthMm: 350 as const, cabinetInnerWidthMm: width * 10,
    bottomUnderMm: bottomUnder * 10, frontMm: front * 10 };
  return <group position={origin} userData={{ hardware: 'Blum MOVENTO 760H3500S', manufacturingReady: false,
    representation: 'mmmcraft CAD brackets and reconstructed rail profiles', motion: 'middle half-travel approximation' }}>
    <Suspense fallback={null}>
      <MoventoDrawerCad {...common} member="cabinet" />
      <group ref={middle}><MoventoDrawerCad {...common} member="intermediate" /></group>
      <group ref={runner}>
        <MoventoDrawerCad {...common} member="runner" />
        <MoventoDrawerCad {...common} locking />
      </group>
    </Suspense>
  </group>;
}
