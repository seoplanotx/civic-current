/**
 * PackLoader — validates and registers content packs.
 *
 * The loader is intentionally separate from the ContentRegistry so that the
 * registry stays a passive store while the loader owns validation,
 * dependency resolution, and error reporting. Phase 5 (community workshop)
 * will extend this with sandboxed runtime validation of user-submitted packs.
 *
 * Phase 0 usage is trivial — `loadBuiltInPacks(registry)` is called once at
 * boot from `content/init.ts`. Future phases will add `loadRemotePack(url)`
 * for the workshop and `loadEntitledPacksFromManifest()` for paid content.
 */

import type { ContentPack, PackLoadResult } from './types';
import type { ContentRegistry } from './registry';

export class PackLoader {
  private registry: ContentRegistry;

  constructor(registry: ContentRegistry) {
    this.registry = registry;
  }

  /**
   * Validate and register a single pack. Returns a structured result rather
   * than throwing so callers can collect partial-success reports across many
   * packs (e.g. "3 of 5 loaded, here are the failures").
   */
  load(pack: ContentPack): PackLoadResult {
    // Shallow shape validation
    if (!pack || !pack.manifest) {
      return {
        ok: false,
        packId: pack?.manifest?.id ?? '<unknown>',
        reason: 'Pack has no manifest',
      };
    }
    const m = pack.manifest;
    if (!m.id || typeof m.id !== 'string') {
      return { ok: false, packId: '<unknown>', reason: 'Manifest is missing a valid id' };
    }
    if (!m.entitlement) {
      return { ok: false, packId: m.id, reason: 'Manifest is missing entitlement' };
    }
    if (!m.engineMinVersion) {
      return { ok: false, packId: m.id, reason: 'Manifest is missing engineMinVersion' };
    }
    // Content sanity
    const hasContent =
      pack.terrains ||
      pack.buildings ||
      pack.events ||
      pack.scenarios ||
      pack.cosmetics ||
      pack.advisors;
    if (!hasContent) {
      return {
        ok: false,
        packId: m.id,
        reason: 'Pack contributes no content (no terrains, buildings, events, scenarios, cosmetics, or advisors)',
      };
    }

    // Delegate to registry (which performs engine-version and dependency checks)
    try {
      this.registry.registerPack(pack);
      return { ok: true, pack };
    } catch (err) {
      return {
        ok: false,
        packId: m.id,
        reason: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Bulk load — packs are loaded in array order so callers can express
   * dependencies by ordering. Returns a result per pack.
   */
  loadAll(packs: ContentPack[]): PackLoadResult[] {
    return packs.map((p) => this.load(p));
  }
}
