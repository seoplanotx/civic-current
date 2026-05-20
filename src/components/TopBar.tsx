import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { 
  DollarSign, 
  Award, 
  Zap, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Leaf, 
  Heart,
  AlertTriangle
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const { state } = useGameStore();
  const {
    turn,
    maxTurns,
    budget,
    income,
    expenses,
    politicalCapital,
    population,
    populationCapacity,
    jobs,
    powerSupply,
    powerDemand,
    reliability,
    environment,
    approval,
    warnings,
    gameStatus,
    warningTurnsLeft
  } = state;

  const surplus = income - expenses;
  const isDeficit = surplus < 0;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Dynamic Critical Alert Banner */}
      {gameStatus === 'warning' && (
        <div className="w-full bg-red-950/80 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm flex items-center justify-between shadow-lg animate-pulse gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="font-semibold text-red-100 uppercase tracking-wide mr-2">Last Warning!</span>
              {warnings.length > 0 ? warnings[0] : 'The city is under high risk of administrative collapse.'}
            </div>
          </div>
          <div className="bg-red-800 text-white font-mono font-bold px-3 py-1 rounded-lg text-xs shrink-0 shadow-md">
            {warningTurnsLeft} TURN{warningTurnsLeft !== 1 ? 'S' : ''} REMAINING
          </div>
        </div>
      )}

      {/* Main Dashboard Panel */}
      <div className="w-full bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        {/* Left Side: Game Logo and Turn tracker */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent leading-none">
              Civic Current
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold tracking-wider">
              Keep the lights on.
            </p>
          </div>
          
          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Turn {turn} <span className="text-[10px] text-slate-500">/ {maxTurns}</span>
            </div>
            {/* Turn progress bar */}
            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5 border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${(turn / maxTurns) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center/Right side: Dashboard Metrics Grid */}
        <div className="flex flex-wrap items-center gap-3.5 flex-1 justify-end">
          
          {/* Treasury Budget */}
          <div className="flex items-center gap-2.5 bg-slate-900/60 border border-white/5 px-3 py-2 rounded-xl min-w-[120px] shadow-sm hover:border-white/10 transition-colors">
            <div className={`p-1.5 rounded-lg ${budget < 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Budget</span>
              <span className={`text-sm font-bold mt-1 leading-none ${budget < 0 ? 'text-red-400' : 'text-slate-100'}`}>
                ${budget}
              </span>
              <span className={`text-[9px] font-bold mt-0.5 leading-none ${isDeficit ? 'text-red-400' : 'text-emerald-400'}`}>
                {isDeficit ? '-' : '+'}${Math.abs(surplus)}/t
              </span>
            </div>
          </div>

          {/* Political Capital */}
          <div className="flex items-center gap-2.5 bg-slate-900/60 border border-white/5 px-3 py-2 rounded-xl min-w-[95px] shadow-sm hover:border-white/10 transition-colors">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Pol. Capital</span>
              <span className="text-sm font-bold text-slate-100 mt-1 leading-none">
                {politicalCapital}
              </span>
              <span className="text-[9px] text-slate-500 font-bold mt-0.5 leading-none">Max 20</span>
            </div>
          </div>

          {/* Power Grid Supply/Demand */}
          <div className="flex items-center gap-2.5 bg-slate-900/60 border border-white/5 px-3 py-2 rounded-xl min-w-[125px] shadow-sm hover:border-white/10 transition-colors">
            <div className={`p-1.5 rounded-lg ${
              powerSupply < powerDemand 
                ? 'bg-red-500/20 text-red-400 animate-pulse' 
                : (powerDemand / Math.max(1, powerSupply) >= 0.85)
                  ? 'bg-amber-500/20 text-amber-400' 
                  : 'bg-teal-500/10 text-teal-400'
            }`}>
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Grid Load</span>
              <span className={`text-sm font-bold mt-1 leading-none ${
                powerSupply < powerDemand ? 'text-red-400 animate-pulse' : 'text-slate-100'
              }`}>
                {powerDemand} <span className={`text-xs font-normal ${
                  powerSupply < powerDemand ? 'text-red-400/80' : 'text-slate-400'
                }`}>/ {powerSupply} MW</span>
              </span>
              <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full ${
                    powerSupply < powerDemand 
                      ? 'bg-red-500 animate-pulse' 
                      : (powerDemand / Math.max(1, powerSupply) >= 0.85)
                        ? 'bg-amber-500' 
                        : 'bg-teal-400'
                  }`}
                  style={{ width: `${Math.min(100, (powerDemand / Math.max(1, powerSupply)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Grid Reliability */}
          <div className="flex items-center gap-2.5 bg-slate-900/60 border border-white/5 px-3 py-2 rounded-xl min-w-[110px] shadow-sm hover:border-white/10 transition-colors">
            <div className={`p-1.5 rounded-lg ${reliability < 60 ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Reliability</span>
              <span className={`text-sm font-bold mt-1 leading-none ${reliability < 60 ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>
                {reliability}%
              </span>
              <span className="text-[9px] text-slate-500 font-bold mt-0.5 leading-none">Target &gt;40%</span>
            </div>
          </div>

          {/* Population */}
          <div className="flex items-center gap-2.5 bg-slate-900/60 border border-white/5 px-3 py-2 rounded-xl min-w-[125px] shadow-sm hover:border-white/10 transition-colors">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Population</span>
              <span className="text-sm font-bold text-slate-100 mt-1 leading-none">
                {population} <span className="text-xs text-slate-400 font-normal">/ {populationCapacity}</span>
              </span>
              <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-blue-400"
                  style={{ width: `${Math.min(100, (population / Math.max(1, populationCapacity)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Jobs / Employment */}
          <div className="flex items-center gap-2.5 bg-slate-900/60 border border-white/5 px-3 py-2 rounded-xl min-w-[115px] shadow-sm hover:border-white/10 transition-colors">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Employment</span>
              <span className="text-sm font-bold text-slate-100 mt-1 leading-none">
                {jobs} <span className="text-xs text-slate-400 font-normal">/ {population}</span>
              </span>
              <span className="text-[9px] text-slate-500 font-bold mt-0.5 leading-none">
                Unempl: {Math.max(0, population - jobs)}
              </span>
            </div>
          </div>

          {/* Environmental Health */}
          <div className="flex items-center gap-2.5 bg-slate-900/60 border border-white/5 px-3 py-2 rounded-xl min-w-[110px] shadow-sm hover:border-white/10 transition-colors">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Environment</span>
              <span className="text-sm font-bold text-slate-100 mt-1 leading-none">
                {environment}%
              </span>
              <span className="text-[9px] text-slate-500 font-bold mt-0.5 leading-none">Good health</span>
            </div>
          </div>

          {/* Public Approval */}
          <div className="flex items-center gap-2.5 bg-slate-900/60 border border-white/5 px-3 py-2 rounded-xl min-w-[110px] shadow-sm hover:border-white/10 transition-colors">
            <div className={`p-1.5 rounded-lg ${approval < 30 ? 'bg-red-500/20 text-red-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <Heart className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Approval</span>
              <span className={`text-sm font-bold mt-1 leading-none ${approval < 30 ? 'text-red-400 animate-bounce' : 'text-slate-100'}`}>
                {approval}%
              </span>
              <span className="text-[9px] text-slate-500 font-bold mt-0.5 leading-none">Target &gt;20%</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
