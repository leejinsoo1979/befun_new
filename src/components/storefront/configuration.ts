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
    thickness: 2, style: 'grid', density: 50, hasBackPanel: true,
    rowHeights: [...product.rows], numRows: product.rows.length,
  });
  useMaterialStore.getState().setColor(color, color === product.color ? product.colorCategory : 'solid');
  product.doors.forEach(row => useHardwareStore.getState().addDoorLayer(row));
}

export function currentConfiguration() {
  const shelf = useShelfStore.getState();
  const material = useMaterialStore.getState();
  const hardware = useHardwareStore.getState();
  return {
    style: shelf.style, density: shelf.density, width: shelf.width,
    height: shelf.height, depth: shelf.depth, hasBackPanel: shelf.hasBackPanel,
    color: material.currentColor, colorCategory: material.colorCategory,
    rowHeights: shelf.rowHeights.slice(0, shelf.numRows), numRows: shelf.numRows,
    doorsCreatedLayers: hardware.doorsCreatedLayers,
    drawersCreatedLayers: hardware.drawersCreatedLayers, hardwareRowStyles: hardware.rowStyles,
  };
}

export function restoreSavedConfiguration(config: SavedDesign['config']) {
  useUIStore.setState({ hoveredRow: null, selectedRow: null, isFloatingBoxHovered: false, showDimensions: false });
  useShelfStore.setState({
    width: config.width, height: config.height, depth: config.depth, thickness: 2,
    style: config.style, density: config.density, hasBackPanel: config.hasBackPanel,
    rowHeights: [...config.rowHeights], numRows: config.numRows,
  });
  useMaterialStore.getState().setColor(config.color, config.colorCategory);
  useHardwareStore.getState().restore(config.doorsCreatedLayers, config.drawersCreatedLayers, config.hardwareRowStyles);
  useShelfStore.getState().reconcileHardware();
}
