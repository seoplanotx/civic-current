/**
 * Deterministic, serializable pseudo-random number generation for the engine.
 *
 * Why this exists: a fair Daily Challenge requires that two players who start
 * from the same seed and make the same moves see the same events. `Math.random()`
 * can't give us that — its internal state isn't reproducible and can't be saved.
 * So every stochastic decision in the simulation flows through here instead.
 *
 * Design contract:
 *   - We never store a live RNG object in GameState (a function/closure can't
 *     survive the JSON round-trip to cloud save). Instead GameState carries a
 *     single integer `seed`, and we re-derive a fresh, independent stream for
 *     each turn from (seed, turn) via `makeTurnRng`.
 *   - Same (seed, turn) → same stream, on any device, forever.
 *   - The ORDER of pulls within a turn is part of the contract: inserting a new
 *     `rng()` call in the middle of turn resolution shifts every later pull and
 *     changes outcomes for that seed. Add new pulls at the end where possible.
 */

/**
 * mulberry32 — a tiny, fast, well-distributed 32-bit PRNG.
 * Returns a generator producing floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Mix integers into a single well-scrambled 32-bit seed. Order-sensitive, so
 * hashSeed(seed, turn) gives a distinct stream per turn. Uses an FNV-1a core
 * with extra avalanche so adjacent inputs (turn 1, 2, 3…) diverge sharply
 * instead of producing correlated streams.
 */
export function hashSeed(...parts: number[]): number {
  let h = 2166136261 >>> 0; // FNV offset basis
  for (const part of parts) {
    h ^= part | 0;
    h = Math.imul(h, 16777619); // FNV prime
    h ^= h >>> 13;
  }
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Convert an arbitrary string (e.g. a daily-challenge id like "2026-05-31")
 * into a stable 32-bit numeric seed.
 */
export function hashStringSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * The canonical per-turn stream. Every random decision taken while resolving a
 * given turn pulls from this one generator. Deterministic in (seed, turn).
 */
export function makeTurnRng(seed: number, turn: number): () => number {
  return mulberry32(hashSeed(seed, turn));
}

/** Default base seed, used as a fallback for saves created before seeds existed. */
export const DEFAULT_SEED = 42;
