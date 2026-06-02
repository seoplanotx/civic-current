import React, { useState } from 'react';
import { PackShop } from './PackShop';
import { CcIcon } from './PlanningWallDefs';

/**
 * Entry point for the content-pack store. Without this the PackShop modal —
 * and the entire pack revenue stream behind it (catalog → Stripe checkout →
 * webhook entitlement grant) — is unreachable.
 *
 * Always visible: the shop renders for anonymous and Clerk-unconfigured builds
 * too (PackShop shows a "sign in / not configured" notice in those cases), so
 * players always see what's for sale even before they have an account.
 */
export const ShopButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Content pack store"
        className="cc-sticky cc-white cc-rot1 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[color:var(--cc-ink)] transition-all active:scale-[0.97]"
      >
        <CcIcon name="bag" className="w-3.5 h-3.5 text-[color:var(--cc-blue)]" />
        <span className="cc-marker hidden sm:inline">Shop</span>
      </button>
      <PackShop open={open} onClose={() => setOpen(false)} />
    </>
  );
};
