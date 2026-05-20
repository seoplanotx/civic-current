import { create } from 'zustand';
import type { GameState, BuildingType } from '../types';
import { generateMap } from '../engine/mapGenerator';
import { simulateTurn } from '../engine/simulation';
import { getContentRegistry } from '../content/init';
import { cloudSave, LOCAL_SLOT_ID } from '../cloud-save/CloudSaveService';

interface GameStore {
  state: GameState;

  /** Slot id of the currently-loaded city (null for fresh / unsaved runs). */
  currentSlotId: string | null;
  /** Human-readable name of the currently-loaded city. */
  currentSlotName: string | null;

  // Audio synthesizer ref
  playSound: (type: 'build' | 'demolish' | 'click' | 'policy' | 'endTurn' | 'warning' | 'victory' | 'failed') => void;
  setSoundEnabled: (enabled: boolean) => void;
  soundEnabled: boolean;

  // Actions
  selectTile: (tileId: string | null) => void;
  buildOnSelected: (buildingType: BuildingType) => void;
  demolishOnSelected: () => void;
  resolveEventChoice: (choiceIndex: number) => void;
  endTurn: () => void;
  resetGame: (seed?: number) => void;

  // Cloud-aware save/load. Legacy single-slot save kept as fallback for
  // anonymous users until they sign in and migrate to cloud.
  loadSavedGame: () => Promise<boolean>;
  saveCurrentGame: () => Promise<void>;
  /** Create a brand-new slot from the current state. */
  saveCurrentAsNewSlot: (cityName: string) => Promise<void>;
  /** Replace the current state with a slot's saved state. */
  loadCitySlot: (slotId: string) => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'civic_current_save';

const initialGameState = (seed: number = 42): GameState => ({
  turn: 1,
  maxTurns: 50,
  budget: 1500,
  income: 180,
  expenses: 100,
  taxRate: 10,
  politicalCapital: 5,
  population: 800,
  populationCapacity: 1000,
  jobs: 500,
  powerSupply: 0,
  powerDemand: 80,
  reliability: 100,
  pollution: 10,
  environment: 80,
  approval: 65,
  selectedTileId: null,
  activeEvent: null,
  eventHistory: [],
  tiles: generateMap(seed),
  warnings: [],
  gameStatus: 'playing',
  warningTurnsLeft: null,
  failedReason: null,
});

// Dynamic Web Audio API Sound Effects Synthesizer
let audioCtx: AudioContext | null = null;

function synthSound(type: string, enabled: boolean) {
  if (!enabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'build') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'demolish') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'policy') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.setValueAtTime(440, now + 0.08);
      osc.frequency.setValueAtTime(550, now + 0.16);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'endTurn') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(293.66, now); // D4
      osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.25); // D5
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'warning') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(150, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'failed') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.6);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    } else if (type === 'victory') {
      osc.type = 'triangle';
      const notes = [261.63, 329.63, 392.00, 523.25]; // C major arpeggio
      notes.forEach((freq, idx) => {
        const noteOsc = audioCtx!.createOscillator();
        const noteGain = audioCtx!.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(audioCtx!.destination);
        noteOsc.type = 'sine';
        noteOsc.frequency.setValueAtTime(freq, now + idx * 0.1);
        noteGain.gain.setValueAtTime(0.08, now + idx * 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
        noteOsc.start(now + idx * 0.1);
        noteOsc.stop(now + idx * 0.1 + 0.4);
      });
    }
  } catch (e) {
    console.warn('Web Audio synthesis failed:', e);
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: initialGameState(),
  currentSlotId: null,
  currentSlotName: null,
  soundEnabled: true,

  playSound: (type) => {
    synthSound(type, get().soundEnabled);
  },

  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
  },

  selectTile: (tileId) => {
    get().playSound('click');
    set((store) => ({
      state: {
        ...store.state,
        selectedTileId: tileId,
      },
    }));
  },

  buildOnSelected: (buildingType) => {
    const { state, playSound } = get();
    const selectedTileId = state.selectedTileId;
    if (!selectedTileId) return;

    const tileIndex = state.tiles.findIndex((t) => t.id === selectedTileId);
    if (tileIndex === -1) return;

    const tile = state.tiles[tileIndex];
    if (tile.building) return; // Already has a building

    const def = getContentRegistry().getBuilding(buildingType);
    if (!def) return; // Unknown building id (pack unloaded or typo)

    let actualCost = def.cost;

    if (state.budget < actualCost) return; // Can't afford
    if (!def.allowedTiles.includes(tile.terrainType)) return; // Invalid terrain

    playSound('build');

    const updatedTiles = [...state.tiles];
    updatedTiles[tileIndex] = {
      ...tile,
      building: buildingType,
    };

    set((store) => ({
      state: {
        ...store.state,
        budget: store.state.budget - actualCost,
        tiles: updatedTiles,
      },
    }));
  },

  demolishOnSelected: () => {
    const { state, playSound } = get();
    const selectedTileId = state.selectedTileId;
    if (!selectedTileId) return;

    const tileIndex = state.tiles.findIndex((t) => t.id === selectedTileId);
    if (tileIndex === -1) return;

    const tile = state.tiles[tileIndex];
    if (!tile.building) return; // Nothing to demolish

    const demolishCost = 50; // flat fee
    if (state.budget < demolishCost) return;

    playSound('demolish');

    const updatedTiles = [...state.tiles];
    updatedTiles[tileIndex] = {
      ...tile,
      building: null,
    };

    set((store) => ({
      state: {
        ...store.state,
        budget: store.state.budget - demolishCost,
        tiles: updatedTiles,
      },
    }));
  },



  resolveEventChoice: (choiceIndex) => {
    const { state, playSound } = get();
    if (!state.activeEvent) return;

    playSound('click');

    const nextState = simulateTurn(state, choiceIndex);
    
    // Play warning / end game sounds if applicable
    if (nextState.gameStatus === 'failed') {
      playSound('failed');
    } else if (nextState.gameStatus === 'victory') {
      playSound('victory');
    } else if (nextState.gameStatus === 'warning') {
      playSound('warning');
    }

    set({ state: nextState });
  },

  endTurn: () => {
    const { state, playSound } = get();
    if (state.activeEvent) return; // Must resolve event card first

    playSound('endTurn');

    const nextState = simulateTurn(state);

    if (nextState.gameStatus === 'failed') {
      playSound('failed');
    } else if (nextState.gameStatus === 'victory') {
      playSound('victory');
    } else if (nextState.gameStatus === 'warning') {
      playSound('warning');
    }

    set({ state: nextState });
  },

  resetGame: (seed) => {
    get().playSound('click');
    set({
      state: initialGameState(seed ?? Math.floor(Math.random() * 1000)),
      currentSlotId: null,
      currentSlotName: null,
    });
  },

  /**
   * Save the current run. Three paths:
   *   - Has a current slot (cloud or local) → overwrite it
   *   - No current slot → fall back to legacy single-key local save so users
   *     who haven't engaged with the slot picker still get their old behavior
   */
  saveCurrentGame: async () => {
    const { state, currentSlotId, currentSlotName } = get();
    const legacy = state.scores?.overallLegacy;
    try {
      if (currentSlotId) {
        await cloudSave.saveSlot(
          currentSlotId,
          currentSlotName ?? `City ${state.turn}`,
          state,
          state.turn,
          legacy
        );
      } else {
        // Legacy single-slot local save for users who haven't named a city yet
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) {
      console.error('Failed to save game state:', e);
      throw e;
    }
  },

  saveCurrentAsNewSlot: async (cityName) => {
    const { state } = get();
    const legacy = state.scores?.overallLegacy;
    const slot = await cloudSave.createSlot(cityName, state, state.turn, legacy);
    set({ currentSlotId: slot.id, currentSlotName: slot.cityName });
  },

  loadCitySlot: async (slotId) => {
    const slot = await cloudSave.loadSlot(slotId);
    if (!slot || slot.state === null) {
      throw new Error('Slot is empty or could not be loaded');
    }
    set({
      state: slot.state as GameState,
      currentSlotId: slot.id,
      currentSlotName: slot.cityName,
    });
    get().playSound('policy');
  },

  loadSavedGame: async () => {
    // Prefer the legacy local save if present (back-compat for existing players)
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        set({ state: parsed });
        get().playSound('policy');
        return true;
      }
    } catch (e) {
      console.error('Failed to load legacy save:', e);
    }
    // Fall back to most-recent cloud or local slot
    try {
      const list = await cloudSave.listSlots();
      if (list.slots.length > 0) {
        // Most recently updated
        const slot = [...list.slots].sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt)
        )[0];
        await get().loadCitySlot(slot.id);
        return true;
      }
    } catch (e) {
      console.error('Failed to load cloud save:', e);
    }
    return false;
  },
}));

// Re-export the well-known anonymous slot id for components that want it.
export { LOCAL_SLOT_ID };

// Expose deterministic test hooks in window (Portfolio gold!)
if (typeof window !== 'undefined') {
  (window as any).render_game_to_text = () => {
    const storeState = useGameStore.getState().state;
    return JSON.stringify(storeState, null, 2);
  };
  (window as any).advanceTime = () => {
    useGameStore.getState().endTurn();
  };
}
