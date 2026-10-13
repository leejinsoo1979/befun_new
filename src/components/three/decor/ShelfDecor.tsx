'use client';

import { useEffect, useMemo } from 'react';
import type { PanelData } from '@/types/shelf';
import type { DoorPlacement, DrawerPlacement } from '@/lib/three/hardware';
import { useDisplayStore } from '../display/displayStore';
import { arrangeDecor, decorSlots } from './layout';
import { buildDecor, createDecorAssets } from './models';

export function ShelfDecor({ panels, doors, drawers }: {panels:PanelData[];doors:DoorPlacement[];drawers:DrawerPlacement[]}) {
  const visible=useDisplayStore(s=>s.showDecor && s.phase==='assembled' && !s.exploded && !s.showBores && s.appearance==='realistic');
  // Mount assets only while wanted; ordinary camera/animation frame updates do not rebuild them.
  return visible?<DecorObjects panels={panels} doors={doors} drawers={drawers}/>:null;
}
function DecorObjects({panels,doors,drawers}:{panels:PanelData[];doors:DoorPlacement[];drawers:DrawerPlacement[]}) {
  const arrangement=useMemo(()=>arrangeDecor(decorSlots(panels,doors,drawers)),[panels,doors,drawers]);
  const assets=useMemo(()=>createDecorAssets(),[]);
  useEffect(()=>()=>assets.dispose(),[assets]);
  const model=useMemo(()=>buildDecor(arrangement,assets),[arrangement,assets]);
  useEffect(()=>()=>model.dispose(),[model]);
  return <primitive object={model.root} dispose={null}/>;
}
