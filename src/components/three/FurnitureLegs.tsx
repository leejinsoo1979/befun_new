'use client';

import { useEffect, useMemo } from 'react';
import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { createMetalLegMaterial } from '@/lib/three/leg-material';
import { useGLTF } from '@react-three/drei';
import type { Material } from 'three';
import { Mesh } from 'three';
import { footPanelIndex } from './display/assemblyPlan';
import { planFurnitureLegs } from '@/lib/three/furniture-base';
import type { PanelData, StyleType } from '@/types/shelf';

/** Local reference renderer asset. Visual mesh only: it is not a machining drawing. */
export function FurnitureLegs({ panels, panelIndex, depth, style, material }: {
  panels: PanelData[]; panelIndex: number; depth: number; style: StyleType; material: Material;
}) {
  const color = useMaterialStore(s => s.currentColor);
  const woodFinish = color.startsWith('N_') || color.startsWith('C_');
  const finish = useShelfStore(s => s.legFinish);
  // Classic의 'panel' = 패널 재질 그대로. Natural에는 panel 옵션이 없으므로 silver로 표시
  const metalFinish = finish === 'panel' ? (color.startsWith('C_') ? null : 'silver') : finish;
  const metalMaterial = useMemo(() => woodFinish && metalFinish ? createMetalLegMaterial(metalFinish) : null, [woodFinish, metalFinish]);
  useEffect(() => () => { metalMaterial?.dispose(); }, [metalMaterial]);
  const legMaterial = metalMaterial ?? material;
  const { scene } = useGLTF('/models/furniture/long-leg.glb');
  const placements = useMemo(() => planFurnitureLegs(panels,depth,style)
    .filter(p=>footPanelIndex(panels,p.position)===panelIndex), [panels,depth,style,panelIndex]);
  const instances = useMemo(() => placements.map(() => {
    const object = scene.clone(true);
    object.traverse(child => { if (child instanceof Mesh) { child.material=legMaterial; child.castShadow=true; child.receiveShadow=true; } });
    return object;
  }), [scene,placements,legMaterial]);
  // GLB nodes contain metre units; shelf coordinates are centimetres.
  // Shared loader geometry and the parent's material remain owned by their providers.
  return <group dispose={null}>{placements.map((p,i)=><group key={i} position={p.position} rotation={[0,p.rotationY,0]} scale={100}>
    <primitive object={instances[i]} />
  </group>)}</group>;
}
