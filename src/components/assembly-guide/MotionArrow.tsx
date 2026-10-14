'use client';

import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import styles from './guide.module.css';

type Direction = 'up' | 'down' | 'slide' | 'left';
const rotations: Record<Direction, [number, number, number]> = {
  up: [0, 0, 0], down: [Math.PI, 0, 0],
  slide: [-Math.PI / 2, 0, 0], left: [0, 0, Math.PI / 2],
};

/** Pixel-sized cue, oriented by the real world-space motion axis, including parent transforms. */
export function MotionArrow({ direction, progress }: { direction: Direction; progress: RefObject<number> }) {
  const root = useRef<Group>(null);
  const marker = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const glyph = useRef<SVGGElement>(null);
  const points = useMemo(() => ({ from: new Vector3(), to: new Vector3() }), []);

  useFrame(({ camera, size }) => {
    if (!root.current || !marker.current || !svg.current || !glyph.current) return;
    let visible = true;
    for (let node: Group['parent'] = root.current; node; node = node.parent) visible = visible && node.visible;
    root.current.updateWorldMatrix(true, false);
    points.from.set(0, 0, 0).applyMatrix4(root.current.matrixWorld).project(camera);
    points.to.set(0, 14, 0).applyMatrix4(root.current.matrixWorld).project(camera);
    const dx = (points.to.x - points.from.x) * size.width / 2;
    const dy = (points.from.y - points.to.y) * size.height / 2;
    visible = visible && points.from.z > -1 && points.from.z < 1 && Math.hypot(dx, dy) > 2;
    marker.current.style.visibility = visible ? 'visible' : 'hidden';
    svg.current.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    // Pose time drives the cue, so pause and seek freeze/restore it exactly.
    const phase = (Math.max(0, Math.min(1, progress.current)) * 3) % 1;
    glyph.current.style.transform = `translateX(${phase * 6 - 3}px)`;
    glyph.current.style.opacity = String(.72 + Math.sin(phase * Math.PI) * .28);
  });

  return <group ref={root} rotation={rotations[direction]}>
    <Html center zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={marker} className={styles.motionArrow} aria-hidden="true" data-motion-arrow={direction}>
        <svg ref={svg} viewBox="0 0 64 40" className={styles.motionArrowSvg}>
          <path className={styles.motionArrowTrail} d="M7 20H20" />
          <g ref={glyph} className={styles.motionArrowGlyph}>
            <path d="M12 18H39V12L51 20L39 28V22H12Z" />
          </g>
        </svg>
      </div>
    </Html>
  </group>;
}
