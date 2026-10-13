import { create } from 'zustand';
import { changeHardwareMode, hardwareModes, resolveHardwareRows, type HardwareMode, type HardwareRowStyles } from '@/lib/three/hardware-state';

interface HardwareState {
  doorsCreatedLayers: number[];
  drawersCreatedLayers: number[];
  rowStyles: HardwareRowStyles;
  openDoors: Record<number, boolean>;
  openDrawers: Record<number, boolean>;
  setMode: (layer:number, kind:'doors'|'drawers', mode:HardwareMode) => void;
  restore: (doors:number[], drawers:number[], rowStyles?:HardwareRowStyles) => void;
  toggleDoor: (layer:number) => void;
  toggleDrawer: (layer:number) => void;
  addDoorLayer: (layer:number) => void;
  removeDoorLayer: (layer:number) => void;
  addDrawerLayer: (layer:number) => void;
  removeDrawerLayer: (layer:number) => void;
  setDoorOpen: (layer:number, open:boolean) => void;
  setDrawerOpen: (layer:number, open:boolean) => void;
  reset: () => void;
}
function layersFor(rowStyles: HardwareRowStyles) {
  const entries = Object.entries(rowStyles);
  return {
    rowStyles,
    doorsCreatedLayers: entries.filter(([,c])=>hardwareModes(c).doors !== 'none').map(([r])=>Number(r)),
    drawersCreatedLayers: entries.filter(([,c])=>hardwareModes(c).drawers !== 'none').map(([r])=>Number(r)),
  };
}
export const useHardwareStore = create<HardwareState>((set,get)=>({
  doorsCreatedLayers:[],drawersCreatedLayers:[],rowStyles:{},openDoors:{},openDrawers:{},
  setMode:(layer,kind,mode)=>set(s=>{
    const rows = resolveHardwareRows(s.doorsCreatedLayers,s.drawersCreatedLayers,s.rowStyles);
    rows[layer]=changeHardwareMode(rows[layer] ?? 11,kind,mode);
    return {...layersFor(rows),openDoors:{...s.openDoors,[layer]:false},openDrawers:{...s.openDrawers,[layer]:false}};
  }),
  restore:(doors,drawers,rows)=>set({...layersFor(resolveHardwareRows(doors,drawers,rows)),openDoors:{},openDrawers:{}}),
  toggleDoor:layer=>get().setMode(layer,'doors',get().doorsCreatedLayers.includes(layer)?'none':'some'),
  toggleDrawer:layer=>get().setMode(layer,'drawers',get().drawersCreatedLayers.includes(layer)?'none':'some'),
  addDoorLayer:layer=>get().setMode(layer,'doors','some'),
  removeDoorLayer:layer=>get().setMode(layer,'doors','none'),
  addDrawerLayer:layer=>get().setMode(layer,'drawers','some'),
  removeDrawerLayer:layer=>get().setMode(layer,'drawers','none'),
  setDoorOpen:(layer,open)=>set(s=>({openDoors:{...s.openDoors,[layer]:open}})),
  setDrawerOpen:(layer,open)=>set(s=>({openDrawers:{...s.openDrawers,[layer]:open}})),
  reset:()=>set({doorsCreatedLayers:[],drawersCreatedLayers:[],rowStyles:{},openDoors:{},openDrawers:{}}),
}));
