'use client';

import { useDisplayStore } from './displayStore';

export function AssemblyFloor() {
  const bounds = useDisplayStore((s) => s.stageBounds);
  const active = useDisplayStore((s) => s.exploded);
  if (!active || !bounds) return null;
  // A transparent shadow catcher grounds the pieces without a mat or visible grid.
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow userData={{ excludeFromAO: true }}>
    <planeGeometry args={[20000, 20000]} />
    <shadowMaterial transparent opacity={0.13} depthWrite={false} />
  </mesh>;
}
