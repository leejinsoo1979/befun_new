'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Mesh, SRGBColorSpace } from 'three';
import type { AssemblyPartPlan } from './assemblyPlan';
import { useDisplayStore } from './displayStore';
import { partLabelLayout } from './labelLayout';

export function PartLabel({ part }: { part: AssemblyPartPlan }) {
  const exploded = useDisplayStore(s => s.exploded);
  return exploded && part.size && part.id.startsWith('panel-') ? <Sticker part={part} /> : null;
}

function Sticker({ part }: { part: AssemblyPartPlan }) {
  const mesh = useRef<Mesh>(null);
  const layout = useMemo(() => partLabelLayout(part), [part]);
  const texture = useMemo(() => {
    if (!layout) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 170;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#fbfcfa';
    ctx.beginPath();
    ctx.roundRect(2, 2, 508, 166, 12);
    ctx.fill();
    ctx.strokeStyle = '#d6dcd6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#747d74';
    ctx.font = '500 20px Arial, sans-serif';
    ctx.fillText('B E F U N   /   P A R T', 28, 31);
    ctx.fillStyle = '#202820';
    ctx.font = '600 62px Arial, sans-serif';
    ctx.fillText(layout.code, 26, 99);
    ctx.fillStyle = '#d6dcd6';
    ctx.fillRect(183, 70, 2, 60);
    ctx.fillStyle = '#384438';
    ctx.font = '500 33px Arial, "Apple SD Gothic Neo", sans-serif';
    ctx.fillText(layout.name, 208, 97);
    ctx.fillStyle = '#339922';
    ctx.beginPath();
    ctx.arc(477, 30, 5, 0, Math.PI * 2);
    ctx.fill();
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return map;
  }, [layout]);
  useEffect(() => () => texture?.dispose(), [texture]);
  useFrame(() => {
    const sticker = mesh.current;
    if (!sticker?.parent) return;
    // Reveal after the board leaves its joint; hide again as it docks during assembly.
    sticker.visible = Math.hypot(sticker.parent.position.x - part.anchor[0],
      sticker.parent.position.y - part.anchor[1], sticker.parent.position.z - part.anchor[2]) > 1;
  });
  if (!layout || !texture) return null;
  return <mesh ref={mesh} position={layout.position} quaternion={layout.quaternion} visible={false}
    userData={{ displayDecor: true, displayPartLabel: true, excludeFromAO: true }}>
    <planeGeometry args={[layout.width, layout.height]} />
    <meshBasicMaterial map={texture} transparent toneMapped={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
  </mesh>;
}
