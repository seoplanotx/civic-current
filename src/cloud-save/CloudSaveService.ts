/**
 * Cloud save service — speaks to the /api/cloud-save endpoints and falls
 * back to localStorage when offline / anonymous.
 *
 * Strategy:
 *   - Signed-in users: source of truth is the cloud. We write through to
 *     localStorage as a cache so first-load is instant.
 *   - Anonymous users: localStorage only (single slot).
 *
 * Save state shape is opaque (a serialized `GameState`) — this service
 * never inspects it.
 */

import { apiRequest, ApiClientError } from '../auth/apiClient';
import type {
  CloudSaveListResponse,
  CloudSavePutRequest,
  CloudSaveSlot,
} from '../shared/api-types';

const LOCAL_KEY = 'civic_current_save_v2';
const LOCAL_SLOT_ID = 'local-1';

/** A locally-cached slot, used when the user is anonymous or offline. */
interface LocalSlot {
  id: string;
  cityName: string;
  state: unknown;
  updatedAt: string;
  turn?: number;
  legacy?: number;
}

/* ─────────────────────────────── local ────────────────────────────────── */

function readLocal(): LocalSlot | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalSlot;
  } catch {
    return null;
  }
}

function writeLocal(slot: LocalSlot): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(slot));
  } catch (e) {
    console.warn('Failed to write local save:', e);
  }
}

function deleteLocal(): void {
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* ignore */
  }
}

/* ─────────────────────────────── public api ───────────────────────────── */

export class CloudSaveService {
  /**
   * List all available save slots. Tries the cloud first (when authenticated);
   * falls back to whatever's in localStorage. Always returns at least the
   * local cache for instant UI.
   */
  async listSlots(): Promise<{ slots: CloudSaveSlot[]; maxSlots: number; source: 'cloud' | 'local' }> {
    try {
      const cloud = await apiRequest<CloudSaveListResponse>('/api/cloud-save');
      return { slots: cloud.slots, maxSlots: cloud.maxSlots, source: 'cloud' };
    } catch (err) {
      // 401 → anonymous; any other error → fall back to local
      if (!(err instanceof ApiClientError) || err.code === 'unauthenticated') {
        const local = readLocal();
        return {
          slots: local
            ? [
                {
                  id: local.id,
                  cityName: local.cityName,
                  state: local.state,
                  updatedAt: local.updatedAt,
                  turn: local.turn,
                  legacy: local.legacy,
                },
              ]
            : [],
          maxSlots: 1,
          source: 'local',
        };
      }
      throw err;
    }
  }

  /** Load a specific slot's state. */
  async loadSlot(slotId: string): Promise<CloudSaveSlot | null> {
    if (slotId === LOCAL_SLOT_ID) {
      const local = readLocal();
      return local ? { ...local, id: local.id } : null;
    }
    try {
      return await apiRequest<CloudSaveSlot>(`/api/cloud-save/${slotId}`);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) return null;
      throw err;
    }
  }

  /**
   * Create a new slot. Returns the server-issued slot id.
   * Throws ApiClientError with code 'slot_limit_exceeded' when the user
   * has hit their tier's slot cap — the UI should surface the UpgradeModal.
   */
  async createSlot(cityName: string, state: unknown, turn?: number, legacy?: number): Promise<CloudSaveSlot> {
    try {
      const body: CloudSavePutRequest & { cityName: string } = {
        cityName,
        state,
        turn,
        legacy,
      };
      return await apiRequest<CloudSaveSlot>('/api/cloud-save', {
        method: 'POST',
        body,
      });
    } catch (err) {
      // Anonymous → write to local (single slot only)
      if (err instanceof ApiClientError && err.code === 'unauthenticated') {
        const slot: LocalSlot = {
          id: LOCAL_SLOT_ID,
          cityName,
          state,
          updatedAt: new Date().toISOString(),
          turn,
          legacy,
        };
        writeLocal(slot);
        return { ...slot };
      }
      throw err;
    }
  }

  /** Overwrite an existing slot. */
  async saveSlot(slotId: string, cityName: string, state: unknown, turn?: number, legacy?: number): Promise<CloudSaveSlot> {
    if (slotId === LOCAL_SLOT_ID) {
      const slot: LocalSlot = {
        id: LOCAL_SLOT_ID,
        cityName,
        state,
        updatedAt: new Date().toISOString(),
        turn,
        legacy,
      };
      writeLocal(slot);
      return { ...slot };
    }
    try {
      const body: CloudSavePutRequest = { cityName, state, turn, legacy };
      return await apiRequest<CloudSaveSlot>(`/api/cloud-save/${slotId}`, {
        method: 'PUT',
        body,
      });
    } catch (err) {
      // If a signed-in user momentarily loses connectivity, cache to local
      // under the same id; next online save will sync back to cloud.
      if (err instanceof ApiClientError && err.code === 'unauthenticated') {
        const slot: LocalSlot = {
          id: LOCAL_SLOT_ID,
          cityName,
          state,
          updatedAt: new Date().toISOString(),
          turn,
          legacy,
        };
        writeLocal(slot);
        return { ...slot };
      }
      throw err;
    }
  }

  async deleteSlot(slotId: string): Promise<void> {
    if (slotId === LOCAL_SLOT_ID) {
      deleteLocal();
      return;
    }
    await apiRequest(`/api/cloud-save/${slotId}`, { method: 'DELETE' });
  }
}

/** Singleton instance — there's only ever one cloud-save service per app. */
export const cloudSave = new CloudSaveService();
export { LOCAL_SLOT_ID };
