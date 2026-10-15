import type { StyleType } from '@/types/shelf';
import { calculateCatalogPreset } from './catalog-presets';
import { calculateGridPanels, type GridInput, type GridResult } from './styles/grid';
import { calculateSlantPanels } from './styles/slant';
import { calculatePixelPanels } from './styles/pixel';
import { calculateGradientPanels } from './styles/gradient';
import { calculatePatternPanels } from './styles/pattern';
import { calculateMosaicPanels } from './styles/mosaic';

const calculators = { grid:calculateGridPanels, slant:calculateSlantPanels, pixel:calculatePixelPanels,
  gradient:calculateGradientPanels, pattern:calculatePatternPanels, mosaic:calculateMosaicPanels };
export function calculateShelfGeometry(style:StyleType,input:GridInput):GridResult {
  return calculateCatalogPreset({ ...input, style }) ?? calculators[style](input);
}
