/**
 * Stripe client + helpers shared by the checkout and webhook handlers.
 */

import Stripe from 'stripe';

let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Configure it in your Vercel project env vars.'
    );
  }
  // Pin to a known API version so a Stripe update doesn't silently break
  // webhooks. We use the SDK's default by omitting `apiVersion` here; the
  // active version is logged by Stripe on each request.
  cachedStripe = new Stripe(secretKey);
  return cachedStripe;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set.');
  }
  return secret;
}
