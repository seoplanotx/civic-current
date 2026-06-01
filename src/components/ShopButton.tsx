import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { PackShop } from './PackShop';

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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 border border-white/10 hover:bg-slate-900 text-slate-200 text-xs font-bold transition-colors active:scale-[0.97]"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Shop</span>
      </button>
      <PackShop open={open} onClose={() => setOpen(false)} />
    </>
  );
};
