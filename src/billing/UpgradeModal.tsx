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
import { Sparkles, X, Cloud, Layers, Save } from 'lucide-react';
import { startPremiumCheckout } from './checkout';
import { isClerkConfigured } from '../auth/ClerkProvider';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Why the user hit this paywall — surfaced as a small headline. */
  reason?: string;
}

const FEATURES = [
  {
    icon: <Layers className="w-4 h-4 text-indigo-400" />,
    title: '3 persistent cities',
    text: 'Save and switch between three ongoing terms across devices.',
  },
  {
    icon: <Cloud className="w-4 h-4 text-teal-400" />,
    title: 'Cloud save & sync',
    text: 'Your cities follow you between laptop, phone, and tablet.',
  },
  {
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    title: 'All launch cosmetics',
    text: 'Every base building theme, unlocked permanently.',
  },
  {
    icon: <Save className="w-4 h-4 text-emerald-400" />,
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
        <div className="text-slate-200">
          <Header onClose={onClose} reason="Premium features require auth setup" />
          <p className="text-xs text-slate-300 leading-relaxed mt-4">
            Sign-in and purchases are not configured in this build. Set
            <code className="mx-1 text-indigo-300">VITE_CLERK_PUBLISHABLE_KEY</code>
            and the Stripe env vars to enable the premium unlock.
          </p>
        </div>
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
      <p className="text-xs text-slate-400 mt-3 leading-relaxed">
        A single one-time payment. No subscription, no recurring charges. Premium
        stays on your account forever.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex items-start gap-3 bg-slate-900/60 border border-white/5 rounded-xl p-3"
          >
            <div className="mt-0.5 shrink-0">{f.icon}</div>
            <div className="leading-tight">
              <div className="text-xs font-extrabold text-slate-100">{f.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{f.text}</div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 text-[11px] text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg p-2">
          {error}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex flex-col leading-none">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            One-time
          </span>
          <span className="text-2xl font-black text-slate-100 mt-1">$14.99</span>
        </div>
        {isSignedIn ? (
          <button
            onClick={handlePurchase}
            disabled={busy}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-xl disabled:opacity-60 transition-all active:scale-[0.97]"
          >
            {busy ? 'Redirecting…' : 'Unlock Premium'}
          </button>
        ) : (
          <SignInButton mode="modal">
            <button className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-xl">
              Sign in to purchase
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
    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-[440px] bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
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
      <div className="flex items-center gap-2 text-indigo-400">
        <Sparkles className="w-4 h-4" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
          {reason ?? 'Civic Current Premium'}
        </span>
      </div>
      <h3 className="text-slate-100 font-black text-lg mt-1">
        Unlock the full mayor experience
      </h3>
    </div>
    <button
      onClick={onClose}
      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);
