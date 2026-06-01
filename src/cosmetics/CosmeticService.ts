/**
 * CosmeticService — client-side equip/unequip orchestration.
 *
 * Calls POST /api/cosmetics/equip to persist the choice server-side (which
 * validates ownership), then optimistically patches the in-memory
 * EntitlementService so the registry + 3D board re-theme immediately without
 * waiting for a round-trip refresh. The server response is authoritative: if
 * the server rejects an unowned equip it returns the unchanged id, and we
 * re-sync to that so the optimistic update can't drift out of truth.
 *
 * Degrades gracefully: when the endpoint is unreachable (no auth / KV), the
 * call rejects and the caller surfaces an error; nothing is persisted.
 */

import type { EquipCosmeticResponse } from '../shared/api-types';
import { apiRequest } from '../auth/apiClient';
import { entitlementService } from '../content/entitlements';

class CosmeticServiceImpl {
  /**
   * Equip a cosmetic theme by id, or pass `null` to revert to the default look.
   * Optimistically updates the entitlement service, then reconciles with the
   * server's authoritative resolved id.
   */
  async equip(cosmeticId: string | null): Promise<string | null> {
    // Optimistic: re-theme the board instantly.
    entitlementService.patch({ equippedCosmeticId: cosmeticId });

    const res = await apiRequest<EquipCosmeticResponse>(
      '/api/cosmetics/equip',
      {
        method: 'POST',
        body: { cosmeticId },
      }
    );

    // Reconcile with the server's resolved value (e.g. an unowned equip is
    // rejected server-side and the prior id comes back unchanged).
    if (res.equippedCosmeticId !== cosmeticId) {
      entitlementService.patch({ equippedCosmeticId: res.equippedCosmeticId });
    }
    return res.equippedCosmeticId;
  }
}

/** Process-wide singleton, mirroring the other client service singletons. */
export const cosmeticService = new CosmeticServiceImpl();
