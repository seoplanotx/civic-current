/**
 * Daily Challenge identity + seed derivation.
 *
 * Shared by the client (to start today's run and build share text) and the
 * serverless API (to namespace the leaderboard). Everything keys off the UTC
 * calendar day so every player worldwide shares exactly one challenge per day.
 *
 * Pure module — no `window`, no side effects — so it imports cleanly on both
 * the browser and the Node serverless runtime.
 */

import { hashStringSeed } from '../engine/rng';
import type { DailyScoreBreakdown } from './api-types';

/** Challenge #1 launched on this UTC day. Used to compute the sequential number. */
const LAUNCH_UTC = Date.UTC(2026, 0, 1); // 2026-01-01
const MS_PER_DAY = 86_400_000;

/** Midnight-UTC timestamp for the calendar day a given date falls on. */
function utcDayStart(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Stable public id for a day's challenge, e.g. "2026-05-31".
 * This is the key the leaderboard is namespaced under.
 */
export function dailyChallengeId(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Validate a challenge id string (defends the API against arbitrary keys). */
export function isValidChallengeId(id: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(id);
}

/** Sequential challenge number since launch — the "#142" in share text. */
export function dailyChallengeNumber(date: Date): number {
  return Math.floor((utcDayStart(date) - LAUNCH_UTC) / MS_PER_DAY) + 1;
}

/**
 * The numeric base seed for a day. Feeds both `generateMap(seed)` and the
 * per-turn event RNG, so the entire run is reproducible from the date alone.
 */
export function dailySeed(date: Date): number {
  return hashStringSeed(`civic-current:${dailyChallengeId(date)}`);
}

/**
 * The Wordle-style shareable result. Identity-forward (your earned title leads),
 * scannable emoji pillars, and a link back to play the same challenge — the
 * three ingredients of the share loop.
 */
export function buildDailyShareText(opts: {
  challengeNumber: number;
  title: string;
  legacy: number;
  breakdown: DailyScoreBreakdown;
  outcome: 'victory' | 'failed';
  url: string;
}): string {
  const { challengeNumber, title, legacy, breakdown, outcome, url } = opts;
  const banner = outcome === 'victory' ? '🏛️' : '💥';
  const pillars = `⚡${breakdown.energy} 💰${breakdown.fiscal} 🌍${breakdown.environment} ❤️${breakdown.approval}`;
  return `Civic Current #${challengeNumber} ${banner}\n${title} — Legacy ${legacy}\n${pillars}\nCan you run a better city? ${url}`;
}
