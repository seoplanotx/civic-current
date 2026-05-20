import type { GameEvent } from '../types';

export const EVENTS: GameEvent[] = [
  {
    id: 'heat_wave',
    title: 'Severe Heat Wave',
    description: 'A brutal summer heat wave hits the valley. Air conditioning demand surges across the city.',
    condition: (state) => state.population > 1200 && state.turn > 5,
    weight: 15,
    choices: [
      {
        label: 'Import Emergency Power (-$250 budget, +15% Reliability)',
        effects: {
          budget: -250,
          reliability: 15,
          approval: 3,
        },
      },
      {
        label: 'Ask Citizens to Conserve (-10MW Demand, -5 Approval)',
        effects: {
          powerDemandModifier: -10,
          approval: -5,
        },
      },
      {
        label: 'Do Nothing (-25% Reliability, -10 Approval)',
        effects: {
          reliability: -25,
          approval: -10,
        },
      },
    ],
  },
  {
    id: 'factory_proposal',
    title: 'Industrial Factory Proposal',
    description: 'A logistics giant wants to build a regional warehouse. They promise jobs and tax revenue, but warn of high grid demand.',
    condition: (state) => state.budget < 2500 && state.jobs < state.population,
    weight: 12,
    choices: [
      {
        label: 'Approve Factory (+$400 budget, +150 Jobs, +30MW Demand, -8 Environment)',
        effects: {
          budget: 400,
          approval: -2,
          environment: -8,
        },
      },
      {
        label: 'Mandate Clean Standards (-1 PC, +80 Jobs, +15MW Demand, +5 Environment)',
        effects: {
          politicalCapital: -1,
          environment: 5,
        },
      },
      {
        label: 'Reject Proposal (+4 Environment, -5 Approval)',
        effects: {
          environment: 4,
          approval: -5,
        },
      },
    ],
  },
  {
    id: 'coal_protest',
    title: 'Coal Power Protest',
    description: 'Activists organize outside City Hall demanding a plan to phase out coal energy due to mounting smog.',
    condition: (state) => state.pollution > 45 && state.tiles.some(t => t.building === 'coalPlant'),
    weight: 15,
    choices: [
      {
        label: 'Promise a Coal Phaseout (+12 Approval, -2 PC)',
        effects: {
          approval: 12,
          politicalCapital: -2,
        },
      },
      {
        label: 'Defend Cheap Energy (-10 Approval, +5% Economic confidence)',
        effects: {
          approval: -10,
          budget: 150, // Business donation
        },
      },
      {
        label: 'Commission a Study (-$100 budget, +3 Approval)',
        effects: {
          budget: -100,
          approval: 3,
        },
      },
    ],
  },
  {
    id: 'cold_snap',
    title: 'Polar Cold Snap',
    description: 'Sub-zero temperatures freeze the grid, spiking heating demands while making turbines sluggish.',
    condition: (state) => state.turn > 10,
    weight: 10,
    choices: [
      {
        label: 'Subsidize Heating (-$300 budget, +8 Approval)',
        effects: {
          budget: -300,
          approval: 8,
        },
      },
      {
        label: 'Enforce Rolling Blackouts (-15MW Demand, -12 Approval)',
        effects: {
          powerDemandModifier: -15,
          approval: -12,
          reliability: 5,
        },
      },
      {
        label: 'Rely on Reserves (-20% Reliability, -5 Environment)',
        effects: {
          reliability: -20,
          environment: -5,
        },
      },
    ],
  },
  {
    id: 'battery_breakthrough',
    title: 'Battery Tech Breakthrough',
    description: 'Local university engineers discover a new solid-state chemical battery chemistry.',
    condition: (state) => state.politicalCapital >= 2,
    weight: 8,
    choices: [
      {
        label: 'Fund Commercialization (-$400 budget, +25% Grid Reliability)',
        effects: {
          budget: -400,
          reliability: 25,
        },
      },
      {
        label: 'Promote Open Source Research (-2 PC, +12% Grid Reliability, +8 Environment)',
        effects: {
          politicalCapital: -2,
          reliability: 12,
          environment: 8,
        },
      },
      {
        label: 'Decline Subsidies (No effects)',
        effects: {},
      },
    ],
  },
  {
    id: 'tax_revolt',
    title: 'Taxpayers Revolt',
    description: 'Angry crowds gather at city council protesting high municipal tax burdens and cost of living.',
    condition: (state) => state.approval < 45 && state.population > 1000,
    weight: 14,
    choices: [
      {
        label: 'Offer Tax Rebates (-$200 budget, +15 Approval)',
        effects: {
          budget: -200,
          approval: 15,
        },
      },
      {
        label: 'Hold Town Halls (-1 PC, +5 Approval)',
        effects: {
          politicalCapital: -1,
          approval: 5,
        },
      },
      {
        label: 'Ignore Them (-12 Approval, +$100 short-term fee revenue)',
        effects: {
          approval: -12,
          budget: 100,
        },
      },
    ],
  },
  {
    id: 'business_lobby',
    title: 'Business Lobby Pressure',
    description: 'A powerful business coalition demands cutting environmental compliance costs to spur growth.',
    condition: (state) => state.approval < 55 && state.environment > 40,
    weight: 10,
    choices: [
      {
        label: 'Deregulate Growth (+$300 budget, -10 Environment, -5 Approval)',
        effects: {
          budget: 300,
          environment: -10,
          approval: -5,
        },
      },
      {
        label: 'Uphold Regulations (+8 Environment, -10 Business Approval)',
        effects: {
          environment: 8,
          budget: -100, // Small economy friction
        },
      },
    ],
  },
  {
    id: 'wildfire',
    title: 'Regional Forest Fire',
    description: 'A wildfire breaks out near the northern forest tiles, threatening transmission lines.',
    condition: (state) => state.pollution > 30 && state.tiles.some(t => t.terrainType === 'forest'),
    weight: 12,
    choices: [
      {
        label: 'Mobilize Forest Service (-$200 budget, +5 Environment)',
        effects: {
          budget: -200,
          environment: 5,
        },
      },
      {
        label: 'Enforce Power Shutdowns (-15MW Demand, -15% Reliability, -10 Approval)',
        effects: {
          reliability: -15,
          approval: -10,
        },
      },
      {
        label: 'Do Nothing (-12 Environment, -15% Reliability)',
        effects: {
          environment: -12,
          reliability: -15,
        },
      },
    ],
  },
  {
    id: 'river_pollution',
    title: 'River Algae Bloom',
    description: 'Excessive industrial runoff causes a toxic algae bloom, turning the municipal river green.',
    condition: (state) => state.pollution > 40 && state.tiles.some(t => t.terrainType === 'river'),
    weight: 11,
    choices: [
      {
        label: 'Clean Up River (-$250 budget, +10 Environment, +5 Approval)',
        effects: {
          budget: -250,
          environment: 10,
          approval: 5,
        },
      },
      {
        label: 'Fines on Industry (+$150 budget, -1 PC, -4 Environment)',
        effects: {
          budget: 150,
          politicalCapital: -1,
          environment: -4,
        },
      },
      {
        label: 'Ignore the Smells (-10 Environment, -8 Approval)',
        effects: {
          environment: -10,
          approval: -8,
        },
      },
    ],
  },
  {
    id: 'election_year',
    title: 'Mayoral Election Year',
    description: 'Your term is nearing its end. Citizens are rating your infrastructure record and fiscal management.',
    condition: (state) => state.turn % 15 === 0 && state.turn < 45,
    weight: 30, // Highly weighted when turn aligns
    choices: [
      {
        label: 'Host Campaign Rallies (-$150 budget, +10 Approval)',
        effects: {
          budget: -150,
          approval: 10,
        },
      },
      {
        label: 'Make Grand Promises (+2 PC, -8 Approval if failure happens)',
        effects: {
          politicalCapital: 2,
        },
      },
      {
        label: 'Run on Your Record (+$100 Campaign Contributions)',
        effects: {
          budget: 100,
        },
      },
    ],
  },
  {
    id: 'green_grant',
    title: 'Federal Green Grant',
    description: 'The federal government offers a clean energy development grant, but requires local matching funds.',
    condition: (state) => state.budget > 500 && state.environment > 50,
    weight: 10,
    choices: [
      {
        label: 'Match Funding (-$200 budget, +15 Environment, +1 PC)',
        effects: {
          budget: -200,
          environment: 15,
          politicalCapital: 1,
        },
      },
      {
        label: 'Decline Grant (No effects)',
        effects: {},
      },
    ],
  },
  {
    id: 'grid_modernization',
    title: 'Smart Grid Partnership',
    description: 'A multinational tech company offers to co-invest in a digital smart grid to optimize load balancing.',
    condition: (state) => state.budget > 800 && state.reliability < 85,
    weight: 9,
    choices: [
      {
        label: 'Partner Up (-$400 budget, +20% Grid Reliability)',
        effects: {
          budget: -400,
          reliability: 20,
        },
      },
      {
        label: 'Self-Fund Program (-2 PC, -$200 budget, +10% Grid Reliability)',
        effects: {
          politicalCapital: -2,
          budget: -200,
          reliability: 10,
        },
      },
      {
        label: 'Decline Partnership (+3 Approval from local unions)',
        effects: {
          approval: 3,
        },
      },
    ],
  },
];
