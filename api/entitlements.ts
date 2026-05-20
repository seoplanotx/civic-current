/**
 * GET /api/entitlements
 *
 * Returns the authenticated user's entitlements (premium unlock,
 * subscription status, owned pack ids). The client calls this once after
 * Clerk auth resolves and pushes the result into the entitlement service,
 * which fans the change out through every registry hook.
 *
 * Anonymous requests get the free-tier defaults. This is the *only*
 * source of truth for entitlements — never trust client claims.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { EntitlementsResponse } from '../src/shared/api-types';
import { authenticateRequest } from './_lib/auth';
import { getEntitlements } from './_lib/storage';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = await authenticateRequest(req);

  if (!user) {
    const anon: EntitlementsResponse = {
      hasPremium: false,
      hasSubscription: false,
      ownedPackIds: [],
      equippedCosmeticIds: [],
    };
    res.status(200).json(anon);
    return;
  }

  const stored = await getEntitlements(user.userId);
  const body: EntitlementsResponse = {
    hasPremium: stored.hasPremium,
    hasSubscription: stored.hasSubscription,
    ownedPackIds: stored.ownedPackIds,
    equippedCosmeticIds: [],
    email: user.email,
  };
  res.status(200).json(body);
}
