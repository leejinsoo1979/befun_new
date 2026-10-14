import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/** Inside the model Suspense boundary, signal after its first rendered frame. */
export function SceneReady({ onReady }: { onReady: (ready: boolean) => void }) {
  const frames = useRef(0);
  useFrame(() => { if (++frames.current === 2) onReady(true); });
  return null;
}
