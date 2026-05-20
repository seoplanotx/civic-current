/**
 * Tomorrow's City — event deck.
 *
 * 12 near-future events. Many gate on owning the pack's signature buildings
 * (vertiport, datacenter, quantum lab) so the deck only fires once the
 * player is meaningfully invested in the pack's playstyle.
 */

import type { GameEvent } from '../../../types';

export const TOMORROWS_EVENTS: GameEvent[] = [
  {
    id: 'tomorrow.ai_breakthrough',
    title: 'AI Capability Breakthrough',
    description:
      'Your datacenter cluster just helped train a frontier model. The lab requests exclusive compute access for the next six months.',
    condition: (state) =>
      state.tiles.some((t) => t.building === 'tomorrow.ai_datacenter'),
    weight: 13,
    choices: [
      {
        label: 'Grant exclusive access (-$200 in goodwill, +12% Reliability bonus, +3 PC)',
        effects: { budget: -200, reliability: 12, politicalCapital: 3 },
      },
      {
        label: 'Auction compute time (+$600, -5 Approval from waitlisted researchers)',
        effects: { budget: 600, approval: -5 },
      },
      {
        label: 'Stay neutral — keep public access (+8 Approval)',
        effects: { approval: 8 },
      },
    ],
  },

  {
    id: 'tomorrow.compute_famine',
    title: 'Compute Famine',
    description:
      'Three more datacenters were approved upstream. Your grid can\'t support another load spike without subsidized power.',
    condition: (state) =>
      state.tiles.filter((t) => t.building === 'tomorrow.ai_datacenter').length >= 1 &&
      state.reliability < 90,
    weight: 12,
    choices: [
      {
        label: 'Subsidize a clean baseload buildout (-$400, +15% Reliability)',
        effects: { budget: -400, reliability: 15 },
      },
      {
        label: 'Throttle inference rates (-15MW Demand, -4 Approval)',
        effects: { powerDemandModifier: -15, approval: -4 },
      },
      {
        label: 'Let market sort it out (-15% Reliability, -8 Approval, +$150)',
        effects: { reliability: -15, approval: -8, budget: 150 },
      },
    ],
  },

  {
    id: 'tomorrow.evtol_corridor',
    title: 'eVTOL Corridor Approval',
    description:
      'The FAA wants to certify your airspace as a regional eVTOL corridor. Traffic will spike. So will revenue. So will noise complaints.',
    condition: (state) =>
      state.tiles.some((t) => t.building === 'tomorrow.vertiport'),
    weight: 11,
    choices: [
      {
        label: 'Approve the corridor (+$500, -6 Approval from suburbs)',
        effects: { budget: 500, approval: -6 },
      },
      {
        label: 'Negotiate quiet hours (+$250, -1 PC, neutral approval)',
        effects: { budget: 250, politicalCapital: -1 },
      },
      {
        label: 'Reject for noise (+5 Approval, -1 PC from industry pushback)',
        effects: { approval: 5, politicalCapital: -1 },
      },
    ],
  },

  {
    id: 'tomorrow.av_accident',
    title: 'Autonomous Vehicle Accident',
    description:
      'An AV pod misread a construction zone. No injuries, but the story is national. The mayor\'s phone is ringing.',
    condition: (state) =>
      state.tiles.some((t) => t.building === 'tomorrow.av_hub'),
    weight: 12,
    choices: [
      {
        label: 'Open investigation, pause fleet (-$200, +6 Approval, -1 PC)',
        effects: { budget: -200, approval: 6, politicalCapital: -1 },
      },
      {
        label: 'Defend the technology publicly (-7 Approval, +2 PC)',
        effects: { approval: -7, politicalCapital: 2 },
      },
      {
        label: 'Order a third-party audit (-$120, +3 Approval)',
        effects: { budget: -120, approval: 3 },
      },
    ],
  },

  {
    id: 'tomorrow.quantum_breakthrough',
    title: 'Quantum Algorithm Discovery',
    description:
      'Researchers at your quantum lab just published a breakthrough in optimization. Pharma and finance are calling.',
    condition: (state) =>
      state.tiles.some((t) => t.building === 'tomorrow.quantum_lab'),
    weight: 10,
    choices: [
      {
        label: 'License the patent (+$700, +2 PC)',
        effects: { budget: 700, politicalCapital: 2 },
      },
      {
        label: 'Open-source it (+12 Approval, -1 PC)',
        effects: { approval: 12, politicalCapital: -1 },
      },
      {
        label: 'Keep results private (+1 PC, +$100 from defense contracts)',
        effects: { politicalCapital: 1, budget: 100 },
      },
    ],
  },

  {
    id: 'tomorrow.drone_privacy_suit',
    title: 'Drone Privacy Lawsuit',
    description:
      'A neighborhood association filed suit alleging drone deliveries are surveilling backyards. Class action looms.',
    condition: (state) =>
      state.tiles.some((t) => t.building === 'tomorrow.drone_depot'),
    weight: 11,
    choices: [
      {
        label: 'Settle out of court (-$300, +5 Approval)',
        effects: { budget: -300, approval: 5 },
      },
      {
        label: 'Fight in court (-1 PC, -3 Approval, +$200 if successful)',
        effects: { politicalCapital: -1, approval: -3, budget: 200 },
      },
      {
        label: 'Mandate blurred-camera firmware (-$150, +8 Approval, -2 PC)',
        effects: { budget: -150, approval: 8, politicalCapital: -2 },
      },
    ],
  },

  {
    id: 'tomorrow.synth_food_acceptance',
    title: 'Synth Food Public Acceptance',
    description:
      'Your vertical farm is producing lab-cultured protein. The state asks if you\'ll champion a labeling pilot.',
    condition: (state) =>
      state.tiles.some((t) => t.building === 'tomorrow.vertical_farm'),
    weight: 9,
    choices: [
      {
        label: 'Lead the pilot (+3 PC, +6 Environment, -2 Approval from skeptics)',
        effects: { politicalCapital: 3, environment: 6, approval: -2 },
      },
      {
        label: 'Defer to FDA (no effects)',
        effects: {},
      },
      {
        label: 'Subsidize traditional farms instead (+5 Approval, -$200)',
        effects: { approval: 5, budget: -200 },
      },
    ],
  },

  {
    id: 'tomorrow.smart_city_ipo',
    title: 'Smart City IPO',
    description:
      'A municipal-services company built on your data wants to go public. They\'re asking the city to be a cornerstone investor.',
    condition: (state) => state.budget > 1500 && state.population > 1500,
    weight: 9,
    choices: [
      {
        label: 'Invest $500 in cornerstone position (-$500, +800 expected return next 5 turns)',
        effects: { budget: -500 }, // Returns paid out via subsequent events / simplification: net flat
      },
      {
        label: 'Pass on the deal (no effects)',
        effects: {},
      },
      {
        label: 'Block the listing over data rights (+8 Approval, -3 PC)',
        effects: { approval: 8, politicalCapital: -3 },
      },
    ],
  },

  {
    id: 'tomorrow.tech_worker_strike',
    title: 'Tech Worker Strike — "AGI Wages"',
    description:
      'AI engineers at your datacenter and quantum lab walk out, demanding a share of model royalties.',
    condition: (state) =>
      state.tiles.some(
        (t) =>
          t.building === 'tomorrow.ai_datacenter' ||
          t.building === 'tomorrow.quantum_lab'
      ),
    weight: 12,
    choices: [
      {
        label: 'Mediate a royalty-share deal (+10 Approval, -2 PC, -$300)',
        effects: { approval: 10, politicalCapital: -2, budget: -300 },
      },
      {
        label: 'Side with management (+$300 from grateful execs, -12 Approval)',
        effects: { budget: 300, approval: -12 },
      },
      {
        label: 'Let it play out (no effects this turn)',
        effects: {},
      },
    ],
  },

  {
    id: 'tomorrow.digital_twin_pilot',
    title: 'Digital Twin Pilot',
    description:
      'A consortium wants to build a real-time digital replica of your city for AV training and disaster prep.',
    condition: (state) => state.turn > 8 && state.budget > 500,
    weight: 8,
    choices: [
      {
        label: 'Approve the pilot (-$250, +15% Reliability, +2 PC)',
        effects: { budget: -250, reliability: 15, politicalCapital: 2 },
      },
      {
        label: 'Require privacy safeguards (-$400, +5 Approval, +10% Reliability)',
        effects: { budget: -400, approval: 5, reliability: 10 },
      },
      {
        label: 'Reject (-3 Approval from tech sector)',
        effects: { approval: -3 },
      },
    ],
  },

  {
    id: 'tomorrow.crypto_crackdown',
    title: 'Crypto Mining Crackdown',
    description:
      'A federal crackdown on energy-intensive mining is poised to shutter rogue operations in your industrial parks.',
    condition: (state) => state.pollution > 30,
    weight: 10,
    choices: [
      {
        label: 'Enforce the crackdown (-15MW Demand, +4 Environment, -2 PC)',
        effects: { powerDemandModifier: -15, environment: 4, politicalCapital: -2 },
      },
      {
        label: 'Lobby for exemption (-1 PC, +$200)',
        effects: { politicalCapital: -1, budget: 200 },
      },
      {
        label: 'Stay out of it (no effects)',
        effects: {},
      },
    ],
  },

  {
    id: 'tomorrow.neuralink_mandate',
    title: 'Neural Interface Workplace Mandate',
    description:
      'A megacorp wants to mandate neural interfaces for warehouse workers. They\'re asking your zoning board to approve the pilot.',
    condition: (state) => state.population > 1800,
    weight: 9,
    choices: [
      {
        label: 'Approve the pilot (+$350 from corporate licensing, -8 Approval)',
        effects: { budget: 350, approval: -8 },
      },
      {
        label: 'Block the mandate (+12 Approval, -2 PC)',
        effects: { approval: 12, politicalCapital: -2 },
      },
      {
        label: 'Require informed consent only (+5 Approval, +$100)',
        effects: { approval: 5, budget: 100 },
      },
    ],
  },
];
