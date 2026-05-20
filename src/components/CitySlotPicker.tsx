/**
 * City slot picker modal — opened from the top bar's "Cities" button.
 *
 * Shows every cloud-saved (or local) city slot with a preview (turn count,
 * legacy score). Users can switch between cities, create new ones (subject
 * to slot limit), or delete.
 *
 * Hitting the slot limit triggers the UpgradeModal.
 */

import React, { useEffect, useState } from 'react';
import { Layers, Plus, Trash2, X, Cloud, HardDrive } from 'lucide-react';
import { cloudSave } from '../cloud-save/CloudSaveService';
import type { CloudSaveSlot } from '../shared/api-types';
import { UpgradeModal } from '../billing/UpgradeModal';
import { useGameStore } from '../store/useGameStore';

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

  useEffect(() => {
    if (!open) return;
    refresh();
  }, [open]);

  const refresh = async () => {
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
  };

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
        className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-[480px] bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-400">
                <Layers className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                  Your Cities
                </span>
              </div>
              <h3 className="text-slate-100 font-black text-lg mt-1">
                {source === 'cloud' ? 'Cloud Save' : 'Local Save'} · {slots.length}/{maxSlots}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="text-[10px] font-mono text-slate-500 flex items-center gap-1 px-2 py-1 border border-white/5 rounded-full"
                title={source === 'cloud' ? 'Synced across devices' : 'Saved on this device only'}
              >
                {source === 'cloud' ? (
                  <Cloud className="w-3 h-3" />
                ) : (
                  <HardDrive className="w-3 h-3" />
                )}
                {source.toUpperCase()}
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Slot list */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-2 min-h-[120px]">
            {loading ? (
              <div className="text-xs text-slate-500 italic text-center py-8">
                Loading…
              </div>
            ) : slots.length === 0 ? (
              <div className="text-xs text-slate-500 italic text-center py-8">
                No saved cities yet. Save your current run below.
              </div>
            ) : (
              slots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-slate-950/40 border border-white/5 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-extrabold text-slate-100">
                      {slot.cityName}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {slot.turn !== undefined && `Turn ${slot.turn}`}
                      {slot.legacy !== undefined && ` · Legacy ${slot.legacy}`}
                      {' · '}
                      {new Date(slot.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleLoad(slot.id)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* New slot input */}
          <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Save current run as a new city
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`City name (turn ${state.turn})`}
                className="flex-1 bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={atLimit ? () => setUpgradeOpen(true) : handleCreate}
                disabled={creating || !newName.trim()}
                className="px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3" />
                {atLimit ? 'Upgrade' : creating ? 'Saving…' : 'Save'}
              </button>
            </div>
            {error && (
              <div className="text-[11px] text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg p-2">
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
