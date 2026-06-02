import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { SceneManager } from '../three/SceneManager';
import { CitySlotPicker } from './CitySlotPicker';
import { useEntitlements } from '../content/hooks';
import { getActiveTerrainColors } from '../content/cosmetics/theme';
import { CcIcon } from './PlanningWallDefs';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const managerRef = useRef<SceneManager | null>(null);
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);

  const { state, selectTile, soundEnabled, setSoundEnabled, saveCurrentGame, loadSavedGame, currentSlotName } = useGameStore();
  const { tiles, selectedTileId, pollution, reliability } = state;

  // Track the equipped cosmetic theme so the board re-colors live when the
  // player buys/equips/unequips a theme. We key the effect on the id only.
  const equippedCosmeticId = useEntitlements().equippedCosmeticId;

  const handleSave = async () => {
    try {
      await saveCurrentGame();
      alert(
        currentSlotName
          ? `Saved "${currentSlotName}"!`
          : 'Game state saved locally. Open the "Cities" menu to save as a named city.'
      );
    } catch (e) {
      alert(`Save failed: ${(e as Error).message}`);
    }
  };

  const handleLoad = async () => {
    try {
      const loaded = await loadSavedGame();
      if (loaded) {
        alert('Loaded saved game!');
      } else {
        alert('No saved game found. Try opening the "Cities" menu to pick a slot.');
      }
    } catch (e) {
      alert(`Load failed: ${(e as Error).message}`);
    }
  };

  // Initialize the Three.js scene manager exactly once, on mount. `tiles` and
  // `selectTile` are intentionally captured at init — subsequent tile changes
  // flow through the dedicated updateTiles effect below, and selectTile is a
  // stable Zustand action — so this effect deliberately has an empty dep array.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const manager = new SceneManager(canvas, tiles, (tileId) => {
      selectTile(tileId);
    });
    managerRef.current = manager;

    // Handle internal hover event broadcasted from SceneManager
    const handleHoverEvent = (e: Event) => {
      const tileId = (e as CustomEvent).detail;
      setHoveredTileId(tileId);
    };

    canvas.addEventListener('tile-hover', handleHoverEvent);

    // Setup window resize observer
    const resizeObserver = new ResizeObserver(() => {
      manager.handleResize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
      // `canvas` is captured above, so this cleanup uses the same node the
      // listener was attached to (not a possibly-changed canvasRef.current).
      canvas.removeEventListener('tile-hover', handleHoverEvent);
      manager.destroy();
      managerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update tiles mesh when state tiles change (e.g. built or demolished)
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.updateTiles(tiles);
    }
  }, [tiles]);

  // Sync selected and hovered states
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setSelectedAndHover(selectedTileId, hoveredTileId, tiles);
    }
  }, [selectedTileId, hoveredTileId, tiles]);

  // Sync Smog Fog & Window Light Flickering
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.updateSmog(pollution, reliability);
    }
  }, [pollution, reliability]);

  // Re-color the live board whenever the equipped cosmetic theme changes
  // (purchase → equip → unequip). getActiveTerrainColors() is read at apply
  // time so subscription-granted themes resolve correctly; passing {} reverts
  // to the default look. This only forwards to the manager — no React state is
  // set here, so it doesn't trip react-hooks/set-state-in-effect.
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.applyTheme(getActiveTerrainColors());
    }
  }, [equippedCosmeticId]);

  return (
    <div className="cc-blueprint cc-pinned relative w-full h-full overflow-hidden flex-1">
      {/* Blueprint title strip pinned above the live board */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 border-b border-[color:var(--cc-bp-line)] pointer-events-none">
        <span className="cc-mono text-[12px] font-bold tracking-[2px] text-[#eaf3ff]">◇ GRID SITE PLAN — SECTOR 7</span>
        <span className="cc-mono text-[10px] tracking-[1px] text-[rgba(191,224,255,0.6)]">SCALE 1:2000 · 10×10</span>
      </div>

      {/* Three.js Canvas (colorful tiles — unchanged) */}
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />

      {/* Floating Canvas Controls — drafting-tool tray */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-[rgba(15,48,87,0.78)] backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[rgba(150,190,230,0.3)] shadow-lg">
        <button onClick={() => setSlotPickerOpen(true)} title="Cities — switch, save, or load a city"
          className="p-1.5 rounded-md hover:bg-white/10 text-[color:var(--cc-cyan)] hover:text-white transition-colors flex items-center gap-1">
          <CcIcon name="layers" className="w-4 h-4" />
          {currentSlotName && <span className="cc-mono text-[10px] font-bold max-w-[80px] truncate">{currentSlotName}</span>}
        </button>
        <button onClick={handleSave} title="Save current run" className="p-1.5 rounded-md hover:bg-white/10 text-[color:var(--cc-cyan)] hover:text-white transition-colors">
          <CcIcon name="save" className="w-4 h-4" />
        </button>
        <button onClick={handleLoad} title="Load saved game" className="p-1.5 rounded-md hover:bg-white/10 text-[color:var(--cc-cyan)] hover:text-white transition-colors">
          <CcIcon name="reset" className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-[rgba(150,190,230,0.3)] mx-1" />
        <button onClick={() => setSoundEnabled(!soundEnabled)} title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          className="p-1.5 rounded-md hover:bg-white/10 text-[color:var(--cc-cyan)] hover:text-white transition-colors">
          <CcIcon name={soundEnabled ? 'sound' : 'mute'} className="w-4 h-4" />
        </button>
      </div>

      {/* Slot picker modal */}
      <CitySlotPicker open={slotPickerOpen} onClose={() => setSlotPickerOpen(false)} />

      {/* Smog warning — a taped note on the plan */}
      {pollution > 60 && (
        <div className="cc-sticky cc-o cc-rot-1 absolute bottom-4 left-4 px-3 py-1.5 text-[12px] flex items-center gap-2 animate-pulse-slow">
          <CcIcon name="warn" className="w-4 h-4 text-[color:var(--cc-red)]" />
          <span className="cc-marker font-bold text-[color:var(--cc-ink)]">Air quality warning — smog at {pollution}%</span>
        </div>
      )}

      {/* Grid outage warning */}
      {reliability < 50 && (
        <div className="cc-sticky cc-p cc-rot1 absolute bottom-[68px] left-4 px-3 py-1.5 text-[12px] flex items-center gap-2 animate-pulse-slow">
          <CcIcon name="bolt" className="w-4 h-4 text-[color:var(--cc-red)]" />
          <span className="cc-marker font-bold text-[color:var(--cc-ink)]">Grid overload — blackouts in residential sectors</span>
        </div>
      )}

      {/* Drafting watermark */}
      <div className="absolute bottom-3 right-4 cc-mono text-[10px] text-[rgba(191,224,255,0.45)] select-none">
        DWG. GP-07 · WEBGL2
      </div>
    </div>
  );
};
