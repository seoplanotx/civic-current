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
import { Crown, X, Layers, Palette, BadgeCheck, HeartHandshake } from 'lucide-react';
import {
  startSubscriptionCheckout,
  openBillingPortal,
} from '../billing/subscriptionCheckout';
import { useSubscription } from '../content/hooks';
import { isClerkConfigured } from '../auth/ClerkProvider';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PERKS = [
  {
    icon: <Layers className="w-4 h-4 text-amber-400" />,
    title: '5 city slots',
    text: 'Run up to five ongoing terms at once, synced across devices.',
  },
  {
    icon: <Palette className="w-4 h-4 text-teal-400" />,
    title: 'Every terrain theme included',
    text: 'All cosmetic board themes unlocked while your subscription is active.',
  },
  {
    icon: <BadgeCheck className="w-4 h-4 text-indigo-400" />,
    title: 'Founder-tier badge',
    text: 'A distinct mark on your leaderboard profile.',
  },
  {
    icon: <HeartHandshake className="w-4 h-4 text-emerald-400" />,
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
        <div className="text-slate-200">
          <Header onClose={onClose} />
          <p className="text-xs text-slate-300 leading-relaxed mt-4">
            Sign-in and subscriptions are not configured in this build. Set
            <code className="mx-1 text-amber-300">VITE_CLERK_PUBLISHABLE_KEY</code>
            and the Stripe env vars (including
            <code className="mx-1 text-amber-300">STRIPE_PRICE_MAYORS_OFFICE</code>)
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
      <p className="text-xs text-slate-400 mt-3 leading-relaxed">
        A monthly subscription that keeps every premium perk active and funds new
        content. Cancel anytime from the billing portal.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        {PERKS.map((p) => (
          <div
            key={p.title}
            className="flex items-start gap-3 bg-slate-900/60 border border-white/5 rounded-xl p-3"
          >
            <div className="mt-0.5 shrink-0">{p.icon}</div>
            <div className="leading-tight">
              <div className="text-xs font-extrabold text-slate-100">{p.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{p.text}</div>
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
          {isSubscriber ? (
            <>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                Active
              </span>
              <span className="text-sm font-black text-slate-100 mt-1">
                Mayor's Office
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Subscription
              </span>
              <span className="text-2xl font-black text-slate-100 mt-1">
                $4.99
                <span className="text-sm font-bold text-slate-400">/mo</span>
              </span>
            </>
          )}
        </div>
        {isSubscriber ? (
          <button
            onClick={handleManage}
            disabled={busy}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-xl disabled:opacity-60 transition-all active:scale-[0.97]"
          >
            {busy ? 'Redirecting…' : 'Manage billing'}
          </button>
        ) : isSignedIn ? (
          <button
            onClick={handleSubscribe}
            disabled={busy}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-xl disabled:opacity-60 transition-all active:scale-[0.97]"
          >
            {busy ? 'Redirecting…' : 'Subscribe'}
          </button>
        ) : (
          <SignInButton mode="modal">
            <button className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-xl">
              Sign in to subscribe
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

const Header: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="flex items-start justify-between">
    <div>
      <div className="flex items-center gap-2 text-amber-400">
        <Crown className="w-4 h-4" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
          Mayor's Office
        </span>
      </div>
      <h3 className="text-slate-100 font-black text-lg mt-1">
        Run the city in style
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
