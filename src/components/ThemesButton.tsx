import React, { useState } from 'react';
import { CosmeticShop } from './CosmeticShop';
import { CcIcon } from './PlanningWallDefs';

/**
 * Entry point for the cosmetic theme store. Sits next to the content-pack Shop
 * button in App.tsx's top-right cluster. Without this the CosmeticShop modal —
 * and the theme revenue stream behind it (catalog → Stripe checkout → webhook
 * grant → equip) — is unreachable.
 *
 * Always visible: the shop renders for anonymous and Clerk-unconfigured builds
 * too (CosmeticShop shows a "sign in / not configured" notice in those cases),
 * so players always see the themes for sale even before they have an account.
 */
export const ThemesButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Board theme store"
        className="cc-sticky cc-white cc-rot-1 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[color:var(--cc-ink)] transition-all active:scale-[0.97]"
      >
        <CcIcon name="palette" className="w-3.5 h-3.5 text-[color:var(--cc-blue)]" />
        <span className="cc-marker hidden sm:inline">Themes</span>
      </button>
      <CosmeticShop open={open} onClose={() => setOpen(false)} />
    </>
  );
};
