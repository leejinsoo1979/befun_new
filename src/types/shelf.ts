export type StyleType = 'grid' | 'slant' | 'pixel' | 'gradient' | 'pattern' | 'mosaic';

export type ColorCategory = 'classic' | 'natural' | 'solid' | 'edgeMix';


export type MaterialType =
  | 'verticalBase'
  | 'verticalEdge'
  | 'horizontalBase'
  | 'horizontalEdge'
  | 'backPanel'
  | 'supportPanel';

export type RowHeight = 18 | 32 | 38;

export interface ShelfConfig {
  width: number;       // 80~240
  height: number;      // 38~228
  depth: number;       // 24~42
  thickness: number;   // 패널 두께 (기본 2)
  style: StyleType;
  density: number;     // 0~100
  color: string;       // 현재 색상명
  colorCategory: ColorCategory;
  hasBackPanel: boolean;
  rowHeights: number[];
}

export interface PanelData {
  w: number;
  h: number;
  d: number;
  x: number;
  y: number;
  z: number;
  matType: MaterialType;
  castShadow: boolean;
  receiveShadow: boolean;
}

export interface HardwareState {
  doors: DoorData[];
  drawers: DrawerData[];
  doorsCreatedLayers: number[];
  drawersCreatedLayers: number[];
}

export interface DoorData {
  layer: number;
  mesh: unknown; // THREE.Group at runtime
  isOpen: boolean;
}

export interface DrawerData {
  layer: number;
  mesh: unknown; // THREE.Group at runtime
  isOpen: boolean;
}
