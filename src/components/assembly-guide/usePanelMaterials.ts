'use client';

import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { birchEdgeTexture, createGuidePanelMaterials, disposeGuidePanelMaterials, type PanelAxis } from '@/lib/assembly-guide/panelMaterials';

export function usePanelMaterials(axis: PanelAxis, inside: boolean, opacity = .08) {
  const source = useLoader(TextureLoader, birchEdgeTexture);
  const result = useMemo(() => createGuidePanelMaterials(source, axis, inside, opacity), [axis, inside, opacity, source]);
  useEffect(() => () => disposeGuidePanelMaterials(result), [result]);
  return result;
}
