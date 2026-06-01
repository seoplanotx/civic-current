import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { dailyChallengeNumber } from '../shared/daily';
import { CalendarDays } from 'lucide-react';

/**
 * Entry point for the Daily Challenge. Everyone who taps this on a given day
 * gets the identical map + deterministic event stream, so scores are directly
 * comparable on the shared leaderboard.
 */
export const DailyChallengeButton: React.FC = () => {
  const startDailyChallenge = useGameStore((s) => s.startDailyChallenge);
  const activeChallenge = useGameStore((s) => s.dailyChallengeId);

  return (
    <button
      onClick={startDailyChallenge}
      title="Play today's Daily Challenge — same city for everyone"
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-extrabold shadow-lg transition-all active:scale-[0.97] ${
        activeChallenge
          ? 'bg-amber-500/90 hover:bg-amber-400 border-amber-300/40 text-slate-900'
          : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 text-amber-300 backdrop-blur'
      }`}
    >
      <CalendarDays className="w-4 h-4" />
      <span className="hidden sm:inline">Daily Challenge</span>
      <span className="opacity-70">#{dailyChallengeNumber(new Date())}</span>
    </button>
  );
};
