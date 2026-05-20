/**
 * Client helper that starts a Stripe Checkout flow for any catalog pack.
 *
 * Adding a new pack means: register it in `content/catalog.ts`, set its
 * Stripe price env var, and you're done — this helper doesn't change.
 */

import type {
  CreateCheckoutRequest,
  CreateCheckoutResponse,
} from '../shared/api-types';
import { apiRequest } from '../auth/apiClient';

interface PackCheckoutBody extends CreateCheckoutRequest {
  packId: string;
}

export async function startPackCheckout(packId: string): Promise<void> {
  const body: PackCheckoutBody = {
    packId,
    successUrl: `${window.location.origin}?pack=${encodeURIComponent(packId)}&result=success`,
    cancelUrl: `${window.location.origin}?pack=${encodeURIComponent(packId)}&result=cancel`,
  };
  const response = await apiRequest<CreateCheckoutResponse>(
    '/api/checkout/pack',
    {
      method: 'POST',
      body,
    }
  );
  window.location.assign(response.url);
}
