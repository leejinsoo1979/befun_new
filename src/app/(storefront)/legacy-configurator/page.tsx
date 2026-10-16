import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import SourceConfigurator from '@/components/source-configurator/SourceConfigurator';
import { sourceProduct } from '@/lib/catalog-entry/source-designs/server';
export const metadata = { title: '화장대 · 레코드 수납장 디자인 | BEFUN' };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  if (typeof params.product !== 'string' || !/^\d+$/.test(params.product)) notFound();
  const source = sourceProduct(`${params.product},j`);
  if (!source || !['dressing_table', 'vinyl_storage'].includes(source.category)) notFound();
  return <Suspense fallback={<div>가구 불러오는 중…</div>}><SourceConfigurator key={source.key} source={source} /></Suspense>;
}
