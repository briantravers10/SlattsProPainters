/**
 * Small deterministic PRNG so the synthetic demo dataset is identical on
 * every render (server and client) and stable between reloads.
 */
export function createRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    /** Integer in [min, max] inclusive. */
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    float: (min: number, max: number) => next() * (max - min) + min,
    pick: <T,>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    /** Pick `n` distinct items. */
    sample: <T,>(arr: readonly T[], n: number): T[] => {
      const pool = [...arr];
      const out: T[] = [];
      const take = Math.min(n, pool.length);
      for (let i = 0; i < take; i++) {
        out.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
      }
      return out;
    },
    bool: (p = 0.5) => next() < p,
    /** Weighted pick. */
    weighted: <T,>(entries: readonly (readonly [T, number])[]): T => {
      const total = entries.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [value, w] of entries) {
        r -= w;
        if (r <= 0) return value;
      }
      return entries[entries.length - 1][0];
    },
  };
}

export type Rng = ReturnType<typeof createRng>;
