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
import { PACK_CATALOG } from '../content/catalog';
import { useEntitlements } from '../content/hooks';
import { startPackCheckout } from '../billing/packCheckout';
import { isClerkConfigured } from '../auth/ClerkProvider';
import { CcIcon } from './PlanningWallDefs';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const PackShop: React.FC<Props> = ({ open, onClose }) => {
  const entitlements = useEntitlements();
  const ownedIds = entitlements.ownedPackIds;

  if (!open) return null;

  return (
    <div className="cc-backdrop animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="cc-sticky cc-white relative w-full max-w-[640px] max-h-[85vh] p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="cc-pin cc-pin-blue" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-[color:var(--cc-ink)]/10 pb-4">
          <div>
            <div className="cc-label">
              <CcIcon name="bag" solid className="text-[color:var(--cc-blue)]" />
              Content Packs
            </div>
            <h3 className="cc-marker font-bold text-[28px] leading-none mt-2 text-[color:var(--cc-ink)]">
              Pick your era
            </h3>
            <p className="cc-hand text-[18px] text-[color:var(--cc-ink-soft)] mt-1 leading-snug">
              Each pack adds new buildings, event cards, and scenarios. One-time
              purchase, yours forever.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[color:var(--cc-ink-soft)] hover:text-[color:var(--cc-ink)] hover:bg-[color:var(--cc-ink)]/5 transition-colors"
          >
            <CcIcon name="x" className="text-[18px]" />
          </button>
        </div>

        {/* Catalog list */}
        <div className="flex flex-col gap-5 overflow-y-auto px-1 pt-2 pb-1 custom-scrollbar">
          {PACK_CATALOG.map((pack, i) => (
            <PackCard
              key={pack.id}
              pack={pack}
              owned={ownedIds.has(pack.id)}
              index={i}
            />
          ))}
        </div>

        {!isClerkConfigured && (
          <div className="cc-hand text-[16px] text-[color:var(--cc-ink-soft)] bg-[color:var(--cc-ink)]/5 border border-[color:var(--cc-ink)]/10 rounded-lg p-3 leading-snug">
            Sign-in and purchases are not configured in this build. Set the Clerk
            and Stripe env vars (see <code className="cc-mono text-[13px]">README-DEPLOYMENT.md</code>) to enable
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
  index: number;
}

// Alternate paper colors and tilts per card for the planning-wall scatter look.
const CARD_PAPERS = ['cc-o', 'cc-b', 'cc-g', 'cc-p'];
const CARD_TILTS = ['cc-rot-1', 'cc-rot1'];

const PackCard: React.FC<CardProps> = ({ pack, owned, index }) => {
  const paper = CARD_PAPERS[index % CARD_PAPERS.length];
  const tilt = CARD_TILTS[index % CARD_TILTS.length];

  return (
    <div className={`cc-sticky ${paper} ${tilt} relative p-5 flex flex-col gap-3`}>
      {owned && (
        <div className="absolute top-3 right-3 z-10">
          <span className="cc-stamp">owned</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="cc-label text-[color:var(--cc-ink-soft)]">
            {pack.tagline}
          </div>
          <h4 className="cc-marker font-bold text-[22px] mt-1 leading-tight text-[color:var(--cc-ink)]">
            {pack.name}
          </h4>
          <p className="text-[13px] text-[color:var(--cc-ink)] opacity-85 mt-2 leading-relaxed">
            {pack.description}
          </p>
        </div>
        {!owned && (
          <div className="shrink-0 text-right">
            <div className="cc-mono text-[10px] uppercase tracking-widest text-[color:var(--cc-ink-soft)]">
              one-time
            </div>
            <div className="cc-marker font-bold text-[28px] leading-none mt-0.5 text-[color:var(--cc-ink)]">
              {pack.displayPrice}
            </div>
          </div>
        )}
      </div>

      <ul className="flex flex-col gap-1.5 mt-1">
        {pack.highlights.map((h) => (
          <li
            key={h}
            className="text-[13px] text-[color:var(--cc-ink)] flex items-start gap-2 leading-snug"
          >
            <CcIcon name="star" className="mt-0.5 shrink-0 text-[color:var(--cc-ink-soft)]" />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      {!owned && <PackBuyRow pack={pack} />}
    </div>
  );
};

/**
 * The purchase CTA row. Split out — and rendered only when Clerk is configured
 * — because it calls Clerk's useAuth(), which THROWS when there's no
 * <ClerkProvider> in the tree (i.e. when VITE_CLERK_PUBLISHABLE_KEY is unset).
 * When Clerk is absent we show a disabled, informative button instead so the
 * shop still renders and lists what's for sale.
 */
const PackBuyRow: React.FC<{ pack: (typeof PACK_CATALOG)[number] }> = ({ pack }) => {
  if (!isClerkConfigured) {
    return (
      <div className="flex justify-end pt-3 border-t border-[color:var(--cc-ink)]/10">
        <button
          disabled
          title="Set VITE_CLERK_PUBLISHABLE_KEY and the Stripe env vars to enable purchases"
          className="cc-btn !text-[14px] !py-2.5"
        >
          <svg className="cc-btn-box cc-rough" viewBox="0 0 220 46" preserveAspectRatio="none">
            <rect x="3" y="3" width="214" height="40" rx="8" fill="rgba(37,48,58,0.06)" stroke="#25303a" strokeWidth="3" />
          </svg>
          <span className="cc-btn-label">Purchases unavailable</span>
        </button>
      </div>
    );
  }
  return <PackBuyRowAuthed pack={pack} />;
};

const PackBuyRowAuthed: React.FC<{ pack: (typeof PACK_CATALOG)[number] }> = ({ pack }) => {
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
    <>
      {error && (
        <div className="cc-hand text-[15px] text-[color:var(--cc-red)] bg-[color:var(--cc-red)]/10 border border-[color:var(--cc-red)]/30 rounded-lg p-2 leading-snug">
          {error}
        </div>
      )}
      <div className="flex justify-end pt-3 border-t border-[color:var(--cc-ink)]/10">
        {isSignedIn ? (
          <button onClick={handleBuy} disabled={busy} className="cc-btn !text-[15px] !py-2.5">
            <svg className="cc-btn-box cc-rough" viewBox="0 0 220 46" preserveAspectRatio="none">
              <rect x="3" y="3" width="214" height="40" rx="8" fill="rgba(46,139,87,0.18)" stroke="#2e8b57" strokeWidth="3" />
            </svg>
            <span className="cc-btn-label flex items-center gap-2 text-[color:var(--cc-green)]">
              <CcIcon name="bag" />
              {busy ? 'Redirecting…' : `Buy ${pack.displayPrice}`}
            </span>
          </button>
        ) : (
          <SignInButton mode="modal">
            <button className="cc-btn !text-[15px] !py-2.5">
              <svg className="cc-btn-box cc-rough" viewBox="0 0 220 46" preserveAspectRatio="none">
                <rect x="3" y="3" width="214" height="40" rx="8" fill="rgba(47,109,176,0.18)" stroke="#2f6db0" strokeWidth="3" />
              </svg>
              <span className="cc-btn-label flex items-center gap-2 text-[color:var(--cc-blue)]">
                <CcIcon name="login" />
                Sign in to purchase
              </span>
            </button>
          </SignInButton>
        )}
      </div>
    </>
  );
};
