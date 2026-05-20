/**
 * React hooks for consuming the content layer.
 *
 * Components NEVER import `BUILDINGS`, `TERRAINS`, or `EVENTS` directly.
 * They call these hooks, which return filtered, entitlement-aware views
 * and re-render automatically when the user's entitlements change
 * (purchase confirmed, subscription activated, etc.).
 *
 * Phase 0 wiring: the registry is initialized at app boot in `content/init.ts`
 * and stored as a module-level singleton via `getContentRegistry()`. The
 * hooks subscribe to its change events.
 *
 * Phase 1 will pipe Clerk + Stripe lookups into `entitlementService.update()`,
 * which automatically flows through these hooks.
 */

import { useSyncExternalStore } from 'react';
import type { BuildingDef, GameEvent, TerrainDef } from '../types';
import type {
  AdvisorDef,
  ContentPack,
  CosmeticDef,
  ScenarioDef,
} from './types';
import { getContentRegistry } from './init';
import { entitlementService } from './entitlements';

/* ─────────────────────────────── registry hooks ─────────────────────────── */

/**
 * Generic subscription helper — re-renders when the registry emits a change.
 * Always returns the current value of the selector via a fresh registry read.
 */
function useRegistryValue<T>(selector: (reg: ReturnType<typeof getContentRegistry>) => T): T {
  return useSyncExternalStore(
    (cb) => getContentRegistry().subscribe(cb),
    () => selector(getContentRegistry()),
    () => selector(getContentRegistry())
  );
}

export function useBuildings(): Record<string, BuildingDef> {
  return useRegistryValue((reg) => reg.getBuildings());
}

export function useBuildingIds(): string[] {
  return useRegistryValue((reg) => reg.getBuildingIds());
}

export function useBuilding(id: string | null): BuildingDef | undefined {
  return useRegistryValue((reg) => (id ? reg.getBuilding(id) : undefined));
}

export function useTerrains(): Record<string, TerrainDef> {
  return useRegistryValue((reg) => reg.getTerrains());
}

export function useTerrain(id: string | null): TerrainDef | undefined {
  return useRegistryValue((reg) => (id ? reg.getTerrain(id) : undefined));
}

export function useEvents(): GameEvent[] {
  return useRegistryValue((reg) => reg.getEvents());
}

export function useScenarios(): ScenarioDef[] {
  return useRegistryValue((reg) => reg.getScenarios());
}

export function useCosmetics(): CosmeticDef[] {
  return useRegistryValue((reg) => reg.getCosmetics());
}

export function useAdvisors(): AdvisorDef[] {
  return useRegistryValue((reg) => reg.getAdvisors());
}

export function useOwnedPacks(): ContentPack[] {
  return useRegistryValue((reg) => reg.getOwnedPacks());
}

/* ─────────────────────────────── entitlement hooks ──────────────────────── */

/**
 * Subscribes to the entitlement service and returns the current entitlements
 * snapshot. Use this in the shop UI, "Premium" badges, paywall gates, etc.
 */
export function useEntitlements() {
  return useSyncExternalStore(
    (cb) => entitlementService.subscribe(cb),
    () => entitlementService.current,
    () => entitlementService.current
  );
}

export function usePremium(): boolean {
  return useEntitlements().hasPremium;
}

export function useSubscription(): boolean {
  return useEntitlements().hasSubscription;
}
