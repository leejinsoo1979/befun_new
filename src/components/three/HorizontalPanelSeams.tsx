'use client';

import { Line } from '@react-three/drei';
import { useMemo } from 'react';
import type { HorizontalSeam } from '@/lib/three/horizontal-seams';

/** A thin, depth-tested joint accent at a real split. Screen-space width avoids
 * disappearing subpixel seams at overview zoom. It is not a physical saw gap. */
export function HorizontalPanelSeams({ seam }: { seam: HorizontalSeam }) {
  const points = useMemo<[number, number, number][]>(() => {
    // 0.05mm surface lift prevents coplanar flicker; dimensions stay unchanged.
    const halfHeight = seam.h / 2 + 0.005;
    const halfDepth = seam.d / 2 + 0.005;
    return [
      [seam.x, seam.y + halfHeight, seam.z - halfDepth],
      [seam.x, seam.y + halfHeight, seam.z + halfDepth],
      [seam.x, seam.y - halfHeight, seam.z + halfDepth],
      [seam.x, seam.y - halfHeight, seam.z - halfDepth],
      [seam.x, seam.y + halfHeight, seam.z - halfDepth],
    ];
  }, [seam]);
  return <Line points={points} color="#36332f" lineWidth={0.85}
    transparent opacity={0.5} depthTest depthWrite={false} toneMapped={false}
    raycast={() => {}} userData={{ excludeFromAO: true, horizontalJointAccent: true }} />;
}
