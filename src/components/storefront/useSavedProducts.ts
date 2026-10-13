'use client';

import { useSyncExternalStore } from 'react';

const KEY = 'befun-storefront-favorites-v1';
const EVENT = 'befun-storefront-favorites-change';
const empty: string[] = [];
let cachedRaw: string | null = null;
let cachedIds = empty;

function snapshot() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cachedIds = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : empty;
    }
  } catch { return cachedIds; }
  return cachedIds;
}
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(EVENT, callback);
  };
}
export function useSavedProducts() {
  const saved = useSyncExternalStore(subscribe, snapshot, () => empty);
  const toggleSaved = (id: string) => {
    const current = snapshot();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    cachedIds = next;
    try {
      const raw = JSON.stringify(next);
      localStorage.setItem(KEY, raw);
      cachedRaw = raw;
    } catch { /* 저장소가 차단되어도 현재 화면의 선택은 유지한다. */ }
    window.dispatchEvent(new Event(EVENT));
  };
  return { saved, toggleSaved };
}
