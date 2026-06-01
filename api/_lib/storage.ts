/**
 * Persistent storage helpers backed by Vercel KV.
 *
 * Storage layout:
 *   user:<userId>:entitlements      → JSON { hasPremium, hasSubscription, ownedPackIds[] }
 *   user:<userId>:slots             → JSON string[] (slot ids in display order)
 *   user:<userId>:slot:<slotId>     → JSON CloudSaveSlot
 *   stripe:customer:<userId>        → Stripe customer id
 *   stripe:checkout:<sessionId>     → userId (set when checkout starts; consumed by webhook)
 *
 * Vercel KV must be provisioned in the dashboard and the project must have
 * KV_REST_API_URL + KV_REST_API_TOKEN env vars set. Without those vars all
 * reads return defaults and writes are no-ops, so the app keeps working
 * (anonymous, local-save only) in environments where KV isn't configured.
 */

import { createClient, type VercelKV } from '@vercel/kv';
import type {
  CloudSaveSlot,
  DailyLeaderboardEntry,
} from '../../src/shared/api-types';

interface StoredEntitlements {
  hasPremium: boolean;
  hasSubscription: boolean;
  ownedPackIds: string[];
}

const DEFAULT_ENTITLEMENTS: StoredEntitlements = {
  hasPremium: false,
  hasSubscription: false,
  ownedPackIds: [],
};

let cachedKv: VercelKV | null = null;
let kvAvailable: boolean | null = null;

function getKv(): VercelKV | null {
  if (kvAvailable === false) return null;
  if (cachedKv) return cachedKv;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    kvAvailable = false;
    return null;
  }
  cachedKv = createClient({ url, token });
  kvAvailable = true;
  return cachedKv;
}

/* ─────────────────────────────── keys ─────────────────────────────────── */

const k = {
  entitlements: (userId: string) => `user:${userId}:entitlements`,
  slots: (userId: string) => `user:${userId}:slots`,
  slot: (userId: string, slotId: string) => `user:${userId}:slot:${slotId}`,
  stripeCustomer: (userId: string) => `stripe:customer:${userId}`,
  stripeCheckout: (sessionId: string) => `stripe:checkout:${sessionId}`,
  // Daily challenge: a sorted set ranks players by score; a hash holds the
  // full entry (name, title, breakdown) keyed by playerId.
  dailyRank: (challengeId: string) => `daily:${challengeId}:rank`,
  dailyEntries: (challengeId: string) => `daily:${challengeId}:entries`,
};

/** Keep finished daily boards around for two months, then let them expire. */
const DAILY_TTL_SECONDS = 60 * 60 * 24 * 60;

/* ─────────────────────────────── entitlements ─────────────────────────── */

export async function getEntitlements(userId: string): Promise<StoredEntitlements> {
  const kv = getKv();
  if (!kv) return DEFAULT_ENTITLEMENTS;
  const raw = await kv.get<StoredEntitlements>(k.entitlements(userId));
  return raw ?? DEFAULT_ENTITLEMENTS;
}

export async function setEntitlements(
  userId: string,
  next: Partial<StoredEntitlements>
): Promise<StoredEntitlements> {
  const kv = getKv();
  const current = await getEntitlements(userId);
  const merged: StoredEntitlements = {
    hasPremium: next.hasPremium ?? current.hasPremium,
    hasSubscription: next.hasSubscription ?? current.hasSubscription,
    ownedPackIds: next.ownedPackIds ?? current.ownedPackIds,
  };
  if (kv) await kv.set(k.entitlements(userId), merged);
  return merged;
}

/* ─────────────────────────────── slots ────────────────────────────────── */

export async function listSlots(userId: string): Promise<CloudSaveSlot[]> {
  const kv = getKv();
  if (!kv) return [];
  const ids = (await kv.get<string[]>(k.slots(userId))) ?? [];
  if (ids.length === 0) return [];
  const slots = await Promise.all(
    ids.map((id) => kv.get<CloudSaveSlot>(k.slot(userId, id)))
  );
  return slots.filter((s): s is CloudSaveSlot => s !== null);
}

export async function getSlot(
  userId: string,
  slotId: string
): Promise<CloudSaveSlot | null> {
  const kv = getKv();
  if (!kv) return null;
  return (await kv.get<CloudSaveSlot>(k.slot(userId, slotId))) ?? null;
}

export async function upsertSlot(
  userId: string,
  slot: CloudSaveSlot
): Promise<void> {
  const kv = getKv();
  if (!kv) return;
  const ids = (await kv.get<string[]>(k.slots(userId))) ?? [];
  if (!ids.includes(slot.id)) {
    ids.push(slot.id);
    await kv.set(k.slots(userId), ids);
  }
  await kv.set(k.slot(userId, slot.id), slot);
}

export async function deleteSlot(
  userId: string,
  slotId: string
): Promise<void> {
  const kv = getKv();
  if (!kv) return;
  const ids = (await kv.get<string[]>(k.slots(userId))) ?? [];
  const remaining = ids.filter((id) => id !== slotId);
  await kv.set(k.slots(userId), remaining);
  await kv.del(k.slot(userId, slotId));
}

/* ─────────────────────────────── stripe linkage ───────────────────────── */

export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const kv = getKv();
  if (!kv) return null;
  return (await kv.get<string>(k.stripeCustomer(userId))) ?? null;
}

export async function setStripeCustomerId(
  userId: string,
  customerId: string
): Promise<void> {
  const kv = getKv();
  if (!kv) return;
  await kv.set(k.stripeCustomer(userId), customerId);
}

export async function recordPendingCheckout(
  sessionId: string,
  userId: string
): Promise<void> {
  const kv = getKv();
  if (!kv) return;
  // Pending checkouts expire in 1 hour — abandoned sessions shouldn't linger
  await kv.set(k.stripeCheckout(sessionId), userId, { ex: 60 * 60 });
}

export async function consumePendingCheckout(
  sessionId: string
): Promise<string | null> {
  const kv = getKv();
  if (!kv) return null;
  const userId = await kv.get<string>(k.stripeCheckout(sessionId));
  if (userId) await kv.del(k.stripeCheckout(sessionId));
  return userId;
}

/* ─────────────────────────────── daily challenge ──────────────────────── */

/**
 * Record a player's daily-challenge result. Best-per-player: a submission only
 * overwrites the player's prior entry if the new legacy score is higher.
 *
 * Returns the player's 1-based rank and the total field size. When KV is not
 * configured this is a no-op returning a zeroed, un-accepted result so the
 * client can degrade gracefully (play offline, no board).
 *
 * NOTE: scores are currently client-reported and trusted. A future pass should
 * verify them by replaying the submitted move sequence server-side against the
 * deterministic engine — the seeded RNG is what makes that verification
 * possible. Until then, treat the board as casual, not competitive-integrity.
 */
export async function submitDailyScore(
  challengeId: string,
  entry: DailyLeaderboardEntry
): Promise<{ rank: number; total: number; accepted: boolean }> {
  const kv = getKv();
  if (!kv) return { rank: 0, total: 0, accepted: false };

  const rankKey = k.dailyRank(challengeId);
  const entriesKey = k.dailyEntries(challengeId);

  const existing = await kv.hget<DailyLeaderboardEntry>(
    entriesKey,
    entry.playerId
  );

  const accepted = !existing || entry.legacy > existing.legacy;
  if (accepted) {
    await kv.zadd(rankKey, { score: entry.legacy, member: entry.playerId });
    await kv.hset(entriesKey, { [entry.playerId]: entry });
    // Refresh TTL on every accepted write so an active board never expires.
    await kv.expire(rankKey, DAILY_TTL_SECONDS);
    await kv.expire(entriesKey, DAILY_TTL_SECONDS);
  }

  const best = accepted ? entry.legacy : existing!.legacy;
  const total = (await kv.zcard(rankKey)) ?? 0;
  // Rank = (players strictly above me) + 1. Scores are integers, so anyone in
  // [best+1, +inf] is strictly higher.
  const higher = (await kv.zcount(rankKey, best + 1, '+inf')) ?? 0;
  return { rank: higher + 1, total, accepted };
}

/**
 * Fetch the top `limit` entries for a challenge (highest legacy first), plus
 * the total field size and — when a playerId is supplied — that player's own
 * standing even if they fall outside the top slice.
 */
export async function getDailyLeaderboard(
  challengeId: string,
  limit: number,
  playerId?: string
): Promise<{
  entries: DailyLeaderboardEntry[];
  total: number;
  you?: { rank: number; entry: DailyLeaderboardEntry };
}> {
  const kv = getKv();
  if (!kv) return { entries: [], total: 0 };

  const rankKey = k.dailyRank(challengeId);
  const entriesKey = k.dailyEntries(challengeId);

  const total = (await kv.zcard(rankKey)) ?? 0;
  if (total === 0) return { entries: [], total: 0 };

  const topIds =
    (await kv.zrange<string[]>(rankKey, 0, limit - 1, { rev: true })) ?? [];

  let entries: DailyLeaderboardEntry[] = [];
  if (topIds.length > 0) {
    const map = await kv.hmget<Record<string, DailyLeaderboardEntry>>(
      entriesKey,
      ...topIds
    );
    entries = topIds
      .map((id) => map?.[id])
      .filter((e): e is DailyLeaderboardEntry => Boolean(e));
  }

  let you: { rank: number; entry: DailyLeaderboardEntry } | undefined;
  if (playerId) {
    const mine = await kv.hget<DailyLeaderboardEntry>(entriesKey, playerId);
    if (mine) {
      const higher = (await kv.zcount(rankKey, mine.legacy + 1, '+inf')) ?? 0;
      you = { rank: higher + 1, entry: mine };
    }
  }

  return { entries, total, you };
}

/** Whether KV is currently configured. Used by handlers to short-circuit. */
export function isStorageConfigured(): boolean {
  return getKv() !== null;
}
