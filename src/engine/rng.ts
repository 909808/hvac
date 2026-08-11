/**
 * Seeded RNG. Every generated challenge is reproducible from its seed, which
 * means a subnetting question you got wrong can be replayed exactly, and a test
 * that fails can be re-run against the same numbers.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  /** Returns a new shuffled array; does not mutate the input. */
  shuffle<T>(items: readonly T[]): T[];
  /** `n` distinct items, or all of them if `n` exceeds the list length. */
  sample<T>(items: readonly T[], n: number): T[];
  readonly seed: number;
}

/** mulberry32 — small, fast, good enough for shuffling questions. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => {
    if (max < min) throw new Error(`int(${min}, ${max}): max is below min`);
    return min + Math.floor(next() * (max - min + 1));
  };

  const pick = <T,>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('pick() called on an empty list');
    return items[int(0, items.length - 1)]!;
  };

  const shuffle = <T,>(items: readonly T[]): T[] => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i);
      const a = out[i]!;
      const b = out[j]!;
      out[i] = b;
      out[j] = a;
    }
    return out;
  };

  const sample = <T,>(items: readonly T[], n: number): T[] => shuffle(items).slice(0, n);

  return { next, int, pick, shuffle, sample, seed };
}

/** A seed derived from the clock, for when reproducibility is not needed. */
export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
