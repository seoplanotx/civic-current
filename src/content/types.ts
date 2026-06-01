/**
 * Content-pack architecture — core types.
 *
 * A ContentPack is the unit of distributable game content. The base game ships
 * one pack (BASE_PACK) under a 'free' entitlement. Future paid packs, cosmetics,
 * scenarios, and subscription content all flow through this same interface.
 *
 * Every piece of game data (buildings, terrains, events, scenarios, cosmetics,
 * advisors) is owned by some pack. The ContentRegistry merges all owned packs
 * into a unified, entitlement-filtered view that the engine and UI consume.
 */

import type * as THREE from 'three';
import type { BuildingDef, GameEvent, GameState, TerrainDef } from '../types';

/* ──────────────────────────────────────────────────────────────────────────
 *  Engine version
 * ──────────────────────────────────────────────────────────────────────────
 *  Packs declare an `engineMinVersion`. The loader refuses to load packs
 *  whose required engine version is newer than what's running, preventing
 *  crashes when a pack uses a building field the engine doesn't understand.
 */
export const CONTENT_ENGINE_VERSION = '1.0.0';

/* ──────────────────────────────────────────────────────────────────────────
 *  Entitlement requirements
 * ──────────────────────────────────────────────────────────────────────────
 *  Each pack declares what the player must own to use its content. The
 *  EntitlementService evaluates these at runtime against the user's actual
 *  entitlements (premium unlock, active subscription, owned packs).
 */
export type EntitlementRequirement =
  | { kind: 'free' }
  | { kind: 'premium' }
  | { kind: 'subscription' }
  | { kind: 'pack'; packId: string };

/* ──────────────────────────────────────────────────────────────────────────
 *  Pack manifest
 * ──────────────────────────────────────────────────────────────────────────
 *  Identity, versioning, and dependency information. The actual content
 *  payload lives alongside on the ContentPack.
 */
export interface ContentPackManifest {
  /** Globally unique, slug-style id. Used to address the pack from anywhere. */
  id: string;
  /** Display name shown in shop / settings. */
  name: string;
  /** Short marketing description. */
  description: string;
  /** Semantic version. Bump on content changes. */
  version: string;
  /** Author / publisher attribution. */
  author: string;
  /** Engine version the pack requires (semantic version, may be loose). */
  engineMinVersion: string;
  /** What the user must own to activate this pack. */
  entitlement: EntitlementRequirement;
  /** Other pack IDs whose content this pack depends on. */
  requires?: string[];
  /** Optional asset / thumbnail URL for storefronts. */
  thumbnailUrl?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Scenario definition
 * ──────────────────────────────────────────────────────────────────────────
 *  Scaffolded now so Phase 2 (content packs) and Phase 4 (weekly challenges)
 *  can ship without retrofitting the system. The base pack provides the
 *  "Standard Term" scenario which mirrors today's gameplay.
 */
export interface ScenarioDef {
  id: string;
  name: string;
  description: string;
  /** Overrides applied to the starting GameState. */
  initialState: Partial<GameState>;
  /** Random seed for deterministic map generation, if specified. */
  seed?: number;
  /** Optional pack-defined victory conditions. */
  victoryConditions?: VictoryCondition[];
  /** Optional pack-defined failure conditions beyond engine defaults. */
  failureConditions?: FailureCondition[];
  /** Difficulty hint for UI sorting (1=easy, 5=brutal). */
  difficulty?: number;
}

export interface VictoryCondition {
  id: string;
  label: string;
  /** Predicate evaluated each turn. Returning true awards this victory star. */
  check: (state: GameState) => boolean;
}

export interface FailureCondition {
  id: string;
  label: string;
  check: (state: GameState) => boolean;
  /** Reason string used for game-over display. */
  reason: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Cosmetic definition
 * ──────────────────────────────────────────────────────────────────────────
 *  Scaffolded for Phase 3 (cosmetic shop). A cosmetic re-skins one or more
 *  building IDs with a new mesh factory. The base game ships its own meshes
 *  as the implicit default cosmetic.
 */
export interface CosmeticDef {
  id: string;
  name: string;
  description: string;
  /** Map from building id → new mesh factory. */
  buildingMeshes?: Record<string, () => THREE.Group>;
  /** Map from terrain id → terrain color/material override. */
  terrainOverrides?: Record<string, Partial<TerrainDef>>;
  /** Optional thumbnail for the shop UI. */
  thumbnailUrl?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Advisor definition
 * ──────────────────────────────────────────────────────────────────────────
 *  Scaffolded for Phase 4 (subscription premium advisors). An advisor
 *  influences which event choices the auto-resolver favors in idle / offline
 *  modes (Phase 1+ tick & idle work). The base pack provides a 'Pragmatist'
 *  default advisor.
 */
export interface AdvisorDef {
  id: string;
  name: string;
  description: string;
  /** Persona archetype for the auto-resolver's choice-weighting heuristic. */
  bias: 'pragmatist' | 'idealist' | 'tycoon' | 'engineer' | 'populist';
  /** Optional portrait asset path. */
  portraitUrl?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Mesh factory for buildings
 * ──────────────────────────────────────────────────────────────────────────
 *  Each building can supply a mesh factory. We keep this separate from
 *  BuildingDef in types.ts because BuildingDef stays serializable for
 *  scenarios / save files; the mesh factory is a runtime concern that the
 *  pack attaches.
 */
export type BuildingMeshFactory = () => THREE.Group;

/* ──────────────────────────────────────────────────────────────────────────
 *  ContentPack — the bundle
 * ──────────────────────────────────────────────────────────────────────────
 *  Packs may contribute any subset of these collections. The base pack
 *  contributes terrains, buildings, events, and scenarios. A pure cosmetic
 *  pack contributes only the cosmetics map. A scenario pack contributes
 *  only scenarios.
 */
export interface ContentPack {
  manifest: ContentPackManifest;
  terrains?: Record<string, TerrainDef>;
  buildings?: Record<string, BuildingDef>;
  buildingMeshes?: Record<string, BuildingMeshFactory>;
  events?: GameEvent[];
  scenarios?: ScenarioDef[];
  cosmetics?: CosmeticDef[];
  advisors?: AdvisorDef[];
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Snapshot of a user's entitlements
 * ──────────────────────────────────────────────────────────────────────────
 *  Phase 0 ships a default snapshot (free tier only). Phase 1 wires this to
 *  Clerk + Stripe so it loads on auth.
 */
export interface UserEntitlements {
  /** Has the user purchased the one-time premium unlock? */
  hasPremium: boolean;
  /** Does the user have an active Mayor's Office subscription? */
  hasSubscription: boolean;
  /** Owned content pack IDs (paid expansions). */
  ownedPackIds: ReadonlySet<string>;
  /**
   * @deprecated Legacy multi-equip set kept for back-compat. New cosmetic
   * features use the singular `equippedCosmeticId` below.
   */
  equippedCosmeticIds?: ReadonlySet<string>;
  /** Owned cosmetic theme IDs (purchasable re-skins). */
  ownedCosmeticIds: ReadonlySet<string>;
  /** The single currently-equipped theme; null = default look. */
  equippedCosmeticId: string | null;
  /** Subscription lifecycle state ('active' | 'canceled' | 'past_due' | 'none'). */
  subscriptionStatus?: string;
}

export const DEFAULT_ENTITLEMENTS: UserEntitlements = {
  hasPremium: false,
  hasSubscription: false,
  ownedPackIds: new Set(),
  equippedCosmeticIds: new Set(),
  ownedCosmeticIds: new Set(),
  equippedCosmeticId: null,
  subscriptionStatus: 'none',
};

/* ──────────────────────────────────────────────────────────────────────────
 *  Loader result shape
 * ──────────────────────────────────────────────────────────────────────────
 */
export type PackLoadResult =
  | { ok: true; pack: ContentPack }
  | { ok: false; packId: string; reason: string };
