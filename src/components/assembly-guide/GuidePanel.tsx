'use client';

import { useEffect, useMemo } from 'react';
import { BoxGeometry, type BufferGeometry } from 'three';
import { mapPanelEdgeUvs, type PanelAxis } from '@/lib/assembly-guide/panelMaterials';
import { usePanelMaterials } from './usePanelMaterials';

/** Dimensions are scene millimetres. Hardware geometry and board dimensions stay unchanged. */
export function GuidePanel({ size, axis, inside, position = [0, 0, 0], source }: { size: readonly [number, number, number]; axis: PanelAxis; inside: boolean; position?: [number, number, number]; source?: BufferGeometry }) {
  const [w, h, d] = size;
  const materials = usePanelMaterials(axis, inside);
  const geometry = useMemo(() => {
    const value = source ? source.clone() : new BoxGeometry(w, h, d);
    mapPanelEdgeUvs(value, axis, [w, h, d][axis], -[w, h, d][axis] / 2);
    // CSG/extruded geometry can have many groups. Assign each actual triangle by
    // its normal; bore walls remain bare plywood, both broad faces laminate.
    if (source) {
      const normal = value.getAttribute('normal');
      const count = value.index?.count ?? normal.count;
      value.clearGroups();
      let start = 0, previous = -1;
      for (let i = 0; i < count; i += 3) {
        const vertex = value.index ? value.index.getX(i) : i;
        const n = [normal.getX(vertex), normal.getY(vertex), normal.getZ(vertex)];
        const material = Math.abs(n[axis]) > .999 ? 0 : 1;
        if (previous !== material) {
          if (i > 0) value.addGroup(start, i - start, previous);
          start = i; previous = material;
        }
      }
      value.addGroup(start, count - start, previous);
    }
    return value;
  }, [w, h, d, axis, source]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={source ? [materials.laminate, materials.birch] : materials.faces} position={position} castShadow={!inside} receiveShadow={!inside} dispose={null} />;
}
