export interface PocketPoint {
  acrossMm: number;
  alongMm: number;
  /** Positive into the board, zero at its machined surface. */
  inwardMm: number;
}

/** Necessary outer footprint check only; it cannot approve an unmeasured undercut section. */
export function auditPocketFootprint(points: readonly PocketPoint[], pocket: { widthMm: number; lengthMm: number; depthMm: number }, toleranceMm = .001) {
  if (![pocket.widthMm, pocket.lengthMm, pocket.depthMm, toleranceMm].every(Number.isFinite) || pocket.widthMm <= 0 || pocket.depthMm <= 0 || pocket.lengthMm < pocket.widthMm || toleranceMm < 0) throw new RangeError('Invalid pocket envelope');
  const radius = pocket.widthMm / 2;
  const straightHalf = (pocket.lengthMm - pocket.widthMm) / 2;
  let maximumRadialExcessMm = 0;
  let outsidePointCount = 0;
  let inspectedPointCount = 0;
  for (const point of points) {
    if (![point.acrossMm, point.alongMm, point.inwardMm].every(Number.isFinite)) throw new RangeError('Invalid transformed hardware point');
    // Surface contact/lips are not penetrating vertices. Only the body strictly
    // inside this board is tested; this is not a full triangle/contact solver.
    if (point.inwardMm <= toleranceMm || point.inwardMm > pocket.depthMm + toleranceMm) continue;
    inspectedPointCount++;
    const excess = Math.hypot(point.acrossMm, Math.max(0, Math.abs(point.alongMm) - straightHalf)) - radius;
    maximumRadialExcessMm = Math.max(maximumRadialExcessMm, excess);
    if (excess > toleranceMm) outsidePointCount++;
  }
  return { inspectedPointCount, outsidePointCount, maximumRadialExcessMm, footprintFits: inspectedPointCount > 0 && outsidePointCount === 0, undercutFit: 'unknown' as const, manufacturingApproved: false as const };
}
