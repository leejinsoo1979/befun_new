'use client';

import { useEffect, useMemo } from 'react';
import { BoxGeometry, type BufferGeometry } from 'three';
import { createMdfCutMaterial, isLaminateSkin, mapPanelEdgeUvs, type PanelAxis } from '@/lib/assembly-guide/panelMaterials';
import { usePanelMaterials } from './usePanelMaterials';

/** Dimensions are scene millimetres. Hardware geometry and board dimensions stay unchanged. */
export function GuidePanel({ size, axis, inside, position = [0, 0, 0], source, finish, mdfCuts = false }: { size: readonly [number, number, number]; axis: PanelAxis; inside: boolean; position?: [number, number, number]; source?: BufferGeometry; finish?: string; mdfCuts?: boolean }) {
  const [w, h, d] = size;
  const materials = usePanelMaterials(axis, inside, .08, finish);
  const cut = useMemo(() => mdfCuts ? createMdfCutMaterial(inside) : null, [mdfCuts, inside]);
  useEffect(() => () => { cut?.material.dispose(); cut?.texture.dispose(); }, [cut]);
  const geometry = useMemo(() => {
    const value = source ? source.clone() : new BoxGeometry(w, h, d);
    mapPanelEdgeUvs(value, axis, [w, h, d][axis], -[w, h, d][axis] / 2);
    // CSG/extruded geometry can have many groups. Assign each actual triangle by
    // its normal; bore walls remain bare plywood, both broad faces laminate.
    if (source) {
      const normal = value.getAttribute('normal');
      const position = value.getAttribute('position');
      const count = value.index?.count ?? normal.count;
      value.clearGroups();
      let start = 0, previous = -1;
      for (let i = 0; i < count; i += 3) {
        const vertex = value.index ? value.index.getX(i) : i;
        const n = [normal.getX(vertex), normal.getY(vertex), normal.getZ(vertex)];
        const coordinates = [0, 1, 2].map(corner => {
          const v = value.index ? value.index.getX(i + corner) : i + corner;
          return [position.getX(v), position.getY(v), position.getZ(v)][axis];
        });
        const outside = [0, 1, 2].some(side => Math.abs(n[side]) > .999 && [0, 1, 2].every(corner => {
          const v = value.index ? value.index.getX(i + corner) : i + corner;
          const at = [position.getX(v), position.getY(v), position.getZ(v)][side];
          return Math.abs(Math.abs(at) - [w, h, d][side] / 2) < .001;
        }));
        const material = isLaminateSkin(n[axis], coordinates, [w, h, d][axis]) ? 0 : mdfCuts && !outside ? 2 : 1;
        if (previous !== material) {
          if (i > 0) value.addGroup(start, i - start, previous);
          start = i; previous = material;
        }
      }
      value.addGroup(start, count - start, previous);
    }
    return value;
  }, [w, h, d, axis, source, mdfCuts]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={source ? [materials.laminate, materials.birch, cut?.material ?? materials.birch] : materials.faces} position={position} castShadow={!inside} receiveShadow={!inside} dispose={null} />;
}
