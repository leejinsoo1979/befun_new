import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ShelfRenderClient } from '@/components/render/ShelfRenderClient';

export const metadata: Metadata = { title: 'Shelf render', robots: { index: false, follow: false } };

/** 개발용: 마케팅 이미지 합성을 위해 가구만 투명 배경으로 렌더링한다. 운영 빌드에서는 404. */
export default function RenderShelfPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <Suspense>
      <ShelfRenderClient />
    </Suspense>
  );
}
