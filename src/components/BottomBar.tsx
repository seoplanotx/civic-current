import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { useBuildings, useTerrains } from '../content/hooks';
import type { BuildingId } from '../types';
import {
  Zap, 
  Home, 
  Factory, 
  Trees, 
  ShieldAlert, 
  ArrowRight,
  Droplets,
  Wind,
  Waves,
  Flame,
  Sparkles,
  Trophy,
  Trash2,
  Sprout,
  Atom,
  Server,
  Cpu
} from 'lucide-react';

export const BottomBar: React.FC = () => {
  const { state, buildOnSelected, endTurn } = useGameStore();
  const { selectedTileId, tiles, budget, activeEvent } = state;
  const BUILDINGS = useBuildings();
  const TERRAINS = useTerrains();

  const selectedTile = tiles.find((t) => t.id === selectedTileId);

  // Helper to map icons to building types. Pack buildings (namespaced ids that
  // aren't in this switch) fall through to the default bolt icon.
  const getBuildingIcon = (type: BuildingId) => {
    switch (type) {
      case 'coalPlant':
      case 'gasPlant':
        return <Zap className="w-4 h-4 text-orange-400" />;
      case 'windFarm':
      case 'solarFarm':
        return <Zap className="w-4 h-4 text-teal-400" />;
      case 'battery':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'housing':
        return <Home className="w-4 h-4 text-blue-400" />;
      case 'industry':
        return <Factory className="w-4 h-4 text-orange-400" />;
      case 'park':
        return <Trees className="w-4 h-4 text-emerald-400" />;
      case 'hydroDam':
        return <Droplets className="w-4 h-4 text-sky-400" />;
      case 'tidalTurbine':
        return <Wind className="w-4 h-4 text-cyan-300" />;
      case 'waveConverter':
        return <Waves className="w-4 h-4 text-blue-300" />;
      case 'marineGeothermal':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'boardwalk':
        return <Sparkles className="w-4 h-4 text-amber-300" />;
      case 'stadium':
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'speedway':
        return <Flame className="w-4 h-4 text-red-400" />;
      case 'wasteEnergy':
        return <Trash2 className="w-4 h-4 text-lime-400" />;
      case 'biofuelRefinery':
        return <Sprout className="w-4 h-4 text-emerald-300" />;
      case 'fusionReactor':
        return <Atom className="w-4 h-4 text-purple-400" />;
      case 'datacenter':
        return <Server className="w-4 h-4 text-indigo-400" />;
      case 'supercapacitor':
        return <Cpu className="w-4 h-4 text-violet-400" />;
      default:
        return <Zap className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="w-full bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-6 shadow-xl">
      {/* Left section: Building Quick Hotbar */}
      <div className="flex flex-col gap-1.5 flex-1 max-w-[75%]">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">
          Quick Build Hotbar
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pr-1 custom-scrollbar">
          {(Object.keys(BUILDINGS) as BuildingId[]).map((bType) => {
            const def = BUILDINGS[bType];
            const actualCost = def.cost;

            const canAfford = budget >= actualCost;
            const isCompatible = selectedTile 
              ? def.allowedTiles.includes(selectedTile.terrainType) && !selectedTile.building
              : false;

            const handleClick = () => {
              if (!selectedTile) {
                alert('Select an empty compatible tile on the 3D board first!');
                return;
              }
              if (!isCompatible) {
                alert(`This building cannot be constructed on ${TERRAINS[selectedTile.terrainType].name}.`);
                return;
              }
              if (!canAfford) {
                alert('Insufficient treasury funds to construct this facility.');
                return;
              }
              buildOnSelected(bType);
            };

            return (
              <button
                key={bType}
                onClick={handleClick}
                disabled={selectedTileId !== null && (!isCompatible || !canAfford)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-bold text-xs transition-all duration-150 shrink-0 select-none ${
                  isCompatible && canAfford
                    ? 'bg-slate-900/60 border-indigo-500/35 hover:bg-slate-900 text-slate-200 hover:border-indigo-400 shadow-sm active:scale-[0.96]'
                    : selectedTileId === null
                    ? 'bg-slate-900/30 border-white/5 text-slate-400 hover:bg-slate-900/50 shadow-sm'
                    : 'bg-slate-950/20 border-white/2.5 text-slate-500 opacity-40 cursor-not-allowed'
                }`}
              >
                {getBuildingIcon(bType)}
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[11px] font-extrabold">{def.name}</span>
                  <span className="text-[9px] font-medium text-slate-400 mt-1">
                    ${actualCost}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right section: Master End Turn Button */}
      <div className="shrink-0 flex items-center">
        {activeEvent ? (
          <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/25 px-4 py-3 rounded-2xl text-amber-300 text-xs font-bold shadow-lg animate-pulse max-w-[200px]">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Resolve Event Card to advance turn</span>
          </div>
        ) : (
          <button
            onClick={endTurn}
            className="group relative px-6 py-3.5 rounded-2xl font-black text-xs tracking-wider uppercase bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white shadow-xl shadow-indigo-900/20 flex items-center gap-2.5 transition-all duration-150 active:scale-[0.97]"
          >
            {/* Pulsing glow ring inside button */}
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            
            <span className="relative z-10">END TURN</span>
            <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
        )}
      </div>
    </div>
  );
};
