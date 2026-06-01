/**
 * Shared types between the React client and the Vercel serverless API.
 *
 * Imported from both `src/` (frontend) and `api/` (backend). Keep this
 * module free of runtime dependencies on either side — types only.
 */

/* ─────────────────────────────── entitlements ──────────────────────────── */

/**
 * Wire format returned by GET /api/entitlements. Mirrors `UserEntitlements`
 * in `content/types.ts` but uses `string[]` instead of `Set` so it survives
 * JSON serialization.
 */
export interface EntitlementsResponse {
  hasPremium: boolean;
  hasSubscription: boolean;
  ownedPackIds: string[];
  /**
   * @deprecated Legacy multi-equip set kept for back-compat. New cosmetic
   * features use the singular `equippedCosmeticId` below — a player equips one
   * theme at a time. Do not add new readers of this field.
   */
  equippedCosmeticIds: string[];
  /** Cosmetic theme IDs the user has purchased. */
  ownedCosmeticIds: string[];
  /** The single currently-equipped theme; null = default look. */
  equippedCosmeticId: string | null;
  /** Subscription lifecycle state. Defaults to 'none' when no subscription. */
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'none';
  /** Email of the authenticated user, for UI display. */
  email?: string;
}

/** Body POSTed to /api/cosmetics/equip. `null` reverts to the default look. */
export interface EquipCosmeticRequest {
  cosmeticId: string | null;
}

/** Response from /api/cosmetics/equip — the resolved equipped theme. */
export interface EquipCosmeticResponse {
  equippedCosmeticId: string | null;
}

/* ─────────────────────────────── checkout ──────────────────────────────── */

/** Body POSTed to /api/checkout/premium. */
export interface CreateCheckoutRequest {
  /** URL Stripe should send the user to after successful payment. */
  successUrl: string;
  /** URL Stripe should send the user to if they cancel. */
  cancelUrl: string;
}

/** Response from /api/checkout/premium. The client redirects to `url`. */
export interface CreateCheckoutResponse {
  url: string;
  sessionId: string;
}

/* ─────────────────────────────── cloud save ────────────────────────────── */

/** A single saved game (one city). */
export interface CloudSaveSlot {
  /** Stable slot id (e.g. 'slot-1', 'slot-2'). */
  id: string;
  /** Player-chosen display name for this city. */
  cityName: string;
  /** Opaque JSON blob — the serialized GameState. */
  state: unknown;
  /** ISO 8601 timestamp of last save. */
  updatedAt: string;
  /** Game turn at last save (for the slot picker preview). */
  turn?: number;
  /** Player legacy score at last save (for the slot picker preview). */
  legacy?: number;
}

/** Response from GET /api/cloud-save (list of slots). */
export interface CloudSaveListResponse {
  slots: CloudSaveSlot[];
  /** How many slots the user is entitled to (1 for free, 3 for premium, 5 with subscription). */
  maxSlots: number;
}

/** Body PUT to /api/cloud-save/[slot]. */
export interface CloudSavePutRequest {
  cityName: string;
  state: unknown;
  turn?: number;
  legacy?: number;
}

/* ─────────────────────────────── errors ────────────────────────────────── */

export interface ApiError {
  error: string;
  code?:
    | 'unauthenticated'
    | 'slot_limit_exceeded'
    | 'not_found'
    | 'invalid_input'
    | 'server_error';
}

/* ─────────────────────────────── slot policy ───────────────────────────── */

/** Authoritative slot allowance per entitlement tier. */
export const SLOT_LIMITS = {
  free: 1,
  premium: 3,
  subscription: 5,
} as const;

export function computeMaxSlots(
  hasPremium: boolean,
  hasSubscription: boolean
): number {
  if (hasSubscription) return SLOT_LIMITS.subscription;
  if (hasPremium) return SLOT_LIMITS.premium;
  return SLOT_LIMITS.free;
}

/* ─────────────────────────────── stripe products ───────────────────────── */

/**
 * Stripe price-id env vars by SKU. The actual price IDs are configured in
 * the Vercel dashboard / .env and validated server-side per request.
 */
export const STRIPE_PRICE_ENV = {
  premiumUnlock: 'STRIPE_PRICE_PREMIUM_UNLOCK',
} as const;

/* ─────────────────────────── daily challenge ──────────────────────────── */

/** The five scorecard pillars, in share-friendly short keys. */
export interface DailyScoreBreakdown {
  energy: number;
  economy: number;
  environment: number;
  approval: number;
  fiscal: number;
}

/** One player's result on a given daily challenge. */
export interface DailyLeaderboardEntry {
  /** Stable per-player id: "clerk:<userId>" when signed in, else "anon:<uuid>". */
  playerId: string;
  /** Display name shown on the board. */
  name: string;
  /** Overall legacy score (0–100). The leaderboard sort key. */
  legacy: number;
  /** Earned title, e.g. "Green Utopian". */
  title: string;
  outcome: 'victory' | 'failed';
  breakdown?: DailyScoreBreakdown;
  /** ISO-8601 timestamp of submission. */
  submittedAt: string;
}

export interface DailyLeaderboardResponse {
  challengeId: string;
  /** Top entries, highest legacy first. */
  entries: DailyLeaderboardEntry[];
  /** Total number of players who have submitted for this challenge. */
  total: number;
  /** The requesting player's own standing, if they've submitted. */
  you?: { rank: number; entry: DailyLeaderboardEntry };
}

export interface DailyScoreSubmitRequest {
  challengeId: string;
  /** Client-generated id for anonymous players. Ignored/overridden when authed. */
  playerId: string;
  name: string;
  legacy: number;
  title: string;
  outcome: 'victory' | 'failed';
  breakdown?: DailyScoreBreakdown;
}

export interface DailyScoreSubmitResponse {
  /** 1-based rank after this submission. 0 if the leaderboard backend is offline. */
  rank: number;
  total: number;
  /** False when the score was rejected (e.g. not a personal best, or KV offline). */
  accepted: boolean;
}
