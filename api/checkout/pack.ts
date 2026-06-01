/**
 * POST /api/checkout/pack
 *
 * Generic content-pack purchase endpoint. Takes a pack id in the request
 * body, validates against the catalog, resolves to a Stripe price env var,
 * and starts a Checkout session.
 *
 * The webhook handler in /api/webhook/stripe.ts sees the resulting event
 * with `sku: 'pack:<id>'` and grants ownership via setEntitlements.
 *
 * One endpoint serves every current and future pack — no per-pack route
 * needed. Adding a new pack only requires registering it in the catalog
 * and setting its STRIPE_PRICE_PACK_* env var.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  CreateCheckoutRequest,
  CreateCheckoutResponse,
} from '../../src/shared/api-types';
import { getCatalogEntry } from '../../src/content/catalog';
import { authenticateRequest } from '../_lib/auth';
import { getStripe } from '../_lib/stripe';
import {
  getStripeCustomerId,
  recordPendingCheckout,
  setStripeCustomerId,
} from '../_lib/storage';

interface PackCheckoutRequest extends CreateCheckoutRequest {
  packId: string;
}

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
      .json({ error: 'Sign in required to purchase', code: 'unauthenticated' });
    return;
  }

  const body = (req.body ?? {}) as Partial<PackCheckoutRequest>;
  if (!body.successUrl || !body.cancelUrl || !body.packId) {
    res.status(400).json({
      error: 'packId, successUrl, and cancelUrl are required',
      code: 'invalid_input',
    });
    return;
  }

  const entry = getCatalogEntry(body.packId);
  if (!entry) {
    res
      .status(404)
      .json({ error: `Unknown pack: ${body.packId}`, code: 'not_found' });
    return;
  }

  const priceId = process.env[entry.stripePriceEnv];
  if (!priceId) {
    res.status(500).json({
      error: `Server missing ${entry.stripePriceEnv} env var`,
      code: 'server_error',
    });
    return;
  }

  const stripe = getStripe();

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
    mode: 'payment',
    customer: customerId,
    client_reference_id: user.userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: body.successUrl,
    cancel_url: body.cancelUrl,
    metadata: {
      sku: `pack:${body.packId}`,
      packId: body.packId,
      clerkUserId: user.userId,
    },
    // Propagate metadata onto the PaymentIntent → Charge so the
    // charge.refunded webhook can resolve the user + sku and revoke pack
    // ownership. Session metadata alone does not reach the charge.
    payment_intent_data: {
      metadata: {
        sku: `pack:${body.packId}`,
        packId: body.packId,
        clerkUserId: user.userId,
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
