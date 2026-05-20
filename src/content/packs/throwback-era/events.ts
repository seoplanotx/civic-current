/**
 * Throwback Era — event deck.
 *
 * 12 events themed around late-20th-century life. Each event's `condition`
 * gates when it can fire, keeping the deck in flavor (e.g. dial-up events
 * only fire if the player has built a dial-up ISP).
 */

import type { GameEvent } from '../../../types';

export const THROWBACK_EVENTS: GameEvent[] = [
  {
    id: 'throwback.y2k_panic',
    title: 'Y2K Panic',
    description:
      'IT consultants insist every system in town will brick when the calendar flips. The cable news anchors agree.',
    condition: (state) => state.turn > 8 && state.budget > 200,
    weight: 12,
    choices: [
      {
        label: 'Spend on emergency IT audits (-$300, +5 Approval, +10% Reliability)',
        effects: { budget: -300, approval: 5, reliability: 10 },
      },
      {
        label: 'Issue a calm-down statement (+2 PC, -3 Approval)',
        effects: { politicalCapital: 2, approval: -3 },
      },
      {
        label: 'Ignore it entirely (-8 Reliability if the prophets were right)',
        effects: { reliability: -8 },
      },
    ],
  },

  {
    id: 'throwback.mall_walking_craze',
    title: 'Mall Walking Craze',
    description:
      'Retirees colonize the strip mall before opening hours. Shop owners complain. Doctors approve.',
    condition: (state) =>
      state.tiles.some((t) => t.building === 'throwback.strip_mall'),
    weight: 10,
    choices: [
      {
        label: 'Officially endorse mall walking (+6 Approval, +$50)',
        effects: { approval: 6, budget: 50 },
      },
      {
        label: 'Charge a "walker pass" fee (+$200, -8 Approval)',
        effects: { budget: 200, approval: -8 },
      },
    ],
  },

  {
    id: 'throwback.dot_com_bubble',
    title: 'Dot-Com Bubble',
    description:
      'Three local kids just IPO\'d a pet supply website with no revenue. The mayor is asked for comment.',
    condition: (state) =>
      state.tiles.some((t) => t.building === 'throwback.dial_up_isp') &&
      state.turn > 12,
    weight: 11,
    choices: [
      {
        label: 'Issue municipal tech bonds (+$400, +3 PC if it crashes -10 Approval later)',
        effects: { budget: 400, politicalCapital: 3 },
      },
      {
        label: 'Warn against speculation publicly (-1 PC, +5 Approval)',
        effects: { politicalCapital: -1, approval: 5 },
      },
      {
        label: 'Stay neutral (no effects)',
        effects: {},
      },
    ],
  },

  {
    id: 'throwback.oil_crisis',
    title: 'OPEC Embargo',
    description:
      'Pump prices double overnight. Lines stretch around the gas mega-plex. The mayor\'s motorcade is mocked on talk radio.',
    condition: (state) =>
      state.tiles.some((t) => t.building === 'throwback.gas_megaplex') &&
      state.turn > 6,
    weight: 12,
    choices: [
      {
        label: 'Subsidize fuel for residents (-$350, +8 Approval)',
        effects: { budget: -350, approval: 8 },
      },
      {
        label: 'Mandate carpool Wednesdays (-10MW Demand, -4 Approval)',
        effects: { powerDemandModifier: -10, approval: -4 },
      },
      {
        label: 'Let the market sort it out (-12 Approval, +$120 from price markup taxes)',
        effects: { approval: -12, budget: 120 },
      },
    ],
  },

  {
    id: 'throwback.mtv_generation',
    title: 'MTV Generation',
    description:
      'A music network wants to shoot a "behind the scenes" feature in your city. The teens are losing their minds.',
    condition: (state) => state.population > 1500,
    weight: 9,
    choices: [
      {
        label: 'Host the production (+$250, +9 Approval, +3 Pollution from crew)',
        effects: { budget: 250, approval: 9, pollution: 3 },
      },
      {
        label: 'Demand a curfew clause (-2 PC, +4 Approval, +$100)',
        effects: { politicalCapital: -2, approval: 4, budget: 100 },
      },
      {
        label: 'Decline politely (-5 Approval from disappointed teens)',
        effects: { approval: -5 },
      },
    ],
  },

  {
    id: 'throwback.suburban_sprawl_vote',
    title: 'Suburban Sprawl Vote',
    description:
      'A ballot initiative would open three farmland districts to tract housing development.',
    condition: (state) =>
      state.tiles.some((t) => t.terrainType === 'farmland') &&
      state.population > 1000,
    weight: 11,
    choices: [
      {
        label: 'Endorse sprawl (+150 Population capacity rhetorically, +$200 from developers, -5 Environment)',
        effects: { budget: 200, environment: -5 },
      },
      {
        label: 'Protect the farmland (+8 Environment, -4 Approval from builders)',
        effects: { environment: 8, approval: -4 },
      },
      {
        label: 'Stay out of it (no effects)',
        effects: {},
      },
    ],
  },

  {
    id: 'throwback.big_box_arrival',
    title: 'Big Box Retailer Arrives',
    description:
      'A massive chain wants to open a superstore on the edge of town. Strip malls and mom-and-pops mobilize against it.',
    condition: (state) => state.budget > 400 && state.population > 1200,
    weight: 10,
    choices: [
      {
        label: 'Approve with tax incentives (+$400, -8 Approval, +60 Jobs rhetorically)',
        effects: { budget: 400, approval: -8 },
      },
      {
        label: 'Reject on small-business grounds (+10 Approval, -1 PC)',
        effects: { approval: 10, politicalCapital: -1 },
      },
    ],
  },

  {
    id: 'throwback.cable_tv_boom',
    title: 'Cable TV Boom',
    description:
      'A cable provider wants to wire the whole city. Public access channels are part of the deal.',
    condition: (state) => state.turn > 5,
    weight: 9,
    choices: [
      {
        label: 'Negotiate municipal cable rights (-$200, +5 Approval, +$60/turn perpetuity, simplified to +250)',
        effects: { budget: 50, approval: 5 }, // net +50 budget after the deal
      },
      {
        label: 'Auction to highest bidder (+$300, -4 Approval from limited access)',
        effects: { budget: 300, approval: -4 },
      },
    ],
  },

  {
    id: 'throwback.cassette_renaissance',
    title: 'Cassette Tape Renaissance',
    description:
      'Local hipsters declare cassettes the true medium. A boutique label wants city sponsorship.',
    condition: (state) => state.approval > 55,
    weight: 6,
    choices: [
      {
        label: 'Sponsor the label (-$100, +6 Approval)',
        effects: { budget: -100, approval: 6 },
      },
      {
        label: 'Politely pass (no effects)',
        effects: {},
      },
    ],
  },

  {
    id: 'throwback.auto_strike',
    title: 'Auto Workers Strike',
    description:
      'The assembly line walks out demanding better wages. The plant manager is in your office.',
    condition: (state) =>
      state.tiles.some((t) => t.building === 'throwback.auto_plant'),
    weight: 13,
    choices: [
      {
        label: 'Side with workers (+12 Approval, -2 PC, -$200 from arbitration costs)',
        effects: { approval: 12, politicalCapital: -2, budget: -200 },
      },
      {
        label: 'Side with management (+$250 from grateful executives, -10 Approval)',
        effects: { budget: 250, approval: -10 },
      },
      {
        label: 'Mediate neutrally (-1 PC, +3 Approval)',
        effects: { politicalCapital: -1, approval: 3 },
      },
    ],
  },

  {
    id: 'throwback.vintage_car_show',
    title: 'Vintage Car Show Weekend',
    description:
      'A national classic-car association wants to host its annual rally in your downtown. Hotels are booked solid.',
    condition: (state) => state.budget > 100 && state.turn > 4,
    weight: 8,
    choices: [
      {
        label: 'Host the rally (+$300, +7 Approval, +6 Pollution from old engines)',
        effects: { budget: 300, approval: 7, pollution: 6 },
      },
      {
        label: 'Charge a permit fee instead (+$200, -2 Approval)',
        effects: { budget: 200, approval: -2 },
      },
      {
        label: 'Reject for emissions (-6 Approval, +4 Environment)',
        effects: { approval: -6, environment: 4 },
      },
    ],
  },

  {
    id: 'throwback.garage_band_scene',
    title: 'Garage Band Scene',
    description:
      'Three rival bands want city permits for the same battle-of-the-bands night. Things will get loud.',
    condition: (state) => state.population > 900,
    weight: 7,
    choices: [
      {
        label: 'Approve the event (+5 Approval, -$50 in cleanup)',
        effects: { approval: 5, budget: -50 },
      },
      {
        label: 'Make them pay venue fees (+$120, -2 Approval)',
        effects: { budget: 120, approval: -2 },
      },
      {
        label: 'Enforce noise ordinance instead (-4 Approval, +1 PC)',
        effects: { approval: -4, politicalCapital: 1 },
      },
    ],
  },
];
