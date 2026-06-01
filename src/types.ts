export type TerrainType =
  | 'plain'
  | 'forest'
  | 'river'
  | 'beach'
  | 'hills'
  | 'coal'
  | 'gas'
  | 'farmland'
  | 'protected';

export type BuildingType =
  | 'coalPlant'
  | 'gasPlant'
  | 'windFarm'
  | 'solarFarm'
  | 'battery'
  | 'housing'
  | 'industry'
  | 'park'
  | 'hydroDam'
  | 'tidalTurbine'
  | 'waveConverter'
  | 'marineGeothermal'
  | 'boardwalk'
  | 'stadium'
  | 'speedway'
  | 'wasteEnergy'
  | 'biofuelRefinery'
  | 'fusionReactor'
  | 'datacenter'
  | 'supercapacitor';

/**
 * Branded string for building ids contributed by content packs at runtime.
 *
 * Packs namespace their building ids (e.g. `"throwback.strip_mall"`,
 * `"tomorrow.ai_datacenter"`). These are not members of the `BuildingType`
 * union — the base game can't enumerate them — but a tile can legitimately
 * hold one once the owning pack is loaded. The brand keeps this distinct from
 * a plain `string`: arbitrary strings (and base-id typos) are still rejected
 * on assignment to `Tile.building`, so base-game safety is preserved, while
 * namespaced pack ids remain comparable in pack event/scenario conditions.
 */
export type PackBuildingId = string & { readonly __packBuilding: unique symbol };

export interface Tile {
  id: string;
  x: number;
  z: number;
  terrainType: TerrainType;
  building: BuildingType | PackBuildingId | null;
}

/** Re-exported here so all content-layer code can import everything from one place. */
export interface TerrainDef {
  name: string;
  description: string;
  color: string;
  height: number;
  buildable: boolean;
}

export interface BuildingDef {
  name: string;
  cost: number;
  maintenance: number;
  powerSupply?: number;
  powerDemand?: number;
  jobs?: number;
  income?: number;
  pollution?: number;
  approval?: number;
  environment?: number;
  populationCapacity?: number;
  reliabilityBonus?: number;
  allowedTiles: TerrainType[];
  terrainBonus?: Record<string, number>;
}



export interface EventChoice {
  label: string;
  effects: {
    budget?: number;
    reliability?: number;
    approval?: number;
    politicalCapital?: number;
    pollution?: number;
    environment?: number;
    population?: number;
    powerDemandModifier?: number;
  };
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  condition: (state: GameState) => boolean;
  weight: number;
  choices: EventChoice[];
}

export interface GameState {
  turn: number;
  maxTurns: number;

  budget: number;
  income: number;
  expenses: number;
  taxRate: number;
  politicalCapital: number;

  population: number;
  populationCapacity: number;
  jobs: number;

  powerSupply: number;
  powerDemand: number;
  reliability: number;

  pollution: number;
  environment: number;
  approval: number;

  selectedTileId: string | null;
  activeEvent: GameEvent | null;
  eventHistory: string[];

  tiles: Tile[];

  warnings: string[];
  gameStatus: 'playing' | 'warning' | 'victory' | 'failed';
  warningTurnsLeft: number | null; // For the "last warning" state
  failedReason: string | null;
  
  // Game scores (for scorecard)
  scores?: {
    energySecurity: number;
    economicStrength: number;
    environmentalHealth: number;
    publicApproval: number;
    fiscalResponsibility: number;
    overallLegacy: number;
    title: string;
  };
}
