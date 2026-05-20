/**
 * Clerk provider wrapper.
 *
 * Wraps Clerk's <ClerkProvider> with our app-specific configuration and
 * gracefully degrades when the publishable key is missing. In that mode
 * the app still renders — anonymous, local-save only — so dev works
 * without env vars and self-hosters can opt out of Clerk by omitting the
 * key entirely (though several Phase 1 features will be unavailable).
 *
 * Configure by setting VITE_CLERK_PUBLISHABLE_KEY in your environment.
 * See README-DEPLOYMENT.md.
 */

import React from 'react';
import { ClerkProvider as ClerkRoot } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/** True when Clerk is configured — used by UI to hide login/upgrade buttons. */
export const isClerkConfigured: boolean = !!PUBLISHABLE_KEY;

interface Props {
  children: React.ReactNode;
}

export const ClerkProvider: React.FC<Props> = ({ children }) => {
  if (!isClerkConfigured) {
    // Render children without Clerk; downstream hooks must tolerate this.
    return <>{children}</>;
  }

  return (
    <ClerkRoot
      publishableKey={PUBLISHABLE_KEY!}
      appearance={{
        variables: {
          colorPrimary: '#6366f1', // indigo-500 to match the app's accent
          colorBackground: '#0f172a', // slate-900
          colorText: '#e2e8f0', // slate-200
          borderRadius: '0.75rem',
        },
      }}
    >
      {children}
    </ClerkRoot>
  );
};
