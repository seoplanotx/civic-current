import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { DailyLeaderboardPanel } from './DailyLeaderboardPanel';
import { CcIcon } from './PlanningWallDefs';

/**
 * ScoreCard — end-of-term overlay, styled as a final report pinned to the
 * planning wall: a legacy-title sticky with hand-drawn metric bars, the
 * narrative blurb, the daily leaderboard panel (for daily runs), and the
 * replay button. Logic unchanged.
 */
export const ScoreCard: React.FC = () => {
  const { state, resetGame } = useGameStore();
  const dailyChallengeId = useGameStore((s) => s.dailyChallengeId);
  const { gameStatus, failedReason, scores } = state;

  if (gameStatus !== 'victory' && gameStatus !== 'failed') return null;

  const finalScores = scores || {
    energySecurity: 0, economicStrength: 0, environmentalHealth: 0,
    publicApproval: 0, fiscalResponsibility: 0, overallLegacy: 0,
    title: 'The Mayor Who Meant Well',
  };

  const isFailed = gameStatus === 'failed';

  const getLegacyDescription = (title: string) => {
    switch (title) {
      case 'Grid Visionary':
        return 'You balanced the complex equations of municipal engineering with extreme precision. The city lights are bright, the air is clean, and the budget is stable. Reviewers will write songs of your term.';
      case 'Green Utopian':
        return 'You prioritized the planet above all else. Your wind farms spin proudly, the river is sparkling, and the citizens breathe the cleanest air in the country. Let’s ignore the fact that the city treasury is practically empty, but you can’t put a price tag on a tree, right?';
      case 'Beloved Mayor':
        return 'You governed with a warm heart and open arms. Citizens loved your tax cuts, beautiful parks, and popular events. High-fives are common on the streets, even if the power grid occasionally flickers.';
      case 'Eco-Preservation Architect':
        return 'Your parks and forest preserves cover the map, creating a green sanctuary. Growth was secondary, but you preserved the natural environment for future generations.';
      case 'Infrastructure Prophet':
        return 'A master of systems. Your batteries are fully charged, the solar fields are vast, and the factories hum with cheap, reliable current. You were a bit cold, but the grid never failed.';
      case 'Coal Baron':
        return 'Cheap power! Huge factories! The grid is incredibly stable and the businesses are booming, but the citizens are wearing industrial-grade respirators. Dark, heavy smog covers the valley, but hey—the factories are fully operational!';
      case 'Growth-at-All-Costs Mayor':
        return 'Capitalism at its finest. You attracted massive industries, built endless suburbs, and filled the city bank accounts with cash. The environment is heavily degraded, but the treasury is overflowing.';
      case 'Bankrupt Idealist':
        return 'Your intentions were beautiful, but mathematics was not your strong suit. You gave the citizens everything they wanted—parks, low taxes, clean grids—right up until the central bank shut down City Hall.';
      case 'Smog Monarch':
        return 'The sky turned pitch black, the river ran green, and the environmental ministry shut down the city. You kept the coal burning, but at what cost?';
      case 'Blackout Governor':
        return 'A dark term—literally. Incessant blackouts caused local businesses to go bankrupt, and citizens eventually recalled you after a month of freezing, grid-wide power failures.';
      default:
        return 'You made some compromises, you built some parks, and you kept the city alive. It wasn’t a flawless term, and the history books will likely summarize you in a single footnote, but you survived the tradeoffs. That is a victory in itself.';
    }
  };

  const bars: { label: string; value: number; color: string }[] = [
    { label: 'Energy security', value: finalScores.energySecurity, color: '#2f6db0' },
    { label: 'Economy', value: finalScores.economicStrength, color: '#2e8b57' },
    { label: 'Environment', value: finalScores.environmentalHealth, color: '#3a9d63' },
    { label: 'Approval', value: finalScores.publicApproval, color: '#f07f95' },
    { label: 'Fiscal', value: finalScores.fiscalResponsibility, color: '#f3a651' },
  ];

  return (
    <div className="cc-backdrop animate-in fade-in duration-300">
      <div className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">

        {/* Main report sticky */}
        <div className={`cc-sticky ${isFailed ? 'cc-p' : 'cc-y'} cc-rot-1 relative p-7`}>
          <span className="cc-pin" />

          <div className="cc-label">
            <CcIcon name={isFailed ? 'warn' : 'flag'} solid className={isFailed ? 'text-[color:var(--cc-red)]' : 'text-[color:var(--cc-blue)]'} />
            {isFailed ? 'Term recalled · administrative suspension' : 'Final report · 50 turns governed'}
          </div>

          <div className="cc-hand text-[22px] text-[color:var(--cc-ink-soft)] mt-3">Your legacy as mayor…</div>
          <div className="relative inline-block">
            <h2 className="cc-hand font-bold text-[40px] leading-none text-[color:var(--cc-ink)]">
              “{finalScores.title}”
            </h2>
            <svg className="cc-rough pointer-events-none absolute -bottom-2 left-0" style={{ width: '100%', height: '14px' }}>
              <path d="M4,8 C100,2 250,2 98%,7" fill="none" stroke="#d8412f" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          {isFailed && (
            <p className="cc-marker text-[13px] font-bold text-[color:var(--cc-red)] mt-3">
              Critical failure: {failedReason}
            </p>
          )}

          {/* Metric bars */}
          <div className="mt-6 flex flex-col gap-3">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between cc-mono text-[11px] uppercase tracking-wider text-[color:var(--cc-ink-soft)]">
                  <span>{b.label}</span><span className="font-bold text-[color:var(--cc-ink)]">{b.value}</span>
                </div>
                <div className="cc-rough h-3.5 mt-1.5 rounded-lg relative overflow-visible" style={{ background: 'rgba(37,48,58,0.1)' }}>
                  <span className="absolute left-0 top-0 bottom-0 rounded-lg" style={{ width: `${b.value}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[12.5px] text-[color:var(--cc-ink)] opacity-85 leading-relaxed mt-5">
            {getLegacyDescription(finalScores.title)}
          </p>
        </div>

        {/* Overall legacy note */}
        <div className="cc-sticky cc-b cc-rot1 relative p-5 mt-5 self-center w-[80%]">
          <span className="cc-pin cc-pin-blue" />
          <div className="cc-label">Overall legacy</div>
          <div className="cc-marker font-bold text-[56px] leading-none mt-1 text-[color:var(--cc-ink)]">
            {finalScores.overallLegacy}<span className="text-[24px] text-[color:var(--cc-ink-soft)]"> / 100</span>
          </div>
        </div>

        {/* Daily leaderboard + share — only for daily runs */}
        {dailyChallengeId && <DailyLeaderboardPanel />}

        {/* Replay */}
        <button onClick={() => resetGame()} className="cc-btn !text-[18px] !py-4 mt-6 mb-2 self-center">
          <svg className="cc-btn-box cc-rough" viewBox="0 0 360 60" preserveAspectRatio="none">
            <rect x="4" y="4" width="352" height="52" rx="11" fill="rgba(158,210,255,0.5)" stroke="#2f6db0" strokeWidth="3.5" />
          </svg>
          <span className="cc-btn-label flex items-center gap-2 text-[#13325a]">
            <CcIcon name="reset" /> {dailyChallengeId ? 'Play a free city' : 'Govern anew'}
          </span>
        </button>
      </div>
    </div>
  );
};
