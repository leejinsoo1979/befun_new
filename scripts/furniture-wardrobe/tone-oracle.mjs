/** Offline verification only. Downloaded public code is never imported by the app.
 * Supply the already saved public bundle/DNA paths; startup is deliberately bypassed.
 */
import fs from 'node:fs';
import vm from 'node:vm';
const bundlePath = process.env.TONE_SOURCE_BUNDLE ?? '/tmp/tylko-wardrobes-bundle.js';
const dnaPath = process.env.TONE_SOURCE_DNA ?? '/tmp/tylko-wardrobe-tone-dna.json';
const bundle = fs.readFileSync(bundlePath, 'utf8');
if (!bundle.includes('r(r.s=1872)')) throw new Error('Unrecognized public engine bootstrap; do not execute it.');
const context = vm.createContext({ console });
vm.runInContext(bundle.replace('r(r.s=1872)', 'globalThis.requireModule=r'), context);
const Engine = context.requireModule(1888).default;
const dna = JSON.parse(fs.readFileSync(dnaPath, 'utf8')).json;
const setups = Object.values(dna.serialization.mesh['2321'].setups);
export function toneOracle(input) {
  const engine = new Engine(); engine.withDNA(dna);
  const setup = setups.filter(s => input.widthMm >= s.parameters.dim_x[0] && input.widthMm <= s.parameters.dim_x[1]).at(-1);
  const channels = {};
  for (const [index, config] of setup.configs.entries()) {
    const section = input.sections[index];
    channels[config.parameters.channel] = {
      series_id: Number(section?.seriesId ?? config.parameters.series_pick), order: -1,
      door_flip: section?.doorDirection === 'left' ? 1 : section?.doorDirection === 'right' ? 2 : null,
      local_x: index === 0 ? input.toneWidthPattern ?? null : null,
    };
  }
  engine.loadPreset({
    configurator_custom_params: { channels, lines: {} },
    density: 0, width: input.widthMm, height: input.heightMm, depth: input.depthMm,
    distortion: 0, drawer_style: input.drawerStyle ?? 'internal', lighting: !!input.lighting,
    geom_id: 2321, geom_type: 'mesh', material: 0,
    additional_parameters: { collection_type: 'Wardrobe', doors_direction: 1 },
  });
  const changes = {};
  for (const [index, config] of setup.configs.entries()) {
    const channel = config.parameters.channel, direction = input.sections[index]?.doorDirection;
    if (direction && engine.getConfiguration().parameters.channels[channel]?.doorDirection?.visible) changes[channel] = { doorDirection: direction === 'left' ? 1 : 2 };
  }
  if (Object.keys(changes).length) engine.changeConfiguration({ channels: changes });
  return { geometry: engine.getGeometry(), render: engine.getRender(), configuration: engine.getConfiguration() };
}
export const geometryKeys = ['slabs', 'walls', 'backs', 'frame', 'masking_bars', 'doors', 'drawers', 'bars', 'lighting', 'components'];
export function compactToneGeometry(geometry) {
  const keys = ['x1', 'x2', 'y1', 'y2', 'z1', 'z2', 'subtype', 'direction', 'handle', 'extremes'];
  return Object.fromEntries(geometryKeys.map(key => [key, (geometry[key] ?? []).map(part => Object.fromEntries(keys.filter(k => part[k] !== undefined).map(k => [k, part[k]])))]));
}
