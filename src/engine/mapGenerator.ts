import type { Tile, TerrainType } from '../types';

/**
 * Generates a semi-random 10x10 map grid with a natural, structured layout:
 * - A winding river flowing north-to-south on the east side
 * - Windy hills in the northwest corner
 * - Coal deposits in the southwest
 * - Gas fields in the northeast
 * - Farmland in the south
 * - Forests in the north
 * - Protected wetlands scattered at the edges
 * - Plains covering the center around the Town Hall (at 4,4)
 */
export function generateMap(seed: number = 42): Tile[] {
  const size = 10;
  const tiles: Tile[] = [];

  // Simple LCG pseudo-random generator to ensure deterministic map generation if needed
  let r = seed;
  const random = () => {
    const x = Math.sin(r++) * 10000;
    return x - Math.floor(x);
  };

  // Precompute side-connected winding river path to prevent corner-only connections
  const riverTiles = new Set<string>();
  let prevCol = -1;
  for (let z = 0; z < size; z++) {
    const col = 7 + Math.floor(Math.sin(z * 0.9) * 1.2);
    if (z > 0 && col !== prevCol) {
      riverTiles.add(`${prevCol},${z}`);
    }
    riverTiles.add(`${col},${z}`);
    prevCol = col;
  }

  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const id = `${x},${z}`;
      let terrainType: TerrainType = 'plain';

      const isRiver = riverTiles.has(id);
      const isBeach = (x === 9 || (x === 8 && (z === 2 || z === 3 || z === 6 || z === 7))) && !isRiver;

      if (isRiver) {
        terrainType = 'river';
      } else if (isBeach) {
        terrainType = 'beach';
      } 
      // 2. Northwest Hills
      else if (x < 3 && z < 3) {
        terrainType = random() > 0.35 ? 'hills' : 'plain';
      } 
      // 3. Northeast Gas Field
      else if (x > 7 && z < 4) {
        terrainType = random() > 0.4 ? 'gas' : 'plain';
      }
      // 4. Southwest Coal Deposits
      else if (x < 3 && z > 6) {
        terrainType = random() > 0.4 ? 'coal' : 'plain';
      } 
      // 5. Farmland in the South
      else if (z >= 8 && x >= 3 && x < 8) {
        terrainType = random() > 0.3 ? 'farmland' : 'plain';
      } 
      // 6. Forest in the North
      else if (z <= 1 && x >= 3 && x < 7) {
        terrainType = random() > 0.3 ? 'forest' : 'plain';
      }
      // 7. Protected Wetlands (scattered edges)
      else if ((x === 0 && z === 5) || (x === 9 && z === 6) || (x === 5 && z === 0)) {
        terrainType = 'protected';
      }

      // Ensure the starting Town Hall center is plain and empty
      if (x === 4 && z === 4) {
        terrainType = 'plain';
      }

      tiles.push({
        id,
        x,
        z,
        terrainType,
        building: null,
      });
    }
  }

  return tiles;
}
