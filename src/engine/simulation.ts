import type { GameState, GameEvent } from '../types';
import { getContentRegistry } from '../content/init';
import { makeTurnRng, DEFAULT_SEED } from './rng';

/**
 * Calculates all city metrics and returns the next game state.
 * Written as a pure, deterministic simulation function.
 *
 * Pulls building definitions and event cards through the ContentRegistry so
 * that any owned content pack contributes to the simulation automatically.
 */
export function simulateTurn(state: GameState, eventChoiceIndex?: number): GameState {
  const registry = getContentRegistry();
  const buildings = registry.getBuildings();
  const nextState = { ...state };

  // 1. Process Active Event Choice Effects (if any)
  if (nextState.activeEvent && eventChoiceIndex !== undefined) {
    const choice = nextState.activeEvent.choices[eventChoiceIndex];
    if (choice) {
      const effects = choice.effects;
      if (effects.budget) nextState.budget += effects.budget;
      if (effects.approval) nextState.approval = clamp(nextState.approval + effects.approval, 0, 100);
      if (effects.reliability) nextState.reliability = clamp(nextState.reliability + effects.reliability, 0, 100);
      if (effects.politicalCapital) nextState.politicalCapital = clamp(nextState.politicalCapital + effects.politicalCapital, 0, 20);
      if (effects.pollution) nextState.pollution = clamp(nextState.pollution + effects.pollution, 0, 100);
      if (effects.environment) nextState.environment = clamp(nextState.environment + effects.environment, 0, 100);
      if (effects.population) nextState.population = clamp(nextState.population + effects.population, 100, 100000);

      // Store event history
      nextState.eventHistory = [...nextState.eventHistory, nextState.activeEvent.title];
    }
    nextState.activeEvent = null; // Clear the active event
  }

  // 2. Count Active Buildings on Map dynamically (every registered building id starts at 0)
  const counts: Record<string, number> = {};
  Object.keys(buildings).forEach((id) => {
    counts[id] = 0;
  });

  nextState.tiles.forEach((tile) => {
    if (tile.building && counts[tile.building] !== undefined) {
      counts[tile.building]++;
    }
  });

  // 3. Power Grid Supply and Demand Calculations (Data-Driven Loops)
  let basePowerSupply = 0;
  let basePowerDemand = 80 + nextState.population * 0.08; // Base grid overhead + citizens use power
  let basePollution = 0;
  let rawEnvironmentBonus = 0;
  let rawApprovalBonus = 0;
  let reliabilityBonus = 0;
  let jobsCapacity = 500; // Base municipal jobs
  let housingCapacity = 1000; // Base housing capacity
  let industrialRevenue = 0;
  let buildingMaintenance = 0;

  Object.keys(counts).forEach((id) => {
    const count = counts[id];
    if (count === 0) return;

    const def = buildings[id];
    if (!def) return;
    basePowerSupply += count * (def.powerSupply || 0);
    basePowerDemand += count * (def.powerDemand || 0);
    basePollution += count * (def.pollution || 0);
    rawEnvironmentBonus += count * (def.environment || 0);
    rawApprovalBonus += count * (def.approval || 0);
    reliabilityBonus += count * (def.reliabilityBonus || 0);
    jobsCapacity += count * (def.jobs || 0);
    housingCapacity += count * (def.populationCapacity || 0);
    industrialRevenue += count * (def.income || 0);
    buildingMaintenance += count * (def.maintenance || 0);
  });

  // Add terrain bonuses for buildings (like windFarm on hills)
  nextState.tiles.forEach((tile) => {
    if (tile.building) {
      const def = buildings[tile.building];
      if (def?.terrainBonus && def.terrainBonus[tile.terrainType]) {
        // Apply power supply bonus if the building produces power
        if (def.powerSupply) {
          basePowerSupply += def.terrainBonus[tile.terrainType];
        }
      }
    }
  });

  nextState.powerSupply = basePowerSupply;

  // Apply event demand modifier if present from choice effects (represented dynamically)
  if (nextState.activeEvent === null && state.activeEvent?.id === 'heat_wave' && eventChoiceIndex === 1) {
    basePowerDemand -= 10; // Citizens conserve
  }
  if (nextState.activeEvent === null && state.activeEvent?.id === 'cold_snap' && eventChoiceIndex === 1) {
    basePowerDemand -= 15; // Rolling blackouts
  }

  nextState.powerDemand = Math.round(basePowerDemand);

  // Grid Reliability
  let rawReliability = 100;
  if (nextState.powerDemand > 0) {
    rawReliability = (nextState.powerSupply / nextState.powerDemand) * 100;
  }

  // Add battery / supercapacitor / efficiency storage bonuses
  rawReliability += reliabilityBonus;

  nextState.reliability = clamp(Math.round(rawReliability), 0, 100);

  // 4. Pollution & Environmental Health Calculations
  // Subtract park filters (-8 pollution per park)
  basePollution -= (counts.park || 0) * 8;

  nextState.pollution = clamp(Math.round(basePollution), 0, 100);

  // Environment Health: baseline 85, decays with pollution, builds with parks and environment bonuses
  const rawEnvironment = 85 - nextState.pollution * 0.8 + (counts.park || 0) * 3 + rawEnvironmentBonus;
  nextState.environment = clamp(Math.round(rawEnvironment), 0, 100);

  // 5. Jobs and Economy (Income vs. Expenses)
  nextState.populationCapacity = housingCapacity;
  nextState.jobs = clamp(jobsCapacity, 0, nextState.population);

  // Income calculations
  const taxBase = nextState.taxRate * 25 + nextState.population * 0.12;
  nextState.income = Math.round(taxBase + industrialRevenue);

  // Expenses calculations
  nextState.expenses = Math.round(buildingMaintenance + 100); // $100 base ops cost

  // Balance update
  nextState.budget += (nextState.income - nextState.expenses);

  // 6. Public Approval
  // Base 65. Subtract tax penalty, reliability gaps, pollution index, and job shortages. Add approval bonuses.
  const taxDeviation = nextState.taxRate - 10;
  let rawApproval = 65 - taxDeviation * 4 - (100 - nextState.reliability) * 0.45 - nextState.pollution * 0.35 + rawApprovalBonus;

  // Unemployment penalty
  if (nextState.population > nextState.jobs && nextState.population > 0) {
    const unemploymentRate = (nextState.population - nextState.jobs) / nextState.population;
    rawApproval -= unemploymentRate * 30;
  }

  nextState.approval = clamp(Math.round(rawApproval), 0, 100);

  // 7. Population Growth
  let growthRate = 0.045; // 4.5% base growth rate
  growthRate += (nextState.approval - 50) * 0.001; // Happiness grows city

  if (nextState.reliability < 70) {
    growthRate -= (70 - nextState.reliability) * 0.0025; // Blackouts stop immigration
  }

  const popGrowth = Math.floor(nextState.population * growthRate);
  // Ensure we don't drop below 100 or exceed capacity
  nextState.population = clamp(nextState.population + popGrowth, 100, nextState.populationCapacity);

  // 8. Political Capital generation
  const pcGain = 1 + Math.floor(nextState.approval / 28); // 1 to 4 PC per turn
  nextState.politicalCapital = clamp(nextState.politicalCapital + pcGain, 0, 20);

  // 9. Warnings and failure thresholds checking ("Last Warning" system)
  const currentWarnings: string[] = [];

  // Check critical thresholds
  const isBudgetCrisis = nextState.budget < 0;
  const isApprovalCrisis = nextState.approval < 20;
  const isReliabilityCrisis = nextState.reliability < 40;
  const isPollutionCrisis = nextState.pollution > 90;
  const isPopulationCrisis = nextState.population < 100;

  if (isBudgetCrisis) currentWarnings.push('BANKRUPTCY ALERT: Your budget is in the red. Fix this before default.');
  if (isApprovalCrisis) currentWarnings.push('CIVIL UNREST: Citizens are outraged by your governance. Public approval is below 20%.');
  if (isReliabilityCrisis) currentWarnings.push('GRID COLLAPSE: Frequent rolling blackouts are paralyzing local businesses.');
  if (isPollutionCrisis) currentWarnings.push('ENVIRONMENTAL DISASTER: Toxic smog levels have exceeded legal safety thresholds.');
  if (isPopulationCrisis) currentWarnings.push('POPULATION COLLAPSE: The city has emptied. Citizens have migrated away.');

  nextState.warnings = currentWarnings;

  // Evaluate "Last Warning" state logic
  if (currentWarnings.length > 0) {
    if (state.gameStatus === 'playing') {
      // First turn warning triggered
      nextState.gameStatus = 'warning';
      nextState.warningTurnsLeft = 2; // User has 2 turns to fix issues
    } else if (state.gameStatus === 'warning') {
      if (state.warningTurnsLeft !== null) {
        if (state.warningTurnsLeft <= 1) {
          // Warning turns expired! Game over failure.
          nextState.gameStatus = 'failed';

          if (isBudgetCrisis) nextState.failedReason = 'Bankrupted the treasury.';
          else if (isApprovalCrisis) nextState.failedReason = 'Recalled by popular revolt.';
          else if (isReliabilityCrisis) nextState.failedReason = 'Grid collapse and complete blackout.';
          else if (isPollutionCrisis) nextState.failedReason = 'Fired due to ecological disaster.';
          else nextState.failedReason = 'City abandoned by all citizens.';
        } else {
          // Decrement countdown
          nextState.warningTurnsLeft = state.warningTurnsLeft - 1;
        }
      }
    }
  } else {
    // If warning was active but issues are cleared, restore playing status
    if (state.gameStatus === 'warning') {
      nextState.gameStatus = 'playing';
      nextState.warningTurnsLeft = null;
    }
  }

  // 10. Advance Turn Counter & Check Victory
  nextState.turn = state.turn + 1;
  if (nextState.turn > state.maxTurns && nextState.gameStatus === 'playing') {
    nextState.gameStatus = 'victory';
  }

  // 11. If Game Ended (Victory or Failure), Compile Scorecard
  if (nextState.gameStatus === 'victory' || nextState.gameStatus === 'failed') {
    const scores = calculateFinalScorecard(nextState);
    nextState.scores = scores;
  } else {
    // 12. Trigger Next Event Card if playing.
    // Derived deterministically from (seed, turn) so the same seed always
    // produces the same event stream — the foundation of the Daily Challenge.
    const rng = makeTurnRng(state.seed ?? DEFAULT_SEED, nextState.turn);
    nextState.activeEvent = maybeGenerateEvent(nextState, rng);
  }

  return nextState;
}

// Helpers
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function maybeGenerateEvent(
  state: GameState,
  rng: () => number
): GameEvent | null {
  // 30% chance of event happening per turn (unless it's an election year which has high trigger rate)
  const isElectionYear = state.turn % 15 === 0 && state.turn < 45;
  const roll = rng();
  if (roll > 0.35 && !isElectionYear) {
    return null;
  }

  // Filter available events based on condition (from every owned pack)
  const events = getContentRegistry().getEvents();
  const availableEvents = events.filter((ev) => ev.condition(state));
  if (availableEvents.length === 0) return null;

  // Weighted random selection
  const totalWeight = availableEvents.reduce((sum, ev) => sum + ev.weight, 0);
  let randomWeight = rng() * totalWeight;

  for (const event of availableEvents) {
    randomWeight -= event.weight;
    if (randomWeight <= 0) {
      return event;
    }
  }

  return availableEvents[0];
}

function calculateFinalScorecard(state: GameState) {
  const energySecurity = state.reliability;
  const economicStrength = clamp(Math.round((state.jobs / Math.max(1, state.population)) * 100), 0, 100);
  const environmentalHealth = state.environment;
  const publicApproval = state.approval;

  // Fiscal Responsibility: score based on average growth/surplus
  const financialScore = clamp(Math.round(50 + (state.budget - 1500) / 100), 10, 100);

  const overallLegacy = Math.round(
    (energySecurity + economicStrength + environmentalHealth + publicApproval + financialScore) / 5
  );

  let title: string;

  if (state.gameStatus === 'failed') {
    if (state.failedReason?.includes('Bankrupted')) title = 'Bankrupt Idealist';
    else if (state.failedReason?.includes('smog')) title = 'Smog Monarch';
    else if (state.failedReason?.includes('blackout')) title = 'Blackout Governor';
    else title = 'Recalled Administrator';
  } else {
    // Determine title based on highest metric
    if (overallLegacy >= 85) title = 'Grid Visionary';
    else if (publicApproval >= 80 && environmentalHealth >= 80) title = 'Green Utopian';
    else if (publicApproval >= 80) title = 'Beloved Mayor';
    else if (environmentalHealth >= 80) title = 'Eco-Preservation Architect';
    else if (energySecurity >= 90 && economicStrength >= 80) title = 'Infrastructure Prophet';
    else if (environmentalHealth <= 40 && energySecurity >= 85) title = 'Coal Baron';
    else if (economicStrength >= 85 && state.budget > 4000) title = 'Growth-at-All-Costs Mayor';
    else title = 'Balanced Builder';
  }

  return {
    energySecurity,
    economicStrength,
    environmentalHealth,
    publicApproval,
    fiscalResponsibility: financialScore,
    overallLegacy,
    title,
  };
}
