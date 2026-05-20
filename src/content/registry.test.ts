/**
 * Tests for the content-pack registry, entitlement filtering, and loader.
 *
 * These tests work directly against fresh ContentRegistry / EntitlementService
 * instances rather than the singleton — they should never be coupled to the
 * app's boot order or to other tests in the suite.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContentRegistry } from './registry';
import { EntitlementService } from './entitlements';
import { PackLoader } from './loader';
import { CONTENT_ENGINE_VERSION, type ContentPack } from './types';
import type { BuildingDef, GameEvent, TerrainDef } from '../types';

/* ─────────────────────────────── fixtures ──────────────────────────────── */

function makeFreePack(overrides: Partial<ContentPack> = {}): ContentPack {
  return {
    manifest: {
      id: 'fixture.free',
      name: 'Free Fixture',
      description: 'Test free pack',
      version: '1.0.0',
      author: 'Test',
      engineMinVersion: CONTENT_ENGINE_VERSION,
      entitlement: { kind: 'free' },
    },
    buildings: {
      'fixture.house': {
        name: 'Test House',
        cost: 100,
        maintenance: 5,
        populationCapacity: 100,
        allowedTiles: ['plain'],
      } as BuildingDef,
    },
    terrains: {
      'fixture.plain': {
        name: 'Test Plain',
        description: 'flat',
        color: '#aaa',
        height: 1,
        buildable: true,
      } as TerrainDef,
    },
    events: [
      {
        id: 'fixture.free_event',
        title: 'Free event',
        description: '',
        condition: () => true,
        weight: 1,
        choices: [],
      } as GameEvent,
    ],
    ...overrides,
  };
}

function makePremiumPack(): ContentPack {
  return {
    manifest: {
      id: 'fixture.premium',
      name: 'Premium Fixture',
      description: 'Test premium pack',
      version: '1.0.0',
      author: 'Test',
      engineMinVersion: CONTENT_ENGINE_VERSION,
      entitlement: { kind: 'premium' },
    },
    buildings: {
      'fixture.mansion': {
        name: 'Premium Mansion',
        cost: 500,
        maintenance: 30,
        populationCapacity: 500,
        allowedTiles: ['plain'],
      } as BuildingDef,
    },
  };
}

function makePaidPack(id: string): ContentPack {
  return {
    manifest: {
      id,
      name: `Paid Pack ${id}`,
      description: 'Test paid pack',
      version: '1.0.0',
      author: 'Test',
      engineMinVersion: CONTENT_ENGINE_VERSION,
      entitlement: { kind: 'pack', packId: id },
    },
    buildings: {
      [`${id}.exclusive`]: {
        name: 'Exclusive Building',
        cost: 1000,
        maintenance: 50,
        allowedTiles: ['plain'],
      } as BuildingDef,
    },
  };
}

/* ──────────────────────────────── tests ────────────────────────────────── */

describe('EntitlementService', () => {
  it('grants free content to every user', () => {
    const ent = new EntitlementService();
    expect(ent.has({ kind: 'free' })).toBe(true);
  });

  it('blocks premium and subscription content for free users', () => {
    const ent = new EntitlementService();
    expect(ent.has({ kind: 'premium' })).toBe(false);
    expect(ent.has({ kind: 'subscription' })).toBe(false);
    expect(ent.has({ kind: 'pack', packId: 'anything' })).toBe(false);
  });

  it('unlocks premium content after premium purchase', () => {
    const ent = new EntitlementService();
    ent.patch({ hasPremium: true });
    expect(ent.has({ kind: 'premium' })).toBe(true);
    expect(ent.hasPremium()).toBe(true);
  });

  it('does NOT auto-unlock paid packs when premium is set (separate purchase)', () => {
    const ent = new EntitlementService();
    ent.patch({ hasPremium: true });
    expect(ent.has({ kind: 'pack', packId: 'post-carbon' })).toBe(false);
  });

  it('unlocks owned packs by id', () => {
    const ent = new EntitlementService();
    ent.patch({ ownedPackIds: new Set(['post-carbon']) });
    expect(ent.has({ kind: 'pack', packId: 'post-carbon' })).toBe(true);
    expect(ent.has({ kind: 'pack', packId: 'other' })).toBe(false);
  });

  it('notifies subscribers when entitlements change', () => {
    const ent = new EntitlementService();
    let calls = 0;
    const unsub = ent.subscribe(() => calls++);
    ent.patch({ hasPremium: true });
    ent.patch({ hasSubscription: true });
    expect(calls).toBe(2);
    unsub();
    ent.patch({ hasPremium: false });
    expect(calls).toBe(2); // No notification after unsubscribe
  });
});

describe('ContentRegistry', () => {
  let ent: EntitlementService;
  let reg: ContentRegistry;

  beforeEach(() => {
    ent = new EntitlementService();
    reg = new ContentRegistry(ent);
  });

  afterEach(() => {
    reg.destroy();
  });

  it('returns empty collections when no packs are registered', () => {
    expect(Object.keys(reg.getBuildings())).toHaveLength(0);
    expect(reg.getEvents()).toHaveLength(0);
  });

  it('exposes free pack content to free users', () => {
    reg.registerPack(makeFreePack());
    expect(reg.getBuilding('fixture.house')?.name).toBe('Test House');
    expect(reg.getTerrain('fixture.plain')?.name).toBe('Test Plain');
    expect(reg.getEvents()).toHaveLength(1);
  });

  it('hides premium pack content from free users', () => {
    reg.registerPack(makeFreePack());
    reg.registerPack(makePremiumPack());
    expect(reg.getBuilding('fixture.mansion')).toBeUndefined();
    expect(reg.getBuilding('fixture.house')).toBeDefined();
  });

  it('exposes premium pack content after premium purchase', () => {
    reg.registerPack(makeFreePack());
    reg.registerPack(makePremiumPack());
    ent.patch({ hasPremium: true });
    expect(reg.getBuilding('fixture.mansion')).toBeDefined();
  });

  it('hides paid pack content unless the specific pack is owned', () => {
    reg.registerPack(makeFreePack());
    reg.registerPack(makePaidPack('post-carbon'));
    reg.registerPack(makePaidPack('archipelago'));
    expect(reg.getBuilding('post-carbon.exclusive')).toBeUndefined();
    expect(reg.getBuilding('archipelago.exclusive')).toBeUndefined();

    ent.patch({ ownedPackIds: new Set(['post-carbon']) });
    expect(reg.getBuilding('post-carbon.exclusive')).toBeDefined();
    expect(reg.getBuilding('archipelago.exclusive')).toBeUndefined();
  });

  it('notifies subscribers when packs are added or entitlements change', () => {
    let calls = 0;
    reg.subscribe(() => calls++);
    reg.registerPack(makeFreePack());
    expect(calls).toBe(1);
    ent.patch({ hasPremium: true });
    expect(calls).toBe(2);
  });

  it('refuses duplicate pack ids', () => {
    reg.registerPack(makeFreePack());
    const beforeCount = reg.allPacks.length;
    reg.registerPack(makeFreePack()); // same id
    expect(reg.allPacks.length).toBe(beforeCount);
  });

  it('refuses packs requiring a newer engine version', () => {
    const futurePack = makeFreePack({
      manifest: {
        ...makeFreePack().manifest,
        id: 'fixture.future',
        engineMinVersion: '999.0.0',
      },
    });
    expect(() => reg.registerPack(futurePack)).toThrow(/engine/);
  });

  it('refuses packs whose dependencies are not registered', () => {
    const dependent = makeFreePack({
      manifest: {
        ...makeFreePack().manifest,
        id: 'fixture.dependent',
        requires: ['fixture.missing'],
      },
    });
    expect(() => reg.registerPack(dependent)).toThrow(/requires/);
  });

  it('later packs override earlier packs on id conflicts (DLC re-balance)', () => {
    reg.registerPack(makeFreePack());
    const override = makeFreePack({
      manifest: { ...makeFreePack().manifest, id: 'fixture.override' },
      buildings: {
        'fixture.house': {
          name: 'Rebalanced House',
          cost: 200,
          maintenance: 10,
          allowedTiles: ['plain'],
        } as BuildingDef,
      },
    });
    reg.registerPack(override);
    expect(reg.getBuilding('fixture.house')?.name).toBe('Rebalanced House');
  });
});

describe('PackLoader', () => {
  let ent: EntitlementService;
  let reg: ContentRegistry;
  let loader: PackLoader;

  beforeEach(() => {
    ent = new EntitlementService();
    reg = new ContentRegistry(ent);
    loader = new PackLoader(reg);
  });

  afterEach(() => {
    reg.destroy();
  });

  it('reports success for a well-formed pack', () => {
    const result = loader.load(makeFreePack());
    expect(result.ok).toBe(true);
  });

  it('reports failure when manifest is missing required fields', () => {
    const broken = { manifest: { id: '' } } as unknown as ContentPack;
    const result = loader.load(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/id/);
  });

  it('reports failure when pack contributes no content', () => {
    const empty: ContentPack = {
      manifest: {
        id: 'fixture.empty',
        name: 'Empty',
        description: '',
        version: '1.0.0',
        author: '',
        engineMinVersion: CONTENT_ENGINE_VERSION,
        entitlement: { kind: 'free' },
      },
    };
    const result = loader.load(empty);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/no content/);
  });

  it('loadAll returns one result per pack in input order', () => {
    const results = loader.loadAll([makeFreePack(), makePremiumPack()]);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.ok)).toBe(true);
  });
});

describe('Base pack loads via init.ts', () => {
  it('exposes every base building, terrain, and event to free users', async () => {
    const { initContent, resetContentRegistryForTest } = await import('./init');
    resetContentRegistryForTest();
    const reg = initContent();
    expect(Object.keys(reg.getBuildings()).length).toBeGreaterThan(0);
    expect(Object.keys(reg.getTerrains()).length).toBeGreaterThan(0);
    expect(reg.getEvents().length).toBeGreaterThan(0);
    expect(reg.getScenario('base.standard_term')).toBeDefined();
    resetContentRegistryForTest();
  });
});
