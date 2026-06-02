import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { useBuildings, useTerrains } from '../content/hooks';
import type { BuildingId } from '../types';
import { CcIcon } from './PlanningWallDefs';

/** A single spec line in the facility readout (label + value, optional tone). */
const SpecRow: React.FC<{ k: string; v: React.ReactNode; tone?: 'pos' | 'neg' }> = ({ k, v, tone }) => (
  <div className="flex justify-between cc-mono text-[12px] py-[3px]">
    <span className="text-[color:var(--cc-ink-soft)]">{k}</span>
    <span className={`font-bold ${tone === 'pos' ? 'text-[color:var(--cc-green)]' : tone === 'neg' ? 'text-[color:var(--cc-red)]' : 'text-[color:var(--cc-ink)]'}`}>{v}</span>
  </div>
);

/**
 * LeftPanel — the tile inspector, rendered as a yellow sticky "clipboard" on
 * the planning wall. Shows the selected tile's terrain, the facility built on
 * it (with an "operational" stamp), or the list of buildable facilities with
 * hand-drawn BUILD buttons.
 */
export const LeftPanel: React.FC = () => {
  const { state, buildOnSelected, demolishOnSelected } = useGameStore();
  const { selectedTileId, tiles, budget } = state;
  const BUILDINGS = useBuildings();
  const TERRAINS = useTerrains();

  const selectedTile = tiles.find((t) => t.id === selectedTileId);

  if (!selectedTile) {
    return (
      <div className="cc-sticky cc-y cc-rot-1 w-[310px] p-5 flex flex-col justify-center items-center text-center min-h-[480px]">
        <div className="text-[color:var(--cc-ink-soft)] mb-4 opacity-70">
          <CcIcon name="help" className="w-12 h-12" />
        </div>
        <h3 className="cc-hand font-bold text-2xl text-[color:var(--cc-ink)]">District Inspector</h3>
        <p className="text-[13px] text-[color:var(--cc-ink)] opacity-80 mt-2 leading-relaxed max-w-[220px]">
          Click any tile on the board to inspect its terrain, manage zoning, or
          pencil in a new municipal facility.
        </p>
      </div>
    );
  }

  const terrain = TERRAINS[selectedTile.terrainType];

  const buildableOptions: BuildingId[] = Object.keys(BUILDINGS).filter((key) =>
    BUILDINGS[key].allowedTiles.includes(selectedTile.terrainType)
  );

  return (
    <div className="cc-sticky cc-y cc-rot-1 relative w-[310px] p-5 flex flex-col min-h-[480px]">
      <span className="cc-pin" />

      {/* Tile header */}
      <div className="flex items-start justify-between border-b border-[rgba(37,48,58,0.12)] pb-3">
        <div>
          <span className="cc-mono text-[10px] uppercase tracking-widest text-[color:var(--cc-ink-soft)]">
            Zoning · {selectedTile.id}
          </span>
          <h2 className="cc-hand font-bold text-[28px] leading-none mt-1 text-[color:var(--cc-ink)]">{terrain.name}</h2>
        </div>
        <div
          className="w-3.5 h-3.5 rounded-full border border-black/20 shadow shrink-0 mt-1"
          style={{ backgroundColor: terrain.color }}
        />
      </div>

      <p className="text-[12px] text-[color:var(--cc-ink)] opacity-85 leading-relaxed mt-3 italic">
        {terrain.description}
      </p>

      <div className="mt-4 flex-1 flex flex-col justify-between">
        {selectedTile.building ? (
          <div className="flex flex-col gap-4">
            <div className="bg-white/55 border-[1.5px] border-solid border-[rgba(46,139,87,0.4)] rounded-md p-4">
              <div className="flex items-center justify-between">
                <h3 className="cc-marker font-bold text-[16px] text-[color:var(--cc-ink)] flex items-center gap-2">
                  <CcIcon name="build" className="text-[color:var(--cc-green)]" />
                  {BUILDINGS[selectedTile.building]?.name ?? selectedTile.building}
                </h3>
                <span className="cc-stamp text-[15px]">built ✓</span>
              </div>
              <div className="h-px bg-[rgba(37,48,58,0.1)] my-3" />
              <div className="flex flex-col">
                <SpecRow k="Maintenance" v={`−$${BUILDINGS[selectedTile.building]?.maintenance ?? 0}/turn`} tone="neg" />
                {BUILDINGS[selectedTile.building]?.powerSupply !== undefined && (
                  <SpecRow k="Grid output" v={`+${BUILDINGS[selectedTile.building]?.powerSupply} MW`} tone="pos" />
                )}
                {BUILDINGS[selectedTile.building]?.powerDemand !== undefined && (
                  <SpecRow k="Grid load" v={`−${BUILDINGS[selectedTile.building]?.powerDemand} MW`} tone="neg" />
                )}
                {BUILDINGS[selectedTile.building]?.jobs !== undefined && (
                  <SpecRow k="Jobs" v={`+${BUILDINGS[selectedTile.building]?.jobs}`} tone="pos" />
                )}
                {BUILDINGS[selectedTile.building]?.pollution !== undefined && (
                  <SpecRow k="Pollution" v={`+${BUILDINGS[selectedTile.building]?.pollution} ppm`} />
                )}
                {BUILDINGS[selectedTile.building]?.reliabilityBonus !== undefined && (
                  <SpecRow k="Reliability" v={`+${BUILDINGS[selectedTile.building]?.reliabilityBonus}%`} tone="pos" />
                )}
                {BUILDINGS[selectedTile.building]?.populationCapacity !== undefined && (
                  <SpecRow k="Housing" v={`+${BUILDINGS[selectedTile.building]?.populationCapacity}`} tone="pos" />
                )}
                {BUILDINGS[selectedTile.building]?.environment !== undefined && (
                  <SpecRow k="Eco bonus" v={`+${BUILDINGS[selectedTile.building]?.environment}`} tone="pos" />
                )}
              </div>
            </div>

            <button onClick={demolishOnSelected} disabled={budget < 50} className="cc-btn w-full">
              <svg className="cc-btn-box cc-rough" viewBox="0 0 270 48" preserveAspectRatio="none">
                <rect x="3" y="3" width="264" height="42" rx="8" fill="rgba(216,65,47,0.10)" stroke="#d8412f" strokeWidth="2.5" />
              </svg>
              <span className="cc-btn-label flex items-center gap-2 text-[color:var(--cc-red)]">
                <CcIcon name="trash" /> Demolish (−$50)
              </span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="cc-mono text-[10px] font-bold uppercase tracking-wide text-[color:var(--cc-ink-soft)] mb-1">
              Pencil in a facility
            </span>

            {buildableOptions.length === 0 ? (
              <div className="text-[color:var(--cc-ink-soft)] text-[12px] italic bg-white/40 p-4 rounded-md border border-dashed border-[rgba(37,48,58,0.2)] text-center my-4">
                Nothing can be built on this terrain.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {buildableOptions.map((bType) => {
                  const def = BUILDINGS[bType];
                  const canAfford = budget >= def.cost;
                  return (
                    <div key={bType} className="bg-white/55 border border-dashed border-[rgba(37,48,58,0.22)] hover:border-[rgba(47,109,176,0.5)] p-3 rounded-md flex flex-col justify-between transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="cc-marker font-bold text-[13px] text-[color:var(--cc-ink)]">{def.name}</h4>
                          <div className="flex items-center gap-2 mt-1 cc-mono text-[10px] text-[color:var(--cc-ink-soft)]">
                            <span>${def.cost}</span><span>·</span><span>${def.maintenance}/t</span>
                          </div>
                        </div>
                        <button onClick={() => buildOnSelected(bType)} disabled={!canAfford} className="cc-btn !px-2.5 !py-1.5 shrink-0">
                          <svg className="cc-btn-box cc-rough" viewBox="0 0 90 38" preserveAspectRatio="none">
                            <rect x="2" y="2" width="86" height="34" rx="7" fill="rgba(46,139,87,0.16)" stroke="#2e8b57" strokeWidth="2.5" />
                          </svg>
                          <span className="cc-btn-label text-[11px] flex items-center gap-1 text-[color:var(--cc-green)]"><CcIcon name="build" /> Build</span>
                        </button>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-[rgba(37,48,58,0.1)] flex flex-wrap gap-x-2.5 gap-y-1 cc-mono text-[9px] text-[color:var(--cc-ink-soft)]">
                        {def.powerSupply !== undefined && <span className="text-[color:var(--cc-green)]">+{def.powerSupply}MW</span>}
                        {def.powerDemand !== undefined && <span className="text-[color:var(--cc-red)]">−{def.powerDemand}MW</span>}
                        {def.jobs !== undefined && <span className="text-[color:var(--cc-blue)]">+{def.jobs} jobs</span>}
                        {def.pollution !== undefined && <span className="text-[color:var(--cc-orange-d,#f3a651)]">+{def.pollution} smog</span>}
                        {def.populationCapacity !== undefined && <span className="text-[color:var(--cc-blue)]">+{def.populationCapacity} cap</span>}
                        {def.environment !== undefined && <span className="text-[color:var(--cc-green)]">+{def.environment} eco</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
