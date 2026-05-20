/**
 * GET  /api/cloud-save        → list this user's cloud-saved cities
 * POST /api/cloud-save        → create a new slot (subject to slot limit)
 *
 * Per-slot read/write/delete lives in /api/cloud-save/[slot].ts.
 *
 * Slot limits depend on entitlements:
 *   free          → 1 slot
 *   premium       → 3 slots
 *   subscription  → 5 slots
 *
 * The limit is enforced server-side; the client may show the limit in UI but
 * cannot bypass it by writing directly to KV — the API is the only writer.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  CloudSaveListResponse,
  CloudSavePutRequest,
  CloudSaveSlot,
} from '../../src/shared/api-types';
import { computeMaxSlots } from '../../src/shared/api-types';
import { authenticateRequest } from '../_lib/auth';
import { getEntitlements, listSlots, upsertSlot } from '../_lib/storage';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const user = await authenticateRequest(req);
  if (!user) {
    res
      .status(401)
      .json({ error: 'Sign in to use cloud save', code: 'unauthenticated' });
    return;
  }

  const ent = await getEntitlements(user.userId);
  const maxSlots = computeMaxSlots(ent.hasPremium, ent.hasSubscription);

  if (req.method === 'GET') {
    const slots = await listSlots(user.userId);
    const body: CloudSaveListResponse = { slots, maxSlots };
    res.status(200).json(body);
    return;
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as Partial<CloudSavePutRequest> & {
      cityName?: string;
    };
    if (!body.cityName || typeof body.cityName !== 'string') {
      res
        .status(400)
        .json({ error: 'cityName is required', code: 'invalid_input' });
      return;
    }

    const existing = await listSlots(user.userId);
    if (existing.length >= maxSlots) {
      res.status(403).json({
        error: `Slot limit reached (${maxSlots}). Upgrade to add more cities.`,
        code: 'slot_limit_exceeded',
      });
      return;
    }

    // Slot ids are sequential and stable per user.
    const usedIds = new Set(existing.map((s) => s.id));
    let slotIndex = 1;
    while (usedIds.has(`slot-${slotIndex}`)) slotIndex++;
    const slotId = `slot-${slotIndex}`;

    const slot: CloudSaveSlot = {
      id: slotId,
      cityName: body.cityName,
      state: body.state ?? null,
      updatedAt: new Date().toISOString(),
      turn: body.turn,
      legacy: body.legacy,
    };
    await upsertSlot(user.userId, slot);
    res.status(201).json(slot);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
