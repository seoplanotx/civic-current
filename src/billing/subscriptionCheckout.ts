/**
 * Client helpers for the recurring "Mayor's Office" subscription.
 *
 * `startSubscriptionCheckout` kicks off the Stripe Checkout flow in
 * subscription mode; `openBillingPortal` sends an existing subscriber to the
 * Stripe-hosted billing portal to manage or cancel.
 *
 * The webhook (api/webhook/stripe.ts) is the actual entitlement grantor. After
 * redirect-back from Stripe, AuthBridge re-fetches /api/entitlements on reload
 * and the registry hooks pick up the new subscription state automatically.
 */

import type {
  CreateCheckoutRequest,
  CreateCheckoutResponse,
} from '../shared/api-types';
import { apiRequest } from '../auth/apiClient';

export async function startSubscriptionCheckout(): Promise<void> {
  const body: CreateCheckoutRequest = {
    successUrl: `${window.location.origin}?subscription=success`,
    cancelUrl: `${window.location.origin}?subscription=cancel`,
  };
  const response = await apiRequest<CreateCheckoutResponse>(
    '/api/checkout/subscription',
    {
      method: 'POST',
      body,
    }
  );
  window.location.assign(response.url);
}

export async function openBillingPortal(): Promise<void> {
  const response = await apiRequest<{ url: string }>('/api/billing/portal', {
    method: 'POST',
    body: { returnUrl: window.location.origin },
  });
  window.location.assign(response.url);
}
