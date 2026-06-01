/**
 * POST /api/cosmetics/equip — equip (or clear) a cosmetic theme.
 * GET  /api/cosmetics/equip — read the currently-equipped theme.
 *
 * Body for POST: { cosmeticId: string | null }. Passing `null` reverts to the
 * default look. Ownership is validated server-side by storage.setEquippedCosmetic
 * (a non-null id the user doesn't own is silently ignored), so the client can
 * never equip a theme it hasn't bought.
 *
 * Authenticated only — equipping is a per-user preference. Anonymous requests
 * (and KV-unconfigured environments) get a 401 / no-op so the app degrades
 * gracefully: the local-only build never reaches this endpoint because the
 * CosmeticShop's equip CTA is gated behind Clerk.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  EquipCosmeticRequest,
  EquipCosmeticResponse,
} from '../../src/shared/api-types';
import { authenticateRequest } from '../_lib/auth';
import { getEntitlements, setEquippedCosmetic } from '../_lib/storage';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = await authenticateRequest(req);
  if (!user) {
    res
      .status(401)
      .json({ error: 'Sign in required to equip themes', code: 'unauthenticated' });
    return;
  }

  if (req.method === 'GET') {
    const stored = await getEntitlements(user.userId);
    const body: EquipCosmeticResponse = {
      equippedCosmeticId: stored.equippedCosmeticId,
    };
    res.status(200).json(body);
    return;
  }

  // POST: validate the body shape. `cosmeticId` must be present and either a
  // string or explicit null (null = revert to default look).
  const raw = (req.body ?? {}) as Partial<EquipCosmeticRequest>;
  const cosmeticId = raw.cosmeticId;
  if (cosmeticId !== null && typeof cosmeticId !== 'string') {
    res.status(400).json({
      error: 'cosmeticId must be a string or null',
      code: 'invalid_input',
    });
    return;
  }

  // setEquippedCosmetic validates ownership and returns the resolved id.
  const resolved = await setEquippedCosmetic(user.userId, cosmeticId);
  const body: EquipCosmeticResponse = { equippedCosmeticId: resolved };
  res.status(200).json(body);
}
