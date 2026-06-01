/**
 * CosmeticShop — the in-game store for buyable terrain re-color themes.
 *
 * Each theme card shows a swatch row of its terrain palette plus a CTA that
 * adapts to the user's state:
 *   - Not owned          → Buy (Stripe checkout via /api/checkout/cosmetic)
 *   - Owned, not equipped → Equip
 *   - Equipped            → Equipped badge + Unequip
 * Subscribers are entitled to every theme, so they can equip any card without
 * buying (no "Buy" CTA is shown for them).
 *
 * Clerk-hook usage is isolated behind `isClerkConfigured`, exactly like
 * PackShop: the Buy/Equip CTA row is split into an inner authed component that
 * calls useAuth(), which THROWS when there's no <ClerkProvider>. When Clerk is
 * absent the shop still renders and lists what's for sale with disabled CTAs.
 */

import React, { useState } from 'react';
import { useAuth, SignInButton } from '@clerk/clerk-react';
import { Palette, X, Check } from 'lucide-react';
import { COSMETIC_CATALOG, type CosmeticCatalogEntry } from '../content/cosmetics/catalog';
import { useEntitlements } from '../content/hooks';
import { startCosmeticCheckout } from '../billing/cosmeticCheckout';
import { cosmeticService } from '../cosmetics/CosmeticService';
import { isClerkConfigured } from '../auth/ClerkProvider';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CosmeticShop: React.FC<Props> = ({ open, onClose }) => {
  const entitlements = useEntitlements();
  const ownedIds = entitlements.ownedCosmeticIds;
  const hasSubscription = entitlements.hasSubscription;
  const equippedId = entitlements.equippedCosmeticId;

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
            <div className="flex items-center gap-2 text-fuchsia-400">
              <Palette className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                Board Themes
              </span>
            </div>
            <h3 className="text-slate-100 font-black text-lg mt-1">
              Re-skin your city
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Each theme re-colors the entire board. Purely cosmetic, applied
              live, equip whichever fits your mood. One-time purchase, yours
              forever.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {hasSubscription && (
          <div className="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 rounded-lg p-2.5">
            Your subscription unlocks every theme — equip any of them freely.
          </div>
        )}

        {/* Catalog list */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
          {COSMETIC_CATALOG.map((cosmetic) => (
            <CosmeticCard
              key={cosmetic.id}
              cosmetic={cosmetic}
              owned={ownedIds.has(cosmetic.id) || hasSubscription}
              equipped={equippedId === cosmetic.id}
            />
          ))}
        </div>

        {!isClerkConfigured && (
          <div className="text-[11px] text-slate-400 bg-slate-950/60 border border-white/5 rounded-lg p-3">
            Sign-in and purchases are not configured in this build. Set the Clerk
            and Stripe env vars (see <code>README-DEPLOYMENT.md</code>) to enable
            buying and equipping themes.
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────── card ──────────────────────────────────── */

interface CardProps {
  cosmetic: CosmeticCatalogEntry;
  /** True if owned outright OR covered by an active subscription. */
  owned: boolean;
  equipped: boolean;
}

const CosmeticCard: React.FC<CardProps> = ({ cosmetic, owned, equipped }) => {
  return (
    <div
      className="bg-slate-950/60 border rounded-xl p-4 flex flex-col gap-3"
      style={{ borderColor: `${cosmetic.accentColor}40` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] font-mono font-bold uppercase tracking-widest"
            style={{ color: cosmetic.accentColor }}
          >
            {cosmetic.tagline}
          </div>
          <h4 className="text-slate-100 font-extrabold text-base mt-0.5 leading-tight">
            {cosmetic.name}
          </h4>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {cosmetic.description}
          </p>
        </div>
        {equipped ? (
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
            <Check className="w-3 h-3" />
            Equipped
          </div>
        ) : (
          !owned && (
            <div className="shrink-0 text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                one-time
              </div>
              <div className="text-xl font-black text-slate-100 leading-none mt-0.5">
                {cosmetic.displayPrice}
              </div>
            </div>
          )
        )}
      </div>

      {/* Swatch row — a small preview of the theme's terrain palette */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {Object.entries(cosmetic.terrainColors).map(([terrain, color]) => (
          <span
            key={terrain}
            title={terrain}
            className="w-5 h-5 rounded-md border border-white/10 shrink-0"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <CosmeticCta cosmetic={cosmetic} owned={owned} equipped={equipped} />
    </div>
  );
};

/* ─────────────────────────────── CTA ───────────────────────────────────── */

/**
 * The buy/equip CTA row. Split out — and the authed variant rendered only when
 * Clerk is configured — because it calls Clerk's useAuth(), which THROWS when
 * there's no <ClerkProvider> (i.e. when VITE_CLERK_PUBLISHABLE_KEY is unset).
 * When Clerk is absent we show a disabled, informative button instead so the
 * shop still renders and lists what's for sale.
 */
const CosmeticCta: React.FC<CardProps> = ({ cosmetic, owned, equipped }) => {
  if (!isClerkConfigured) {
    return (
      <div className="flex justify-end pt-2 border-t border-white/5">
        <button
          disabled
          title="Set VITE_CLERK_PUBLISHABLE_KEY and the Stripe env vars to enable purchases"
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider shadow-md opacity-60 cursor-not-allowed"
        >
          Themes unavailable
        </button>
      </div>
    );
  }
  return <CosmeticCtaAuthed cosmetic={cosmetic} owned={owned} equipped={equipped} />;
};

const CosmeticCtaAuthed: React.FC<CardProps> = ({ cosmetic, owned, equipped }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useAuth();

  const handleBuy = async () => {
    setBusy(true);
    setError(null);
    try {
      await startCosmeticCheckout(cosmetic.id);
      // Redirects to Stripe; we won't reach here on success.
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  const handleEquip = async (next: string | null) => {
    setBusy(true);
    setError(null);
    try {
      await cosmeticService.equip(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {error && (
        <div className="text-[11px] text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg p-2">
          {error}
        </div>
      )}
      <div className="flex justify-end pt-2 border-t border-white/5">
        {!isSignedIn ? (
          <SignInButton mode="modal">
            <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md transition-colors">
              Sign in to {owned ? 'equip' : 'purchase'}
            </button>
          </SignInButton>
        ) : equipped ? (
          <button
            onClick={() => handleEquip(null)}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md disabled:opacity-60 transition-colors active:scale-[0.97]"
          >
            {busy ? 'Working…' : 'Unequip'}
          </button>
        ) : owned ? (
          <button
            onClick={() => handleEquip(cosmetic.id)}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md disabled:opacity-60 transition-all active:scale-[0.97]"
            style={{
              background: `linear-gradient(135deg, ${cosmetic.accentColor}, ${cosmetic.accentColor}cc)`,
            }}
          >
            {busy ? 'Working…' : 'Equip'}
          </button>
        ) : (
          <button
            onClick={handleBuy}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md disabled:opacity-60 transition-all active:scale-[0.97]"
            style={{
              background: `linear-gradient(135deg, ${cosmetic.accentColor}, ${cosmetic.accentColor}cc)`,
            }}
          >
            {busy ? 'Redirecting…' : `Buy ${cosmetic.displayPrice}`}
          </button>
        )}
      </div>
    </>
  );
};
