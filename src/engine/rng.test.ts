import { describe, it, expect } from 'vitest';
import { mulberry32, hashSeed, hashStringSeed, makeTurnRng } from './rng';

describe('rng', () => {
  it('mulberry32 is deterministic for a given seed', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = [a(), a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('mulberry32 produces values in [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('different seeds produce different streams', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toEqual(b());
  });

  it('hashSeed is order-sensitive', () => {
    expect(hashSeed(1, 2)).not.toEqual(hashSeed(2, 1));
  });

  it('hashSeed gives well-separated streams for adjacent turns', () => {
    // The whole point of the avalanche: turn 1, 2, 3 must not be correlated.
    const t1 = makeTurnRng(999, 1)();
    const t2 = makeTurnRng(999, 2)();
    const t3 = makeTurnRng(999, 3)();
    expect(t1).not.toEqual(t2);
    expect(t2).not.toEqual(t3);
    expect(t1).not.toEqual(t3);
  });

  it('makeTurnRng is reproducible across independent calls (the daily-challenge guarantee)', () => {
    const first = makeTurnRng(2026_05_31, 7);
    const second = makeTurnRng(2026_05_31, 7);
    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it('hashStringSeed is stable and distinct per string', () => {
    expect(hashStringSeed('2026-05-31')).toEqual(hashStringSeed('2026-05-31'));
    expect(hashStringSeed('2026-05-31')).not.toEqual(hashStringSeed('2026-06-01'));
  });
});
