import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useUIStore } from '@/stores/useUIStore';
import { shelfQuote } from '@/lib/commerce/shelf-quote';
import type { GridInput } from '@/lib/three/styles/grid';
import { calculateShelfGeometry } from '@/lib/three/shelf-geometry';
import { catalogPreset, matchingCatalogPreset } from '@/lib/three/catalog-presets';
import type { ColorCategory, StyleType } from '@/types/shelf';
import { productHeight, type CatalogProduct } from './catalog';
import type { SavedDesign } from './savedDesign';
import { parseSavedDesign } from './savedDesign';
import { resolveHardwareRows } from '@/lib/three/hardware-state';

export function configurationPrice(style: StyleType, input: GridInput & { color?: string; baseType?: 'standard' | 'legs' }, colorCategory: ColorCategory) {
  return shelfQuote(style, input, colorCategory);
}

export function loadProductConfiguration(product: CatalogProduct, color = product.color) {
  const preset=product.catalogPreset?catalogPreset(product.catalogPreset):null;
  useHardwareStore.getState().reset();
  useUIStore.setState({ hoveredRow: null, selectedRow: null, isFloatingBoxHovered: false, showDimensions: false });
  useShelfStore.setState({
    width: product.width, height: productHeight(product), depth: product.depth,
    catalogPreset:product.catalogPreset, baseType:preset?.baseType??'standard', legFinish:'panel', thickness:2,
    style:preset?.style??'grid', density:preset?.density??50, hasBackPanel:preset?.hasBackPanel??false,
    rowHeights: [...product.rows], numRows: product.rows.length,
  });
  useMaterialStore.getState().setColor(color, color === product.color ? product.colorCategory : 'solid');
  if(preset){
    const shelf=useShelfStore.getState();
    const geometry=calculateShelfGeometry(shelf.style,{...shelf});
    const doors=[...new Set(geometry.fronts?.filter(f=>f.type==='door').map(f=>f.rowIndex))];
    const drawers=[...new Set(geometry.fronts?.filter(f=>f.type==='drawer').map(f=>f.rowIndex))];
    const codes=Object.fromEntries([...new Set([...doors,...drawers])].map(row=>[row,(drawers.includes(row)?20:10)+(doors.includes(row)?2:1)]));
    useHardwareStore.getState().restore(doors,drawers,codes);
  } else product.doors.forEach(row => useHardwareStore.getState().addDoorLayer(row));
}

export function currentConfiguration() {
  const shelf = useShelfStore.getState();
  const material = useMaterialStore.getState();
  const hardware = useHardwareStore.getState();
  const rowHeights = shelf.rowHeights.slice(0, shelf.numRows);
  return {
    catalogPreset: shelf.catalogPreset, baseType: shelf.baseType, legFinish: shelf.legFinish, style: shelf.style, density: shelf.density, width: shelf.width,
    height: 2 + rowHeights.reduce((total, height) => total + height + 2, 0), depth: shelf.depth, hasBackPanel: shelf.hasBackPanel,
    color: material.currentColor, colorCategory: material.colorCategory,
    rowHeights, numRows: shelf.numRows,
    doorsCreatedLayers: [...hardware.doorsCreatedLayers],
    drawersCreatedLayers: [...hardware.drawersCreatedLayers],
    hardwareRowStyles: resolveHardwareRows(hardware.doorsCreatedLayers, hardware.drawersCreatedLayers, hardware.rowStyles),
  };
}

export function restoreSavedConfiguration(config: SavedDesign['config']) {
  const design = parseSavedDesign(JSON.stringify({ version: 1, name: '', config }));
  if (!design) return false;
  const saved = design.config;
  const usesInitialLayout = matchingCatalogPreset({ ...saved, thickness: 2 }) !== null;
  useUIStore.setState({ hoveredRow: null, selectedRow: null, isFloatingBoxHovered: false, showDimensions: false });
  useShelfStore.setState({
    catalogPreset:saved.catalogPreset, width: saved.width, height: saved.height, depth: saved.depth, thickness: 2,
    style: saved.style, density: saved.density, hasBackPanel: saved.hasBackPanel,
    rowHeights: [...saved.rowHeights], numRows: saved.numRows,
  });
  useMaterialStore.getState().setColor(saved.color, saved.colorCategory);
  useShelfStore.getState().setBaseType(saved.baseType ?? 'standard');
  useShelfStore.getState().setLegFinish(saved.legFinish ?? 'silver');
  useHardwareStore.getState().restore(saved.doorsCreatedLayers, saved.drawersCreatedLayers, saved.hardwareRowStyles);
  if(!usesInitialLayout) useShelfStore.getState().reconcileHardware();
  return true;
}
