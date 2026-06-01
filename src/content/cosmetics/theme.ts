/**
 * Active cosmetic theme resolver — the single source of truth for "what
 * terrain re-coloring is currently in effect".
 *
 * Reads the live EntitlementService snapshot and decides which catalog theme
 * (if any) should re-color the board. A theme applies when it is equipped AND
 * the user is entitled to it — either because they own it outright, or because
 * they hold a subscription (subscribers get every cosmetic, matching how the
 * subscription tier unlocks all content elsewhere).
 *
 * Returns an empty map when nothing is equipped or the equipped theme isn't
 * entitled, which the registry and 3D layer interpret as "use the default
 * terrain colors". Keyed by terrain id (string) to match the registry's
 * terrain map shape.
 */

import type { TerrainType } from '../../types';
import { entitlementService } from '../entitlements';
import { getCosmeticCatalogEntry } from './catalog';

export function getActiveTerrainColors(): Partial<Record<string, string>> {
  const ent = entitlementService.current;
  const equipped = ent.equippedCosmeticId;
  if (!equipped) return {};

  // Subscribers get every cosmetic; otherwise the user must own this one.
  const entitled = ent.hasSubscription || ent.ownedCosmeticIds.has(equipped);
  if (!entitled) return {};

  const entry = getCosmeticCatalogEntry(equipped);
  if (!entry) return {};

  return entry.terrainColors as Partial<Record<TerrainType, string>>;
}
