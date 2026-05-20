/**
 * Bridges Clerk's React-only auth state into modules that aren't React.
 *
 * Two responsibilities:
 *   1. Plumbs `getToken` from Clerk into the apiClient module so other
 *      services (cloud save) can make authenticated fetches without using
 *      React hooks.
 *   2. Mounts an EntitlementLoader that calls /api/entitlements on sign-in
 *      and pushes the result into the entitlement service, which fans the
 *      change through every registry hook.
 *
 * Renders nothing visible — pure side-effect component.
 */

import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import type { EntitlementsResponse } from '../shared/api-types';
import { apiRequest, setTokenGetter } from './apiClient';
import { entitlementService } from '../content/entitlements';
import { isClerkConfigured } from './ClerkProvider';

/* ─────────────────────────────── component ─────────────────────────────── */

export const AuthBridge: React.FC = () => {
  if (!isClerkConfigured) {
    // No Clerk → anonymous, free-tier only. Nothing to bridge.
    return null;
  }
  return <AuthBridgeInner />;
};

/* ─────────────────────────────── inner ─────────────────────────────────── */

/**
 * Inner component uses Clerk hooks. Separated so the outer component can
 * cheaply early-return when Clerk isn't configured (without violating the
 * Rules of Hooks).
 */
const AuthBridgeInner: React.FC = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  // Wire the token getter on every render so apiClient always has the latest.
  useEffect(() => {
    setTokenGetter(async () => {
      if (!isSignedIn) return null;
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
  }, [isSignedIn, getToken]);

  // Reload entitlements whenever auth state changes (sign-in, sign-out,
  // session refresh). Anonymous users get default free entitlements.
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await apiRequest<EntitlementsResponse>('/api/entitlements');
        if (cancelled) return;
        entitlementService.update({
          hasPremium: data.hasPremium,
          hasSubscription: data.hasSubscription,
          ownedPackIds: new Set(data.ownedPackIds),
          equippedCosmeticIds: new Set(data.equippedCosmeticIds ?? []),
        });
      } catch {
        // Network failure → default free entitlements. The user just sees
        // the free game with a "couldn't reach server" toast handled
        // elsewhere if we add one later.
        if (!cancelled) {
          entitlementService.update({
            hasPremium: false,
            hasSubscription: false,
            ownedPackIds: new Set(),
            equippedCosmeticIds: new Set(),
          });
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  return null;
};
