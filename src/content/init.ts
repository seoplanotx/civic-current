/**
 * Content-layer bootstrap.
 *
 * Called once at app start (from `main.tsx`) before the React tree mounts.
 * Responsibilities:
 *   1. Construct the singleton ContentRegistry bound to the shared
 *      EntitlementService.
 *   2. Load the BASE_PACK so the game has its core content.
 *   3. (Phase 1+) Trigger an async load of any paid packs the authenticated
 *      user owns. Until auth resolves, only the base pack is available.
 *
 * Tests can call `resetContentRegistryForTest()` to get a clean registry
 * between cases without relying on import side effects.
 */

import { ContentRegistry } from './registry';
import { PackLoader } from './loader';
import { entitlementService } from './entitlements';
import { BASE_PACK } from './packs/base';
import { THROWBACK_ERA_PACK } from './packs/throwback-era';
import { TOMORROWS_CITY_PACK } from './packs/tomorrows-city';

let registry: ContentRegistry | null = null;

/**
 * Initialize the content system. Idempotent — safe to call multiple times,
 * subsequent calls are no-ops.
 */
export function initContent(): ContentRegistry {
  if (registry) return registry;

  registry = new ContentRegistry(entitlementService);
  const loader = new PackLoader(registry);

  // Load every shipped pack. Paid packs are entitlement-gated at the registry
  // level — they're always loaded into the engine but their content is
  // invisible until the user owns the corresponding pack id.
  const results = loader.loadAll([
    BASE_PACK,
    THROWBACK_ERA_PACK,
    TOMORROWS_CITY_PACK,
  ]);
  for (const result of results) {
    if (!result.ok) {
      // The base pack must load or the game can't start. Paid packs failing
      // to load is recoverable — log and continue.
      if (result.packId === 'base') {
        throw new Error(
          `Failed to load content pack "${result.packId}": ${result.reason}`
        );
      }
      console.error(
        `Optional pack "${result.packId}" failed to load: ${result.reason}`
      );
    }
  }

  return registry;
}

/**
 * Returns the initialized registry. Lazily initializes if not yet bootstrapped
 * (for tests and dev-tool entry points that run before main.tsx). In normal
 * app flow, main.tsx calls `initContent()` explicitly at boot so the load
 * happens before the React tree mounts.
 */
export function getContentRegistry(): ContentRegistry {
  if (!registry) {
    return initContent();
  }
  return registry;
}

/**
 * Test-only escape hatch. Destroys the current registry and forces the next
 * `initContent()` call to build a fresh one. Use inside `beforeEach`.
 */
export function resetContentRegistryForTest(): void {
  registry?.destroy();
  registry = null;
}
