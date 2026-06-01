import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { SceneManager } from '../three/SceneManager';
import { Volume2, VolumeX, Save, RotateCcw, Layers } from 'lucide-react';
import { CitySlotPicker } from './CitySlotPicker';
import { useEntitlements } from '../content/hooks';
import { getActiveTerrainColors } from '../content/cosmetics/theme';

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
    <div className="relative w-full h-full bg-slate-900 overflow-hidden flex-1 rounded-2xl border border-white/5 shadow-2xl">
      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-lg">
        {/* Cities (slot picker) button */}
        <button
          onClick={() => setSlotPickerOpen(true)}
          title="Cities — switch, save, or load a city"
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors duration-150 flex items-center gap-1"
        >
          <Layers className="w-4 h-4" />
          {currentSlotName && (
            <span className="text-[10px] font-bold text-slate-300 max-w-[80px] truncate">
              {currentSlotName}
            </span>
          )}
        </button>

        {/* Save button */}
        <button
          onClick={handleSave}
          title="Save current run"
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors duration-150"
        >
          <Save className="w-4 h-4" />
        </button>

        {/* Load button */}
        <button
          onClick={handleLoad}
          title="Load saved game"
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors duration-150"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-white/15 mx-1" />

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors duration-150"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Slot picker modal */}
      <CitySlotPicker open={slotPickerOpen} onClose={() => setSlotPickerOpen(false)} />

      {/* Dynamic Smog Warning Banner */}
      {pollution > 60 && (
        <div className="absolute bottom-4 left-4 bg-amber-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 shadow-lg animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Air quality warning: Smog levels are currently at {pollution}%.
        </div>
      )}

      {/* Grid Outage Warning Banner */}
      {reliability < 50 && (
        <div className="absolute bottom-16 left-4 bg-red-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-red-500/30 text-red-300 text-xs flex items-center gap-2 shadow-lg animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Grid overload: Blackouts are occurring across residential sectors.
        </div>
      )}

      {/* Game seed watermark */}
      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-slate-500 select-none">
        RENDERER: WEBGL2 | GRID: 10x10
      </div>
    </div>
  );
};
