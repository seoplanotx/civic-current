/**
 * THROWBACK_ERA_PACK — assembled content pack export.
 *
 * Entitlement: requires the 'throwback-era' pack to be owned by the user.
 * The catalog entry (src/content/catalog.ts) handles purchase and the webhook
 * adds the pack id to the user's ownedPackIds, after which the registry
 * automatically exposes this pack's content.
 */

import type { ContentPack } from '../../types';
import { CONTENT_ENGINE_VERSION } from '../../types';
import { THROWBACK_BUILDINGS } from './buildings';
import { THROWBACK_MESHES } from './meshes';
import { THROWBACK_EVENTS } from './events';
import { THROWBACK_SCENARIOS } from './scenarios';

export const THROWBACK_ERA_PACK: ContentPack = {
  manifest: {
    id: 'throwback-era',
    name: 'Throwback Era',
    description:
      'Mayor in the analog age. Drive-in diners, strip malls, suburban tract housing, auto plants, dial-up ISPs, and gas mega-plexes. Cheaper builds, bigger footprints, dirtier output.',
    version: '1.0.0',
    author: 'Civic Current',
    engineMinVersion: CONTENT_ENGINE_VERSION,
    entitlement: { kind: 'pack', packId: 'throwback-era' },
  },
  buildings: THROWBACK_BUILDINGS,
  buildingMeshes: THROWBACK_MESHES,
  events: THROWBACK_EVENTS,
  scenarios: THROWBACK_SCENARIOS,
};
