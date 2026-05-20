/**
 * POST /api/webhook/stripe
 *
 * Stripe webhook receiver. Only events we currently handle:
 *   - checkout.session.completed → grant premium unlock to the linked user
 *   - charge.refunded            → revoke premium unlock
 *
 * Stripe sends a `stripe-signature` header; we verify it against
 * STRIPE_WEBHOOK_SECRET before trusting any payload. Stripe retries
 * non-2xx responses for up to 3 days, so this handler MUST be idempotent.
 *
 * Vercel: raw body is required for signature verification, so the handler
 * disables JSON body parsing via the `config` export.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';
import { getStripe, getWebhookSecret } from '../_lib/stripe';
import { getEntitlements, setEntitlements } from '../_lib/storage';

export const config = {
  api: {
    bodyParser: false, // raw body required for Stripe signature verification
  },
};

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;
  try {
    const raw = await readRawBody(req);
    event = getStripe().webhooks.constructEvent(raw, signature, getWebhookSecret());
  } catch (err) {
    res
      .status(400)
      .json({ error: `Webhook signature verification failed: ${(err as Error).message}` });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.client_reference_id ??
          (session.metadata?.clerkUserId as string | undefined);
        const sku = session.metadata?.sku;
        if (!userId || !sku) break;

        if (sku === 'premium_unlock') {
          await setEntitlements(userId, { hasPremium: true });
        } else if (sku.startsWith('pack:')) {
          const packId = sku.slice('pack:'.length);
          const current = await getEntitlements(userId);
          if (!current.ownedPackIds.includes(packId)) {
            await setEntitlements(userId, {
              ownedPackIds: [...current.ownedPackIds, packId],
            });
          }
        }
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const userId = charge.metadata?.clerkUserId as string | undefined;
        const sku = charge.metadata?.sku;
        if (!userId || !sku) break;

        if (sku === 'premium_unlock') {
          await setEntitlements(userId, { hasPremium: false });
        } else if (sku.startsWith('pack:')) {
          const packId = sku.slice('pack:'.length);
          const current = await getEntitlements(userId);
          await setEntitlements(userId, {
            ownedPackIds: current.ownedPackIds.filter((id) => id !== packId),
          });
        }
        break;
      }
      // Phase 4 will add invoice.payment_succeeded / customer.subscription.deleted
      default:
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    // Returning 500 makes Stripe retry — preferable to silently dropping events.
    res.status(500).json({ error: (err as Error).message });
  }
}
