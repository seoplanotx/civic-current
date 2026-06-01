import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { CosmeticShop } from './CosmeticShop';

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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 border border-white/10 hover:bg-slate-900 text-slate-200 text-xs font-bold transition-colors active:scale-[0.97]"
      >
        <Palette className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Themes</span>
      </button>
      <CosmeticShop open={open} onClose={() => setOpen(false)} />
    </>
  );
};
