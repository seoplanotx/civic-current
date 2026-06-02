/**
 * Mayor's Office subscription modal.
 *
 * Pitches the recurring $4.99/mo tier (5 city slots, every terrain theme,
 * founder-tier badge, supporting development) and provides the right CTA for
 * the viewer's state:
 *   - not signed in        → Clerk sign-in
 *   - signed in, not subbed → "Subscribe" → Stripe Checkout (subscription mode)
 *   - active subscriber     → status + "Manage billing" → Stripe billing portal
 *
 * Like UpgradeModal, all Clerk hooks live in an inner component that only
 * renders when `isClerkConfigured` — calling useAuth() with no <ClerkProvider>
 * in the tree throws, so the outer component shows a non-Clerk fallback notice
 * in local/dev builds where auth is unset.
 */

import React, { useState } from 'react';
import { useAuth, SignInButton } from '@clerk/clerk-react';
import {
  startSubscriptionCheckout,
  openBillingPortal,
} from '../billing/subscriptionCheckout';
import { useSubscription } from '../content/hooks';
import { isClerkConfigured } from '../auth/ClerkProvider';
import { CcIcon } from './PlanningWallDefs';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PERKS = [
  {
    icon: <CcIcon name="layers" className="text-[var(--cc-blue)]" />,
    title: '5 city slots',
    text: 'Run up to five ongoing terms at once, synced across devices.',
  },
  {
    icon: <CcIcon name="palette" className="text-[var(--cc-green)]" />,
    title: 'Every terrain theme included',
    text: 'All cosmetic board themes unlocked while your subscription is active.',
  },
  {
    icon: <CcIcon name="star" className="text-[var(--cc-red)]" />,
    title: 'Founder-tier badge',
    text: 'A distinct mark on your leaderboard profile.',
  },
  {
    icon: <CcIcon name="heart" className="text-[var(--cc-red)]" />,
    title: 'Support ongoing development',
    text: 'Fund new buildings, events, and scenarios every month.',
  },
];

export const MayorOfficeModal: React.FC<Props> = ({ open, onClose }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  if (!isClerkConfigured) {
    return (
      <Backdrop onClose={onClose}>
        <div>
          <Header onClose={onClose} />
          <p className="cc-marker text-[13px] text-[var(--cc-ink-soft)] leading-relaxed mt-4">
            Sign-in and subscriptions are not configured in this build. Set
            <code className="cc-mono mx-1 text-[12px] text-[var(--cc-blue)]">VITE_CLERK_PUBLISHABLE_KEY</code>
            and the Stripe env vars (including
            <code className="cc-mono mx-1 text-[12px] text-[var(--cc-blue)]">STRIPE_PRICE_MAYORS_OFFICE</code>)
            to enable the Mayor's Office subscription.
          </p>
        </div>
      </Backdrop>
    );
  }

  return (
    <MayorOfficeModalInner
      onClose={onClose}
      busy={busy}
      setBusy={setBusy}
      error={error}
      setError={setError}
    />
  );
};

interface InnerProps {
  onClose: () => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
  error: string | null;
  setError: (e: string | null) => void;
}

const MayorOfficeModalInner: React.FC<InnerProps> = ({
  onClose,
  busy,
  setBusy,
  error,
  setError,
}) => {
  const { isSignedIn } = useAuth();
  const isSubscriber = useSubscription();

  const handleSubscribe = async () => {
    setBusy(true);
    setError(null);
    try {
      await startSubscriptionCheckout();
      // startSubscriptionCheckout redirects; we won't reach here on success.
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  const handleManage = async () => {
    setBusy(true);
    setError(null);
    try {
      await openBillingPortal();
      // openBillingPortal redirects; we won't reach here on success.
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <Backdrop onClose={onClose}>
      <Header onClose={onClose} />
      <p className="cc-marker text-[13px] text-[var(--cc-ink-soft)] mt-3 leading-relaxed">
        A monthly subscription that keeps every premium perk active and funds new
        content. Cancel anytime from the billing portal.
      </p>
      <div className="mt-5 flex flex-col gap-2.5">
        {PERKS.map((p) => (
          <div
            key={p.title}
            className="flex items-start gap-3 bg-white/45 rounded-lg p-3 ring-1 ring-[rgba(37,48,58,0.10)]"
          >
            <div className="mt-0.5 shrink-0 text-[18px]">{p.icon}</div>
            <div className="leading-tight">
              <div className="cc-marker text-[14px] font-bold text-[var(--cc-ink)]">{p.title}</div>
              <div className="cc-marker text-[12px] text-[var(--cc-ink-soft)] mt-0.5">{p.text}</div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="cc-marker mt-4 text-[12px] text-[var(--cc-red)] bg-[rgba(216,65,47,0.10)] ring-1 ring-[rgba(216,65,47,0.30)] rounded-lg p-2">
          {error}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-[rgba(37,48,58,0.12)] flex items-center justify-between">
        <div className="flex flex-col leading-none">
          {isSubscriber ? (
            <>
              <span className="cc-stamp">Active</span>
              <span className="cc-hand text-[22px] text-[var(--cc-ink)] mt-2">
                Mayor's Office
              </span>
            </>
          ) : (
            <>
              <span className="cc-label">Subscription</span>
              <span className="cc-marker text-[30px] font-extrabold text-[var(--cc-ink)] mt-1 leading-none">
                $4.99
                <span className="cc-marker text-[15px] font-bold text-[var(--cc-ink-soft)]">/mo</span>
              </span>
            </>
          )}
        </div>
        {isSubscriber ? (
          <button onClick={handleManage} disabled={busy} className="cc-btn">
            <svg className="cc-btn-box cc-rough" viewBox="0 0 200 56" preserveAspectRatio="none">
              <rect x="4" y="4" width="192" height="48" rx="11" fill="rgba(37,48,58,0.06)" stroke="#25303a" strokeWidth="3.5" />
            </svg>
            <span className="cc-btn-label flex items-center gap-2 text-[var(--cc-ink)]">
              {busy ? 'Redirecting…' : 'Manage billing'}
            </span>
          </button>
        ) : isSignedIn ? (
          <button onClick={handleSubscribe} disabled={busy} className="cc-btn">
            <svg className="cc-btn-box cc-rough" viewBox="0 0 180 56" preserveAspectRatio="none">
              <rect x="4" y="4" width="172" height="48" rx="11" fill="rgba(47,109,176,0.16)" stroke="#2f6db0" strokeWidth="3.5" />
            </svg>
            <span className="cc-btn-label flex items-center gap-2 text-[#13325a]">
              <CcIcon name="crown" /> {busy ? 'Redirecting…' : 'Subscribe'}
            </span>
          </button>
        ) : (
          <SignInButton mode="modal">
            <button className="cc-btn">
              <svg className="cc-btn-box cc-rough" viewBox="0 0 240 56" preserveAspectRatio="none">
                <rect x="4" y="4" width="232" height="48" rx="11" fill="rgba(47,109,176,0.16)" stroke="#2f6db0" strokeWidth="3.5" />
              </svg>
              <span className="cc-btn-label flex items-center gap-2 text-[#13325a]">
                <CcIcon name="login" /> Sign in to subscribe
              </span>
            </button>
          </SignInButton>
        )}
      </div>
    </Backdrop>
  );
};

const Backdrop: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({
  onClose,
  children,
}) => (
  <div
    className="cc-backdrop animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div
      className="cc-sticky cc-b cc-rot-1 relative w-full max-w-[440px] p-7"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="cc-pin cc-pin-blue" />
      {children}
    </div>
  </div>
);

const Header: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="flex items-start justify-between">
    <div>
      <div className="cc-label">
        <CcIcon name="crown" />
        Mayor's Office
      </div>
      <h3 className="cc-hand text-[var(--cc-ink)] text-[34px] leading-tight mt-1">
        Run the city in style
      </h3>
    </div>
    <button
      onClick={onClose}
      className="cc-marker text-[20px] p-1.5 rounded-lg text-[var(--cc-ink-soft)] hover:text-[var(--cc-ink)] hover:bg-black/5 transition-colors"
      aria-label="Close"
    >
      <CcIcon name="x" />
    </button>
  </div>
);
