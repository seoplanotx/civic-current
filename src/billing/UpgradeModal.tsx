/**
 * Premium unlock upsell modal.
 *
 * Shown when a free user attempts to access a premium-only feature
 * (e.g. creating a second city slot, opening a paid content pack).
 * Single CTA: starts the Stripe Checkout flow.
 *
 * For users who aren't signed in yet, the CTA routes through Clerk's
 * sign-in flow first — Stripe checkout requires an authenticated user
 * so we can attribute the purchase.
 */

import React, { useState } from 'react';
import { useAuth, SignInButton } from '@clerk/clerk-react';
import { startPremiumCheckout } from './checkout';
import { isClerkConfigured } from '../auth/ClerkProvider';
import { CcIcon } from '../components/PlanningWallDefs';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Why the user hit this paywall — surfaced as a small headline. */
  reason?: string;
}

const FEATURES = [
  {
    icon: <CcIcon name="layers" className="text-[color:var(--cc-blue)]" />,
    title: '3 persistent cities',
    text: 'Save and switch between three ongoing terms across devices.',
  },
  {
    icon: <CcIcon name="cloud" className="text-[color:var(--cc-green)]" />,
    title: 'Cloud save & sync',
    text: 'Your cities follow you between laptop, phone, and tablet.',
  },
  {
    icon: <CcIcon name="star" solid className="text-[color:var(--cc-red)]" />,
    title: 'All launch cosmetics',
    text: 'Every base building theme, unlocked permanently.',
  },
  {
    icon: <CcIcon name="crown" className="text-[color:var(--cc-blue)]" />,
    title: 'Founder badge',
    text: 'A permanent mark on your leaderboard profile.',
  },
];

export const UpgradeModal: React.FC<Props> = ({ open, onClose, reason }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  if (!isClerkConfigured) {
    return (
      <Backdrop onClose={onClose}>
        <Header onClose={onClose} reason="Premium features require auth setup" />
        <p className="text-[12.5px] text-[color:var(--cc-ink)] opacity-85 leading-relaxed mt-4">
          Sign-in and purchases are not configured in this build. Set
          <code className="cc-mono mx-1 text-[11px] text-[color:var(--cc-blue)]">VITE_CLERK_PUBLISHABLE_KEY</code>
          and the Stripe env vars to enable the premium unlock.
        </p>
      </Backdrop>
    );
  }

  return <UpgradeModalInner onClose={onClose} reason={reason} busy={busy} setBusy={setBusy} error={error} setError={setError} />;
};

interface InnerProps {
  onClose: () => void;
  reason?: string;
  busy: boolean;
  setBusy: (b: boolean) => void;
  error: string | null;
  setError: (e: string | null) => void;
}

const UpgradeModalInner: React.FC<InnerProps> = ({
  onClose,
  reason,
  busy,
  setBusy,
  error,
  setError,
}) => {
  const { isSignedIn } = useAuth();

  const handlePurchase = async () => {
    setBusy(true);
    setError(null);
    try {
      await startPremiumCheckout();
      // startPremiumCheckout redirects; we won't reach here on success.
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <Backdrop onClose={onClose}>
      <Header onClose={onClose} reason={reason} />
      <p className="text-[12.5px] text-[color:var(--cc-ink)] opacity-85 mt-3 leading-relaxed">
        A single one-time payment. No subscription, no recurring charges. Premium
        stays on your account forever.
      </p>
      <div className="mt-5 flex flex-col gap-2.5">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex items-start gap-3 cc-sticky cc-white rounded-md p-3"
          >
            <div className="mt-0.5 shrink-0 text-[18px] leading-none">{f.icon}</div>
            <div className="leading-tight">
              <div className="cc-marker text-[13px] font-bold text-[color:var(--cc-ink)]">{f.title}</div>
              <div className="text-[11.5px] text-[color:var(--cc-ink)] opacity-75 mt-0.5">{f.text}</div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 cc-marker text-[11.5px] font-bold text-[color:var(--cc-red)] bg-[rgba(216,65,47,0.08)] border border-[rgba(216,65,47,0.3)] rounded-md p-2.5">
          {error}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-dashed border-[rgba(37,48,58,0.18)] flex items-center justify-between">
        <div className="flex flex-col leading-none">
          <span className="cc-label">One-time</span>
          <span className="cc-marker text-3xl font-bold text-[color:var(--cc-ink)] mt-1.5">$14.99</span>
        </div>
        {isSignedIn ? (
          <button onClick={handlePurchase} disabled={busy} className="cc-btn">
            <svg className="cc-btn-box cc-rough" viewBox="0 0 240 52" preserveAspectRatio="none">
              <rect x="3" y="3" width="234" height="46" rx="8" fill="rgba(47,109,176,0.18)" stroke="#2f6db0" strokeWidth="3" />
            </svg>
            <span className="cc-btn-label flex items-center gap-2 text-[#13325a]">
              <CcIcon name="bolt" solid /> {busy ? 'Redirecting…' : 'Unlock Premium'}
            </span>
          </button>
        ) : (
          <SignInButton mode="modal">
            <button className="cc-btn">
              <svg className="cc-btn-box cc-rough" viewBox="0 0 240 52" preserveAspectRatio="none">
                <rect x="3" y="3" width="234" height="46" rx="8" fill="rgba(47,109,176,0.18)" stroke="#2f6db0" strokeWidth="3" />
              </svg>
              <span className="cc-btn-label flex items-center gap-2 text-[#13325a]">
                <CcIcon name="login" /> Sign in to purchase
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
  <div className="cc-backdrop animate-in fade-in duration-200" onClick={onClose}>
    <div
      className="cc-sticky cc-y cc-rot-1 relative w-full max-w-[440px] p-7"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="cc-pin" />
      {children}
    </div>
  </div>
);

const Header: React.FC<{ onClose: () => void; reason?: string }> = ({
  onClose,
  reason,
}) => (
  <div className="flex items-start justify-between">
    <div>
      <div className="cc-label">
        <CcIcon name="star" solid className="text-[color:var(--cc-blue)]" />
        {reason ?? 'Civic Current Premium'}
      </div>
      <h3 className="cc-hand font-bold text-[32px] leading-tight text-[color:var(--cc-ink)] mt-1">
        Unlock the full mayor experience
      </h3>
    </div>
    <button
      onClick={onClose}
      className="shrink-0 p-1.5 rounded-md text-[18px] leading-none text-[color:var(--cc-ink-soft)] hover:text-[color:var(--cc-ink)] hover:bg-[rgba(37,48,58,0.08)] transition-colors"
    >
      <CcIcon name="x" />
    </button>
  </div>
);
