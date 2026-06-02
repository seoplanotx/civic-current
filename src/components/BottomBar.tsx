import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { useBuildings, useTerrains } from '../content/hooks';
import type { BuildingId } from '../types';
import { CcIcon } from './PlanningWallDefs';

/**
 * BottomBar — the quick-build hotbar (a strip of facility chips) and the big
 * hand-drawn END TURN marker button. Planning Wall styled; logic unchanged.
 */

// map base building ids → hand-drawn icon names; pack/unknown ids fall back.
const ICON_FOR: Record<string, string> = {
  coalPlant: 'bolt', gasPlant: 'bolt', windFarm: 'bolt', solarFarm: 'sun', battery: 'bolt',
  housing: 'people', industry: 'brief', park: 'leaf', hydroDam: 'wave', tidalTurbine: 'anchor',
  waveConverter: 'wave', marineGeothermal: 'bolt', boardwalk: 'star', stadium: 'trophy',
  speedway: 'bolt', wasteEnergy: 'leaf', biofuelRefinery: 'leaf', fusionReactor: 'bolt',
  datacenter: 'cloud', supercapacitor: 'shield',
};

export const BottomBar: React.FC = () => {
  const { state, buildOnSelected, endTurn } = useGameStore();
  const { selectedTileId, tiles, budget, activeEvent } = state;
  const BUILDINGS = useBuildings();
  const TERRAINS = useTerrains();

  const selectedTile = tiles.find((t) => t.id === selectedTileId);

  return (
    <div className="cc-sticky cc-white cc-rot-1 w-full p-4 flex items-center justify-between gap-6">
      {/* Quick build hotbar */}
      <div className="flex flex-col gap-1.5 flex-1 max-w-[75%]">
        <span className="cc-mono text-[10px] font-bold uppercase tracking-wide text-[color:var(--cc-ink-soft)]">
          Quick-build hotbar
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pr-1 custom-scrollbar">
          {(Object.keys(BUILDINGS) as BuildingId[]).map((bType) => {
            const def = BUILDINGS[bType];
            const canAfford = budget >= def.cost;
            const isCompatible = selectedTile
              ? def.allowedTiles.includes(selectedTile.terrainType) && !selectedTile.building
              : false;

            const handleClick = () => {
              if (!selectedTile) { alert('Pick an empty, compatible tile on the board first!'); return; }
              if (!isCompatible) { alert(`Can't build on ${TERRAINS[selectedTile.terrainType]?.name ?? 'this tile'}.`); return; }
              if (!canAfford) { alert('Not enough in the treasury for this.'); return; }
              buildOnSelected(bType);
            };

            const usable = isCompatible && canAfford;
            return (
              <button
                key={bType}
                onClick={handleClick}
                disabled={selectedTileId !== null && (!isCompatible || !canAfford)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-bold text-xs transition-all shrink-0 select-none ${
                  usable
                    ? 'bg-white/70 border-[rgba(47,109,176,0.4)] hover:border-[color:var(--cc-blue)] text-[color:var(--cc-ink)] shadow-sm active:scale-[0.96]'
                    : selectedTileId === null
                      ? 'bg-white/40 border-[rgba(37,48,58,0.12)] text-[color:var(--cc-ink-soft)] hover:bg-white/60'
                      : 'bg-white/20 border-[rgba(37,48,58,0.08)] text-[color:var(--cc-ink-soft)] opacity-40 cursor-not-allowed'
                }`}
              >
                <span className="text-[color:var(--cc-blue)]"><CcIcon name={ICON_FOR[bType] ?? 'build'} className="w-4 h-4" /></span>
                <span className="flex flex-col items-start leading-none">
                  <span className="cc-marker text-[11px] font-bold">{def.name}</span>
                  <span className="cc-mono text-[9px] text-[color:var(--cc-ink-soft)] mt-1">${def.cost}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* End turn */}
      <div className="shrink-0 flex items-center">
        {activeEvent ? (
          <div className="cc-sticky cc-p cc-rot1 px-4 py-3 flex items-center gap-2 max-w-[220px]">
            <CcIcon name="warn" className="w-4 h-4 text-[color:var(--cc-red)] shrink-0" />
            <span className="cc-hand font-bold text-[17px] text-[color:var(--cc-ink)]">Resolve the event card first!</span>
          </div>
        ) : (
          <button onClick={endTurn} className="cc-btn !text-[20px] !px-9 !py-3 text-[#13325a]">
            <svg className="cc-btn-box cc-rough" viewBox="0 0 230 64" preserveAspectRatio="none">
              <rect x="4" y="4" width="222" height="56" rx="11" fill="rgba(158,210,255,0.5)" stroke="#2f6db0" strokeWidth="3.5" />
            </svg>
            <span className="cc-btn-label flex items-center gap-2">END TURN ▶</span>
          </button>
        )}
      </div>
    </div>
  );
};
