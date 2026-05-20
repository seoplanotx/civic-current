/**
 * PackShop — the in-game store listing every content pack in the catalog.
 *
 * Owned packs show an "Owned" badge with no CTA. Unowned packs show price
 * and a "Buy" button that kicks off Stripe Checkout via /api/checkout/pack.
 *
 * Free users without auth see "Sign in to purchase" routed through Clerk.
 */

import React, { useState } from 'react';
import { useAuth, SignInButton } from '@clerk/clerk-react';
import { Sparkles, X, ShoppingBag, Check } from 'lucide-react';
import { PACK_CATALOG } from '../content/catalog';
import { useEntitlements } from '../content/hooks';
import { startPackCheckout } from '../billing/packCheckout';
import { isClerkConfigured } from '../auth/ClerkProvider';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const PackShop: React.FC<Props> = ({ open, onClose }) => {
  const entitlements = useEntitlements();
  const ownedIds = entitlements.ownedPackIds;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[640px] max-h-[85vh] bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                Content Packs
              </span>
            </div>
            <h3 className="text-slate-100 font-black text-lg mt-1">
              Pick your era
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Each pack adds new buildings, event cards, and scenarios. One-time
              purchase, yours forever.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Catalog list */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
          {PACK_CATALOG.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              owned={ownedIds.has(pack.id)}
            />
          ))}
        </div>

        {!isClerkConfigured && (
          <div className="text-[11px] text-slate-400 bg-slate-950/60 border border-white/5 rounded-lg p-3">
            Sign-in and purchases are not configured in this build. Set the Clerk
            and Stripe env vars (see <code>README-DEPLOYMENT.md</code>) to enable
            the shop.
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────── card ──────────────────────────────────── */

interface CardProps {
  pack: (typeof PACK_CATALOG)[number];
  owned: boolean;
}

const PackCard: React.FC<CardProps> = ({ pack, owned }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useAuth();

  const handleBuy = async () => {
    setBusy(true);
    setError(null);
    try {
      await startPackCheckout(pack.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <div
      className="bg-slate-950/60 border rounded-xl p-4 flex flex-col gap-3"
      style={{ borderColor: `${pack.accentColor}40` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] font-mono font-bold uppercase tracking-widest"
            style={{ color: pack.accentColor }}
          >
            {pack.tagline}
          </div>
          <h4 className="text-slate-100 font-extrabold text-base mt-0.5 leading-tight">
            {pack.name}
          </h4>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {pack.description}
          </p>
        </div>
        {owned ? (
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
            <Check className="w-3 h-3" />
            Owned
          </div>
        ) : (
          <div className="shrink-0 text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              one-time
            </div>
            <div className="text-xl font-black text-slate-100 leading-none mt-0.5">
              {pack.displayPrice}
            </div>
          </div>
        )}
      </div>

      <ul className="flex flex-col gap-1 mt-1">
        {pack.highlights.map((h) => (
          <li
            key={h}
            className="text-[11px] text-slate-300 flex items-start gap-2 leading-snug"
          >
            <Sparkles
              className="w-3 h-3 mt-0.5 shrink-0"
              style={{ color: pack.accentColor }}
            />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      {error && (
        <div className="text-[11px] text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg p-2">
          {error}
        </div>
      )}

      {!owned && (
        <div className="flex justify-end pt-2 border-t border-white/5">
          {isSignedIn ? (
            <button
              onClick={handleBuy}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md disabled:opacity-60 transition-all active:scale-[0.97]"
              style={{
                background: `linear-gradient(135deg, ${pack.accentColor}, ${pack.accentColor}cc)`,
              }}
            >
              {busy ? 'Redirecting…' : `Buy ${pack.displayPrice}`}
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md transition-colors">
                Sign in to purchase
              </button>
            </SignInButton>
          )}
        </div>
      )}
    </div>
  );
};
