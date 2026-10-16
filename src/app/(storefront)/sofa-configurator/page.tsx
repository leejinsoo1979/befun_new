import { Suspense } from 'react';
import SofaConfigurator from '@/components/sofa/SofaConfigurator';
import { notFound } from 'next/navigation';
import { sourceProduct } from '@/lib/catalog-entry/source-designs/server';
import SourceConfigurator from '@/components/source-configurator/SourceConfigurator';
export const metadata = { title: '모듈 소파 만들기 | BEFUN' };
export default async function SofaConfiguratorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  if (typeof params.product === 'string') {
    const source = /^\d+$/.test(params.product) ? sourceProduct(`${params.product},s`) : null;
    if (!source) notFound();
    return <Suspense fallback={<div style={{ minHeight: 600 }} />}><SourceConfigurator key={source.key} source={source} /></Suspense>;
  }
  return <Suspense fallback={<div style={{minHeight:600}} />}><SofaConfigurator /></Suspense>;
}
