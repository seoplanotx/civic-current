/**
 * Client helper that starts a Stripe Checkout flow for any catalog cosmetic
 * theme.
 *
 * Mirrors packCheckout.ts. Adding a new theme means: register it in
 * `content/cosmetics/catalog.ts`, set its Stripe price env var, and you're done
 * — this helper doesn't change. On success/cancel Stripe redirects back to
 * `?cosmetic=<id>&result=success|cancel`, which App.tsx turns into a toast.
 */

import type {
  CreateCheckoutRequest,
  CreateCheckoutResponse,
} from '../shared/api-types';
import { apiRequest } from '../auth/apiClient';

interface CosmeticCheckoutBody extends CreateCheckoutRequest {
  cosmeticId: string;
}

export async function startCosmeticCheckout(cosmeticId: string): Promise<void> {
  const body: CosmeticCheckoutBody = {
    cosmeticId,
    successUrl: `${window.location.origin}?cosmetic=${encodeURIComponent(cosmeticId)}&result=success`,
    cancelUrl: `${window.location.origin}?cosmetic=${encodeURIComponent(cosmeticId)}&result=cancel`,
  };
  const response = await apiRequest<CreateCheckoutResponse>(
    '/api/checkout/cosmetic',
    {
      method: 'POST',
      body,
    }
  );
  window.location.assign(response.url);
}
