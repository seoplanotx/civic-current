/**
 * EntitlementService — the source of truth for what the current user owns.
 *
 * Phase 0: starts with DEFAULT_ENTITLEMENTS (free tier). Anyone can override
 * via `update()` for testing, dev-tools shortcuts, or storybook fixtures.
 *
 * Phase 1: a Clerk-aware bootstrapper calls `update()` after auth resolves,
 * passing entitlements pulled from a server-side Stripe lookup.
 *
 * Phase 4: subscription status syncs through the same `update()` channel.
 *
 * The service exposes a tiny pub/sub interface so the ContentRegistry and
 * any React hook can re-render when the user's entitlements change (e.g.
 * after a successful purchase callback).
 */

import {
  DEFAULT_ENTITLEMENTS,
  type EntitlementRequirement,
  type UserEntitlements,
} from './types';

type Listener = (entitlements: UserEntitlements) => void;

export class EntitlementService {
  private entitlements: UserEntitlements;
  private listeners: Set<Listener> = new Set();

  constructor(initial: UserEntitlements = DEFAULT_ENTITLEMENTS) {
    this.entitlements = initial;
  }

  /* ───────────────────────────── reads ───────────────────────────── */

  /** Returns the current entitlements snapshot. Treat as immutable. */
  get current(): UserEntitlements {
    return this.entitlements;
  }

  hasPremium(): boolean {
    return this.entitlements.hasPremium;
  }

  hasSubscription(): boolean {
    return this.entitlements.hasSubscription;
  }

  ownsPack(packId: string): boolean {
    return this.entitlements.ownedPackIds.has(packId);
  }

  /**
   * Evaluate an EntitlementRequirement against the user's current state.
   * The ContentRegistry uses this to decide whether a pack's content
   * should be exposed to the engine and UI.
   *
   * Premium and Subscription each strictly imply free — paying users
   * always see free content. A pack-specific requirement only resolves
   * for that exact pack id (premium does NOT auto-unlock paid packs;
   * that's a separate purchase by design).
   */
  has(requirement: EntitlementRequirement): boolean {
    switch (requirement.kind) {
      case 'free':
        return true;
      case 'premium':
        return this.entitlements.hasPremium;
      case 'subscription':
        return this.entitlements.hasSubscription;
      case 'pack':
        return this.entitlements.ownedPackIds.has(requirement.packId);
    }
  }

  /* ───────────────────────────── writes ───────────────────────────── */

  /**
   * Replace the current entitlements snapshot. Notifies all listeners.
   * Phase 1 calls this once after Clerk auth resolves; future webhook
   * receivers (Stripe purchase complete, subscription cancelled) call it
   * to keep the in-memory state in sync.
   */
  update(next: UserEntitlements): void {
    this.entitlements = next;
    this.notify();
  }

  /**
   * Convenience: shallow-merge a partial update. Useful when a single
   * purchase confirms (set hasPremium true) without re-fetching every field.
   */
  patch(partial: Partial<UserEntitlements>): void {
    this.entitlements = {
      ...this.entitlements,
      ...partial,
      ownedPackIds:
        partial.ownedPackIds ?? this.entitlements.ownedPackIds,
      equippedCosmeticIds:
        partial.equippedCosmeticIds ?? this.entitlements.equippedCosmeticIds,
    };
    this.notify();
  }

  /* ───────────────────────────── pub/sub ───────────────────────────── */

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.entitlements);
    }
  }
}

/**
 * Process-wide singleton. The app boots a single EntitlementService and
 * shares it across the ContentRegistry, hooks, and (Phase 1+) auth wiring.
 *
 * Tests can construct their own EntitlementService and ContentRegistry for
 * isolated runs — they don't have to go through this singleton.
 */
export const entitlementService = new EntitlementService();
