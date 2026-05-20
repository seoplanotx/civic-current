/**
 * Pack catalog — the source-of-truth list of purchasable content packs.
 *
 * Every paid pack is registered here so:
 *   - The shop UI can list all available packs (owned + unowned)
 *   - The server checkout endpoint can validate the requested pack id and
 *     resolve it to a Stripe price env var
 *   - The webhook can convert a `sku: 'pack:<id>'` event back into an
 *     ownedPackIds entry
 *
 * Adding a new pack:
 *   1. Build the pack under `src/content/packs/<id>/`
 *   2. Register it in `init.ts` (loaded for all users; access is filtered
 *      by entitlement at the registry level)
 *   3. Add an entry below
 *   4. Create a Stripe Product + Price; set the env var named here
 *   5. Done — shop UI and checkout flow pick it up automatically.
 */

export interface PackCatalogEntry {
  /** Must match the pack's manifest.id. */
  id: string;
  /** Display name in the shop. */
  name: string;
  /** Marketing tagline. */
  tagline: string;
  /** Longer description. */
  description: string;
  /** Display price (e.g. '$4.99') — for UI only; Stripe is source of truth. */
  displayPrice: string;
  /** Env var holding the Stripe price id. Server reads this; never sent to client. */
  stripePriceEnv: string;
  /** Bullet-point list of what the pack adds. */
  highlights: string[];
  /** Visual accent color used on the storefront card. */
  accentColor: string;
  /** Optional thumbnail. */
  thumbnailUrl?: string;
}

export const PACK_CATALOG: PackCatalogEntry[] = [
  {
    id: 'throwback-era',
    name: 'Throwback Era',
    tagline: 'Mayor in the analog age',
    description:
      'Run your city like it\'s 1992. Big cars, drive-in diners, suburban tract housing, dial-up ISPs, strip malls, and a roaring auto-manufacturing economy. Cheaper to build, but bigger footprints and dirtier output. Includes 12 nostalgia-era event cards and three scenario challenges.',
    displayPrice: '$4.99',
    stripePriceEnv: 'STRIPE_PRICE_PACK_THROWBACK',
    highlights: [
      '6 new buildings (drive-in diner, strip mall, auto plant, tract housing, dial-up ISP, gas mega-plex)',
      '12 throwback-era event cards (Y2K, mall walking, dot-com bubble, MTV generation…)',
      '3 themed scenarios with their own leaderboards',
      'Builds are cheaper and easier — but inefficient and pollution-heavy',
    ],
    accentColor: '#f59e0b', // amber — nostalgia warm
  },
  {
    id: 'tomorrows-city',
    name: "Tomorrow's City",
    tagline: 'Mayor in the AI age',
    description:
      'Push your city into 2060. eVTOL vertiports, AI datacenter clusters, autonomous vehicle hubs, vertical farms, quantum compute labs, and drone delivery depots. Expensive and power-hungry — but compact, clean, and absurdly profitable when balanced. Includes 12 near-future event cards and three scenario challenges.',
    displayPrice: '$4.99',
    stripePriceEnv: 'STRIPE_PRICE_PACK_TOMORROWS_CITY',
    highlights: [
      '6 new buildings (vertiport, AI datacenter, AV hub, vertical farm, quantum lab, drone depot)',
      '12 near-future event cards (AI breakthroughs, compute famines, neural mandates…)',
      '3 themed scenarios with their own leaderboards',
      'Buildings are expensive and power-hungry — but compact, clean, and high-yield',
    ],
    accentColor: '#22d3ee', // cyan — futurism cool
  },
];

export function getCatalogEntry(packId: string): PackCatalogEntry | undefined {
  return PACK_CATALOG.find((p) => p.id === packId);
}
