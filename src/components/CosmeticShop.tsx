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
import { COSMETIC_CATALOG, type CosmeticCatalogEntry } from '../content/cosmetics/catalog';
import { useEntitlements } from '../content/hooks';
import { startCosmeticCheckout } from '../billing/cosmeticCheckout';
import { cosmeticService } from '../cosmetics/CosmeticService';
import { isClerkConfigured } from '../auth/ClerkProvider';
import { CcIcon } from './PlanningWallDefs';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Sticky paper colors + tilts cycled across cards for the hand-made feel. */
const CARD_PAPERS = ['cc-y', 'cc-p', 'cc-b', 'cc-g', 'cc-o'];
const CARD_TILTS = ['cc-rot-1', 'cc-rot1', 'cc-rot-2', 'cc-rot2'];
const PINS = ['cc-pin', 'cc-pin cc-pin-blue', 'cc-pin cc-pin-green'];

export const CosmeticShop: React.FC<Props> = ({ open, onClose }) => {
  const entitlements = useEntitlements();
  const ownedIds = entitlements.ownedCosmeticIds;
  const hasSubscription = entitlements.hasSubscription;
  const equippedId = entitlements.equippedCosmeticId;

  if (!open) return null;

  return (
    <div className="cc-backdrop animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="cc-sticky cc-white cc-rot-1 relative w-full max-w-[640px] max-h-[85vh] p-7 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="cc-pin cc-pin-blue" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="cc-label">
              <CcIcon name="palette" className="text-[color:var(--cc-blue)]" />
              Board Themes
            </div>
            <h3 className="cc-hand font-bold text-[34px] leading-none text-[color:var(--cc-ink)] mt-2">
              Re-skin your city
            </h3>
            <p className="text-[12.5px] text-[color:var(--cc-ink)] opacity-80 mt-2 leading-relaxed max-w-[440px]">
              Each theme re-colors the entire board. Purely cosmetic, applied
              live, equip whichever fits your mood. One-time purchase, yours
              forever.
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 -mr-1 -mt-1 rounded-lg text-[color:var(--cc-ink-soft)] hover:text-[color:var(--cc-ink)] transition-colors"
          >
            <CcIcon name="x" className="text-[18px]" />
          </button>
        </div>

        {hasSubscription && (
          <div className="cc-marker text-[12px] font-bold text-[color:var(--cc-green)] flex items-center gap-2">
            <CcIcon name="check" className="text-[color:var(--cc-green)]" />
            Your subscription unlocks every theme — equip any of them freely.
          </div>
        )}

        {/* Catalog list */}
        <div className="flex flex-col gap-6 overflow-y-auto px-1 pt-3 pb-1 custom-scrollbar">
          {COSMETIC_CATALOG.map((cosmetic, i) => (
            <CosmeticCard
              key={cosmetic.id}
              cosmetic={cosmetic}
              owned={cosmetic.free || ownedIds.has(cosmetic.id) || hasSubscription}
              // The free default theme is "equipped" whenever no paid theme is.
              equipped={cosmetic.free ? equippedId === null : equippedId === cosmetic.id}
              index={i}
            />
          ))}
        </div>

        {!isClerkConfigured && (
          <div className="cc-marker text-[12px] text-[color:var(--cc-ink)] opacity-80 leading-relaxed border-t border-[rgba(37,48,58,0.15)] pt-3">
            Sign-in and purchases are not configured in this build. Set the Clerk
            and Stripe env vars (see <code className="cc-mono">README-DEPLOYMENT.md</code>) to enable
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

const CosmeticCard: React.FC<CardProps & { index: number }> = ({ cosmetic, owned, equipped, index }) => {
  const paper = CARD_PAPERS[index % CARD_PAPERS.length];
  const tilt = CARD_TILTS[index % CARD_TILTS.length];
  const pin = PINS[index % PINS.length];

  return (
    <div className={`cc-sticky ${paper} ${tilt} relative p-5 flex flex-col gap-3`}>
      <span className={pin} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="cc-label">{cosmetic.tagline}</div>
          <h4 className="cc-marker font-bold text-[20px] leading-tight text-[color:var(--cc-ink)] mt-1">
            {cosmetic.name}
          </h4>
          <p className="text-[12px] text-[color:var(--cc-ink)] opacity-80 mt-2 leading-relaxed">
            {cosmetic.description}
          </p>
        </div>
        {equipped ? (
          <span className="cc-stamp shrink-0">in use ✓</span>
        ) : (
          !owned && (
            <div className="shrink-0 text-right">
              <div className="cc-label justify-end">one-time</div>
              <div className="cc-hand font-bold text-[32px] leading-none text-[color:var(--cc-ink)] mt-0.5">
                {cosmetic.displayPrice}
              </div>
            </div>
          )
        )}
      </div>

      {/* Swatch row — a small preview of the theme's terrain palette */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {Object.entries(cosmetic.terrainColors).map(([terrain, color], i) => (
          <span
            key={terrain}
            title={terrain}
            className="w-6 h-6 rounded-md shrink-0"
            style={{
              backgroundColor: color,
              border: '2px solid rgba(37,48,58,0.25)',
              transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (3 + (i % 3))}deg)`,
              boxShadow: '0 2px 3px rgba(40,50,60,0.18)',
            }}
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
      <div className="flex justify-end pt-2 border-t border-[rgba(37,48,58,0.18)]">
        <button
          disabled
          title="Set VITE_CLERK_PUBLISHABLE_KEY and the Stripe env vars to enable purchases"
          className="cc-btn !text-[14px] !py-2.5"
        >
          <svg className="cc-btn-box cc-rough" viewBox="0 0 220 46" preserveAspectRatio="none">
            <rect x="3" y="3" width="214" height="40" rx="8" fill="rgba(37,48,58,0.06)" stroke="#25303a" strokeWidth="3" />
          </svg>
          <span className="cc-btn-label">Themes unavailable</span>
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
        <div className="cc-marker text-[12px] font-bold text-[color:var(--cc-red)]">
          {error}
        </div>
      )}
      <div className="flex justify-end pt-2 border-t border-[rgba(37,48,58,0.18)]">
        {!isSignedIn ? (
          <SignInButton mode="modal">
            <button className="cc-btn !text-[14px] !py-2.5">
              <svg className="cc-btn-box cc-rough" viewBox="0 0 220 46" preserveAspectRatio="none">
                <rect x="3" y="3" width="214" height="40" rx="8" fill="rgba(37,48,58,0.06)" stroke="#25303a" strokeWidth="3" />
              </svg>
              <span className="cc-btn-label">Sign in to {owned ? 'equip' : 'purchase'}</span>
            </button>
          </SignInButton>
        ) : equipped ? (
          <button
            onClick={() => handleEquip(null)}
            disabled={busy}
            className="cc-btn !text-[14px] !py-2.5"
          >
            <svg className="cc-btn-box cc-rough" viewBox="0 0 220 46" preserveAspectRatio="none">
              <rect x="3" y="3" width="214" height="40" rx="8" fill="rgba(37,48,58,0.06)" stroke="#25303a" strokeWidth="3" />
            </svg>
            <span className="cc-btn-label">{busy ? 'Working…' : 'Unequip'}</span>
          </button>
        ) : owned ? (
          <button
            onClick={() => handleEquip(cosmetic.free ? null : cosmetic.id)}
            disabled={busy}
            className="cc-btn !text-[14px] !py-2.5"
          >
            <svg className="cc-btn-box cc-rough" viewBox="0 0 220 46" preserveAspectRatio="none">
              <rect x="3" y="3" width="214" height="40" rx="8" fill="rgba(47,109,176,0.18)" stroke="#2f6db0" strokeWidth="3" />
            </svg>
            <span className="cc-btn-label flex items-center gap-2 text-[#13325a]">
              <CcIcon name="star" /> {busy ? 'Working…' : 'Equip'}
            </span>
          </button>
        ) : (
          <button
            onClick={handleBuy}
            disabled={busy}
            className="cc-btn !text-[14px] !py-2.5"
          >
            <svg className="cc-btn-box cc-rough" viewBox="0 0 220 46" preserveAspectRatio="none">
              <rect x="3" y="3" width="214" height="40" rx="8" fill="rgba(46,139,87,0.18)" stroke="#2e8b57" strokeWidth="3" />
            </svg>
            <span className="cc-btn-label flex items-center gap-2 text-[#1f6b41]">
              {busy ? 'Redirecting…' : `Buy ${cosmetic.displayPrice}`}
            </span>
          </button>
        )}
      </div>
    </>
  );
};
