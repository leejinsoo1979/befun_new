import { create } from 'zustand';

interface HardwareState {
  doorsCreatedLayers: number[];
  drawersCreatedLayers: number[];
  openDoors: Record<number, boolean>;
  openDrawers: Record<number, boolean>;

  // Actions
  toggleDoor: (layer: number) => void;
  toggleDrawer: (layer: number) => void;
  addDoorLayer: (layer: number) => void;
  removeDoorLayer: (layer: number) => void;
  addDrawerLayer: (layer: number) => void;
  removeDrawerLayer: (layer: number) => void;
  setDoorOpen: (layer: number, open: boolean) => void;
  setDrawerOpen: (layer: number, open: boolean) => void;
  reset: () => void;
}

export const useHardwareStore = create<HardwareState>((set, get) => ({
  doorsCreatedLayers: [],
  drawersCreatedLayers: [],
  openDoors: {},
  openDrawers: {},

  toggleDoor: (layer) => {
    const { doorsCreatedLayers } = get();
    if (doorsCreatedLayers.includes(layer)) {
      get().removeDoorLayer(layer);
    } else {
      get().addDoorLayer(layer);
    }
  },

  toggleDrawer: (layer) => {
    const { drawersCreatedLayers } = get();
    if (drawersCreatedLayers.includes(layer)) {
      get().removeDrawerLayer(layer);
    } else {
      get().addDrawerLayer(layer);
    }
  },

  addDoorLayer: (layer) =>
    set((s) => ({
      doorsCreatedLayers: [...s.doorsCreatedLayers, layer],
      // 서랍이 있으면 제거
      drawersCreatedLayers: s.drawersCreatedLayers.filter((l) => l !== layer),
    })),

  removeDoorLayer: (layer) =>
    set((s) => ({
      doorsCreatedLayers: s.doorsCreatedLayers.filter((l) => l !== layer),
      openDoors: { ...s.openDoors, [layer]: false },
    })),

  addDrawerLayer: (layer) =>
    set((s) => ({
      drawersCreatedLayers: [...s.drawersCreatedLayers, layer],
      // 도어가 있으면 제거
      doorsCreatedLayers: s.doorsCreatedLayers.filter((l) => l !== layer),
    })),

  removeDrawerLayer: (layer) =>
    set((s) => ({
      drawersCreatedLayers: s.drawersCreatedLayers.filter((l) => l !== layer),
      openDrawers: { ...s.openDrawers, [layer]: false },
    })),

  setDoorOpen: (layer, open) =>
    set((s) => ({ openDoors: { ...s.openDoors, [layer]: open } })),

  setDrawerOpen: (layer, open) =>
    set((s) => ({ openDrawers: { ...s.openDrawers, [layer]: open } })),

  reset: () =>
    set({
      doorsCreatedLayers: [],
      drawersCreatedLayers: [],
      openDoors: {},
      openDrawers: {},
    }),
}));
