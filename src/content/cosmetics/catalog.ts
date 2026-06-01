/**
 * Cosmetic catalog — the source-of-truth list of purchasable terrain themes.
 *
 * A cosmetic theme re-colors the 3D board's terrain tiles. It owns no gameplay
 * content — buying one is purely visual flair. Each theme is registered here so:
 *   - The CosmeticShop UI can list all themes (owned + unowned)
 *   - The server checkout endpoint (api/checkout/cosmetic.ts) can validate the
 *     requested id and resolve it to a Stripe price env var
 *   - The webhook can convert a `sku: 'cosmetic:<id>'` event back into an
 *     ownedCosmeticIds entry
 *   - The active-theme resolver (cosmetics/theme.ts) can look up the color map
 *
 * Mirrors the pack catalog (src/content/catalog.ts) deliberately so both
 * storefronts share the same mental model. Adding a new theme:
 *   1. Add an entry below with a full `terrainColors` map
 *   2. Create a Stripe Product + Price; set the env var named here
 *   3. Done — the CosmeticShop and checkout flow pick it up automatically.
 */

import type { TerrainType } from '../../types';

export interface CosmeticCatalogEntry {
  /** Globally unique, slug-style id. Also the equipped-theme key. */
  id: string;
  /** Display name in the shop. */
  name: string;
  /** Short marketing tagline. */
  tagline: string;
  /** Longer description. */
  description: string;
  /** Display price (e.g. '$2.99') — for UI only; Stripe is source of truth. */
  displayPrice: string;
  /** Env var holding the Stripe price id. Server reads this; never sent to client. */
  stripePriceEnv: string;
  /** Visual accent color used on the storefront card and swatch borders. */
  accentColor: string;
  /** Per-terrain hex color overrides applied to the 3D board when equipped. */
  terrainColors: Partial<Record<TerrainType, string>>;
}

export const COSMETIC_CATALOG: CosmeticCatalogEntry[] = [
  {
    id: 'noir',
    name: 'Noir City',
    tagline: 'A town drawn in shadow',
    description:
      'Strip the board of color. Every tile is rendered in moody, monochrome grays and inky blacks — a hard-boiled, film-noir take on your city. The whole map reads like a rain-slicked street under a single streetlamp.',
    displayPrice: '$2.99',
    stripePriceEnv: 'STRIPE_PRICE_COSMETIC_NOIR',
    accentColor: '#9ca3af', // slate-400
    terrainColors: {
      plain: '#6b7280', // mid gray
      forest: '#374151', // dark slate
      river: '#1f2937', // near-black blue-gray
      beach: '#9ca3af', // light gray sand
      hills: '#4b5563', // gunmetal
      coal: '#111827', // ink black
      gas: '#52525b', // zinc
      farmland: '#71717a', // warm gray
      protected: '#3f3f46', // deep zinc
    },
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    tagline: 'Sunset on a digital grid',
    description:
      'Bathe your city in neon. Hot pinks, electric purples, and glowing cyan wash across the board for a retro-futurist, late-night-mall aesthetic. Equip it and the whole map hums like a CRT at 3 a.m.',
    displayPrice: '$2.99',
    stripePriceEnv: 'STRIPE_PRICE_COSMETIC_VAPORWAVE',
    accentColor: '#e879f9', // fuchsia-400
    terrainColors: {
      plain: '#a855f7', // purple-500
      forest: '#7c3aed', // violet-600
      river: '#22d3ee', // cyan-400
      beach: '#f9a8d4', // pink-300
      hills: '#c026d3', // fuchsia-600
      coal: '#4c1d95', // violet-900
      gas: '#6366f1', // indigo-500
      farmland: '#f472b6', // pink-400
      protected: '#2dd4bf', // teal-400
    },
  },
  {
    id: 'solarpunk',
    name: 'Solarpunk',
    tagline: 'A greener tomorrow, today',
    description:
      'Lush, optimistic, and overgrown. Saturated emerald canopies, golden grain, and clean turquoise water paint a hopeful, garden-city future. Your sustainable empire finally looks the part.',
    displayPrice: '$2.99',
    stripePriceEnv: 'STRIPE_PRICE_COSMETIC_SOLARPUNK',
    accentColor: '#34d399', // emerald-400
    terrainColors: {
      plain: '#4ade80', // green-400
      forest: '#15803d', // green-700
      river: '#2dd4bf', // teal-400
      beach: '#fde68a', // amber-200
      hills: '#65a30d', // lime-600
      coal: '#166534', // green-800
      gas: '#a3e635', // lime-400
      farmland: '#facc15', // yellow-400
      protected: '#059669', // emerald-600
    },
  },
];

export function getCosmeticCatalogEntry(
  id: string
): CosmeticCatalogEntry | undefined {
  return COSMETIC_CATALOG.find((c) => c.id === id);
}
