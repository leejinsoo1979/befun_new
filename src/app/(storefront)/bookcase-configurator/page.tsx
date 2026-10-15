import {Suspense} from 'react';
import BookcaseConfigurator from '@/components/bookcase/BookcaseConfigurator';
import type {StartKey} from '@/lib/bookcase/types';
import {notFound} from 'next/navigation';
import {sourceProduct} from '@/lib/catalog-entry/source-designs/server';
import SourceConfigurator from '@/components/source-configurator/SourceConfigurator';
export const metadata={title:'Edge · Tone 가구 디자인 | BEFUN'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const known:Record<string,StartKey>={'657092':'bedside','1964607':'tone-1964607','1964423':'tone-wall','540446':'edge','1964243':'tone'};
 if(typeof params.product==='string'&&Object.hasOwn(known,params.product)){
  const start=known[params.product];
  return <Suspense fallback={<div>가구 불러오는 중…</div>}><BookcaseConfigurator key={start} start={start}/></Suspense>;
 }
 if(typeof params.product==='string'&&/^\d+$/.test(params.product)){
  const source=sourceProduct(`${params.product},w`);if(!source)notFound();
  return <Suspense fallback={<div>가구 불러오는 중…</div>}><SourceConfigurator key={source.key} source={source}/></Suspense>;
 }
 const start:StartKey=params.product==='wall-green'||params.product==='1964423'?'tone-wall':params.line==='edge'?'edge':'tone';
 return <Suspense fallback={<div>가구 불러오는 중…</div>}><BookcaseConfigurator key={start} start={start}/></Suspense>;
}
