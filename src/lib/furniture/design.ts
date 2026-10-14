import { availableStorageColumns, DESK_CHANNEL_OPTIONS, type DeskInput } from './desk';
import { WARDROBE_COLORS, EDGE_PAINT_COLORS, TONE_OUTER_COLORS, toneInnerColors } from './wardrobe-colors';
import type { WardrobeInput } from './wardrobe/types';
import { createWardrobeInput, validateWardrobeInput } from './wardrobe/initial';
import { normalizeWardrobeInput } from './wardrobe';
import { REFERENCE_COLORS, REFERENCE_CLASSIC_COLORS } from '../three/reference-colors';

export type FurnitureFamily = 'desk-classic' | 'desk-modern' | 'wardrobe-edge' | 'wardrobe-tone';
export type FurnitureDesign = { version: 1; family: FurnitureFamily; color: string; innerColor: string } & (
  { kind: 'desk'; config: DeskInput; sectionIds: string[] } |
  { kind: 'wardrobe'; config: WardrobeInput }
);
export const MODERN_DESK_COLORS = ['S_White', 'S_Gray', 'Sand+Midnight Blue', 'S_Olive Green', 'S_Sage Green',
  'S_Butter Yellow', 'S_Cotton', 'S_Teracotta', 'S_Stone Gray', 'S_Reisinger Pink', 'S_Lilac', 'S_Dark Brown'];

export const FAMILY_NAMES: Record<FurnitureFamily,string> = {
  'desk-classic': 'Classic 데스크', 'desk-modern': 'Modern 데스크',
  'wardrobe-edge': 'Edge 옷장', 'wardrobe-tone': 'Tone 옷장',
};
export const isFurnitureFamily = (value:string): value is FurnitureFamily => Object.hasOwn(FAMILY_NAMES,value);
export function createFurnitureDesign(family:FurnitureFamily):FurnitureDesign {
  if (family.startsWith('desk-')) return {version:1,kind:'desk',family,color:family==='desk-classic'?'C_Yellow':'S_Gray',innerColor:'S_White',sectionIds:['storage-1'],config:{family:family==='desk-classic'?'type01':'type02',widthMm:family==='desk-classic'?1020:1200,depthMm:500,storageColumns:1,legroomPosition:1,hasBackPanel:true,channels:[{kind:family==='desk-classic'?'door':'mix',doorDirection:'right'}]}};
  return {version:1,kind:'wardrobe',family,color:family==='wardrobe-edge'?'W_Olive':'T_White',innerColor:'T_White',config:createWardrobeInput(family==='wardrobe-edge'?'edge':'tone')};
}
export function normalizeDeskDesign(design:Extract<FurnitureDesign,{kind:'desk'}>):Extract<FurnitureDesign,{kind:'desk'}> {
  const config={...design.config};
  config.widthMm=Math.max(900,Math.min(2400,Math.round(config.widthMm)));
  const available=availableStorageColumns(config.widthMm);
  if(!available.includes(config.storageColumns)) config.storageColumns=available.reduce((best,n)=>Math.abs(n-config.storageColumns)<Math.abs(best-config.storageColumns)?n:best,available[0]);
  config.legroomPosition=Math.max(0,Math.min(config.storageColumns,Math.round(config.legroomPosition)));
  config.channels=Array.from({length:config.storageColumns},(_,i)=>config.channels?.[i]??{kind:'mix',doorDirection:'right'});
  const ids=Array.from({length:config.storageColumns},(_,i)=>design.sectionIds[i]??`storage-${i+1}`);
  return {...design,config,sectionIds:ids};
}
/** Missing optional defaults are compatible with old links; explicit values must
 * survive normalization so the editor and renderer describe the same furniture. */
function hasStableWardrobeState(input: WardrobeInput): boolean {
  const normalized = normalizeWardrobeInput(input);
  if (normalized.sections.length !== input.sections.length) return false;
  for (const key of ['widthMm', 'heightMm', 'depthMm', 'toneWidthPattern', 'drawerStyle', 'lighting', 'topEdge'] as const) {
    if (input[key] !== undefined && input[key] !== normalized[key]) return false;
  }
  return input.sections.every((section, index) => {
    const next = normalized.sections[index];
    if (section.id !== next.id || String(section.seriesId) !== String(next.seriesId)) return false;
    // Independent widths and open Tone facades have no supported source rule.
    if (section.widthMm != null || input.model === 'tone' && section.facade !== undefined && section.facade !== 'closed') return false;
    return (['doorDirection', 'localHeightMm', 'localDepthMm'] as const).every(key =>
      section[key] == null || section[key] === next[key]);
  });
}
export function parseFurnitureDesign(serialized:string):FurnitureDesign|null {
  try {
    if(serialized.length>50000)return null;
    const d=JSON.parse(serialized) as FurnitureDesign;
    if(!d||d.version!==1||!isFurnitureFamily(d.family)||!d.config||typeof d.color!=='string'||typeof d.innerColor!=='string')return null;
    if(!REFERENCE_COLORS[d.color]&&!REFERENCE_CLASSIC_COLORS[d.color]&&!WARDROBE_COLORS[d.color])return null;
    if(!REFERENCE_COLORS[d.innerColor]&&!WARDROBE_COLORS[d.innerColor])return null;
    if(d.kind==='desk'){
      const c=d.config;
      if(d.family==='desk-classic'?!Object.hasOwn(REFERENCE_CLASSIC_COLORS,d.color):!MODERN_DESK_COLORS.includes(d.color))return null;
      if(!d.family.startsWith('desk-')||c.family!==(d.family==='desk-classic'?'type01':'type02')||!Number.isFinite(c.widthMm)||c.widthMm<900||c.widthMm>2400||![400,500,600].includes(c.depthMm)||!availableStorageColumns(c.widthMm).includes(c.storageColumns)||!Number.isInteger(c.legroomPosition)||c.legroomPosition<0||c.legroomPosition>c.storageColumns||typeof c.hasBackPanel!=='boolean'||!Array.isArray(d.sectionIds)||d.sectionIds.length!==c.storageColumns||new Set(d.sectionIds).size!==c.storageColumns||d.sectionIds.some(id=>typeof id!=='string'||!id.trim()||id.length>80)||!Array.isArray(c.channels)||c.channels.length!==c.storageColumns||c.channels.some(ch=>!DESK_CHANNEL_OPTIONS.some(o=>o.id===ch.kind)||!['left','right'].includes(ch.doorDirection??'right')))return null;
      if(c.cableManagement!==undefined&&!['off','left','right'].includes(c.cableManagement))return null;
      if(c.channels.some(ch=>ch.cableOpenings!==undefined&&typeof ch.cableOpenings!=='boolean'))return null;
      return structuredClone(d);
    }
    if(d.kind==='wardrobe'&&d.family.startsWith('wardrobe-')){
      const c=d.config;
      if(c.model==='edge'&&!EDGE_PAINT_COLORS.includes(d.color)&&!['C_White','C_Gray'].includes(d.color))return null;
      if(c.model==='tone'&&(!TONE_OUTER_COLORS.includes(d.color)||!toneInnerColors(d.color).includes(d.innerColor)))return null;
      if(c.model!==(d.family==='wardrobe-edge'?'edge':'tone')||![c.widthMm,c.heightMm,c.depthMm].every(Number.isFinite)||!Array.isArray(c.sections)||c.sections.length>20||c.sections.some(s=>!s||typeof s.id!=='string')||validateWardrobeInput(c).length||!hasStableWardrobeState(c))return null;
      return structuredClone(d);
    }
  }catch { /* Invalid saved data must never silently produce another design. */ }
  return null;
}
export function furnitureDesignHref(design:FurnitureDesign):string {
  return `/furniture-design/${design.family}?design=${encodeURIComponent(JSON.stringify(design))}`;
}
