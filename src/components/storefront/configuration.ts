import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useUIStore } from '@/stores/useUIStore';
import { calculatePrice } from '@/lib/pricing';
import { calculateGridPanels, type GridInput } from '@/lib/three/styles/grid';
import { calculateSlantPanels } from '@/lib/three/styles/slant';
import { calculatePixelPanels } from '@/lib/three/styles/pixel';
import { calculateGradientPanels } from '@/lib/three/styles/gradient';
import { calculatePatternPanels } from '@/lib/three/styles/pattern';
import { calculateMosaicPanels } from '@/lib/three/styles/mosaic';
import type { ColorCategory, StyleType } from '@/types/shelf';
import { productHeight, type CatalogProduct } from './catalog';
import type { SavedDesign } from './savedDesign';
import { parseSavedDesign } from './savedDesign';
import { resolveHardwareRows } from '@/lib/three/hardware-state';

const panelCalculators = {
  grid: calculateGridPanels, slant: calculateSlantPanels,
  pixel: calculatePixelPanels, gradient: calculateGradientPanels,
  pattern: calculatePatternPanels, mosaic: calculateMosaicPanels,
};

export function configurationPrice(style: StyleType, input: GridInput, colorCategory: ColorCategory) {
  const { panels } = panelCalculators[style]({ ...input, family: colorCategory === 'classic' || colorCategory === 'natural' ? 'type01' : 'type02' });
  return calculatePrice({
    totalPanelVolume: panels.reduce((volume, panel) => volume + panel.w * panel.h * panel.d, 0),
    colorCategory,
  });
}

export function loadProductConfiguration(product: CatalogProduct, color = product.color) {
  useHardwareStore.getState().reset();
  useUIStore.setState({ hoveredRow: null, selectedRow: null, isFloatingBoxHovered: false, showDimensions: false });
  useShelfStore.setState({
    width: product.width, height: productHeight(product), depth: product.depth,
    baseType: 'standard', legFinish: 'silver', thickness: 2, style: 'grid', density: 50, hasBackPanel: true,
    rowHeights: [...product.rows], numRows: product.rows.length,
  });
  useMaterialStore.getState().setColor(color, color === product.color ? product.colorCategory : 'solid');
  product.doors.forEach(row => useHardwareStore.getState().addDoorLayer(row));
}

export function currentConfiguration() {
  const shelf = useShelfStore.getState();
  const material = useMaterialStore.getState();
  const hardware = useHardwareStore.getState();
  const rowHeights = shelf.rowHeights.slice(0, shelf.numRows);
  return {
    baseType: shelf.baseType, legFinish: shelf.legFinish, style: shelf.style, density: shelf.density, width: shelf.width,
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
  useUIStore.setState({ hoveredRow: null, selectedRow: null, isFloatingBoxHovered: false, showDimensions: false });
  useShelfStore.setState({
    width: saved.width, height: saved.height, depth: saved.depth, thickness: 2,
    style: saved.style, density: saved.density, hasBackPanel: saved.hasBackPanel,
    rowHeights: [...saved.rowHeights], numRows: saved.numRows,
  });
  useMaterialStore.getState().setColor(saved.color, saved.colorCategory);
  useShelfStore.getState().setBaseType(saved.baseType ?? 'standard');
  useShelfStore.getState().setLegFinish(saved.legFinish ?? 'silver');
  useHardwareStore.getState().restore(saved.doorsCreatedLayers, saved.drawersCreatedLayers, saved.hardwareRowStyles);
  useShelfStore.getState().reconcileHardware();
  return true;
}
