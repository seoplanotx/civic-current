/**
 * ContentRegistry — unified, entitlement-filtered view of all loaded packs.
 *
 * The engine and UI never import building / terrain / event data directly.
 * They go through this registry, which:
 *   1. Holds every registered pack
 *   2. Filters them through the user's EntitlementService
 *   3. Merges the surviving packs into single keyed collections
 *   4. Notifies subscribers when ownership changes (purchase, subscription)
 *
 * Conflict policy: if two owned packs both define a building with the same
 * id, the higher-priority pack wins. Priority is determined by registration
 * order, with the base pack always first. Future paid packs override base
 * only if they explicitly target the same id (intended for re-balance DLC).
 */

import {
  CONTENT_ENGINE_VERSION,
  type AdvisorDef,
  type BuildingMeshFactory,
  type ContentPack,
  type CosmeticDef,
  type ScenarioDef,
} from './types';
import type { BuildingDef, GameEvent, TerrainDef } from '../types';
import { EntitlementService } from './entitlements';
import { getActiveTerrainColors } from './cosmetics/theme';

type Listener = () => void;

export class ContentRegistry {
  /** Registration order matters — earlier packs lose on id conflicts. */
  private packs: ContentPack[] = [];
  private listeners: Set<Listener> = new Set();
  private entitlementUnsubscribe: (() => void) | null = null;

  /** Memoized filtered views, invalidated on pack-add or entitlement change. */
  private cache: {
    terrains?: Record<string, TerrainDef>;
    buildings?: Record<string, BuildingDef>;
    buildingMeshes?: Record<string, BuildingMeshFactory>;
    events?: GameEvent[];
    scenarios?: ScenarioDef[];
    cosmetics?: CosmeticDef[];
    advisors?: AdvisorDef[];
    ownedPacks?: ContentPack[];
  } = {};

  private entitlements: EntitlementService;

  constructor(entitlements: EntitlementService) {
    this.entitlements = entitlements;
    // Auto-invalidate cache and notify subscribers when entitlements change
    this.entitlementUnsubscribe = entitlements.subscribe(() => {
      this.invalidate();
      this.notify();
    });
  }

  /* ───────────────────────────── pack mgmt ───────────────────────────── */

  /**
   * Register a pack. Packs registered later override earlier packs on id
   * conflicts. The base pack should always be registered first.
   *
   * No-op if a pack with the same id is already registered — call
   * `unregister` first if you need to swap a pack (rare, mostly for tests).
   */
  registerPack(pack: ContentPack): void {
    if (this.packs.some((p) => p.manifest.id === pack.manifest.id)) {
      return;
    }
    // Engine-version check
    if (!this.isEngineVersionCompatible(pack.manifest.engineMinVersion)) {
      throw new Error(
        `Pack "${pack.manifest.id}" requires engine ${pack.manifest.engineMinVersion}, ` +
          `which is newer than the running engine.`
      );
    }
    // Dependency check
    if (pack.manifest.requires) {
      for (const depId of pack.manifest.requires) {
        if (!this.packs.some((p) => p.manifest.id === depId)) {
          throw new Error(
            `Pack "${pack.manifest.id}" requires pack "${depId}" which is not registered.`
          );
        }
      }
    }
    this.packs.push(pack);
    this.invalidate();
    this.notify();
  }

  unregisterPack(packId: string): void {
    const before = this.packs.length;
    this.packs = this.packs.filter((p) => p.manifest.id !== packId);
    if (this.packs.length !== before) {
      this.invalidate();
      this.notify();
    }
  }

  /** Every pack registered with the engine, regardless of entitlement. */
  get allPacks(): readonly ContentPack[] {
    return this.packs;
  }

  /** Packs the current user owns and which therefore contribute content. */
  getOwnedPacks(): ContentPack[] {
    if (!this.cache.ownedPacks) {
      this.cache.ownedPacks = this.packs.filter((p) =>
        this.entitlements.has(p.manifest.entitlement)
      );
    }
    return this.cache.ownedPacks;
  }

  /* ───────────────────────────── content reads ───────────────────────────── */

  getTerrains(): Record<string, TerrainDef> {
    if (!this.cache.terrains) {
      const merged = this.merge((p) => p.terrains);
      // Apply the active cosmetic theme on top of the merged defs: clone each
      // terrain and override its `.color` where the equipped theme provides one.
      // The cache is invalidated + listeners notified on every entitlement
      // change (see constructor), so equipping a theme re-themes automatically.
      const themeColors = getActiveTerrainColors();
      const themed: Record<string, TerrainDef> = {};
      for (const [id, def] of Object.entries(merged)) {
        const override = themeColors[id];
        themed[id] = override ? { ...def, color: override } : def;
      }
      this.cache.terrains = themed;
    }
    return this.cache.terrains;
  }

  getTerrain(id: string): TerrainDef | undefined {
    return this.getTerrains()[id];
  }

  getBuildings(): Record<string, BuildingDef> {
    if (!this.cache.buildings) {
      this.cache.buildings = this.merge((p) => p.buildings);
    }
    return this.cache.buildings;
  }

  getBuilding(id: string): BuildingDef | undefined {
    return this.getBuildings()[id];
  }

  getBuildingIds(): string[] {
    return Object.keys(this.getBuildings());
  }

  getBuildingMeshes(): Record<string, BuildingMeshFactory> {
    if (!this.cache.buildingMeshes) {
      this.cache.buildingMeshes = this.merge((p) => p.buildingMeshes);
    }
    return this.cache.buildingMeshes;
  }

  getBuildingMesh(id: string): BuildingMeshFactory | undefined {
    return this.getBuildingMeshes()[id];
  }

  getEvents(): GameEvent[] {
    if (!this.cache.events) {
      this.cache.events = this.getOwnedPacks().flatMap((p) => p.events ?? []);
    }
    return this.cache.events;
  }

  getScenarios(): ScenarioDef[] {
    if (!this.cache.scenarios) {
      this.cache.scenarios = this.getOwnedPacks().flatMap(
        (p) => p.scenarios ?? []
      );
    }
    return this.cache.scenarios;
  }

  getScenario(id: string): ScenarioDef | undefined {
    return this.getScenarios().find((s) => s.id === id);
  }

  getCosmetics(): CosmeticDef[] {
    if (!this.cache.cosmetics) {
      this.cache.cosmetics = this.getOwnedPacks().flatMap(
        (p) => p.cosmetics ?? []
      );
    }
    return this.cache.cosmetics;
  }

  getAdvisors(): AdvisorDef[] {
    if (!this.cache.advisors) {
      this.cache.advisors = this.getOwnedPacks().flatMap(
        (p) => p.advisors ?? []
      );
    }
    return this.cache.advisors;
  }

  /* ───────────────────────────── pub/sub ───────────────────────────── */

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Tear down entitlement subscription. Used in tests. */
  destroy(): void {
    this.entitlementUnsubscribe?.();
    this.entitlementUnsubscribe = null;
    this.listeners.clear();
  }

  /* ───────────────────────────── internals ───────────────────────────── */

  private merge<T extends object>(
    select: (pack: ContentPack) => T | undefined
  ): Record<string, T extends Record<string, infer V> ? V : never> {
    const out: Record<string, unknown> = {};
    for (const pack of this.getOwnedPacks()) {
      const slice = select(pack);
      if (!slice) continue;
      // Later packs override earlier on id conflict (registration order)
      Object.assign(out, slice);
    }
    return out as Record<string, T extends Record<string, infer V> ? V : never>;
  }

  private invalidate(): void {
    this.cache = {};
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private isEngineVersionCompatible(required: string): boolean {
    // Permissive semver check: only compares major.minor.patch numerically.
    // Returns true if the running engine is >= required.
    const parse = (v: string) =>
      v.split('.').map((n) => parseInt(n, 10) || 0);
    const [rMaj = 0, rMin = 0, rPatch = 0] = parse(required);
    const [eMaj = 0, eMin = 0, ePatch = 0] = parse(CONTENT_ENGINE_VERSION);
    if (eMaj !== rMaj) return eMaj > rMaj;
    if (eMin !== rMin) return eMin > rMin;
    return ePatch >= rPatch;
  }
}
