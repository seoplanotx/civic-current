import React, { useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { LeftPanel } from './components/LeftPanel';
import { GameCanvas } from './components/GameCanvas';
import { RightPanel } from './components/RightPanel';
import { BottomBar } from './components/BottomBar';
import { ScoreCard } from './components/ScoreCard';
import { AccountMenu } from './components/AccountMenu';
import { ShopButton } from './components/ShopButton';
import { DailyChallengeButton } from './components/DailyChallengeButton';
import { useGameStore } from './store/useGameStore';
import { getCatalogEntry } from './content/catalog';
import { HelpCircle, Sparkles, CheckCircle2 } from 'lucide-react';

/** True when the page was opened via a shared "?daily=…" deep link. */
function hasDailyDeepLink(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('daily');
}

/**
 * Initial post-purchase toast derived from the Stripe redirect-back query
 * params. Covers both the premium unlock (?premium=...) and content packs
 * (?pack=<id>&result=...). Entitlements refresh on reload via AuthBridge, so
 * by the time this shows the user already owns what they bought.
 */
function initialPurchaseToast(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);

  const premium = params.get('premium');
  if (premium === 'success') return 'Premium unlocked! Welcome to Civic Current Premium.';
  if (premium === 'cancel') return 'Purchase cancelled — no charge was made.';

  const packId = params.get('pack');
  if (packId) {
    const result = params.get('result');
    const name = getCatalogEntry(packId)?.name ?? 'Content pack';
    if (result === 'success') return `${name} unlocked! New buildings and events are now in play.`;
    if (result === 'cancel') return 'Purchase cancelled — no charge was made.';
  }
  return null;
}

const App: React.FC = () => {
  // A shared daily link skips the tutorial — derive that at init so we never
  // setState inside the effect just to hide it.
  const [showTutorial, setShowTutorial] = useState(() => !hasDailyDeepLink());
  const [tutorialStep, setTutorialStep] = useState(0);
  // Derive the toast lazily from the URL so the effect only handles side
  // effects (clearing the query, auto-dismiss timer) — no synchronous setState.
  const [purchaseToast, setPurchaseToast] = useState<string | null>(initialPurchaseToast);
  const startDailyChallenge = useGameStore((s) => s.startDailyChallenge);

  // Deep link: a shared "?daily=…" link drops the player straight into today's
  // challenge. startDailyChallenge() is a store action (external system), not a
  // React setState, so this effect synchronizes without cascading renders.
  useEffect(() => {
    if (!hasDailyDeepLink()) return;
    startDailyChallenge();
    const params = new URLSearchParams(window.location.search);
    params.delete('daily');
    const qs = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, [startDailyChallenge]);

  // Stripe redirect-back handling for both premium (?premium=...) and packs
  // (?pack=<id>&result=...). The toast text is derived at init (see
  // initialPurchaseToast); this effect only runs side effects — stripping the
  // query so a refresh doesn't re-trigger, and scheduling the auto-dismiss.
  // Entitlements are refreshed by AuthBridge on reload, so by the time the
  // toast shows the purchase is already reflected in the registry.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isPremium = params.get('premium') === 'success' || params.get('premium') === 'cancel';
    const isPack = params.has('pack');
    if (!isPremium && !isPack) return;

    const succeeded =
      params.get('premium') === 'success' || params.get('result') === 'success';

    window.history.replaceState({}, '', window.location.pathname);
    const timer = setTimeout(() => setPurchaseToast(null), succeeded ? 6000 : 4000);
    return () => clearTimeout(timer);
  }, []);

  const tutorialPrompts = [
    {
      title: 'Welcome, Mayor!',
      text: 'Civic Current is a strategy game about managing tradeoffs. Your goal is to guide a small town into a thriving city over 50 turns. You must keep the lights on, the citizens happy, and the treasury in the black.',
    },
    {
      title: 'Power First',
      text: 'Your town needs electricity before it can grow. Select a Plains, Coal, or Gas tile on the board, then build a power source. Clean energy is popular but low output; fossil fuels are dirty but cheap and powerful.',
    },
    {
      title: 'The Growth Loop',
      text: 'Building Housing Districts increases population capacity, which attracts citizens. Citizens create Power Demand and need Employment. Building Industrial Zones creates jobs and tax revenue, but spikes pollution and energy demand.',
    },
    {
      title: 'Keep the Grid Stable',
      text: 'Reliability drops when Power Demand exceeds Power Supply. Low reliability causes rolling blackouts, which severely drops Public Approval and stops all economic growth.',
    },
    {
      title: 'Crisis & Advisor Tips',
      text: 'Every turn, you must address critical City Advisor warnings, balance the treasury, and resolve random Event Cards. Build a robust grid and manage your resources carefully to ensure a legacy of stable, clean growth.',
    }
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col p-4 md:p-6 font-sans antialiased overflow-hidden select-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      
      {/* Dynamic Ambient Blur Glows in Background */}
      <div className="absolute top-[-10%] left-[10%] w-[35vw] h-[35vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

      {/* Daily Challenge entry point — floats top-left */}
      <div className="absolute top-4 left-6 z-30">
        <DailyChallengeButton />
      </div>

      {/* Account menu + shop — float top-right, above the dashboard grid */}
      <div className="absolute top-4 right-6 z-30 flex items-center gap-2">
        <ShopButton />
        <AccountMenu />
      </div>

      {/* Main Content Layout Grid */}
      <div className="max-w-[1560px] mx-auto w-full flex-1 flex flex-col gap-4">

        {/* Top-Bar row */}
        <TopBar />

        {/* Center Canvas + Panels Row */}
        <div className="flex-1 flex gap-4 min-h-[500px]">
          {/* Left Inspector */}
          <LeftPanel />

          {/* Center 3D Viewport wrapper */}
          <div className="flex-1 flex flex-col relative">
            <GameCanvas />
          </div>

          {/* Right Governance Panel */}
          <RightPanel />
        </div>

        {/* Bottom Build menu + End turn */}
        <BottomBar />

      </div>

      {/* ScoreCard Game Over Overlay */}
      <ScoreCard />

      {/* Post-purchase confirmation toast */}
      {purchaseToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 bg-emerald-950/90 border border-emerald-500/40 px-4 py-3 rounded-2xl text-emerald-200 text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {purchaseToast}
        </div>
      )}

      {/* Tutorial Dialog Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-[460px] bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
            
            <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-5 h-5 shrink-0" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                  Mayoral Briefing
                </span>
              </div>
              <h3 className="text-slate-100 font-black text-lg mt-1">
                {tutorialPrompts[tutorialStep].title}
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed mt-3 bg-slate-950/40 p-4 rounded-xl border border-white/5 shadow-inner">
                {tutorialPrompts[tutorialStep].text}
              </p>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
              {/* Skip button */}
              <button
                onClick={() => setShowTutorial(false)}
                className="text-xs text-slate-500 hover:text-slate-300 font-bold transition-colors"
              >
                Skip Briefing
              </button>

              {/* Next/Close button */}
              <button
                onClick={() => {
                  if (tutorialStep < tutorialPrompts.length - 1) {
                    setTutorialStep(tutorialStep + 1);
                  } else {
                    setShowTutorial(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-colors duration-150 active:scale-[0.96]"
              >
                {tutorialStep === tutorialPrompts.length - 1 ? "COMMENCE TERM" : "NEXT STEP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Tutorial Help Toggle Button */}
      {!showTutorial && (
        <button
          onClick={() => {
            setTutorialStep(0);
            setShowTutorial(true);
          }}
          className="fixed bottom-6 right-6 p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-xl hover:scale-105 transition-all z-40 active:scale-[0.95]"
          title="Open Mayoral Briefing"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default App;
