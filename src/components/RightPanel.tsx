import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { useBuildings } from '../content/hooks';
import { CcIcon } from './PlanningWallDefs';

/**
 * RightPanel — "City Hall": dynamic advisor notes, the active event card
 * (a pinned pink decision note), and a tally of placed assets. Styled as a
 * sticky clipboard on the planning wall.
 */
export const RightPanel: React.FC = () => {
  const { state, resolveEventChoice } = useGameStore();
  const { activeEvent, budget, politicalCapital, population } = state;
  const BUILDINGS = useBuildings();

  const getAdvisorTips = () => {
    const tips: { type: string; text: string; icon: string }[] = [];
    if (state.powerSupply < state.powerDemand) tips.push({ type: 'critical', text: 'GRID DEFICIT! Expand supply now — clean Hydro Dams or a Fusion Reactor — before a blackout.', icon: 'warn' });
    if (state.approval < 50) tips.push({ type: 'warning', text: 'PUBLIC ANGER! Build crowd-pleasers like a Beach Boardwalk or Grand Stadium.', icon: 'heart' });
    if (state.pollution > 45) tips.push({ type: 'warning', text: 'TOXIC SMOG! Add Parks, Geothermal Wells, or a Waste-to-Energy plant to scrub the air.', icon: 'leaf' });
    if (state.jobs < population) tips.push({ type: 'info', text: 'UNEMPLOYMENT! Add Industrial Zones or a Cloud Datacenter to create jobs.', icon: 'brief' });
    if (budget < 350) tips.push({ type: 'critical', text: 'FISCAL CRISIS! Build revenue-generators like a Stadium, Speedway, or Datacenter.', icon: 'coin' });
    if (state.reliability < 80) tips.push({ type: 'info', text: 'GRID WOBBLE! Add Battery Storage or a Supercapacitor to steady distribution.', icon: 'shield' });
    if (tips.length === 0) tips.push({ type: 'success', text: 'STABLE GROWTH! Everything is humming. Keep expanding the grid.', icon: 'check' });
    return tips;
  };

  const getAssetCounts = () => {
    const counts = {} as Record<string, { name: string; count: number }>;
    state.tiles.forEach((tile) => {
      if (tile.building) {
        const b = tile.building;
        const def = BUILDINGS[b];
        if (!def) return;
        if (!counts[b]) counts[b] = { name: def.name, count: 0 };
        counts[b].count++;
      }
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  };

  const advisorTips = getAdvisorTips();
  const assetCounts = getAssetCounts();

  const tipColor = (t: string) =>
    t === 'critical' ? 'text-[color:var(--cc-red)]'
    : t === 'warning' ? 'text-[color:var(--cc-orange-d,#c77f1e)]'
    : t === 'success' ? 'text-[color:var(--cc-green)]'
    : 'text-[color:var(--cc-blue)]';

  return (
    <div className="cc-sticky cc-white cc-rot1 relative w-full lg:w-[310px] p-5 flex flex-col lg:min-h-[480px]">
      <span className="cc-pin cc-pin-blue" />

      <div className="flex items-center gap-2.5 border-b border-[rgba(37,48,58,0.12)] pb-3">
        <div className="text-[color:var(--cc-blue)]"><CcIcon name="flag" solid className="w-5 h-5" /></div>
        <div>
          <span className="cc-mono text-[10px] uppercase tracking-widest text-[color:var(--cc-ink-soft)]">Municipality</span>
          <h2 className="cc-hand font-bold text-[26px] leading-none text-[color:var(--cc-ink)]">City Hall</h2>
        </div>
      </div>

      {activeEvent ? (
        <div className="flex-1 flex flex-col justify-between mt-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex flex-col">
            <div className="cc-sticky cc-p cc-rot-1 p-3.5 flex items-start gap-2.5">
              <CcIcon name="warn" className="w-5 h-5 text-[color:var(--cc-red)] shrink-0 mt-0.5" />
              <div>
                <span className="cc-mono text-[9px] font-bold uppercase tracking-wider text-[color:var(--cc-red)]">Decision needed</span>
                <h3 className="cc-hand font-bold text-2xl leading-none mt-0.5 text-[color:var(--cc-ink)]">{activeEvent.title}</h3>
              </div>
            </div>

            <p className="text-[12.5px] text-[color:var(--cc-ink)] leading-relaxed mt-4 bg-white/50 p-3.5 rounded-md border border-dashed border-[rgba(37,48,58,0.2)]">
              {activeEvent.description}
            </p>

            <span className="cc-mono text-[10px] font-bold uppercase tracking-wider mt-5 text-[color:var(--cc-ink-soft)]">
              What's the call, Mayor?
            </span>
          </div>

          <div className="flex flex-col gap-2.5 mt-4">
            {activeEvent.choices.map((choice, idx) => {
              const needsBudget = (choice.effects.budget || 0) < 0 ? Math.abs(choice.effects.budget || 0) : 0;
              const needsPC = (choice.effects.politicalCapital || 0) < 0 ? Math.abs(choice.effects.politicalCapital || 0) : 0;
              const canAfford = budget >= needsBudget && politicalCapital >= needsPC;
              return (
                <button key={idx} onClick={() => resolveEventChoice(idx)} disabled={!canAfford}
                  className="cc-btn !justify-start !px-3.5 !py-3 w-full text-left disabled:opacity-40 group">
                  <svg className="cc-btn-box cc-rough" viewBox="0 0 280 80" preserveAspectRatio="none">
                    <rect x="3" y="3" width="274" height="74" rx="9" fill="rgba(255,255,255,0.5)" stroke="#25303a" strokeWidth="2" />
                  </svg>
                  <span className="cc-btn-label flex flex-col w-full">
                    <span className="cc-marker font-bold text-[12.5px] leading-tight text-[color:var(--cc-ink)]">{choice.label}</span>
                    <span className="flex flex-wrap gap-x-2.5 gap-y-1 mt-2 pt-2 border-t border-[rgba(37,48,58,0.1)] cc-mono text-[9px]">
                      {choice.effects.budget !== undefined && <span className={choice.effects.budget < 0 ? 'text-[color:var(--cc-red)]' : 'text-[color:var(--cc-green)]'}>Budget {choice.effects.budget < 0 ? '' : '+'}${choice.effects.budget}</span>}
                      {choice.effects.approval !== undefined && <span className={choice.effects.approval < 0 ? 'text-[color:var(--cc-red)]' : 'text-[color:var(--cc-green)]'}>Approval {choice.effects.approval < 0 ? '' : '+'}{choice.effects.approval}%</span>}
                      {choice.effects.reliability !== undefined && <span className={choice.effects.reliability < 0 ? 'text-[color:var(--cc-red)]' : 'text-[color:var(--cc-blue)]'}>Grid {choice.effects.reliability < 0 ? '' : '+'}{choice.effects.reliability}%</span>}
                      {choice.effects.politicalCapital !== undefined && <span className={choice.effects.politicalCapital < 0 ? 'text-[color:var(--cc-red)]' : 'text-[color:var(--cc-blue)]'}>PC {choice.effects.politicalCapital < 0 ? '' : '+'}{choice.effects.politicalCapital}</span>}
                      {choice.effects.environment !== undefined && <span className={choice.effects.environment < 0 ? 'text-[color:var(--cc-red)]' : 'text-[color:var(--cc-green)]'}>Eco {choice.effects.environment < 0 ? '' : '+'}{choice.effects.environment}</span>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between mt-4 overflow-hidden">
          <div className="flex flex-col gap-2">
            <span className="cc-mono text-[10px] font-bold uppercase tracking-wide text-[color:var(--cc-ink-soft)] mb-1">Advisor notes</span>
            <div className="flex flex-col gap-2 bg-white/45 border border-dashed border-[rgba(37,48,58,0.18)] rounded-md p-3">
              {advisorTips.map((tip, idx) => (
                <div key={idx} className="flex gap-2 items-start text-[11.5px] leading-relaxed">
                  <div className={`mt-0.5 shrink-0 ${tipColor(tip.type)}`}><CcIcon name={tip.icon} className="w-4 h-4" /></div>
                  <span className={`font-semibold ${tipColor(tip.type)}`}>{tip.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4 flex-1 overflow-hidden">
            <span className="cc-mono text-[10px] font-bold uppercase tracking-wide text-[color:var(--cc-ink-soft)] mb-1">Placed assets</span>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[220px]">
              {assetCounts.length === 0 ? (
                <div className="text-[11px] text-[color:var(--cc-ink-soft)] text-center py-6 italic">No assets placed yet — start building!</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {assetCounts.map((asset) => (
                    <div key={asset.name} className="flex justify-between items-center bg-white/45 border border-[rgba(37,48,58,0.12)] rounded-md px-2.5 py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--cc-blue)] shrink-0" />
                        <span className="cc-marker text-[12px] font-bold text-[color:var(--cc-ink)]">{asset.name}</span>
                      </div>
                      <span className="cc-mono text-[10px] font-bold px-1.5 py-0.5 bg-[rgba(47,109,176,0.12)] text-[color:var(--cc-blue)] rounded-md">×{asset.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
