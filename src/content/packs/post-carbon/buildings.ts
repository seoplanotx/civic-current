/**
 * Post-Carbon Future — building definitions.
 *
 * Six buildings designed around a clean-energy / climate-resilience theme.
 * Tuned to be sidegrades to base-pack equivalents, not strict upgrades —
 * each has a tradeoff so it doesn't trivially obsolete the base game.
 *
 * Naming convention: every id is prefixed with `pc.` so it can never
 * collide with a base-pack id (or another pack's). The simulation engine
 * treats ids as opaque strings so this works transparently.
 */

import type { BuildingDef } from '../../../types';

export const POST_CARBON_BUILDINGS: Record<string, BuildingDef> = {
  // Massive grid-scale tidal — sidegrade to base tidalTurbine. Bigger
  // output but only on beach (same as base tidal — fights for the same
  // tiles, forcing a choice).
  'pc.tidal_array': {
    name: 'Tidal Array',
    cost: 850,
    maintenance: 35,
    powerSupply: 110,
    jobs: 18,
    pollution: 0,
    approval: 4,
    environment: 3,
    allowedTiles: ['beach'],
  },

  // Closed-loop geothermal — sidegrade to base marineGeothermal. Lower
  // raw output but works on more terrain and zero environmental impact.
  'pc.geothermal_loop': {
    name: 'Closed-Loop Geothermal',
    cost: 1100,
    maintenance: 45,
    powerSupply: 130,
    jobs: 22,
    pollution: 0,
    approval: 5,
    environment: 6,
    allowedTiles: ['hills', 'plain'],
  },

  // Direct Air Capture — does not produce power. Existence justified by
  // its strong pollution scrubbing + approval gain. Operating cost is real.
  'pc.dac_facility': {
    name: 'Direct Air Capture',
    cost: 1400,
    maintenance: 80,
    powerDemand: 60, // DAC is power-hungry — your grid had better be ready
    jobs: 30,
    pollution: -25, // negative pollution: cleans the air
    approval: 8,
    environment: 18,
    allowedTiles: ['plain', 'coal', 'gas'], // recovers former fossil land
  },

  // Small Modular Reactor — clean baseload alternative to coal. Expensive
  // to build but tiny footprint and zero emissions.
  'pc.smr_reactor': {
    name: 'Small Modular Reactor',
    cost: 1650,
    maintenance: 90,
    powerSupply: 280,
    jobs: 45,
    pollution: 0,
    approval: 2, // still nuclear — modest civic anxiety
    allowedTiles: ['plain', 'hills'],
  },

  // Vertical Farm — food + jobs without using farmland. Reduces approval
  // hit from urbanizing farmland tiles by providing alternative supply.
  'pc.vertical_farm': {
    name: 'Vertical Farm',
    cost: 700,
    maintenance: 28,
    powerDemand: 40,
    jobs: 60,
    income: 55,
    approval: 6,
    environment: 4,
    populationCapacity: 200,
    allowedTiles: ['plain', 'farmland'],
  },

  // Hydrogen Storage Hub — massive reliability buffer. Sidegrade to
  // battery/supercapacitor with much bigger bonus but higher upkeep.
  'pc.hydrogen_hub': {
    name: 'Hydrogen Storage Hub',
    cost: 1200,
    maintenance: 55,
    reliabilityBonus: 35,
    pollution: 0,
    approval: 3,
    allowedTiles: ['plain', 'coal', 'gas'],
  },
};
