'use client';

import dynamic from 'next/dynamic';

const OptimizerApp = dynamic(() => import('./OptimizerApp'), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-gray-500">옵티마이저를 불러오는 중...</div>,
});

export function OptimizerClient() {
  return <OptimizerApp />;
}
