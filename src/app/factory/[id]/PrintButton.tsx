'use client';

export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="rounded-md border border-gray-300 bg-white px-3 py-1.5">인쇄</button>;
}
