/**
 * Throwback Era — building definitions.
 *
 * Design pillars:
 *   - Cheaper than base buildings (lower up-front cost, lower maintenance)
 *   - Bigger jobs & income at low end of population curve
 *   - Pay the cost in pollution, power inefficiency, and approval friction
 *   - Buildable on plentiful terrain (plains, farmland) — these are
 *     low-tech buildings that don't need exotic land
 *
 * Pack ids are namespaced with `throwback.` to avoid collisions.
 */

import type { BuildingDef } from '../../../types';

export const THROWBACK_BUILDINGS: Record<string, BuildingDef> = {
  'throwback.drive_in_diner': {
    name: 'Drive-In Diner',
    cost: 220,
    maintenance: 12,
    income: 40,
    jobs: 35,
    powerDemand: 10,
    approval: 6, // nostalgic favorite
    allowedTiles: ['plain', 'farmland'],
  },

  'throwback.strip_mall': {
    name: 'Strip Mall',
    cost: 320,
    maintenance: 18,
    income: 75,
    jobs: 90,
    powerDemand: 30,
    approval: 2,
    allowedTiles: ['plain'],
  },

  'throwback.auto_plant': {
    name: 'Auto Manufacturing Plant',
    cost: 480,
    maintenance: 32,
    income: 140,
    jobs: 180, // big employer
    powerDemand: 85,
    pollution: 22,
    approval: -3,
    allowedTiles: ['plain', 'coal'],
  },

  'throwback.tract_housing': {
    name: 'Suburban Tract Housing',
    cost: 240, // cheaper than base 'housing'
    maintenance: 9,
    populationCapacity: 650, // bigger than base 'housing'
    powerDemand: 35, // but inefficient — eats more power per capacity
    approval: 1,
    allowedTiles: ['plain', 'farmland'],
  },

  'throwback.dial_up_isp': {
    name: 'Dial-Up ISP',
    cost: 280,
    maintenance: 14,
    income: 55,
    jobs: 30,
    powerDemand: 18,
    approval: 1,
    allowedTiles: ['plain'],
  },

  'throwback.gas_megaplex': {
    name: 'Gas Mega-Plex',
    cost: 260,
    maintenance: 14,
    income: 65,
    jobs: 25,
    powerDemand: 12,
    pollution: 8,
    approval: 0,
    allowedTiles: ['plain', 'gas'],
    terrainBonus: {
      // bigger margins when sited directly on natural gas reserves
      gas: 15,
    },
  },
};
