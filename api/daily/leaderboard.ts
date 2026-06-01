/**
 * GET  /api/daily/leaderboard?date=YYYY-MM-DD&limit=20   → top scores + your rank
 * POST /api/daily/leaderboard                            → submit today's score
 *
 * The Daily Challenge: every player worldwide gets the same map and the same
 * deterministic event stream for a given UTC day (see src/shared/daily.ts and
 * the seeded RNG in src/engine/rng.ts), so legacy scores are directly
 * comparable. This endpoint persists and ranks them.
 *
 * Identity:
 *   - Signed-in players are keyed by their Clerk id ("clerk:<userId>") and the
 *     server overrides any client-supplied playerId/name with trusted values,
 *     so they can't impersonate or pad the board under another id.
 *   - Anonymous players (the school/kids use case — no account required) submit
 *     a client-generated id, stored as "anon:<id>". These are spoofable; see the
 *     integrity note in storage.submitDailyScore.
 *
 * Degrades gracefully: with KV unconfigured, GET returns an empty board and
 * POST reports accepted:false so the client just hides the leaderboard.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  DailyLeaderboardEntry,
  DailyLeaderboardResponse,
  DailyScoreBreakdown,
  DailyScoreSubmitRequest,
  DailyScoreSubmitResponse,
} from '../../src/shared/api-types';
import { dailyChallengeId, isValidChallengeId } from '../../src/shared/daily';
import { authenticateRequest } from '../_lib/auth';
import { getDailyLeaderboard, submitDailyScore } from '../_lib/storage';

const MAX_NAME_LEN = 24;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function todayChallengeId(): string {
  return dailyChallengeId(new Date());
}

function clampScore(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 0;
  return Math.max(0, Math.min(100, v));
}

/** Drop control characters (codepoint < 0x20 and DEL) without a control-char regex. */
function stripControlChars(s: string): string {
  let out = '';
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 && code !== 0x7f) out += ch;
  }
  return out;
}

function sanitizeName(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  const cleaned = stripControlChars(raw).replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LEN);
  return cleaned.length > 0 ? cleaned : fallback;
}

function sanitizeBreakdown(raw: unknown): DailyScoreBreakdown | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const b = raw as Record<string, unknown>;
  return {
    energy: clampScore(b.energy),
    economy: clampScore(b.economy),
    environment: clampScore(b.environment),
    approval: clampScore(b.approval),
    fiscal: clampScore(b.fiscal),
  };
}

/** Anonymous client ids must look like a short opaque token. */
function sanitizeAnonId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  return cleaned.length >= 8 ? cleaned : null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const user = await authenticateRequest(req);

  /* ─────────────────────────────── GET ──────────────────────────────── */
  if (req.method === 'GET') {
    const dateParam = typeof req.query.date === 'string' ? req.query.date : '';
    const challengeId =
      dateParam && isValidChallengeId(dateParam) ? dateParam : todayChallengeId();

    const limitParam = Number(req.query.limit);
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(limitParam)))
      : DEFAULT_LIMIT;

    // Whose "you" standing to resolve: trusted Clerk id if signed in, else the
    // client-supplied anonymous id (read-only here, so spoofing only reveals a
    // public score that player already submitted).
    let playerId: string | undefined;
    if (user) {
      playerId = `clerk:${user.userId}`;
    } else {
      const anon = sanitizeAnonId(req.query.playerId);
      if (anon) playerId = `anon:${anon}`;
    }

    const board = await getDailyLeaderboard(challengeId, limit, playerId);
    const body: DailyLeaderboardResponse = {
      challengeId,
      entries: board.entries,
      total: board.total,
      you: board.you,
    };
    res.status(200).json(body);
    return;
  }

  /* ─────────────────────────────── POST ─────────────────────────────── */
  if (req.method === 'POST') {
    const body = (req.body ?? {}) as Partial<DailyScoreSubmitRequest>;

    const challengeId =
      typeof body.challengeId === 'string' && isValidChallengeId(body.challengeId)
        ? body.challengeId
        : '';
    if (!challengeId) {
      res
        .status(400)
        .json({ error: 'Valid challengeId (YYYY-MM-DD) required', code: 'invalid_input' });
      return;
    }

    // Reject submissions for a future day outright — there's no legitimate way
    // to have finished tomorrow's challenge.
    if (challengeId > todayChallengeId()) {
      res
        .status(400)
        .json({ error: 'Challenge has not started yet', code: 'invalid_input' });
      return;
    }

    if (body.outcome !== 'victory' && body.outcome !== 'failed') {
      res
        .status(400)
        .json({ error: 'outcome must be victory or failed', code: 'invalid_input' });
      return;
    }

    // Resolve trusted identity.
    let playerId: string;
    let name: string;
    if (user) {
      playerId = `clerk:${user.userId}`;
      name = sanitizeName(body.name, user.email?.split('@')[0] ?? 'Mayor');
    } else {
      const anon = sanitizeAnonId(body.playerId);
      if (!anon) {
        res
          .status(400)
          .json({ error: 'A valid playerId is required for anonymous play', code: 'invalid_input' });
        return;
      }
      playerId = `anon:${anon}`;
      name = sanitizeName(body.name, 'Anonymous Mayor');
    }

    const entry: DailyLeaderboardEntry = {
      playerId,
      name,
      legacy: clampScore(body.legacy),
      title: sanitizeName(body.title, 'Mayor'),
      outcome: body.outcome,
      breakdown: sanitizeBreakdown(body.breakdown),
      submittedAt: new Date().toISOString(),
    };

    const result = await submitDailyScore(challengeId, entry);
    const response: DailyScoreSubmitResponse = {
      rank: result.rank,
      total: result.total,
      accepted: result.accepted,
    };
    res.status(200).json(response);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
