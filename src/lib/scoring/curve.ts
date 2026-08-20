/**
 * Soft ceiling applied to raw score totals.
 *
 * Without it, several strong leads all pile up at exactly 100 and the top of
 * the list stops discriminating. This compresses everything above the knee
 * asymptotically toward 100 — ordering is preserved, nothing ever reaches a
 * perfect score, and the difference between a very strong and an exceptional
 * lead stays visible.
 */
export function softCeiling(raw: number, knee = 78, ceiling = 100, softness = 26) {
  if (raw <= knee) return raw;
  return knee + (ceiling - knee) * (1 - Math.exp(-(raw - knee) / softness));
}
