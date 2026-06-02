import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { CcIcon } from './PlanningWallDefs';

/**
 * TopBar — the city's vital stats, rendered as a cluster of color-coded sticky
 * notes pinned/taped to the planning wall, plus a warning banner and the
 * turn-tracker checklist note. The data is identical to before; only the
 * presentation changed to the Planning Wall aesthetic.
 */

interface NoteProps {
  paper: 'y' | 'p' | 'b' | 'g' | 'o';
  rot: string;
  icon: string;
  label: string;
  /** main value node */
  children: React.ReactNode;
  sub?: React.ReactNode;
  subTone?: 'soft' | 'up' | 'warn';
  pin?: 'red' | 'blue' | 'green' | null;
  tape?: boolean;
  /** draws the red "flagged" hand-drawn circle around the note */
  flagged?: boolean;
}

const StatNote: React.FC<NoteProps> = ({
  paper, rot, icon, label, children, sub, subTone = 'soft', pin = null, tape = false, flagged = false,
}) => {
  const subColor =
    subTone === 'up' ? 'text-[color:var(--cc-green)]'
    : subTone === 'warn' ? 'text-[color:var(--cc-red)]'
    : 'text-[color:var(--cc-ink-soft)]';
  const pinClass =
    pin === 'blue' ? 'cc-pin cc-pin-blue'
    : pin === 'green' ? 'cc-pin cc-pin-green'
    : pin === 'red' ? 'cc-pin'
    : '';
  return (
    <div className={`cc-sticky cc-${paper} ${rot} ${tape ? 'cc-tape' : ''} relative px-3 py-2.5 sm:px-4 sm:py-3 w-full lg:w-auto lg:min-w-[150px]`}>
      {pin && <span className={pinClass} />}
      <div className="cc-label">
        <CcIcon name={icon} /> {label}
      </div>
      <div className="cc-marker font-bold text-[26px] sm:text-[34px] leading-none mt-1 sm:mt-1.5 mb-1 text-[color:var(--cc-ink)]">
        {children}
      </div>
      {sub && <div className={`cc-hand text-[16px] sm:text-[19px] leading-tight ${subColor}`}>{sub}</div>}

      {flagged && (
        <svg
          className="cc-rough pointer-events-none absolute"
          style={{ inset: '-14px', width: 'calc(100% + 28px)', height: 'calc(100% + 28px)' }}
        >
          <ellipse cx="50%" cy="54%" rx="46%" ry="44%" fill="none" stroke="#d8412f" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};

const Unit: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[14px] sm:text-[17px] font-semibold text-[color:var(--cc-ink-soft)]">{children}</span>
);

export const TopBar: React.FC = () => {
  const { state } = useGameStore();
  const {
    turn, maxTurns, budget, income, expenses, politicalCapital,
    population, populationCapacity, jobs, powerSupply, powerDemand,
    reliability, environment, approval, warnings, gameStatus, warningTurnsLeft,
  } = state;

  const surplus = income - expenses;
  const isDeficit = surplus < 0;
  const loadRatio = powerSupply > 0 ? powerDemand / powerSupply : (powerDemand > 0 ? 2 : 0);
  const powerStrained = powerDemand > powerSupply || loadRatio >= 0.85;
  const unemployed = Math.max(0, population - jobs);

  // turn-tracker ticks
  const ticks = Array.from({ length: maxTurns }, (_, i) => i < turn);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Critical alert banner — a torn red-edged warning note */}
      {gameStatus === 'warning' && (
        <div className="cc-sticky cc-p cc-tape cc-rot-1 w-full px-5 py-3 flex items-center justify-between gap-3 animate-pulse-slow">
          <div className="flex items-center gap-2.5">
            <CcIcon name="warn" className="text-[color:var(--cc-red)] w-6 h-6 shrink-0" />
            <div className="text-[color:var(--cc-ink)]">
              <span className="cc-hand font-bold text-2xl text-[color:var(--cc-red)] mr-2">Last warning!</span>
              <span className="text-[13px]">{warnings.length > 0 ? warnings[0] : 'The city is at high risk of administrative collapse.'}</span>
            </div>
          </div>
          <div className="cc-mono font-bold text-xs text-[color:var(--cc-red)] border-2 border-[color:var(--cc-red)] rounded-lg px-3 py-1 shrink-0 -rotate-2">
            {warningTurnsLeft} TURN{warningTurnsLeft !== 1 ? 'S' : ''} LEFT
          </div>
        </div>
      )}

      <div className="w-full flex flex-col lg:flex-row items-start justify-between gap-4 lg:gap-4 lg:flex-wrap">
        {/* Title lockup */}
        <div className="relative shrink-0">
          <span className="cc-masking-tape">
            <h1 className="cc-marker font-bold text-[32px] sm:text-[40px] leading-none text-[color:var(--cc-ink)] m-0">
              Civic <span className="text-[color:var(--cc-red)]">Current</span>
            </h1>
          </span>
          <div className="cc-hand font-semibold text-[20px] sm:text-[24px] text-[color:var(--cc-blue)] mt-1.5 ml-1.5">
            keep the lights on →
          </div>
        </div>

        {/* Stat sticky cluster — 2-col grid on mobile, 3-col on sm, flex-wrap on lg */}
        <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-start gap-3 sm:gap-x-5 sm:gap-y-6 lg:flex-wrap lg:justify-end lg:flex-1">
          <StatNote paper="y" rot="cc-rot-2" tape icon="coin" label="Treasury"
            sub={`${isDeficit ? '▼' : '▲'} ${isDeficit ? '-' : '+'}$${Math.abs(surplus)} / turn`}
            subTone={isDeficit ? 'warn' : 'up'}>
            ${budget}
          </StatNote>

          <StatNote paper="o" rot="cc-rot1" pin="red" icon="bolt" label="Power load"
            sub={powerStrained ? '85%+ — near capacity!' : 'grid has headroom'}
            subTone={powerStrained ? 'warn' : 'soft'} flagged={powerStrained}>
            {powerDemand}<Unit> / {powerSupply} MW</Unit>
          </StatNote>

          <StatNote paper="b" rot="cc-rot-1" tape icon="shield" label="Reliability"
            sub={reliability < 60 ? 'unstable — risk of blackouts' : 'stable · within tolerance'}
            subTone={reliability < 60 ? 'warn' : 'soft'}>
            {reliability}<Unit>%</Unit>
          </StatNote>

          <StatNote paper="p" rot="cc-rot3" pin="red" icon="heart" label="Approval"
            sub={approval < 30 ? 'citizens are furious' : 'holding steady'}
            subTone={approval < 30 ? 'warn' : 'soft'}>
            {approval}<Unit>%</Unit>
          </StatNote>

          <StatNote paper="g" rot="cc-rot2" tape icon="people" label="Population"
            sub={`${population} of ${populationCapacity} housed`}>
            {population}<Unit> / {populationCapacity}</Unit>
          </StatNote>

          <StatNote paper="y" rot="cc-rot-1" pin="green" icon="brief" label="Jobs"
            sub={unemployed > 0 ? `${unemployed} still job-hunting` : 'full employment!'}
            subTone={unemployed > 0 ? 'soft' : 'up'}>
            {jobs}<Unit> / {population}</Unit>
          </StatNote>

          <StatNote paper="g" rot="cc-rot-3" tape icon="leaf" label="Environment"
            sub="city health index">
            {environment}<Unit>%</Unit>
          </StatNote>

          <StatNote paper="p" rot="cc-rot1" pin="blue" icon="star" label="Pol. capital"
            sub={`${politicalCapital} to spend`}>
            {politicalCapital}<Unit> / 20</Unit>
          </StatNote>

          {/* Turn tracker — checklist note (spans full width in the mobile grid) */}
          <div className="cc-sticky cc-b cc-rot2 relative px-4 py-3 col-span-2 sm:col-span-3 lg:col-span-1 w-full lg:w-[230px]">
            <span className="cc-pin cc-pin-blue" />
            <div className="cc-label"><CcIcon name="flag" solid /> Term · turn {turn}</div>
            <div className="cc-marker font-bold text-[22px] leading-none mt-1.5 text-[color:var(--cc-ink)]">
              Turn {turn} <span className="cc-hand text-[color:var(--cc-blue)]">of {maxTurns}</span>
            </div>
            <div className="flex flex-wrap gap-[3px] mt-2 max-w-[200px]">
              {ticks.map((done, i) => (
                <span
                  key={i}
                  className="block w-2 h-3.5 rounded-[1px] -skew-x-12"
                  style={done
                    ? { background: 'var(--cc-ink)', opacity: 0.8 }
                    : { boxShadow: 'inset 0 0 0 1.5px rgba(37,48,58,0.30)' }}
                />
              ))}
            </div>
            <div className="cc-hand text-[18px] text-[color:var(--cc-blue)] mt-1.5">
              {Math.max(0, maxTurns - turn)} turns left!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
