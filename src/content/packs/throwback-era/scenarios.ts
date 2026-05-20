/**
 * Throwback Era — scenarios.
 *
 * Each scenario tweaks the starting GameState to emphasize a different
 * playstyle. Victory conditions and failure conditions hang off the
 * standard simulation engine via the ContentPack VictoryCondition /
 * FailureCondition hooks (Phase 4+ will wire scoring/UI for them).
 */

import type { ScenarioDef } from '../../types';

export const THROWBACK_SCENARIOS: ScenarioDef[] = [
  {
    id: 'throwback.class_of_92',
    name: 'Class of \'92',
    description:
      'It\'s 1992 and you\'ve been elected mayor on a populist platform. The city has a roaring auto plant economy and zero internet infrastructure. Keep approval above 50 for the full 50 turns.',
    difficulty: 2,
    initialState: {
      budget: 1800, // a little more breathing room — period economy is fragile
      taxRate: 8,
      politicalCapital: 5,
      population: 950,
      populationCapacity: 1200,
      approval: 60,
    },
    seed: 1992,
    victoryConditions: [
      {
        id: 'throwback.class_of_92.approval_streak',
        label: 'Approval stayed above 50 every turn',
        check: (state) => state.approval >= 50,
      },
    ],
  },

  {
    id: 'throwback.mall_rats',
    name: 'Mall Rats',
    description:
      'Your city\'s economy depends entirely on retail. Maximize income from strip malls and drive-in diners — but at least one auto plant must operate by turn 25 to absorb factory workers from the next town over.',
    difficulty: 3,
    initialState: {
      budget: 1400,
      taxRate: 10,
      politicalCapital: 4,
      population: 700,
      populationCapacity: 1000,
      approval: 55,
    },
    seed: 1985,
    victoryConditions: [
      {
        id: 'throwback.mall_rats.retail_revenue',
        label: 'At least 3 retail buildings active and 1 auto plant by turn 25',
        check: (state) => {
          const retail = state.tiles.filter(
            (t) =>
              t.building === 'throwback.strip_mall' ||
              t.building === 'throwback.drive_in_diner'
          ).length;
          const auto = state.tiles.some(
            (t) => t.building === 'throwback.auto_plant'
          );
          return retail >= 3 && auto;
        },
      },
    ],
  },

  {
    id: 'throwback.rust_belt_revival',
    name: 'Rust Belt Revival',
    description:
      'You\'ve inherited a declining industrial town. Population is leaving. The grid is held together by string. Get back to 1500 people with at least 80% reliability by turn 40.',
    difficulty: 4,
    initialState: {
      budget: 900,
      taxRate: 12,
      politicalCapital: 3,
      population: 650,
      populationCapacity: 900,
      reliability: 70,
      approval: 45,
    },
    seed: 1977,
    victoryConditions: [
      {
        id: 'throwback.rust_belt_revival.revival',
        label: 'Population ≥ 1500 and reliability ≥ 80 by turn 40',
        check: (state) =>
          state.turn >= 40 && state.population >= 1500 && state.reliability >= 80,
      },
    ],
  },
];
