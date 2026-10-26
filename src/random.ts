/** A random source returning a float in [0, 1). */
export type Rng = () => number;

/** Small, fast seeded PRNG (mulberry32) so test data can be reproduced. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function int(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function digits(rng: Rng, count: number): string {
  let out = "";
  for (let i = 0; i < count; i++) out += int(rng, 0, 9);
  return out;
}
