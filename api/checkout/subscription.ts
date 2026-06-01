/**
 * POST /api/checkout/subscription
 *
 * Starts a Stripe Checkout session for the recurring "Mayor's Office"
 * subscription. Returns the hosted Checkout URL; the client redirects the
 * browser to it.
 *
 * The session is created in `subscription` mode — Mayor's Office is a
 * recurring $4.99/mo charge that grants premium-tier perks (5 city slots,
 * every terrain theme, founder badge) while active.
 *
 * Idempotency note: starting two concurrent checkouts is harmless. The webhook
 * handler is the only place that grants entitlements, and it looks up
 * `client_reference_id` (the Clerk user id). We also stamp the underlying
 * Subscription object with `metadata.clerkUserId` via `subscription_data` so
 * later lifecycle events (customer.subscription.updated/deleted,
 * invoice.payment_failed) can resolve the owning user.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  CreateCheckoutRequest,
  CreateCheckoutResponse,
} from '../../src/shared/api-types';
import { authenticateRequest } from '../_lib/auth';
import { getStripe } from '../_lib/stripe';
import {
  getStripeCustomerId,
  recordPendingCheckout,
  setStripeCustomerId,
} from '../_lib/storage';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = await authenticateRequest(req);
  if (!user) {
    res
      .status(401)
      .json({ error: 'Sign in required to subscribe', code: 'unauthenticated' });
    return;
  }

  const body = (req.body ?? {}) as Partial<CreateCheckoutRequest>;
  if (!body.successUrl || !body.cancelUrl) {
    res.status(400).json({
      error: 'successUrl and cancelUrl are required',
      code: 'invalid_input',
    });
    return;
  }

  const priceId = process.env.STRIPE_PRICE_MAYORS_OFFICE;
  if (!priceId) {
    res.status(500).json({
      error: 'Server missing STRIPE_PRICE_MAYORS_OFFICE env var',
      code: 'server_error',
    });
    return;
  }

  const stripe = getStripe();

  // Reuse or create a Stripe customer for this user so subscriptions, receipts,
  // and the billing portal stay grouped under one customer record.
  let customerId = await getStripeCustomerId(user.userId);
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { clerkUserId: user.userId },
    });
    customerId = customer.id;
    await setStripeCustomerId(user.userId, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.userId, // critical: links webhook event back to user
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: body.successUrl,
    cancel_url: body.cancelUrl,
    metadata: {
      sku: 'mayors_office',
      clerkUserId: user.userId,
    },
    // Stamp the created Subscription object so its lifecycle webhooks
    // (customer.subscription.updated/deleted, invoice.payment_failed) can
    // resolve the owning user from `subscription.metadata.clerkUserId`. Session
    // metadata does NOT propagate to the Subscription on its own.
    subscription_data: {
      metadata: {
        clerkUserId: user.userId,
        sku: 'mayors_office',
      },
    },
  });

  if (!session.url) {
    res
      .status(500)
      .json({ error: 'Stripe returned no checkout URL', code: 'server_error' });
    return;
  }

  await recordPendingCheckout(session.id, user.userId);

  const response: CreateCheckoutResponse = {
    url: session.url,
    sessionId: session.id,
  };
  res.status(200).json(response);
}
