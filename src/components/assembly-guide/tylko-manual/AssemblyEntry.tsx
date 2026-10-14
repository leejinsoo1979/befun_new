'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';
import { CONNECTOR_SETTINGS_EVENT, CONNECTOR_SETTINGS_KEY, resolveGuideSystem, savedConnectorSystem } from '@/lib/assembly-guide/tylko-manual/selection';

const LegacyGuide = dynamic(() => import('../AssemblyGuide').then(m => m.AssemblyGuide));
const TylkoGuide = dynamic(() => import('./TylkoManual').then(m => m.TylkoManual));
function subscribe(notify: () => void) {
  const storage = (event: StorageEvent) => { if (!event.key || event.key === CONNECTOR_SETTINGS_KEY) notify(); };
  window.addEventListener('storage', storage);
  window.addEventListener(CONNECTOR_SETTINGS_EVENT, notify);
  return () => {
    window.removeEventListener('storage', storage);
    window.removeEventListener(CONNECTOR_SETTINGS_EVENT, notify);
  };
}
function snapshot() {
  try { return localStorage.getItem(CONNECTOR_SETTINGS_KEY); } catch { return null; }
}
const serverSnapshot = () => undefined;

/** Explicit links select a manual, never mutate the administrator's production setting. */
export function AssemblyEntry({ system, topic, chapter }: { system?: string; topic?: string; chapter?: string }) {
  const saved = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  if (saved === undefined && !system && !topic) return <p role="status">접합 방식에 맞는 조립 안내를 준비하고 있습니다…</p>;
  const selected = resolveGuideSystem(system, topic, savedConnectorSystem(saved ?? null));
  if (selected === 'ovvo') return <LegacyGuide initialTopic="connector" />;
  return <TylkoGuide initialChapter={chapter ?? (topic === 'legs' ? 'legs' : topic === 'back-panel' ? 'back-assemble' : undefined)} />;
}
