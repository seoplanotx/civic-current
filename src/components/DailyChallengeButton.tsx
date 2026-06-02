import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { dailyChallengeNumber } from '../shared/daily';
import { CcIcon } from './PlanningWallDefs';

/**
 * Entry point for the Daily Challenge. Everyone who taps this on a given day
 * gets the identical map + deterministic event stream, so scores are directly
 * comparable on the shared leaderboard. Styled as a taped index-card tab.
 */
export const DailyChallengeButton: React.FC = () => {
  const startDailyChallenge = useGameStore((s) => s.startDailyChallenge);
  const activeChallenge = useGameStore((s) => s.dailyChallengeId);

  return (
    <button
      onClick={startDailyChallenge}
      title="Play today's Daily Challenge — same city for everyone"
      className={`cc-sticky cc-rot-1 flex items-center gap-2 px-3 py-2 text-xs font-extrabold transition-all active:scale-[0.97] ${
        activeChallenge ? 'cc-o' : 'cc-y'
      } text-[color:var(--cc-ink)]`}
    >
      <CcIcon name="flag" solid className="w-4 h-4 text-[color:var(--cc-blue)]" />
      <span className="cc-marker hidden sm:inline">Daily Challenge</span>
      <span className="cc-hand text-[15px] opacity-80">#{dailyChallengeNumber(new Date())}</span>
    </button>
  );
};
