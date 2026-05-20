/**
 * TOMORROWS_CITY_PACK — assembled content pack export.
 *
 * Entitlement: requires the 'tomorrows-city' pack to be owned. The catalog
 * entry handles purchase; the webhook flips ownership on payment.
 */

import type { ContentPack } from '../../types';
import { CONTENT_ENGINE_VERSION } from '../../types';
import { TOMORROWS_BUILDINGS } from './buildings';
import { TOMORROWS_MESHES } from './meshes';
import { TOMORROWS_EVENTS } from './events';
import { TOMORROWS_SCENARIOS } from './scenarios';

export const TOMORROWS_CITY_PACK: ContentPack = {
  manifest: {
    id: 'tomorrows-city',
    name: "Tomorrow's City",
    description:
      'Mayor in the AI age. eVTOLs, AI datacenters, autonomous vehicle hubs, vertical farms, quantum compute labs, and drone depots. Expensive and power-hungry — but compact, clean, and high-yield.',
    version: '1.0.0',
    author: 'Civic Current',
    engineMinVersion: CONTENT_ENGINE_VERSION,
    entitlement: { kind: 'pack', packId: 'tomorrows-city' },
  },
  buildings: TOMORROWS_BUILDINGS,
  buildingMeshes: TOMORROWS_MESHES,
  events: TOMORROWS_EVENTS,
  scenarios: TOMORROWS_SCENARIOS,
};
