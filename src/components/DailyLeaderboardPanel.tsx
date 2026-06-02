import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  dailyService,
  getOrCreateAnonId,
  getDisplayName,
  setDisplayName,
} from '../daily/DailyService';
import {
  buildDailyShareText,
  dailyChallengeNumber,
} from '../shared/daily';
import type {
  DailyLeaderboardResponse,
  DailyScoreBreakdown,
  DailyScoreSubmitRequest,
} from '../shared/api-types';
import { CcIcon } from './PlanningWallDefs';

/**
 * Shown inside the ScoreCard when the finished run was today's Daily Challenge.
 * Submits the result once, then renders the leaderboard + a shareable result.
 *
 * Everything here is best-effort: if the leaderboard backend is offline the
 * panel quietly shows nothing rather than blocking the end-of-game screen.
 */
export const DailyLeaderboardPanel: React.FC = () => {
  const state = useGameStore((s) => s.state);
  const challengeId = useGameStore((s) => s.dailyChallengeId);

  const [board, setBoard] = useState<DailyLeaderboardResponse | null>(null);
  const [status, setStatus] = useState<'submitting' | 'done' | 'offline'>('submitting');
  const [name, setName] = useState<string>(getDisplayName());
  const [shareLabel, setShareLabel] = useState<'Share result' | 'Copied!'>('Share result');

  const scores = state.scores;

  const breakdown: DailyScoreBreakdown | null = scores
    ? {
        energy: scores.energySecurity,
        economy: scores.economicStrength,
        environment: scores.environmentalHealth,
        approval: scores.publicApproval,
        fiscal: scores.fiscalResponsibility,
      }
    : null;

  // Submit the result and reload the board. setState only happens *after* the
  // first await, so this is safe to kick off from the mount effect without
  // triggering synchronous cascading renders.
  async function runSubmit(displayName: string) {
    if (!challengeId || !scores || !breakdown) return;
    const req: DailyScoreSubmitRequest = {
      challengeId,
      playerId: getOrCreateAnonId(),
      name: displayName.trim() || 'Anonymous Mayor',
      legacy: scores.overallLegacy,
      title: scores.title,
      outcome: state.gameStatus === 'victory' ? 'victory' : 'failed',
      breakdown,
    };
    const result = await dailyService.submit(req);
    const fresh = await dailyService.getLeaderboard({ date: challengeId, limit: 10 });
    if (!result && !fresh) {
      setStatus('offline');
      return;
    }
    setBoard(fresh);
    setStatus('done');
  }

  // Submit once on mount, then load the board. This is a fetch-on-mount effect:
  // runSubmit only setStates after its first await (in a microtask), so it does
  // not cause synchronous cascading renders — but the static rule can't see
  // past the async call, so we disable it here with that justification.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runSubmit(getDisplayName());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!challengeId || !scores || !breakdown) return null;

  const handleShare = async () => {
    const url = `${window.location.origin}/?daily=1`;
    const text = buildDailyShareText({
      challengeNumber: dailyChallengeNumber(new Date()),
      title: scores.title,
      legacy: scores.overallLegacy,
      breakdown,
      outcome: state.gameStatus === 'victory' ? 'victory' : 'failed',
      url,
    });
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareLabel('Copied!');
        setTimeout(() => setShareLabel('Share result'), 2000);
      }
    } catch {
      /* user dismissed the share sheet — no-op */
    }
  };

  const handleSaveName = () => {
    setDisplayName(name.trim());
    setStatus('submitting');
    runSubmit(name);
  };

  // The server resolves our own id (anon: or clerk:) and returns it in `you`.
  const myServerId = board?.you?.entry.playerId;

  return (
    <div className="cc-sticky cc-g cc-rot1 relative mt-5 p-4 self-stretch">
      <span className="cc-pin cc-pin-green" />
      <div className="flex items-center justify-between mb-3">
        <div className="cc-label text-[color:var(--cc-ink)]">
          <CcIcon name="trophy" className="text-[color:var(--cc-blue)]" />
          Daily Challenge #{dailyChallengeNumber(new Date())}
        </div>
        {board?.you && (
          <span className="cc-hand text-[18px] text-[color:var(--cc-ink-soft)]">
            Your rank: <span className="text-[color:var(--cc-blue)] font-bold">#{board.you.rank}</span>
            <span className="text-[color:var(--cc-ink-soft)]"> / {board.total}</span>
          </span>
        )}
      </div>

      {/* Name + share row */}
      <div className="flex items-center gap-2 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
          maxLength={24}
          placeholder="Your name for the board"
          className="flex-1 cc-marker bg-white/60 border border-dashed border-[rgba(37,48,58,0.25)] rounded-lg px-3 py-2 text-[13px] text-[color:var(--cc-ink)] placeholder:text-[color:var(--cc-ink-soft)] focus:outline-none focus:border-[color:var(--cc-blue)]"
        />
        <button onClick={handleShare} className="cc-btn !px-3 !py-2 shrink-0">
          <svg className="cc-btn-box cc-rough" viewBox="0 0 150 44" preserveAspectRatio="none">
            <rect x="3" y="3" width="144" height="38" rx="8" fill="rgba(47,109,176,0.16)" stroke="#2f6db0" strokeWidth="3" />
          </svg>
          <span className="cc-btn-label flex items-center gap-1.5 text-[13px] text-[color:var(--cc-blue)]">
            <CcIcon name={shareLabel === 'Copied!' ? 'check' : 'share'} className="w-3.5 h-3.5" />
            {shareLabel}
          </span>
        </button>
      </div>

      {/* Board */}
      {status === 'submitting' && (
        <div className="flex items-center justify-center gap-2 py-4 text-[color:var(--cc-ink-soft)] cc-hand text-[18px]">
          <CcIcon name="clock" className="w-4 h-4 animate-spin" /> Loading leaderboard…
        </div>
      )}

      {status === 'offline' && (
        <p className="text-center cc-hand text-[17px] text-[color:var(--cc-ink-soft)] py-3">
          Leaderboard's offline — your score is saved here and counts when you reconnect.
        </p>
      )}

      {status === 'done' && board && board.entries.length > 0 && (
        <ol className="flex flex-col gap-1">
          {board.entries.map((entry, idx) => {
            const isMe = !!myServerId && entry.playerId === myServerId;
            return (
              <li
                key={entry.playerId}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                  isMe ? 'bg-[color:var(--cc-blue)]/15 border border-[color:var(--cc-blue)]/35' : 'bg-white/45'
                }`}
              >
                <span className="w-6 text-center cc-marker font-bold text-[color:var(--cc-ink-soft)]">
                  {idx === 0 ? <CcIcon name="trophy" className="w-3.5 h-3.5 inline text-[color:var(--cc-blue)]" /> : idx + 1}
                </span>
                <span className="flex-1 truncate cc-marker font-bold text-[color:var(--cc-ink)]">
                  {entry.name}
                </span>
                <span className="cc-mono text-[10px] text-[color:var(--cc-ink-soft)] truncate max-w-[110px] hidden sm:inline">
                  {entry.title}
                </span>
                <span className="cc-marker font-bold text-[color:var(--cc-ink)] tabular-nums">{entry.legacy}</span>
              </li>
            );
          })}
        </ol>
      )}

      {status === 'done' && board && board.entries.length === 0 && (
        <p className="text-center cc-hand text-[17px] text-[color:var(--cc-ink-soft)] py-3">
          You're the first to finish today's challenge — share it and see who can beat you!
        </p>
      )}
    </div>
  );
};
