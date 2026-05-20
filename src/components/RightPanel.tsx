import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { useBuildings } from '../content/hooks';
import { 
  BookOpen, 
  FileText, 
  Sparkles,
  ShieldAlert,
  Coins,
  Wrench,
  Gauge
} from 'lucide-react';

export const RightPanel: React.FC = () => {
  const { state, resolveEventChoice } = useGameStore();
  const { activeEvent, budget, politicalCapital, population } = state;
  const BUILDINGS = useBuildings();

  // 1. Determine dynamic advice based on city health metrics
  const getAdvisorTips = () => {
    const tips = [];
    
    if (state.powerSupply < state.powerDemand) {
      tips.push({
        type: 'critical',
        text: 'GRID DEFICIT! Expand supply immediately using clean Hydroelectric Dams or a Fusion Reactor to avoid a major grid collapse.',
        icon: <ShieldAlert className="w-4 h-4 text-red-400" />
      });
    }
    if (state.approval < 50) {
      tips.push({
        type: 'warning',
        text: 'PUBLIC ANGER! Build high-approval amusement options like a Beach Boardwalk or Grand Stadium.',
        icon: <Sparkles className="w-4 h-4 text-amber-400" />
      });
    }
    if (state.pollution > 45) {
      tips.push({
        type: 'warning',
        text: 'TOXIC SMOG! Construct a Park & Preserve, clean Geothermal Wells, or a Waste-to-Energy facility to scrub air pollution.',
        icon: <ShieldAlert className="w-4 h-4 text-rose-400" />
      });
    }
    if (state.jobs < population) {
      tips.push({
        type: 'info',
        text: 'UNEMPLOYMENT! Establish new Industrial Zones or a Cloud Datacenter to create jobs and boost tax base.',
        icon: <Wrench className="w-4 h-4 text-indigo-400" />
      });
    }
    if (budget < 350) {
      tips.push({
        type: 'critical',
        text: 'FISCAL CRISIS! Build high-revenue generators like a Grand Stadium, Speedway, or Datacenter to rescue the treasury.',
        icon: <Coins className="w-4 h-4 text-amber-500" />
      });
    }
    if (state.reliability < 80) {
      tips.push({
        type: 'info',
        text: 'GRID INSTABILITY! Construct a Battery Storage or a Supercapacitor Buffer to stabilize grid distribution.',
        icon: <Gauge className="w-4 h-4 text-cyan-400" />
      });
    }

    if (tips.length === 0) {
      tips.push({
        type: 'success',
        text: 'STABLE GROWTH! Everything is running smoothly. Continue expanding your city’s energy grid infrastructure!',
        icon: <Sparkles className="w-4 h-4 text-emerald-400" />
      });
    }

    return tips;
  };

  // 2. Count active map structures dynamically
  const getAssetCounts = () => {
    const counts = {} as Record<string, { name: string; count: number; cost: number }>;
    state.tiles.forEach((tile) => {
      if (tile.building) {
        const b = tile.building;
        const def = BUILDINGS[b];
        if (!counts[b]) {
          counts[b] = { name: def.name, count: 0, cost: def.cost };
        }
        counts[b].count++;
      }
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  };

  const advisorTips = getAdvisorTips();
  const assetCounts = getAssetCounts();

  return (
    <div className="w-[310px] bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex flex-col shadow-xl min-h-[480px]">
      
      {/* City Hall / Governance Header */}
      <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
        <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <BookOpen className="w-4.5 h-4.5" />
        </div>
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest leading-none">
            MUNICIPALITY
          </span>
          <h2 className="text-slate-100 font-bold text-base mt-0.5 leading-none">City Hall</h2>
        </div>
      </div>

      {activeEvent ? (
        /* SECTION A: EVENT CARD BLOC (BLOCKED INTERACTION) */
        <div className="flex-1 flex flex-col justify-between mt-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex flex-col">
            {/* Event Header Banner */}
            <div className="bg-gradient-to-r from-amber-600/20 to-red-600/20 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-2.5 shadow-md">
              <FileText className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Critical Event Card
                </span>
                <h3 className="text-slate-100 font-extrabold text-sm mt-0.5 leading-tight">
                  {activeEvent.title}
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-[11.5px] text-slate-300 leading-relaxed mt-4 bg-slate-900/60 p-3.5 rounded-xl border border-white/5 shadow-inner">
              {activeEvent.description}
            </p>

            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-5 leading-none block">
              Resolve Mayoral Decision:
            </span>
          </div>

          {/* Choices list */}
          <div className="flex flex-col gap-2.5 mt-4">
            {activeEvent.choices.map((choice, idx) => {
              const needsBudget = (choice.effects.budget || 0) < 0 ? Math.abs(choice.effects.budget || 0) : 0;
              const needsPC = (choice.effects.politicalCapital || 0) < 0 ? Math.abs(choice.effects.politicalCapital || 0) : 0;

              const canAfford = budget >= needsBudget && politicalCapital >= needsPC;

              return (
                <button
                  key={idx}
                  onClick={() => resolveEventChoice(idx)}
                  disabled={!canAfford}
                  className="w-full text-left bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-amber-500/30 p-3 rounded-xl disabled:opacity-30 disabled:hover:bg-slate-900/50 font-bold transition-all duration-150 flex flex-col justify-between shadow-sm active:scale-[0.98] group"
                >
                  <span className="text-xs text-slate-200 group-hover:text-slate-100 font-extrabold leading-tight">
                    {choice.label}
                  </span>
                  
                  {/* Micro effect checklist inside choice button */}
                  <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 mt-2.5 pt-2 border-t border-white/5 text-[9px] text-slate-400 font-medium">
                    {choice.effects.budget !== undefined && (
                      <span className={choice.effects.budget < 0 ? 'text-red-400' : 'text-emerald-400'}>
                        Budget: {choice.effects.budget < 0 ? '' : '+'}${choice.effects.budget}
                      </span>
                    )}
                    {choice.effects.approval !== undefined && (
                      <span className={choice.effects.approval < 0 ? 'text-red-400' : 'text-rose-400'}>
                        Approval: {choice.effects.approval < 0 ? '' : '+'}{choice.effects.approval}%
                      </span>
                    )}
                    {choice.effects.reliability !== undefined && (
                      <span className={choice.effects.reliability < 0 ? 'text-red-400' : 'text-cyan-400'}>
                        Grid: {choice.effects.reliability < 0 ? '' : '+'}{choice.effects.reliability}%
                      </span>
                    )}
                    {choice.effects.politicalCapital !== undefined && (
                      <span className={choice.effects.politicalCapital < 0 ? 'text-red-400' : 'text-indigo-400'}>
                        PC: {choice.effects.politicalCapital < 0 ? '' : '+'}{choice.effects.politicalCapital}
                      </span>
                    )}
                    {choice.effects.pollution !== undefined && (
                      <span className={choice.effects.pollution < 0 ? 'text-emerald-400' : 'text-amber-500'}>
                        Smog: {choice.effects.pollution < 0 ? '' : '+'}{choice.effects.pollution}
                      </span>
                    )}
                    {choice.effects.environment !== undefined && (
                      <span className={choice.effects.environment < 0 ? 'text-red-400' : 'text-emerald-400'}>
                        Eco: {choice.effects.environment < 0 ? '' : '+'}{choice.effects.environment}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* SECTION B: CITY ADVISOR & MUNICIPAL ASSETS SUITE */
        <div className="flex-1 flex flex-col justify-between mt-4 overflow-hidden">
          {/* Advisor Panel */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none mb-1">
              Municipal Advisories
            </span>
            <div className="flex flex-col gap-2 bg-slate-900/60 border border-white/5 rounded-xl p-3 shadow-inner">
              {advisorTips.map((tip, idx) => (
                <div key={idx} className="flex gap-2 items-start text-[11px] leading-relaxed">
                  <div className="mt-0.5 shrink-0">
                    {tip.icon}
                  </div>
                  <span className={`font-semibold ${
                    tip.type === 'critical' ? 'text-red-300' :
                    tip.type === 'warning' ? 'text-amber-300' :
                    tip.type === 'success' ? 'text-emerald-300' : 'text-indigo-300'
                  }`}>
                    {tip.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Breakdown Panel */}
          <div className="flex flex-col gap-2 mt-4 flex-1 overflow-hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none mb-1">
              Municipal Grid Assets
            </span>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[220px]">
              {assetCounts.length === 0 ? (
                <div className="text-[11px] text-slate-500 text-center py-6 italic">
                  No municipal grid assets placed. Construct buildings on the map!
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {assetCounts.map((asset) => (
                    <div 
                      key={asset.name} 
                      className="flex justify-between items-center bg-slate-900/30 hover:bg-slate-900/50 border border-white/5 hover:border-white/10 rounded-lg px-2.5 py-1.5 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-300">{asset.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/10">
                          x{asset.count}
                        </span>
                      </div>
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
