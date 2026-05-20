import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { 
  Award, 
  Flame, 
  ShieldCheck, 
  Briefcase, 
  Leaf, 
  Heart, 
  DollarSign,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const ScoreCard: React.FC = () => {
  const { state, resetGame } = useGameStore();
  const { gameStatus, failedReason, scores } = state;

  if (gameStatus !== 'victory' && gameStatus !== 'failed') return null;

  const finalScores = scores || {
    energySecurity: 0,
    economicStrength: 0,
    environmentalHealth: 0,
    publicApproval: 0,
    fiscalResponsibility: 0,
    overallLegacy: 0,
    title: 'The Mayor Who Meant Well',
  };

  const isFailed = gameStatus === 'failed';

  // Legacy descriptions based on title
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-[580px] bg-slate-900/90 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col items-center shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Dynamic Glowing Background Effect */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${isFailed ? 'bg-red-500' : 'bg-teal-500'}`} />
        <div className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${isFailed ? 'bg-amber-600' : 'bg-indigo-500'}`} />

        {/* Section 1: Header */}
        <div className="flex flex-col items-center text-center">
          {isFailed ? (
            <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 mb-4 shadow-inner">
              <Flame className="w-10 h-10 animate-pulse" />
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-tr from-teal-500/10 to-indigo-500/10 border border-teal-500/25 rounded-2xl text-teal-400 mb-4 shadow-md">
              <Award className="w-10 h-10 animate-bounce" />
            </div>
          )}

          <h2 className="text-2xl font-black bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            {isFailed ? 'Term Recalled!' : 'Term Completed!'}
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono mt-1">
            {isFailed ? 'Administrative Suspension' : '50 simulated turns governed'}
          </p>
        </div>

        {/* Section 2: Overall Title Badge */}
        <div className={`mt-5 px-5 py-3 rounded-2xl border text-center shadow-md max-w-full ${
          isFailed 
            ? 'bg-red-950/40 border-red-500/20 text-red-300' 
            : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300'
        }`}>
          <div className="text-[10px] font-mono uppercase tracking-widest leading-none font-bold text-slate-400">
            Final Legacy Evaluation
          </div>
          <div className="text-lg font-black mt-2 leading-none flex items-center justify-center gap-2">
            {!isFailed && <Sparkles className="w-4 h-4 text-indigo-400" />}
            {finalScores.title}
          </div>
        </div>

        {/* Fail detail */}
        {isFailed && (
          <p className="text-xs text-red-300/90 font-bold bg-red-950/30 px-4 py-2 border border-red-500/15 rounded-xl mt-3 max-w-[400px] text-center leading-relaxed">
            CRITICAL FAILURE STATE: {failedReason}
          </p>
        )}

        {/* Section 3: Metric Scores */}
        <div className="w-full mt-6 bg-slate-950/40 border border-white/5 p-5 rounded-2xl flex flex-col gap-3 shadow-inner">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none mb-1">
            Department Performance Records
          </h3>

          {/* Grid Reliability */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Energy Security
              </span>
              <span className="text-slate-100 font-bold font-mono">{finalScores.energySecurity}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-cyan-400" style={{ width: `${finalScores.energySecurity}%` }} />
            </div>
          </div>

          {/* Economic Strength */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                Economic Strength
              </span>
              <span className="text-slate-100 font-bold font-mono">{finalScores.economicStrength}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-indigo-400" style={{ width: `${finalScores.economicStrength}%` }} />
            </div>
          </div>

          {/* Environmental Health */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                Environmental Health
              </span>
              <span className="text-slate-100 font-bold font-mono">{finalScores.environmentalHealth}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-emerald-400" style={{ width: `${finalScores.environmentalHealth}%` }} />
            </div>
          </div>

          {/* Public Approval */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Public Approval
              </span>
              <span className="text-slate-100 font-bold font-mono">{finalScores.publicApproval}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-rose-400" style={{ width: `${finalScores.publicApproval}%` }} />
            </div>
          </div>

          {/* Fiscal Responsibility */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                Fiscal Responsibility
              </span>
              <span className="text-slate-100 font-bold font-mono">{finalScores.fiscalResponsibility}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-amber-400" style={{ width: `${finalScores.fiscalResponsibility}%` }} />
            </div>
          </div>
        </div>

        {/* Section 4: Narrative Description */}
        <p className="text-xs text-slate-300 text-center leading-relaxed mt-5 px-3 max-w-[460px]">
          {getLegacyDescription(finalScores.title)}
        </p>

        {/* Section 5: Replay Trigger */}
        <button
          onClick={() => resetGame()}
          className="w-full mt-7 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-extrabold text-sm py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] select-none"
        >
          <RotateCcw className="w-4 h-4" />
          GOVERN ANEW (PLAY AGAIN)
        </button>
      </div>
    </div>
  );
};
