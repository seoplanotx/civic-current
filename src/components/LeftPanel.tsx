import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { useBuildings, useTerrains } from '../content/hooks';
import type { BuildingId } from '../types';
import { Hammer, Trash2, HelpCircle } from 'lucide-react';

export const LeftPanel: React.FC = () => {
  const { state, buildOnSelected, demolishOnSelected } = useGameStore();
  const { selectedTileId, tiles, budget } = state;
  const BUILDINGS = useBuildings();
  const TERRAINS = useTerrains();

  const selectedTile = tiles.find((t) => t.id === selectedTileId);

  // If no tile selected
  if (!selectedTile) {
    return (
      <div className="w-[310px] bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-center text-center shadow-xl min-h-[480px]">
        <div className="p-4 bg-slate-900/60 rounded-full border border-white/5 text-slate-500 mb-4 animate-bounce">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h3 className="text-slate-200 font-bold text-sm">District Inspector</h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-[220px]">
          Click on any 3D grid tile on the game board to inspect its terrain, manage local zoning, or construct municipal facilities.
        </p>
      </div>
    );
  }

  const terrain = TERRAINS[selectedTile.terrainType];

  // Compile list of buildable structures for this specific terrain type.
  // BUILDINGS is the merged registry view, so this already includes any owned
  // pack buildings — ids are plain strings (BuildingId).
  const buildableOptions: BuildingId[] = Object.keys(BUILDINGS).filter((key) =>
    BUILDINGS[key].allowedTiles.includes(selectedTile.terrainType)
  );

  return (
    <div className="w-[310px] bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex flex-col shadow-xl min-h-[480px]">
      
      {/* Tile Header */}
      <div className="flex items-start justify-between border-b border-white/5 pb-3">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest leading-none">
            ZONING [{selectedTile.id}]
          </span>
          <h2 className="text-slate-100 font-bold text-base mt-1 leading-none">{terrain.name}</h2>
        </div>
        {/* Terrain tag colored based on type */}
        <div 
          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-md shrink-0 mt-1"
          style={{ backgroundColor: terrain.color }}
        />
      </div>

      {/* Description */}
      <p className="text-[11px] text-slate-300 leading-relaxed mt-3 italic bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
        {terrain.description}
      </p>

      {/* Main Content Area */}
      <div className="mt-4 flex-1 flex flex-col justify-between">
        {selectedTile.building ? (
          /* SECTION: BUILDING CONSTRUCTED */
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl shadow-md">
              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider">Operational Facilities</span>
              <h3 className="text-slate-100 font-extrabold text-sm mt-1 leading-none">
                {BUILDINGS[selectedTile.building].name}
              </h3>
              
              <div className="h-px bg-white/5 my-3" />

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Maintenance Cost</span>
                  <span className="text-red-400 font-bold">-${BUILDINGS[selectedTile.building].maintenance}/turn</span>
                </div>

                {/* Render specific parameters of built structure */}
                {BUILDINGS[selectedTile.building].powerSupply !== undefined && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Grid Output</span>
                    <span className="text-teal-400 font-bold">
                      +{BUILDINGS[selectedTile.building].powerSupply} MW
                      {selectedTile.building === 'windFarm' && selectedTile.terrainType === 'hills' && ' (+25 Hills Bonus!)'}
                    </span>
                  </div>
                )}
                
                {BUILDINGS[selectedTile.building].powerDemand !== undefined && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Grid Load</span>
                    <span className="text-amber-400 font-bold">-{BUILDINGS[selectedTile.building].powerDemand} MW</span>
                  </div>
                )}

                {BUILDINGS[selectedTile.building].jobs !== undefined && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Jobs Provided</span>
                    <span className="text-indigo-400 font-bold">+{BUILDINGS[selectedTile.building].jobs} jobs</span>
                  </div>
                )}

                {BUILDINGS[selectedTile.building].pollution !== undefined && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Pollution Index</span>
                    <span className="text-amber-500 font-bold">+{BUILDINGS[selectedTile.building].pollution} ppm</span>
                  </div>
                )}

                {BUILDINGS[selectedTile.building].reliabilityBonus !== undefined && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Reliability Buffer</span>
                    <span className="text-cyan-400 font-bold">+{BUILDINGS[selectedTile.building].reliabilityBonus}% grid</span>
                  </div>
                )}

                {BUILDINGS[selectedTile.building].populationCapacity !== undefined && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Capacity increase</span>
                    <span className="text-blue-400 font-bold">+{BUILDINGS[selectedTile.building].populationCapacity} cap</span>
                  </div>
                )}

                {BUILDINGS[selectedTile.building].environment !== undefined && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Eco Conservation</span>
                    <span className="text-emerald-400 font-bold">+{BUILDINGS[selectedTile.building].environment} pts</span>
                  </div>
                )}
              </div>
            </div>

            {/* Demolish button */}
            <button
              onClick={demolishOnSelected}
              disabled={budget < 50}
              className="w-full flex items-center justify-center gap-2 bg-red-950/40 hover:bg-red-900/30 text-red-300 disabled:opacity-40 disabled:hover:bg-red-950/40 border border-red-500/25 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all duration-150 active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              DEMOLISH ZONE (-$50)
            </button>
          </div>
        ) : (
          /* SECTION: EMPTY ZONING - BUILD MENU OPTIONS */
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none mb-1">
              Construct Municipal Facility
            </span>

            {buildableOptions.length === 0 ? (
              <div className="text-slate-400 text-xs italic bg-slate-900/30 p-4 rounded-xl border border-white/5 text-center my-4">
                No facilities can be constructed on this terrain type.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {buildableOptions.map((bType) => {
                  const def = BUILDINGS[bType];
                  const actualCost = def.cost;
                  const canAfford = budget >= actualCost;

                  return (
                    <div 
                      key={bType}
                      className="bg-slate-900/40 border border-white/5 hover:border-indigo-500/35 p-3 rounded-xl flex flex-col justify-between hover:bg-slate-900/60 transition-all duration-150 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-slate-200 font-extrabold text-xs">{def.name}</h4>
                          {/* Cost descriptors */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400">
                              Cost: <span className="text-indigo-300 font-extrabold">${def.cost}</span>
                            </span>
                            <span className="text-[8px] text-slate-500">•</span>
                            <span className="text-[10px] text-slate-400">
                              Maint: <span className="text-red-400 font-bold">${def.maintenance}/t</span>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => buildOnSelected(bType)}
                          disabled={!canAfford}
                          className="px-2.5 py-1.5 rounded-lg font-bold text-[10px] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:opacity-40 transition-all shadow-md shrink-0 flex items-center gap-1 active:scale-[0.96]"
                        >
                          <Hammer className="w-2.5 h-2.5" />
                          BUILD
                        </button>
                      </div>

                      {/* Micro visual indicator metrics on hover or build list */}
                      <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap gap-x-2.5 gap-y-1.5 text-[9px] text-slate-400 font-medium">
                        {def.powerSupply !== undefined && (
                          <span className="flex items-center gap-0.5 text-teal-400">
                            Supply: +{def.powerSupply}MW
                            {bType === 'windFarm' && selectedTile.terrainType === 'hills' && ' (+25 Hills Bonus!)'}
                          </span>
                        )}
                        {def.powerDemand !== undefined && (
                          <span className="flex items-center gap-0.5 text-amber-400">Demand: -{def.powerDemand}MW</span>
                        )}
                        {def.jobs !== undefined && (
                          <span className="flex items-center gap-0.5 text-indigo-400">Jobs: +{def.jobs}</span>
                        )}
                        {def.pollution !== undefined && (
                          <span className="flex items-center gap-0.5 text-amber-500">Smog: +{def.pollution}</span>
                        )}
                        {def.reliabilityBonus !== undefined && (
                          <span className="flex items-center gap-0.5 text-cyan-400">Grid: +{def.reliabilityBonus}%</span>
                        )}
                        {def.populationCapacity !== undefined && (
                          <span className="flex items-center gap-0.5 text-blue-400">Cap: +{def.populationCapacity}</span>
                        )}
                        {def.environment !== undefined && (
                          <span className="flex items-center gap-0.5 text-emerald-400">Eco: +{def.environment}</span>
                        )}
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
