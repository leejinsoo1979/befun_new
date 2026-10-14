import type { Metadata } from 'next';
import { AssemblyEntry } from '@/components/assembly-guide/tylko-manual/AssemblyEntry';

export const metadata: Metadata = {
  title: 'Tylko 클립·OVVO·백패널·다리 조립 안내 · Befun',
  description: '색상 대응부터 핀 진입·클립 슬라이드·끝선 확인까지, 접합 방식별로 가까이 보면서 따라가는 3D 조립 안내 예시.',
};

export default async function AssemblyGuidePage({ searchParams }: { searchParams: Promise<{ topic?: string; system?: string; chapter?: string }> }) {
  const params = await searchParams;
  return <AssemblyEntry system={params.system} topic={params.topic} chapter={params.chapter} />;
}
