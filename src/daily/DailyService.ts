/**
 * DailyService — client wrapper over the daily-challenge leaderboard API.
 *
 * Mirrors CloudSaveService's posture: every call degrades gracefully (returns
 * null) on network/KV failure so the game stays fully playable offline. The
 * leaderboard is an enhancement, never a blocker.
 */

import { apiRequest } from '../auth/apiClient';
import type {
  DailyLeaderboardResponse,
  DailyScoreSubmitRequest,
  DailyScoreSubmitResponse,
} from '../shared/api-types';

const ANON_ID_KEY = 'civic_current_anon_id';
const DISPLAY_NAME_KEY = 'civic_current_display_name';

/**
 * Stable per-browser id for anonymous players (kids/classrooms with no account).
 * Generated once and persisted; used so a player's repeated submissions update a
 * single leaderboard row instead of spamming new ones.
 */
export function getOrCreateAnonId(): string {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      const raw =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      id = raw.replace(/[^a-zA-Z0-9_-]/g, '');
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return 'anon-local-player';
  }
}

export function getDisplayName(): string {
  try {
    return localStorage.getItem(DISPLAY_NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setDisplayName(name: string): void {
  try {
    localStorage.setItem(DISPLAY_NAME_KEY, name);
  } catch {
    /* ignore quota/availability errors */
  }
}

export const dailyService = {
  async getLeaderboard(opts?: {
    date?: string;
    limit?: number;
  }): Promise<DailyLeaderboardResponse | null> {
    const params = new URLSearchParams();
    if (opts?.date) params.set('date', opts.date);
    if (opts?.limit) params.set('limit', String(opts.limit));
    params.set('playerId', getOrCreateAnonId());
    try {
      return await apiRequest<DailyLeaderboardResponse>(
        `/api/daily/leaderboard?${params.toString()}`
      );
    } catch {
      return null;
    }
  },

  async submit(
    req: DailyScoreSubmitRequest
  ): Promise<DailyScoreSubmitResponse | null> {
    try {
      return await apiRequest<DailyScoreSubmitResponse>(
        '/api/daily/leaderboard',
        { method: 'POST', body: req }
      );
    } catch {
      return null;
    }
  },
};
