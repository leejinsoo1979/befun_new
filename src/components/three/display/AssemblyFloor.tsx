'use client';

import { useDisplayStore } from './displayStore';

export function AssemblyFloor() {
  const bounds = useDisplayStore((s) => s.stageBounds);
  const active = useDisplayStore((s) => s.exploded);
  if (!active || !bounds) return null;
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, bounds.center[2]]} receiveShadow userData={{ excludeFromAO: true }}>
      <planeGeometry args={[bounds.width + 150, bounds.depth + 150]} />
      <meshStandardMaterial color="#e2e0dc" roughness={0.95} />
    </mesh>
    <gridHelper args={[Math.max(bounds.width, bounds.depth) + 100, 30, '#c9c8c3', '#d3d2cd']} position={[0, -0.12, bounds.center[2]]} />
  </group>;
}
