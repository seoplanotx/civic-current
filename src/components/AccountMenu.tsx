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
import { usePremium, useSubscription } from '../content/hooks';
import { UpgradeModal } from '../billing/UpgradeModal';
import { MayorOfficeModal } from './MayorOfficeModal';
import { isClerkConfigured } from '../auth/ClerkProvider';
import { CcIcon } from './PlanningWallDefs';

export const AccountMenu: React.FC = () => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [mayorOpen, setMayorOpen] = useState(false);
  const isPremium = usePremium();
  const isSubscriber = useSubscription();

  if (!isClerkConfigured) {
    // Render a discrete taped tag so the layout doesn't shift in dev
    return (
      <div className="cc-mono text-[10px] uppercase tracking-wider text-[color:var(--cc-ink-soft)] px-3 py-1.5 bg-[color:var(--cc-tape)] border border-black/5 -rotate-1">
        Anonymous · local save
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="cc-sticky cc-white cc-rot1 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[color:var(--cc-ink)] transition-all active:scale-[0.97]">
            <CcIcon name="login" className="w-3.5 h-3.5 text-[color:var(--cc-blue)]" />
            <span className="cc-marker">Sign in</span>
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
            className="cc-sticky cc-o cc-rot-1 px-2.5 py-1 text-[10px] font-extrabold text-[color:var(--cc-ink)] uppercase tracking-wider flex items-center gap-1 transition-all active:scale-[0.97]"
          >
            <CcIcon name="crown" className="w-3 h-3 text-[color:var(--cc-blue)]" /> <span className="cc-marker">Mayor's Office</span>
          </button>
        ) : isPremium ? (
          <span className="cc-sticky cc-b cc-rot1 px-2.5 py-1 text-[10px] font-extrabold text-[color:var(--cc-ink)] uppercase tracking-wider flex items-center gap-1">
            <CcIcon name="star" className="w-3 h-3 text-[color:var(--cc-blue)]" /> <span className="cc-marker">Premium</span>
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setUpgradeOpen(true)}
              className="cc-sticky cc-y cc-rot-1 px-2.5 py-1 text-[10px] font-extrabold text-[color:var(--cc-ink)] uppercase tracking-wider flex items-center gap-1 transition-all active:scale-[0.97]"
            >
              <CcIcon name="star" className="w-3 h-3 text-[color:var(--cc-blue)]" /> <span className="cc-marker">Upgrade</span>
            </button>
            {/* Subtle secondary entry point to the recurring subscription. */}
            <button
              onClick={() => setMayorOpen(true)}
              title="Mayor's Office subscription"
              aria-label="Mayor's Office subscription"
              className="p-1 rounded-full text-[color:var(--cc-blue)] opacity-70 hover:opacity-100 hover:bg-[color:var(--cc-blue)]/10 transition-all"
            >
              <CcIcon name="crown" className="w-3.5 h-3.5" />
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
