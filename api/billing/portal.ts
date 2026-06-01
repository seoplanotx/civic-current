/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Billing Portal session so a subscriber can manage or cancel
 * their Mayor's Office subscription. Returns the hosted portal URL; the client
 * redirects the browser to it.
 *
 * Requires an authenticated user with an existing Stripe customer record. A
 * user who has never started a checkout has no customer id yet, so we return
 * 400 {code:'not_found'} — the UI only surfaces "Manage billing" to active
 * subscribers, who always have a customer.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest } from '../_lib/auth';
import { getStripe } from '../_lib/stripe';
import { getStripeCustomerId } from '../_lib/storage';

interface PortalRequest {
  /** Where Stripe should send the user after they leave the portal. */
  returnUrl?: string;
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
      .json({ error: 'Sign in required to manage billing', code: 'unauthenticated' });
    return;
  }

  const customerId = await getStripeCustomerId(user.userId);
  if (!customerId) {
    res.status(400).json({
      error: 'No billing account found for this user',
      code: 'not_found',
    });
    return;
  }

  const body = (req.body ?? {}) as Partial<PortalRequest>;
  // Header host is unavailable here; the client supplies its origin. Fall back
  // to a sane production default so the portal still works if it's omitted.
  const returnUrl = body.returnUrl ?? 'https://civiccurrent.app';

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  res.status(200).json({ url: session.url });
}
