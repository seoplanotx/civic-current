/**
 * GET    /api/cloud-save/:slot  → load a single saved city
 * PUT    /api/cloud-save/:slot  → overwrite the saved state for one slot
 * DELETE /api/cloud-save/:slot  → remove a saved city
 *
 * Slot ids are server-issued — clients can only write to slots returned by
 * POST /api/cloud-save (or this PUT handler when re-saving an existing one).
 * Free users overwriting their single slot is the common case.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  CloudSavePutRequest,
  CloudSaveSlot,
} from '../../src/shared/api-types';
import { authenticateRequest } from '../_lib/auth';
import { deleteSlot, getSlot, upsertSlot } from '../_lib/storage';

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

  const slotId = req.query.slot;
  if (!slotId || typeof slotId !== 'string') {
    res.status(400).json({ error: 'Slot id required', code: 'invalid_input' });
    return;
  }

  if (req.method === 'GET') {
    const slot = await getSlot(user.userId, slotId);
    if (!slot) {
      res.status(404).json({ error: 'Slot not found', code: 'not_found' });
      return;
    }
    res.status(200).json(slot);
    return;
  }

  if (req.method === 'PUT') {
    const body = (req.body ?? {}) as Partial<CloudSavePutRequest>;
    if (!body.cityName) {
      res
        .status(400)
        .json({ error: 'cityName is required', code: 'invalid_input' });
      return;
    }
    const existing = await getSlot(user.userId, slotId);
    if (!existing) {
      res
        .status(404)
        .json({ error: 'Slot not found — create it via POST first', code: 'not_found' });
      return;
    }
    const slot: CloudSaveSlot = {
      id: slotId,
      cityName: body.cityName,
      state: body.state ?? null,
      updatedAt: new Date().toISOString(),
      turn: body.turn,
      legacy: body.legacy,
    };
    await upsertSlot(user.userId, slot);
    res.status(200).json(slot);
    return;
  }

  if (req.method === 'DELETE') {
    await deleteSlot(user.userId, slotId);
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
