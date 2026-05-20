/**
 * BASE_PACK — the free, always-loaded content pack that powers the core game.
 *
 * Everything that exists in Civic Current today lives here: the 9 terrain
 * types, the 20 buildings, the 13 event cards, the procedural mesh factories,
 * and a single "Standard Term" scenario that mirrors today's 50-turn game.
 *
 * Future content (Post-Carbon Future, scenario packs, cosmetics) live as
 * sibling packs under `src/content/packs/<pack-id>/` and add the manifest
 * `entitlement: { kind: 'pack', packId: '<pack-id>' }` so they only load for
 * users who have purchased them.
 */

import type { ContentPack, ScenarioDef } from '../../types';
import { CONTENT_ENGINE_VERSION } from '../../types';
import { BUILDINGS } from '../../../config/buildings';
import { TERRAINS } from '../../../config/terrain';
import { EVENTS } from '../../../config/events';
import { createBuildingMesh } from '../../../three/BuildingModels';
import type { BuildingType } from '../../../types';

/* ──────────────────────────────────────────────────────────────────────────
 *  Mesh factory map
 * ──────────────────────────────────────────────────────────────────────────
 *  The procedural mesh code in `three/BuildingModels.ts` already covers every
 *  base-pack building, so we wrap its switch statement with one factory per
 *  building id. Future packs ship their own factories the same way.
 */
const baseMeshes: Record<string, () => ReturnType<typeof createBuildingMesh>> =
  Object.keys(BUILDINGS).reduce(
    (acc, id) => {
      acc[id] = () => createBuildingMesh(id as BuildingType);
      return acc;
    },
    {} as Record<string, () => ReturnType<typeof createBuildingMesh>>
  );

/* ──────────────────────────────────────────────────────────────────────────
 *  Default scenario
 * ──────────────────────────────────────────────────────────────────────────
 *  Mirrors the current 50-turn game exactly. When Phase 2 ships paid
 *  scenarios, the engine will read this list from the registry instead of
 *  hardcoding starting conditions in useGameStore.
 */
const standardTerm: ScenarioDef = {
  id: 'base.standard_term',
  name: 'Standard Term',
  description:
    'A 50-turn term as mayor of a small town. Manage the grid, balance the budget, and leave a legacy.',
  difficulty: 2,
  initialState: {
    turn: 1,
    maxTurns: 50,
    budget: 1500,
    income: 180,
    expenses: 100,
    taxRate: 10,
    politicalCapital: 5,
    population: 800,
    populationCapacity: 1000,
    jobs: 500,
    powerSupply: 0,
    powerDemand: 80,
    reliability: 100,
    pollution: 10,
    environment: 80,
    approval: 65,
  },
};

/* ──────────────────────────────────────────────────────────────────────────
 *  Manifest + assembled pack
 * ──────────────────────────────────────────────────────────────────────────
 */
export const BASE_PACK: ContentPack = {
  manifest: {
    id: 'base',
    name: 'Civic Current — Base Game',
    description:
      'The free, always-loaded foundation: every terrain, building, and event card the core game ships with.',
    version: '1.0.0',
    author: 'Civic Current',
    engineMinVersion: CONTENT_ENGINE_VERSION,
    entitlement: { kind: 'free' },
  },
  terrains: TERRAINS,
  buildings: BUILDINGS,
  buildingMeshes: baseMeshes,
  events: EVENTS,
  scenarios: [standardTerm],
};
