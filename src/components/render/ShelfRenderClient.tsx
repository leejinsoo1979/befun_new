'use client';

import dynamic from 'next/dynamic';

const ShelfRender = dynamic(() => import('./ShelfRender'), { ssr: false });

export function ShelfRenderClient() {
  return <ShelfRender />;
}
