import React, { useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { LeftPanel } from './components/LeftPanel';
import { GameCanvas } from './components/GameCanvas';
import { RightPanel } from './components/RightPanel';
import { BottomBar } from './components/BottomBar';
import { ScoreCard } from './components/ScoreCard';
import { AccountMenu } from './components/AccountMenu';
import { ShopButton } from './components/ShopButton';
import { ThemesButton } from './components/ThemesButton';
import { DailyChallengeButton } from './components/DailyChallengeButton';
import { useGameStore } from './store/useGameStore';
import { getCatalogEntry } from './content/catalog';
import { getCosmeticCatalogEntry } from './content/cosmetics/catalog';
import { PlanningWallDefs, CcIcon } from './components/PlanningWallDefs';

/** True when the page was opened via a shared "?daily=…" deep link. */
function hasDailyDeepLink(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('daily');
}

/**
 * Initial post-purchase toast derived from the Stripe redirect-back query
 * params. Covers the premium unlock (?premium=...), content packs
 * (?pack=<id>&result=...), cosmetic themes (?cosmetic=<id>&result=...), and the
 * Mayor's Office subscription (?subscription=...). Entitlements refresh on
 * reload via AuthBridge, so by the time this shows the user already owns what
 * they bought.
 */
function initialPurchaseToast(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);

  const premium = params.get('premium');
  if (premium === 'success') return 'Premium unlocked! Welcome to Civic Current Premium.';
  if (premium === 'cancel') return 'Purchase cancelled — no charge was made.';

  const subscription = params.get('subscription');
  if (subscription === 'success')
    return "Mayor's Office active — thank you for supporting Civic Current!";
  if (subscription === 'cancel') return 'Purchase cancelled — no charge was made.';

  const packId = params.get('pack');
  if (packId) {
    const result = params.get('result');
    const name = getCatalogEntry(packId)?.name ?? 'Content pack';
    if (result === 'success') return `${name} unlocked! New buildings and events are now in play.`;
    if (result === 'cancel') return 'Purchase cancelled — no charge was made.';
  }

  const cosmeticId = params.get('cosmetic');
  if (cosmeticId) {
    const result = params.get('result');
    const name = getCosmeticCatalogEntry(cosmeticId)?.name ?? 'Theme';
    if (result === 'success') return `${name} unlocked! Open Themes to equip it.`;
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

  // Stripe redirect-back handling for premium (?premium=...), packs
  // (?pack=<id>&result=...), cosmetic themes (?cosmetic=<id>&result=...), and
  // the Mayor's Office subscription (?subscription=...). The toast text is
  // derived at init (see initialPurchaseToast); this effect only runs side
  // effects — stripping the query so a refresh doesn't re-trigger, and
  // scheduling the auto-dismiss. Entitlements are refreshed by AuthBridge on
  // reload, so by the time the toast shows the purchase is already reflected in
  // the registry.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isPremium = params.get('premium') === 'success' || params.get('premium') === 'cancel';
    const isPack = params.has('pack');
    const isCosmetic = params.has('cosmetic');
    const isSubscription =
      params.get('subscription') === 'success' || params.get('subscription') === 'cancel';
    if (!isPremium && !isPack && !isCosmetic && !isSubscription) return;

    const succeeded =
      params.get('premium') === 'success' ||
      params.get('subscription') === 'success' ||
      params.get('result') === 'success';

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
    <div className="cc-wall min-h-screen w-full text-[color:var(--cc-ink)] flex flex-col p-4 md:p-6 antialiased overflow-hidden select-none">

      {/* Shared SVG defs (roughen filters + hand-drawn icon sprite) */}
      <PlanningWallDefs />

      {/* Daily Challenge entry point — floats top-left */}
      <div className="absolute top-4 left-6 z-30">
        <DailyChallengeButton />
      </div>

      {/* Account menu + shop + themes — float top-right, above the dashboard grid */}
      <div className="absolute top-4 right-6 z-30 flex items-center gap-2">
        <ThemesButton />
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

      {/* Post-purchase confirmation toast — a taped sticky note */}
      {purchaseToast && (
        <div className="cc-sticky cc-g cc-tape cc-rot-1 fixed top-20 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 px-5 py-3 max-w-[420px] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CcIcon name="check" className="text-[color:var(--cc-green)]" />
          <span className="cc-marker font-bold text-sm text-[color:var(--cc-ink)]">{purchaseToast}</span>
        </div>
      )}

      {/* Tutorial Dialog Overlay — a yellow briefing note pinned to the wall */}
      {showTutorial && (
        <div className="cc-backdrop animate-in fade-in duration-200">
          <div className="cc-sticky cc-y cc-rot-1 relative w-full max-w-[470px] p-7 shadow-2xl flex flex-col justify-between">
            <span className="cc-pin" />
            <div className="flex flex-col">
              <div className="cc-label">
                <CcIcon name="flag" solid className="text-[color:var(--cc-blue)]" />
                Mayoral Briefing
              </div>
              <h3 className="cc-hand font-bold text-3xl mt-2 leading-none text-[color:var(--cc-ink)]">
                {tutorialPrompts[tutorialStep].title}
              </h3>
              <p className="text-[13px] leading-relaxed mt-3 text-[color:var(--cc-ink)] opacity-90">
                {tutorialPrompts[tutorialStep].text}
              </p>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(37,48,58,0.12)]">
              <button
                onClick={() => setShowTutorial(false)}
                className="cc-mono text-[11px] uppercase tracking-wider text-[color:var(--cc-ink-soft)] hover:text-[color:var(--cc-ink)] font-bold transition-colors"
              >
                Skip briefing
              </button>

              <button
                onClick={() => {
                  if (tutorialStep < tutorialPrompts.length - 1) {
                    setTutorialStep(tutorialStep + 1);
                  } else {
                    setShowTutorial(false);
                  }
                }}
                className="cc-btn"
              >
                <svg className="cc-btn-box cc-rough" viewBox="0 0 220 48" preserveAspectRatio="none">
                  <rect x="3" y="3" width="214" height="42" rx="9" fill="rgba(47,109,176,0.18)" stroke="#2f6db0" strokeWidth="3" />
                </svg>
                <span className="cc-btn-label">
                  {tutorialStep === tutorialPrompts.length - 1 ? 'Commence term →' : 'Next step →'}
                </span>
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
          className="cc-sticky cc-b fixed bottom-6 right-6 p-3 shadow-xl hover:scale-105 transition-all z-40 active:scale-[0.95] text-[color:var(--cc-blue)]"
          title="Open Mayoral Briefing"
        >
          <CcIcon name="help" className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default App;
