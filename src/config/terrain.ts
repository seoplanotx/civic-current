import type { TerrainType, TerrainDef } from '../types';
// Re-export so any historical importer from this module still works.
export type { TerrainDef };

export const TERRAINS: Record<TerrainType, TerrainDef> = {
  plain: {
    name: 'Open Plains',
    description: 'Flat, stable land. Perfect for any type of general construction.',
    color: '#8fbc8f', // DarkSeaGreen
    height: 1.0,
    buildable: true,
  },
  forest: {
    name: 'Dense Forest',
    description: 'Natural woodland. Great for parks; clearing it harms the environment.',
    color: '#2e8b57', // SeaGreen
    height: 1.1,
    buildable: true,
  },
  river: {
    name: 'Winding River',
    description: 'Flowing waterway. Supports parks and provides environmental cooling.',
    color: '#4682b4', // SteelBlue
    height: 0.8,
    buildable: true,
  },
  beach: {
    name: 'Coastal Beach',
    description: 'Sandy coast. Perfect for wave power, tidal stream turbines, and beach boardwalks.',
    color: '#e8d8b0', // Sandy gold
    height: 0.85,
    buildable: true,
  },
  hills: {
    name: 'Windy Hills',
    description: 'High elevation. Highly compatible with wind turbines (+25% bonus).',
    color: '#8b8589', // Greyish
    height: 1.5,
    buildable: true,
  },
  coal: {
    name: 'Coal Deposit',
    description: 'Rich underground coal deposit. Speeds up Coal Power Plant setup.',
    color: '#2f4f4f', // DarkSlateGrey
    height: 1.0,
    buildable: true,
  },
  gas: {
    name: 'Natural Gas Field',
    description: 'Natural gas pocket. Enables Gas Power Plant hookups.',
    color: '#708090', // SlateGrey
    height: 1.0,
    buildable: true,
  },
  farmland: {
    name: 'Arable Farmland',
    description: 'Fertile soil. Great for solar grids or housing, but replacing it sparks debate.',
    color: '#d2b48c', // Tan
    height: 0.95,
    buildable: true,
  },
  protected: {
    name: 'Protected Wetlands',
    description: 'Ecologically fragile reserve. Cannot build here unless protected land policies change.',
    color: '#556b2f', // DarkOliveGreen
    height: 1.05,
    buildable: false, // Default unbuildable
  },
};
