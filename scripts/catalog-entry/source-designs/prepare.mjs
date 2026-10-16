import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const source = path.join(root, 'docs/handoffs/thumbnail-configurators');
const destination = path.join(root, 'src/lib/catalog-entry/source-designs');
fs.mkdirSync(path.join(destination, 'upstream'), { recursive: true });
fs.mkdirSync(path.join(destination, 'dna'), { recursive: true });

const readBundle = (filename, bootstrap) => {
  const code = gunzipSync(fs.readFileSync(filename)).toString('utf8');
  if (!code.includes(bootstrap)) throw new Error(`Unexpected source bootstrap: ${filename}`);
  const context = vm.createContext({ console });
  vm.runInContext(code.replace(bootstrap, 'globalThis.requireModule=r'), context);
  return context.requireModule;
};
const wrapModules = (requireModule, entries, footer, name) => {
  const ids = new Set();
  const visit = id => {
    if (ids.has(id)) return;
    ids.add(id);
    if (id === 1 || id === 2) return;
    const factory = requireModule.m[id];
    if (!factory) throw new Error(`Missing source dependency ${id}`);
    for (const match of factory.toString().matchAll(/\br\((\d+(?:e\d+)?)\)/g)) visit(Number(match[1]));
  };
  entries.forEach(visit);
  const code = '/* eslint-disable */\n// Public source dependency closure; see ../SOURCES.md.\nconst modules={\n' +
    [...ids].map(id => `${id}:${id === 1 || id === 2 ? 'function(){}' : requireModule.m[id].toString()}`).join(',\n') +
    '\n};const cache={};function require(id){if(cache[id])return cache[id].exports;const m=cache[id]={exports:{}};modules[id](m,m.exports,require);return m.exports;}\n' +
    'require.o=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);require.d=(o,k,f)=>{if(!require.o(o,k))Object.defineProperty(o,k,{enumerable:true,get:f})};\n' + footer + '\n';
  fs.writeFileSync(path.join(destination, 'upstream', name), code);
  console.log(name, ids.size, code.length);
};

const renderer = readBundle(path.join(source, 'source-resources/renderer-bundle.js.gz'), 'r(r.s=2300)');
const palettes = {};
for (const [type, id] of [[3, 525], [4, 526], [5, 531], [6, 527], [7, 528], [8, 529], [14, 1012]]) {
  const mapping = Object.values(renderer(id))[0];
  const seen = new Set();
  palettes[type] = [];
  for (let value = 0; value < 40; value++) {
    const materials = mapping(value);
    const identity = JSON.stringify(materials);
    if (seen.has(identity)) continue;
    seen.add(identity);
    const outer = (materials.outer ?? materials.doors ?? materials.walls).colors.primary;
    const inner = (materials.walls ?? materials.outer).colors.primary;
    palettes[type].push({ id: value, outer, inner });
  }
}
fs.writeFileSync(path.join(destination, 'palettes.json'), JSON.stringify(palettes));
wrapModules(renderer, [1047, 1049, 1050, 1051, 1053, 1054, 1055, 1057, 1060], `
const processors={3:[1047,'type03Processor'],4:[1049,'type13Processor'],5:[1051,'veneer13Processor'],6:[1053,'type23Processor'],7:[1054,'type24Processor'],8:[1055,'type25Processor'],10:[1057,'type10Processor'],12:[1060,'type12Processor'],14:[1050,'type14Processor']};
export function renderSource(geometry,type){const [id,name]=processors[type];return require(id)[name]({...geometry,dimensions:[]});}
`, 'renderer.js');
const wardrobe = readBundle(path.join(source, 'source-resources/wardrobe-bundle.js.gz'), 'r(r.s=1872)');
wrapModules(wardrobe, [1888], 'export default require(1888).default;', 'wardrobe.js');
const sofa = gunzipSync(fs.readFileSync(path.join(source, 'source-resources/BFoqguav2.js.gz'))).toString('utf8');
fs.writeFileSync(path.join(destination, 'upstream/sofa.js'), '/* eslint-disable */\n// Original public sofa engine, telemetry prefix removed.\n' +
  sofa.slice(sofa.indexOf('import{')).replaceAll('./ebgaXKuC.js', '../../../bookcase/upstream/ebgaXKuC.js').replaceAll('./iJMyB6Jq2.js', '../../../bookcase/upstream/iJMyB6Jq2.js') + '\nexport function resetSourceDNA(dna){O.getInstance(dna).setDNA(dna);}\n');

for (const name of fs.readdirSync(path.join(source, 'source-resources')).filter(name => name.startsWith('dna-'))) {
  const response = JSON.parse(fs.readFileSync(path.join(source, 'source-resources', name), 'utf8'));
  fs.writeFileSync(path.join(destination, 'dna', name), JSON.stringify(response.json ?? response));
}
const products = {};
for (const filename of fs.readdirSync(path.join(source, 'raw')).filter(name => name.endsWith('.json'))) {
  const raw = JSON.parse(fs.readFileSync(path.join(source, 'raw', filename), 'utf8'));
  const type = raw.shelf_type;
  const collection = raw.configurator_params.additional_parameters.collection_type;
  const key = filename.slice(0, -5);
  const detached = [10, 12].includes(type) && !raw.configurator_params.layout.some(container => ['axis', 'turn'].includes(container.type));
  const geometry = Object.fromEntries(['components', 'walls', 'slabs', 'backs', 'doors', 'drawers', 'hinges', 'frame', 'legs', 'masking_bars', 'lighting', 'cable_management', 'bars', 'seaters', 'armrests', 'chaise_longues', 'chaise_longue_armrests', 'corners', 'open_ends', 'footrests', 'cushions', 'materials', 'width', 'height', 'depth', 'material', 'shelf_type', 'covers_only', 'configurator_params', 'physical_product_version', 'shelf_category'].filter(key => raw[key] !== undefined).map(key => [key, raw[key]]));
  products[key] = { key, id: raw.id, shelfType: type, category: raw.shelf_category ?? raw.category,
    line: type === 12 ? 'uff' : type === 10 ? 'smooth' : [4, 5].includes(type) ? 'edge' : 'tone',
    dnaKey: `dna-${type}-${collection}-${type === 3 ? 4 : 6}`, preset: raw.configurator_params,
    width: raw.width, height: raw.height, depth: raw.depth, eur: Number(raw.region_price_in_euro), color: raw.color_name,
    coversOnly: raw.covers_only ?? false, preview: raw.preview_webp ?? raw.preview, ...(detached ? { detached } : {}), ...(geometry ? { geometry } : {}) };
}
fs.writeFileSync(path.join(destination, 'products.json'), JSON.stringify(products));
fs.writeFileSync(path.join(destination, 'entries.json'), JSON.stringify(Object.fromEntries(Object.values(products).map(product => [product.key, {
  id: `source-${product.key}`, kind: product.key.endsWith(',s') ? 'sofa' : 'bookcase',
  href: `/${product.key.endsWith(',s') ? 'sofa' : 'bookcase'}-configurator?line=${product.line}&product=${product.id}`,
}]))));
console.log('Exact source products', Object.keys(products).length);
