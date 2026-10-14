import type { PanelBoringData } from '@/lib/optimizer/upstream/domain/boring/types';

/** Replace only this producer's reasons; metadata survives cloned/saved panels. */
export function replaceManufacturingBlocks(data: PanelBoringData, source: string, reasons: string[]) {
  const previous = data.manufacturingBlockOwnership;
  const owned = new Set(Object.values(previous?.reasons ?? {}).flat());
  const external = (data.manufacturingBlockReasons ?? []).filter(reason => !owned.has(reason));
  const unattributedBlocked = previous?.unattributedBlocked
    || (!previous && data.manufacturingReady === false && !data.manufacturingBlockReasons?.length);
  const bySource = { ...previous?.reasons };
  // A pre-existing external reason is never claimed by this producer.
  const next = [...new Set(reasons)].filter(reason => !external.includes(reason));
  if (next.length) bySource[source] = next;
  else delete bySource[source];
  const combined = [...new Set([...external, ...Object.values(bySource).flat()])];
  if (combined.length) data.manufacturingBlockReasons = combined;
  else delete data.manufacturingBlockReasons;
  if (combined.length || unattributedBlocked) data.manufacturingReady = false;
  else delete data.manufacturingReady;
  if (Object.keys(bySource).length) {
    data.manufacturingBlockOwnership = {
      reasons: bySource,
      ...(unattributedBlocked ? { unattributedBlocked: true as const } : {}),
    };
  } else delete data.manufacturingBlockOwnership;
}
