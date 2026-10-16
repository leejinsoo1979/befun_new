import { BIRCH_EDGE_MIX_COLOR } from '../three/finish';
import { calculatePrice } from '../pricing';
import coefficients from './data/tylko-coefficients-20261014.json';
import sourceParts from './data/shelf-price-parts.json';
import fx from './fx-snapshot.json';
import { calculateReferenceShelfPrice, type ReferenceShelfPriceInput, type ReferencePricePart } from './reference-pricing';
import { calculateShelfGeometry } from '../three/shelf-geometry';
import { matchingCatalogPreset } from '../three/catalog-presets';
import { baseHeight, planFurnitureLegs, type FurnitureBaseType } from '../three/furniture-base';
import { REFERENCE_COLORS } from '../three/reference-colors';
import type { GridInput } from '../three/styles/grid';
import type { ColorCategory, PanelData, StyleType } from '@/types/shelf';
import { EUR_QUOTE_VERSION } from './eur-quote';

const classic: Record<string, number> = { C_White:0,C_Black:1,C_Gray:3,C_Pink:8,C_Yellow:7,C_Blue:9,'C_Moss Green':11,C_Cashmere:12,'C_Clay Brown':13 };
type PriceInput = GridInput & { color?: string; baseType?: FurnitureBaseType };
const bounds = (p: { x: number; y: number; w: number; h: number }): ReferencePricePart => ({ x1:(p.x-p.w/2)*10,x2:(p.x+p.w/2)*10,y1:(p.y-p.h/2)*10,y2:(p.y+p.h/2)*10 });

/** Join render segmentation at a common shelf level. Price engine counts economic spans. */
function economicHorizontals(panels: PanelData[]) {
  const spans = panels.filter(p=>p.matType==='horizontalBase').map(p=>({x1:(p.x-p.w/2)*10,x2:(p.x+p.w/2)*10,y1:p.y*10,y2:p.y*10})).sort((a,b)=>a.y1-b.y1||a.x1-b.x1);
  const result:ReferencePricePart[]=[];
  for(const p of spans){const last=result[result.length-1];if(last&&Math.abs(last.y1-p.y1)<.01&&Math.abs(last.x2-p.x1)<1){last.x2=p.x2;}else result.push({...p});}
  return result;
}

export function shelfQuote(style: StyleType, input: PriceInput, colorCategory: ColorCategory) {
  const preset = matchingCatalogPreset({...input,style});
  const color = input.color ?? preset?.color ?? (colorCategory==='classic'?'C_White':'S_White');
  // Displaying the legacy Clay Brown key under Mix must not change its source price table.
  const family = color===BIRCH_EDGE_MIX_COLOR||colorCategory==='classic'?'classic':colorCategory==='natural'?'veneer':'modern';
  const materialId = family==='classic' ? classic[color] : family==='veneer' ? 0 : REFERENCE_COLORS[color]?.referenceId;

  const geometry=calculateShelfGeometry(style,{...input,family:family==='modern'?'type02':'type01'});
  const panels=geometry.panels;
  if(materialId===undefined) {
    // Preserve legacy saved colours without pretending they have a verified Tylko material ID.
    const legacy=calculatePrice({totalPanelVolume:panels.reduce((sum,p)=>sum+p.w*p.h*p.d,0),colorCategory});
    return {originalPrice:legacy.originalPrice,finalPrice:legacy.originalPrice,discountRate:0,
      regularEur:legacy.originalPrice/fx.rates.KRW,currency:'EUR' as const,version:'befun-estimate-v1',geometryVerified:false,isEstimate:true};
  }
  const selected=(type:PanelData['matType'])=>panels.filter(p=>p.matType===type).map(bounds);
  const fronts=(type:'door'|'drawer')=>(geometry.fronts??[]).filter(f=>f.type===type).map(f=>bounds({x:f.x,y:f.y,w:f.width,h:f.height}));
  const base=input.baseType??preset?.baseType??'standard';
  const raw=preset&&Object.hasOwn(sourceParts,input.catalogPreset!)?sourceParts[input.catalogPreset as keyof typeof sourceParts]:null;
  const rawInserts=raw?.inserts as ({subtype?:string}&ReferencePricePart)[]|undefined;
  const rawLegs=raw?.long_legs as unknown[]|undefined;
  const rawPlinth=raw?.plinth as unknown[]|undefined;
  const sameFronts=raw && (!input.hardwareRowStyles || Object.keys(input.hardwareRowStyles).length===0
    || (raw.doors.length===fronts('door').length&&raw.drawers.length===fronts('drawer').length));
  const priceInput:ReferenceShelfPriceInput={
    kind:'shelf',family,style,materialId,
    category:(input.catalogPreset && Object.hasOwn(sourceParts,input.catalogPreset) ? sourceParts[input.catalogPreset as keyof typeof sourceParts].shelf_category : undefined) as ReferenceShelfPriceInput['category'] ?? 'bookcase',
    widthMm:input.width*10,heightMm:(input.height+baseHeight(base))*10,depthMm:input.depth*10,
    horizontals:raw?.horizontals??economicHorizontals(panels),verticals:raw?.verticals??selected('verticalBase'),
    supports:raw?.supports??selected('supportPanel'),
    backs:raw&&input.hasBackPanel===preset?.hasBackPanel?raw.backs:selected('backPanel'),
    doors:sameFronts?raw.doors:fronts('door'),drawers:sameFronts?raw.drawers:fronts('drawer'),
    inserts:(rawInserts??[]).map(p=>({...p,orientation:p.subtype==='v'?'vertical':'horizontal'})),
    longLegCount:base==='legs'?(rawLegs?.length||planFurnitureLegs(panels,input.depth,style).length):0,
    hasPlinth:base==='legs'&&!!rawPlinth?.length,cableManagementCount:0,
  };
  const result=calculateReferenceShelfPrice(priceInput,{
    version:EUR_QUOTE_VERSION,market:'DE',currency:'EUR',sourceUrl:'https://tylko.com/api/v1/pricing/coefficients/',
    capturedAt:'2026-10-14',coefficients,vatFactor:1.23,eurFactor:4.3,regionalMultiplier:1,promotionPercent:null,
  });
  if(result.status!=='available') throw new Error(`EUR quote unavailable: ${result.reason}`);
  // Legacy cart uses KRW. Preserve the unrounded FX equivalent until display/checkout.
  // regularEur remains canonical; no invented 20% discount or Tylko Club entitlement.
  const price=result.regularEur*fx.rates.KRW;
  return { originalPrice:price,finalPrice:price,discountRate:0,regularEur:result.regularEur,
    currency:'EUR' as const,version:EUR_QUOTE_VERSION,geometryVerified:!!raw,isEstimate:!raw };
}
