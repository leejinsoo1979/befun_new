import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const source = path.join(root, 'docs/handoffs/legacy-priority');
const destination = path.join(root, 'src/lib/catalog-entry/legacy-designs');
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

const archive = path.join(source, 'source-resources');
fs.mkdirSync(archive, {recursive:true});
const original = readBundle(path.join(archive,'cplus.js.gz'),'r(r.s=2217)');
wrapModules(original,[1414],'export default require(1414).default;','engine.js');
wrapModules(original,[1013,1046,57],`export function renderLegacy(g,t){return require(t===0?1013:1046)[t===0?'type01Processor':'type02Processor']({...g,dimensions:[]});}
export const getMaterialCfg=require(57).getMaterialCfg;`,'renderer.js');
for (const name of ['desk-0', 'desk-1', 'bookcase-0']) {
  const raw = JSON.parse(fs.readFileSync(path.join(archive, name + '.json'), 'utf8'));
  fs.writeFileSync(path.join(destination, 'dna', name + '.json'), JSON.stringify(raw.json));
}
wrapModules(original,[802],'export const PricingCore=require(802).PricingCore;','pricing.js');
const palette={};for(const type of [0,1]){const map=Object.values(original(type===0?523:524))[0];const seen=new Set();palette[type]=[];for(let id=0;id<(type===0?14:23);id++){const m=map(id);const key=JSON.stringify(m);if(seen.has(key))continue;seen.add(key);palette[type].push({id,outer:m.horizontals.colors.primary,inner:type===1?m.horizontals.colors.secondary:m.verticals.colors.primary});}}fs.writeFileSync(path.join(destination,'palettes.json'),JSON.stringify(palette));
