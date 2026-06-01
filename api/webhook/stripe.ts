/**
 * POST /api/webhook/stripe
 *
 * Stripe webhook receiver. Events we currently handle:
 *   - checkout.session.completed          → grant premium / pack / cosmetic / subscription
 *   - checkout.session.async_payment_succeeded → grant for delayed-payment methods
 *   - charge.refunded                     → revoke premium / pack / cosmetic
 *   - customer.subscription.updated       → sync Mayor's Office subscription status
 *   - customer.subscription.deleted       → mark Mayor's Office subscription canceled
 *   - invoice.payment_failed              → flag Mayor's Office subscription past_due
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

/**
 * Grant entitlements for a completed, PAID Checkout session. Shared by
 * `checkout.session.completed` and `checkout.session.async_payment_succeeded`
 * (delayed-notification payment methods complete the session before funds
 * clear, then fire the async event once paid).
 *
 * Idempotent: re-delivered events re-apply the same state without double-adding.
 */
async function grantForCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<void> {
  // Only grant once the payment has actually settled. For delayed-notification
  // methods, checkout.session.completed can fire with payment_status 'unpaid'
  // (the async_payment_succeeded event arrives later when funds clear).
  // Subscriptions report 'no_payment_required' / 'paid' on completion.
  if (
    session.payment_status !== 'paid' &&
    session.payment_status !== 'no_payment_required'
  ) {
    return;
  }

  const userId =
    session.client_reference_id ??
    (session.metadata?.clerkUserId as string | undefined);
  const sku = session.metadata?.sku;
  if (!userId || !sku) return;

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
  } else if (sku.startsWith('cosmetic:')) {
    const cosmeticId = sku.slice('cosmetic:'.length);
    const current = await getEntitlements(userId);
    if (!current.ownedCosmeticIds.includes(cosmeticId)) {
      await setEntitlements(userId, {
        ownedCosmeticIds: [...current.ownedCosmeticIds, cosmeticId],
      });
    }
  } else if (sku === 'mayors_office') {
    // Recurring Mayor's Office subscription started. Grant the perks and record
    // the subscription id so later lifecycle events can be correlated (and so
    // the customer portal can manage it).
    await setEntitlements(userId, {
      hasSubscription: true,
      subscriptionStatus: 'active',
      stripeSubscriptionId:
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id,
    });
  }
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
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        // Both events carry a Checkout.Session. grantForCheckoutSession gates on
        // payment_status so an 'unpaid' completed event (delayed-notification
        // methods) grants nothing until the async_payment_succeeded follow-up.
        await grantForCheckoutSession(
          event.data.object as Stripe.Checkout.Session
        );
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
        } else if (sku.startsWith('cosmetic:')) {
          const cosmeticId = sku.slice('cosmetic:'.length);
          const current = await getEntitlements(userId);
          await setEntitlements(userId, {
            ownedCosmeticIds: current.ownedCosmeticIds.filter(
              (id) => id !== cosmeticId
            ),
            // If the refunded theme was equipped, revert to the default look.
            // (Passing null clears; undefined would preserve.)
            equippedCosmeticId:
              current.equippedCosmeticId === cosmeticId
                ? null
                : current.equippedCosmeticId,
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        // Mayor's Office subscription lifecycle change (renewal, payment
        // recovery, scheduled cancellation, etc.). Map Stripe's status to our
        // coarse subscriptionStatus and keep hasSubscription in sync so perks
        // turn on/off automatically.
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.clerkUserId;
        if (!userId) break; // unattributed subscription — nothing to update

        // Stripe doesn't guarantee event ordering and retries for 3 days. If
        // the user has since started a DIFFERENT subscription, ignore stale
        // events for the old one so a late 'canceled' can't revoke the new,
        // active subscription.
        const updCurrent = await getEntitlements(userId);
        if (
          updCurrent.stripeSubscriptionId &&
          updCurrent.stripeSubscriptionId !== sub.id
        ) {
          break;
        }

        let subscriptionStatus: 'active' | 'past_due' | 'canceled' | undefined;
        let hasSubscription: boolean | undefined;
        switch (sub.status) {
          case 'active':
          case 'trialing':
            subscriptionStatus = 'active';
            hasSubscription = true;
            break;
          case 'past_due':
          case 'unpaid':
            subscriptionStatus = 'past_due';
            hasSubscription = false;
            break;
          case 'canceled':
          case 'incomplete_expired':
            subscriptionStatus = 'canceled';
            hasSubscription = false;
            break;
          default:
            // incomplete / paused / other transient states: leave entitlements
            // untouched and wait for a definitive event.
            break;
        }

        if (subscriptionStatus === undefined) break;
        await setEntitlements(userId, {
          hasSubscription,
          subscriptionStatus,
          stripeSubscriptionId: sub.id,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        // Subscription fully ended (canceled at period end, or hard-canceled).
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.clerkUserId;
        if (!userId) break;
        // Ignore a stale deletion for a subscription the user has already
        // replaced with a newer active one (out-of-order delivery).
        const delCurrent = await getEntitlements(userId);
        if (
          delCurrent.stripeSubscriptionId &&
          delCurrent.stripeSubscriptionId !== sub.id
        ) {
          break;
        }
        await setEntitlements(userId, {
          hasSubscription: false,
          subscriptionStatus: 'canceled',
        });
        break;
      }
      case 'invoice.payment_failed': {
        // A recurring charge failed. We flag past_due as an advisory but do NOT
        // strip hasSubscription here: Stripe keeps the subscription 'active'
        // during its retry/grace window, and `customer.subscription.updated`
        // (with the authoritative sub.status) is what flips perks off if the
        // subscription truly lapses — and back on if payment recovers. Hard-
        // revoking off a bare failure would leave a recovered subscriber
        // downgraded with no event to restore them.
        const invoice = event.data.object as Stripe.Invoice;
        const sub = (invoice as { subscription?: string | Stripe.Subscription })
          .subscription;
        let userId: string | undefined;
        let subId: string | undefined;
        if (sub && typeof sub !== 'string') {
          userId = sub.metadata?.clerkUserId;
          subId = sub.id;
        } else if (typeof sub === 'string') {
          subId = sub;
        }
        // When only the subscription id is present we can't resolve the user
        // from the invoice alone — break safely; customer.subscription.updated
        // carries past_due with full metadata as the backstop.
        if (!userId) break;
        // Ignore stale failures for a subscription the user has since replaced.
        const failCurrent = await getEntitlements(userId);
        if (
          subId &&
          failCurrent.stripeSubscriptionId &&
          failCurrent.stripeSubscriptionId !== subId
        ) {
          break;
        }
        await setEntitlements(userId, { subscriptionStatus: 'past_due' });
        break;
      }
      default:
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    // Returning 500 makes Stripe retry — preferable to silently dropping events.
    res.status(500).json({ error: (err as Error).message });
  }
}
