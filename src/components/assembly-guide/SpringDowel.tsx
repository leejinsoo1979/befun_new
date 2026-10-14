'use client';

import { useEffect, useMemo, type RefObject } from 'react';
import { CatmullRomCurve3, Group, TubeGeometry, Vector3 } from 'three';

/** Existing back-panel demonstration, shared with rear supports. Supplier dimensions remain unconfirmed. */
export function SpringDowel({ extension, inside = true, housingColor = '#718674' }: { extension: RefObject<Group | null>; inside?: boolean; housingColor?: string }) {
  const spring = useMemo(() => {
    const points = Array.from({ length: 129 }, (_, index) => {
      const angle = index / 128 * Math.PI * 12;
      return new Vector3(Math.cos(angle) * 2.2, index / 128 * 9, Math.sin(angle) * 2.2);
    });
    return new TubeGeometry(new CatmullRomCurve3(points), 128, .18, 8, false);
  }, []);
  useEffect(() => () => spring.dispose(), [spring]);
  return <group>
    <mesh position={[0, -7, 0]}><cylinderGeometry args={[2.7, 2.7, 14, 24]} /><meshStandardMaterial color={housingColor} transparent={inside} opacity={inside ? .16 : 1} depthWrite={!inside} /></mesh>
    <group ref={extension}>
      <mesh position={[0, -6.5, 0]}><cylinderGeometry args={[1.9, 1.9, 13, 24]} /><meshStandardMaterial color="#b8c1bd" metalness={.75} roughness={.25} /></mesh>
      <mesh position={[0, -1.9, 0]}><sphereGeometry args={[1.9, 24, 12]} /><meshStandardMaterial color="#b8c1bd" metalness={.75} roughness={.25} /></mesh>
    </group>
    <mesh geometry={spring} position={[0, -13, 0]} name="example-spring" visible={inside} dispose={null}><meshStandardMaterial color="#c6a65e" metalness={.7} roughness={.35} /></mesh>
  </group>;
}
