'use client';

import { useEffect, useMemo, useState } from 'react';
import { BoxGeometry, type BufferGeometry } from 'three';
import type { Bore } from './boring';
import { boredBoxKey, createBoredBoxCached, hasCachedBoredBox } from './geometry';

/**
 * 구멍 뚫린 판 geometry. 슬라이더 드래그처럼 치수가 연속으로 바뀌는 동안은 CSG를 하지 않고
 * 구멍 없는 상자를 바로 보여 준 뒤, 입력이 delayMs 동안 멈추면 실제 구멍(CSG)으로 교체한다.
 * 이미 계산한 치수·구멍 조합은 캐시에서 즉시 꺼낸다. 반환 geometry는 이 훅이 소유·dispose한다.
 */
export function useBoredBoxGeometry(
  w: number, h: number, d: number, holes: readonly Bore[],
  offset: readonly [number, number, number] = [0, 0, 0], delayMs = 220,
): BufferGeometry {
  const key = boredBoxKey(w, h, d, holes);
  const [ox, oy, oz] = offset;
  const build = (bored: boolean) => {
    const geo = bored ? createBoredBoxCached(w, h, d, holes) : new BoxGeometry(w, h, d);
    if (ox || oy || oz) geo.translate(ox, oy, oz);
    return geo;
  };
  // 키가 바뀌면 즉시: 캐시가 있으면 구멍 버전, 없으면 구멍 없는 상자
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const immediate = useMemo(() => build(hasCachedBoredBox(w, h, d, holes)), [key, ox, oy, oz]);
  const [settled, setSettled] = useState<{ key: string; geo: BufferGeometry } | null>(null);

  useEffect(() => {
    if (hasCachedBoredBox(w, h, d, holes)) return;
    const timer = setTimeout(() => setSettled({ key: `${key}|${ox},${oy},${oz}`, geo: build(true) }), delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ox, oy, oz, delayMs]);

  const current = settled && settled.key === `${key}|${ox},${oy},${oz}` ? settled.geo : immediate;
  useEffect(() => () => immediate.dispose(), [immediate]);
  useEffect(() => () => settled?.geo.dispose(), [settled]);
  return current;
}
