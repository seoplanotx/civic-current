/**
 * City slot picker modal — opened from the top bar's "Cities" button.
 *
 * Shows every cloud-saved (or local) city slot with a preview (turn count,
 * legacy score). Users can switch between cities, create new ones (subject
 * to slot limit), or delete.
 *
 * Hitting the slot limit triggers the UpgradeModal.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { cloudSave } from '../cloud-save/CloudSaveService';
import type { CloudSaveSlot } from '../shared/api-types';
import { UpgradeModal } from '../billing/UpgradeModal';
import { useGameStore } from '../store/useGameStore';
import { CcIcon } from './PlanningWallDefs';

// Alternating sticky-note paper colors + tilts for the saved-city slots.
const SLOT_PAPERS = ['cc-y', 'cc-b', 'cc-g', 'cc-o', 'cc-p'];
const SLOT_TILTS = ['cc-rot-1', 'cc-rot1', 'cc-rot-2', 'cc-rot2'];

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CitySlotPicker: React.FC<Props> = ({ open, onClose }) => {
  const [slots, setSlots] = useState<CloudSaveSlot[]>([]);
  const [maxSlots, setMaxSlots] = useState<number>(1);
  const [source, setSource] = useState<'cloud' | 'local'>('local');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const { state, loadCitySlot, saveCurrentAsNewSlot } = useGameStore();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cloudSave.listSlots();
      setSlots(data.slots);
      setMaxSlots(data.maxSlots);
      setSource(data.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch the slot list whenever the modal opens. This is a fetch-on-open
  // effect synchronizing with an external system (cloud/local storage); refresh
  // only setStates after an await, so it doesn't cause synchronous cascading
  // renders — the static rule just can't see past the async boundary.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [open, refresh]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await saveCurrentAsNewSlot(newName.trim());
      setNewName('');
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('limit')) {
        setUpgradeOpen(true);
      } else {
        setError(msg);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleLoad = async (slotId: string) => {
    try {
      await loadCitySlot(slotId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (slotId: string) => {
    try {
      await cloudSave.deleteSlot(slotId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (!open) return null;

  const atLimit = slots.length >= maxSlots;

  return (
    <>
      <div
        className="cc-backdrop animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="cc-sticky cc-white relative w-full max-w-[480px] max-h-[80vh] p-6 flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="cc-pin cc-pin-blue" />

          {/* Header */}
          <div className="flex items-start justify-between border-b border-[color:var(--cc-ink)]/10 pb-4">
            <div>
              <div className="cc-label">
                <CcIcon name="layers" solid className="text-[color:var(--cc-blue)]" />
                Your Cities
              </div>
              <h3 className="cc-marker font-bold text-[28px] leading-none mt-2 text-[color:var(--cc-ink)]">
                {source === 'cloud' ? 'Cloud Save' : 'Local Save'}
              </h3>
              <p className="cc-hand text-[18px] text-[color:var(--cc-ink-soft)] mt-1 leading-snug">
                {slots.length} of {maxSlots} city {maxSlots === 1 ? 'slot' : 'slots'} pinned to the wall.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="cc-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5 px-2 py-1 rounded-full border border-[color:var(--cc-ink)]/15 text-[color:var(--cc-ink-soft)]"
                title={source === 'cloud' ? 'Synced across devices' : 'Saved on this device only'}
              >
                <CcIcon name={source === 'cloud' ? 'cloud' : 'save'} className="text-[13px]" />
                {source.toUpperCase()}
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[color:var(--cc-ink-soft)] hover:text-[color:var(--cc-ink)] hover:bg-[color:var(--cc-ink)]/5 transition-colors"
              >
                <CcIcon name="x" className="text-[18px]" />
              </button>
            </div>
          </div>

          {/* Slot list */}
          <div className="flex-1 overflow-y-auto px-1 pt-1 pb-1 custom-scrollbar flex flex-col gap-4 min-h-[120px]">
            {loading ? (
              <div className="cc-hand text-[20px] text-[color:var(--cc-ink-soft)] text-center py-8">
                Loading…
              </div>
            ) : slots.length === 0 ? (
              <div className="cc-hand text-[20px] text-[color:var(--cc-ink-soft)] text-center py-8 leading-snug">
                No saved cities yet. Save your current run below.
              </div>
            ) : (
              slots.map((slot, i) => (
                <div
                  key={slot.id}
                  className={`cc-sticky ${SLOT_PAPERS[i % SLOT_PAPERS.length]} ${SLOT_TILTS[i % SLOT_TILTS.length]} relative p-4 flex items-center justify-between gap-3`}
                >
                  <span className="cc-pin" />
                  <div className="flex flex-col leading-tight min-w-0">
                    <span className="cc-marker font-bold text-[20px] leading-tight text-[color:var(--cc-ink)] truncate">
                      {slot.cityName}
                    </span>
                    <span className="cc-mono text-[10px] uppercase tracking-wider text-[color:var(--cc-ink-soft)] mt-1">
                      {slot.turn !== undefined && `Turn ${slot.turn}`}
                      {slot.legacy !== undefined && ` · Legacy ${slot.legacy}`}
                      {' · '}
                      {new Date(slot.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleLoad(slot.id)}
                      className="cc-btn !text-[13px] !px-4 !py-2"
                    >
                      <svg className="cc-btn-box cc-rough" viewBox="0 0 120 44" preserveAspectRatio="none">
                        <rect x="4" y="4" width="112" height="36" rx="9" fill="rgba(47,109,176,0.10)" stroke="#2f6db0" strokeWidth="3" />
                      </svg>
                      <span className="cc-btn-label text-[color:var(--cc-blue)]">Load</span>
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      title="Delete"
                      className="cc-btn !p-2"
                    >
                      <svg className="cc-btn-box cc-rough" viewBox="0 0 44 44" preserveAspectRatio="none">
                        <rect x="4" y="4" width="36" height="36" rx="9" fill="rgba(216,65,47,0.10)" stroke="#d8412f" strokeWidth="3" />
                      </svg>
                      <span className="cc-btn-label text-[color:var(--cc-red)]">
                        <CcIcon name="trash" className="text-[16px]" />
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* New slot input */}
          <div className="pt-4 border-t border-[color:var(--cc-ink)]/10 flex flex-col gap-2">
            <span className="cc-label text-[color:var(--cc-ink-soft)]">
              Save current run as a new city
            </span>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`City name (turn ${state.turn})`}
                className="flex-1 cc-marker bg-[#fbf9f2] border-2 border-[color:var(--cc-ink)]/20 rounded-lg px-3 py-2 text-[15px] text-[color:var(--cc-ink)] placeholder:text-[color:var(--cc-ink-soft)] placeholder:opacity-60 focus:outline-none focus:border-[color:var(--cc-green)]"
              />
              <button
                onClick={atLimit ? () => setUpgradeOpen(true) : handleCreate}
                disabled={creating || !newName.trim()}
                className="cc-btn !text-[14px] !px-4 !py-2 shrink-0"
              >
                <svg className="cc-btn-box cc-rough" viewBox="0 0 160 48" preserveAspectRatio="none">
                  <rect x="4" y="4" width="152" height="40" rx="10" fill="rgba(46,139,87,0.10)" stroke="#2e8b57" strokeWidth="3.5" />
                </svg>
                <span className="cc-btn-label flex items-center gap-1.5 text-[color:var(--cc-green)]">
                  <CcIcon name={atLimit ? 'coin' : 'build'} className="text-[15px]" />
                  {atLimit ? 'Upgrade' : creating ? 'Saving…' : 'Save'}
                </span>
              </button>
            </div>
            {error && (
              <div className="cc-marker text-[14px] text-[color:var(--cc-red)] bg-[rgba(216,65,47,0.08)] border-2 border-[color:var(--cc-red)]/30 rounded-lg p-2.5">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason="More city slots"
      />
    </>
  );
};
