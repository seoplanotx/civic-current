/**
 * Tomorrow's City — scenarios.
 *
 * Themed around the AI / autonomous-systems era. All scenarios assume the
 * pack is owned (which is enforced by entitlement filtering on the registry).
 */

import type { ScenarioDef } from '../../types';

export const TOMORROWS_SCENARIOS: ScenarioDef[] = [
  {
    id: 'tomorrow.singularity_sandbox',
    name: 'Singularity Sandbox',
    description:
      'The federal government picked your city as a test bed for "AI-native" municipal services. Build at least 2 AI datacenters and 1 quantum lab by turn 30 — without your grid collapsing.',
    difficulty: 4,
    initialState: {
      budget: 2500, // generous opening to fund the infrastructure
      taxRate: 12,
      politicalCapital: 6,
      population: 1200,
      populationCapacity: 1500,
      approval: 60,
    },
    seed: 2042,
    victoryConditions: [
      {
        id: 'tomorrow.singularity_sandbox.compute_milestone',
        label: '≥2 AI datacenters + 1 quantum lab by turn 30, reliability ≥ 70',
        check: (state) => {
          if (state.turn < 30) return false;
          const dc = state.tiles.filter(
            (t) => t.building === 'tomorrow.ai_datacenter'
          ).length;
          const ql = state.tiles.filter(
            (t) => t.building === 'tomorrow.quantum_lab'
          ).length;
          return dc >= 2 && ql >= 1 && state.reliability >= 70;
        },
      },
    ],
  },

  {
    id: 'tomorrow.skys_the_limit',
    name: "Sky's the Limit",
    description:
      'Your entire transit strategy bets on eVTOLs. Build 4+ vertiports and replace ground roads with autonomous vehicle hubs. Hit 90% approval by turn 40 to prove the model.',
    difficulty: 3,
    initialState: {
      budget: 2000,
      taxRate: 11,
      politicalCapital: 5,
      population: 1100,
      populationCapacity: 1400,
      approval: 55,
    },
    seed: 2055,
    victoryConditions: [
      {
        id: 'tomorrow.skys_the_limit.air_first',
        label: '≥4 vertiports + ≥2 AV hubs + approval ≥ 90 by turn 40',
        check: (state) => {
          if (state.turn < 40) return false;
          const vp = state.tiles.filter(
            (t) => t.building === 'tomorrow.vertiport'
          ).length;
          const av = state.tiles.filter(
            (t) => t.building === 'tomorrow.av_hub'
          ).length;
          return vp >= 4 && av >= 2 && state.approval >= 90;
        },
      },
    ],
  },

  {
    id: 'tomorrow.first_smart_city_charter',
    name: 'First Smart City Charter',
    description:
      'Your city is the trial site for a national "Smart City" charter. Every building constructed during the term must be from Tomorrow\'s City. Survive the full 50 turns.',
    difficulty: 5,
    initialState: {
      budget: 3000,
      taxRate: 10,
      politicalCapital: 8,
      population: 1300,
      populationCapacity: 1800,
      approval: 65,
    },
    seed: 2099,
    victoryConditions: [
      {
        id: 'tomorrow.first_smart_city_charter.survived',
        label: 'Survived 50 turns with approval ≥ 50',
        check: (state) => state.turn >= 50 && state.approval >= 50,
      },
    ],
  },
];
