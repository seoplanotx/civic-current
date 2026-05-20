/**
 * Client helper that kicks off the Stripe Checkout flow for the premium
 * unlock. Returns the URL the user should be redirected to.
 *
 * The webhook (api/webhook/stripe.ts) is the actual entitlement grantor.
 * After redirect-back from Stripe, the success page reloads entitlements
 * by re-mounting AuthBridge, which calls /api/entitlements and updates
 * the registry hooks automatically.
 */

import type {
  CreateCheckoutRequest,
  CreateCheckoutResponse,
} from '../shared/api-types';
import { apiRequest } from '../auth/apiClient';

export async function startPremiumCheckout(): Promise<void> {
  const body: CreateCheckoutRequest = {
    // Stripe will append ?session_id={CHECKOUT_SESSION_ID}; we use it as a
    // refresh cue on the landing page.
    successUrl: `${window.location.origin}?premium=success`,
    cancelUrl: `${window.location.origin}?premium=cancel`,
  };
  const response = await apiRequest<CreateCheckoutResponse>(
    '/api/checkout/premium',
    {
      method: 'POST',
      body,
    }
  );
  window.location.assign(response.url);
}
