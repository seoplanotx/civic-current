/**
 * Top-right account widget.
 *
 * - Anonymous → "Sign in" button + small premium-upsell pill
 * - Signed-in free → user avatar + "Upgrade" pill
 * - Signed-in premium → user avatar + Premium badge
 *
 * Clerk's <UserButton> handles the avatar dropdown (manage account, sign
 * out, etc.) — we just compose its trigger with our entitlement pills.
 */

import React, { useState } from 'react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/clerk-react';
import { Sparkles, LogIn, Crown } from 'lucide-react';
import { usePremium, useSubscription } from '../content/hooks';
import { UpgradeModal } from '../billing/UpgradeModal';
import { MayorOfficeModal } from './MayorOfficeModal';
import { isClerkConfigured } from '../auth/ClerkProvider';

export const AccountMenu: React.FC = () => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [mayorOpen, setMayorOpen] = useState(false);
  const isPremium = usePremium();
  const isSubscriber = useSubscription();

  if (!isClerkConfigured) {
    // Render a discrete placeholder so the layout doesn't shift in dev
    return (
      <div className="text-[10px] font-mono text-slate-500 px-3 py-1.5 border border-white/5 rounded-full">
        ANONYMOUS · LOCAL SAVE
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 border border-white/10 hover:bg-slate-900 text-slate-200 text-xs font-bold transition-colors">
            <LogIn className="w-3.5 h-3.5" />
            Sign in
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        {/* Entitlement pill */}
        {isSubscriber ? (
          // Active subscribers: the pill opens the modal for billing management.
          <button
            onClick={() => setMayorOpen(true)}
            title="Manage your Mayor's Office subscription"
            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-400/20 border border-amber-400/40 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider hover:from-amber-500/30 hover:to-amber-400/30 transition-all active:scale-[0.97]"
          >
            Mayor's Office
          </button>
        ) : isPremium ? (
          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-400/40 text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Premium
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setUpgradeOpen(true)}
              className="px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md transition-all active:scale-[0.97]"
            >
              <Sparkles className="w-3 h-3" /> Upgrade
            </button>
            {/* Subtle secondary entry point to the recurring subscription. */}
            <button
              onClick={() => setMayorOpen(true)}
              title="Mayor's Office subscription"
              aria-label="Mayor's Office subscription"
              className="p-1 rounded-full text-amber-400/70 hover:text-amber-300 hover:bg-amber-400/10 transition-colors"
            >
              <Crown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-7 h-7',
            },
          }}
        />
      </SignedIn>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <MayorOfficeModal open={mayorOpen} onClose={() => setMayorOpen(false)} />
    </div>
  );
};
