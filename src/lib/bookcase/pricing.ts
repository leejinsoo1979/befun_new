import TonePrice from './upstream/tone-price.js';
import {MinimalPrice, HangingPrice, LegsPrice} from './upstream/tone-style-price.js';
import coefficients from './data/tone-price-coefficients.json';
import styleCoefficients from './data/tone-style-price-coefficients.json';
import type {Geometry} from './types';

export function hasTonePricing(type:number|undefined):boolean {
 return type===6 || type===7 || type===8 || type===14;
}

/** Tylko TYPE14 and TYPE23/24/25 regular EUR quote. Select the calculator
 * from the current geometry, including after a minimal/hanging/legs switch.
 * Original calculator operates in mm,
 * applies its own margins/logistics/material factors, then truncates EUR.
 * The source's Club promotion is separate and is not an automatic discount.
 */
export function toneEuro(geometry:Geometry):number {
 const type=geometry.shelf_type;
 if(!hasTonePricing(type))throw new Error(`Unsupported Tone price type: ${type}`);
 const Price=type===6?MinimalPrice:type===7?HangingPrice:type===8?LegsPrice:TonePrice;
 const checked=new Proxy((type===14?coefficients:styleCoefficients) as Record<string,number>,{
  get(target,key:string){
   if(!Object.hasOwn(target,key)||!Number.isFinite(target[key]))throw new Error(`Missing Tone price coefficient: ${key}`);
   return target[key];
  },
 });
 const amount=new Price(geometry,checked,true).getPrice();
 const eur=Math.trunc(amount*1.23/4.3);
 if(!Number.isFinite(eur)||eur<=0)throw new Error('Invalid Tone quote');
 return eur;
}
