/**
 * Tomorrow's City — building definitions.
 *
 * Design pillars (opposite of Throwback Era):
 *   - Expensive up-front, expensive to maintain
 *   - Huge income & high-skill jobs per footprint
 *   - Massive power demand (AI/compute-heavy) — players need clean baseload
 *   - Zero direct pollution; some buildings actively reduce it
 *   - Approval bonuses for prestige
 *   - Often require already having other paid pack buildings or base
 *     advanced power (fusion / hydro) to support the load
 */

import type { BuildingDef } from '../../../types';

export const TOMORROWS_BUILDINGS: Record<string, BuildingDef> = {
  'tomorrow.vertiport': {
    name: 'eVTOL Vertiport',
    cost: 1200,
    maintenance: 60,
    income: 220, // premium air-taxi revenue
    jobs: 70,
    powerDemand: 95,
    approval: 8, // visible prestige object
    allowedTiles: ['plain', 'hills'],
  },

  'tomorrow.ai_datacenter': {
    name: 'AI Datacenter Cluster',
    cost: 1500,
    maintenance: 85,
    income: 340, // massive — sells inference capacity
    jobs: 90,
    powerDemand: 220, // hungriest building in the game
    approval: 3,
    allowedTiles: ['plain', 'hills'],
  },

  'tomorrow.av_hub': {
    name: 'Autonomous Vehicle Hub',
    cost: 900,
    maintenance: 45,
    income: 140,
    jobs: 50,
    powerDemand: 55,
    pollution: -2, // replaces gas cars, slightly cleans air
    approval: 6,
    allowedTiles: ['plain'],
  },

  'tomorrow.vertical_farm': {
    name: 'Vertical Farm Tower',
    cost: 750,
    maintenance: 35,
    income: 110,
    jobs: 40,
    powerDemand: 60,
    populationCapacity: 200, // mixed-use: housing + farm
    environment: 8,
    approval: 5,
    allowedTiles: ['plain', 'farmland'],
  },

  'tomorrow.quantum_lab': {
    name: 'Quantum Compute Lab',
    cost: 1800,
    maintenance: 100,
    income: 380, // sells compute time to the planet
    jobs: 35, // small but elite
    powerDemand: 130,
    approval: 10, // city-of-the-future signaling
    allowedTiles: ['plain', 'hills'],
  },

  'tomorrow.drone_depot': {
    name: 'Drone Delivery Depot',
    cost: 600,
    maintenance: 28,
    income: 160,
    jobs: 25, // mostly automated
    powerDemand: 40,
    pollution: -1,
    approval: 3,
    allowedTiles: ['plain'],
  },
};
