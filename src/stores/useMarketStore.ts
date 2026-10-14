'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isEuropeanCountry, type EuropeanCountry } from '@/lib/commerce/markets';

/** Language/market live in I18nProvider; this stores only the EU delivery destination. */
export const useMarketStore = create<{europeanCountry: EuropeanCountry;setEuropeanCountry:(country:EuropeanCountry)=>void}>()(persist((set)=>({
  europeanCountry:'DE',
  setEuropeanCountry:country=>{if(isEuropeanCountry(country))set({europeanCountry:country});},
}),{name:'befun-european-country',skipHydration:true,merge:(persisted,current)=>{
  const value=persisted as {europeanCountry?:unknown}|null;
  return {...current,europeanCountry:isEuropeanCountry(value?.europeanCountry)?value.europeanCountry:'DE'};
}}));
