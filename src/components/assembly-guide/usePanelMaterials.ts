'use client';

import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { birchEdgeTexture, createGuidePanelMaterials, disposeGuidePanelMaterials, type PanelAxis } from '@/lib/assembly-guide/panelMaterials';

export function usePanelMaterials(axis: PanelAxis, inside: boolean, opacity = .08, finish = '#e4e7eb') {
  const source = useLoader(TextureLoader, birchEdgeTexture);
  const result = useMemo(() => createGuidePanelMaterials(source, axis, inside, opacity, finish), [axis, inside, opacity, finish, source]);
  useEffect(() => () => disposeGuidePanelMaterials(result), [result]);
  return result;
}
