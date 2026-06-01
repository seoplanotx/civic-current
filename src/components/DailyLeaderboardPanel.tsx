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
import { Trophy, Share2, Check, Loader2, Medal } from 'lucide-react';

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
    <div className="mt-4 bg-slate-800/40 rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-amber-300">
          <Trophy className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">
            Daily Challenge #{dailyChallengeNumber(new Date())}
          </span>
        </div>
        {board?.you && (
          <span className="text-[11px] font-bold text-slate-300">
            Your rank: <span className="text-amber-300">#{board.you.rank}</span>
            <span className="text-slate-500"> / {board.total}</span>
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
          className="flex-1 bg-slate-900/70 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
        />
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-400 text-slate-900 text-xs font-extrabold transition-colors active:scale-[0.97]"
        >
          {shareLabel === 'Copied!' ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
          {shareLabel}
        </button>
      </div>

      {/* Board */}
      {status === 'submitting' && (
        <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading leaderboard…
        </div>
      )}

      {status === 'offline' && (
        <p className="text-center text-[11px] text-slate-500 py-3">
          Leaderboard is offline — your score is saved locally and counts when you reconnect.
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
                  isMe ? 'bg-indigo-500/20 border border-indigo-400/30' : 'bg-slate-900/40'
                }`}
              >
                <span className="w-6 text-center font-black text-slate-400">
                  {idx === 0 ? <Medal className="w-3.5 h-3.5 inline text-amber-300" /> : idx + 1}
                </span>
                <span className="flex-1 truncate font-bold text-slate-200">
                  {entry.name}
                </span>
                <span className="text-slate-500 truncate max-w-[110px] hidden sm:inline">
                  {entry.title}
                </span>
                <span className="font-black text-white tabular-nums">{entry.legacy}</span>
              </li>
            );
          })}
        </ol>
      )}

      {status === 'done' && board && board.entries.length === 0 && (
        <p className="text-center text-[11px] text-slate-500 py-3">
          You're the first to finish today's challenge. Share it and see who can beat you.
        </p>
      )}
    </div>
  );
};
