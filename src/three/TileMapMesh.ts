import * as THREE from 'three';
import type { Tile, TerrainType } from '../types';
import { getContentRegistry } from '../content/init';
import { createBuildingMesh } from './BuildingModels';

/**
 * Helper — resolves a terrain id through the registry, falling back to a
 * "missing pack" placeholder so the canvas never crashes when a tile
 * references a terrain whose owning pack is not loaded.
 */
function getTerrainDef(id: string) {
  const def = getContentRegistry().getTerrain(id);
  if (def) return def;
  // Loud-but-safe fallback for unowned packs / dev-time typos
  return { name: id, description: '', color: '#666666', height: 1.0, buildable: false };
}

export class TileMapMesh {
  private group: THREE.Group;
  private tileMeshes: Map<string, THREE.Mesh> = new Map();
  private buildingMeshes: Map<string, THREE.Group> = new Map();
  
  // Selection / Hover indicators
  private hoverMesh: THREE.Mesh;
  private selectMesh: THREE.LineSegments;
  
  private activeSelectId: string | null = null;
  private baseSelectY = 0;

  // Reusable decorative materials
  private leafMat = new THREE.MeshStandardMaterial({ color: 0x1e6f3d, roughness: 0.8 });
  private woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3e1a, roughness: 0.9 });
  private rockMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 });
  private sandMat = new THREE.MeshStandardMaterial({ color: 0xe6c280, roughness: 0.8 });
  private copperMat = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.9, roughness: 0.1 });
  private furrowMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.95 });
  private waveMat = new THREE.MeshStandardMaterial({
    color: 0x3da5d9,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85
  });
  private foamMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95
  });

  private spacing = 2.0;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'tilemap-group';
    scene.add(this.group);

    // 1. Create a beautiful baseboard framing the map
    const baseGeo = new THREE.BoxGeometry(20.4, 0.4, 20.4);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.9, metalness: 0.1 });
    const baseboard = new THREE.Mesh(baseGeo, baseMat);
    baseboard.position.set(0, -0.2, 0);
    baseboard.receiveShadow = true;
    this.group.add(baseboard);

    // 2. Setup Hover Overlay Mesh
    const hoverGeo = new THREE.PlaneGeometry(1.85, 1.85);
    hoverGeo.rotateX(-Math.PI / 2);
    const hoverMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.hoverMesh = new THREE.Mesh(hoverGeo, hoverMat);
    this.hoverMesh.position.y = 1000; // hide initially
    scene.add(this.hoverMesh);

    // 3. Setup Selection Neon Box
    const selectBoxGeo = new THREE.BoxGeometry(1.9, 0.2, 1.9);
    const edges = new THREE.EdgesGeometry(selectBoxGeo);
    const selectLineMat = new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 2 });
    this.selectMesh = new THREE.LineSegments(edges, selectLineMat);
    this.selectMesh.position.y = 1000; // hide initially
    scene.add(this.selectMesh);
  }

  /**
   * Translates grid coordinate x,z to world space X,Y,Z.
   */
  public gridToWorld(x: number, z: number, yOffset = 0): THREE.Vector3 {
    const worldX = (x - 4.5) * this.spacing;
    const worldZ = (z - 4.5) * this.spacing;
    return new THREE.Vector3(worldX, yOffset, worldZ);
  }

  /**
   * Initializes or updates the 3D tiles based on the tiles data array.
   */
  public syncMap(tiles: Tile[]) {
    // Clear buildings first
    this.buildingMeshes.forEach((mesh) => {
      this.group.remove(mesh);
    });
    this.buildingMeshes.clear();

    const waterCoords = new Set<string>(
      tiles.filter((t) => t.terrainType === 'river' || t.terrainType === 'beach').map((t) => `${t.x},${t.z}`)
    );

    tiles.forEach((tile) => {
      const id = tile.id;
      const def = getTerrainDef(tile.terrainType);
      const worldPos = this.gridToWorld(tile.x, tile.z);

      // Create tile base block if it doesn't exist
      let tileMesh = this.tileMeshes.get(id);
      if (!tileMesh) {
        const height = def.height;
        const geo = new THREE.BoxGeometry(1.8, height, 1.8);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(def.color),
          roughness: 0.85,
          metalness: 0.05
        });
        
        tileMesh = new THREE.Mesh(geo, mat);
        // Store the terrain type so applyTheme() can resolve each cached tile's
        // base color from the registry / a theme color map without re-walking
        // the tiles array.
        tileMesh.userData = { tileId: id, x: tile.x, z: tile.z, terrainType: tile.terrainType };
        tileMesh.position.copy(worldPos);
        tileMesh.position.y = height / 2;
        tileMesh.castShadow = true;
        tileMesh.receiveShadow = true;
        
        this.group.add(tileMesh);
        this.tileMeshes.set(id, tileMesh);

        // Decorate Tiles with beautiful low-poly micro props
        this.decorateTile(tileMesh, tile.terrainType, height, waterCoords);
      }

      // Render buildings if built — prefer pack-supplied mesh factory,
      // fall back to the base procedural meshes for legacy building ids.
      if (tile.building) {
        const height = def.height;
        const factory = getContentRegistry().getBuildingMesh(tile.building);
        const bGroup = factory
          ? factory()
          : createBuildingMesh(tile.building as never);

        // Position directly on the surface of the tile
        bGroup.position.copy(worldPos);
        bGroup.position.y = height;

        this.group.add(bGroup);
        this.buildingMeshes.set(id, bGroup);
      }
    });
  }

  /**
   * Re-colors the EXISTING cached tile meshes in place to reflect an equipped
   * cosmetic theme. Iterates every tile mesh, resolves its terrain type from
   * userData, and sets its material color to the themed value.
   *
   * Source of truth: the passed `colors` map (terrain id → hex) wins; where a
   * terrain has no override the tile falls back to the registry's current
   * terrain color (which is itself theme-adjusted by getTerrains()). This means
   * passing `{}` cleanly reverts every tile to its default look.
   *
   * The hills crest decoration shares the tile mesh's material, so it re-colors
   * for free; other decorations keep their own (intentional) accent materials.
   */
  public applyTheme(colors: Partial<Record<string, string>>) {
    this.tileMeshes.forEach((mesh) => {
      const type = mesh.userData.terrainType as TerrainType | undefined;
      if (!type) return;
      const hex = colors[type] ?? getTerrainDef(type).color;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.color.set(hex);
    });
  }

  /**
   * Decorates tiles procedurally with micro props to make them pop.
   */
  private decorateTile(tileMesh: THREE.Mesh, type: TerrainType, height: number, waterCoords?: Set<string>) {
    const group = new THREE.Group();
    group.name = 'decorations';
    tileMesh.add(group);

    if (type === 'forest') {
      // Create 3 tiny procedurally positioned trees
      const positions = [
        { x: -0.4, z: -0.3, s: 0.7 },
        { x: 0.3, z: 0.2, s: 0.85 },
        { x: -0.15, z: 0.4, s: 0.6 }
      ];
      positions.forEach((pos) => {
        const tree = new THREE.Group();
        tree.position.set(pos.x, height / 2, pos.z);
        tree.scale.setScalar(pos.s);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.22, 5), this.woodMat);
        trunk.position.y = 0.11;
        trunk.castShadow = true;
        tree.add(trunk);

        const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 5), this.leafMat);
        leaves.position.y = 0.38;
        leaves.castShadow = true;
        tree.add(leaves);

        group.add(tree);
      });

    } else if (type === 'coal') {
      // Scattered coal chunks
      const positions = [
        { x: -0.3, z: 0.3, s: 0.12 },
        { x: 0.4, z: -0.2, s: 0.15 },
        { x: 0.1, z: 0.35, s: 0.1 }
      ];
      positions.forEach((pos) => {
        const rock = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.rockMat);
        rock.position.set(pos.x, height / 2 + pos.s / 2, pos.z);
        rock.scale.setScalar(pos.s);
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        rock.castShadow = true;
        group.add(rock);
      });

    } else if (type === 'hills') {
      // Put a nice organic grassy hill crest
      const hillGeo = new THREE.SphereGeometry(0.65, 8, 8);
      hillGeo.scale(1.0, 0.45, 1.0);
      const hillMesh = new THREE.Mesh(hillGeo, tileMesh.material);
      hillMesh.position.set(0, height / 2, 0);
      hillMesh.castShadow = true;
      group.add(hillMesh);

    } else if (type === 'farmland') {
      // Furrow ridges (thin box strips in brown-yellow)
      for (let i = -0.6; i <= 0.6; i += 0.3) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 1.4), this.furrowMat);
        strip.position.set(i, height / 2 + 0.015, 0);
        group.add(strip);
      }

    } else if (type === 'river') {
      const x = Number(tileMesh.userData.x);
      const z = Number(tileMesh.userData.z);

      // Draw borders only where there is no adjacent river or beach tile!
      const hasWestWater = waterCoords?.has(`${x - 1},${z}`) ?? false;
      const hasEastWater = waterCoords?.has(`${x + 1},${z}`) ?? false;
      const hasNorthWater = waterCoords?.has(`${x},${z - 1}`) ?? false;
      const hasSouthWater = waterCoords?.has(`${x},${z + 1}`) ?? false;

      // West Bank
      if (!hasWestWater) {
        const border = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 2.02), this.sandMat);
        border.position.set(-1.0, height / 2 + 0.01, 0);
        group.add(border);
      }

      // East Bank
      if (!hasEastWater) {
        const border = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 2.02), this.sandMat);
        border.position.set(1.0, height / 2 + 0.01, 0);
        group.add(border);
      }

      // North Bank
      if (!hasNorthWater) {
        const border = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.04, 0.12), this.sandMat);
        border.position.set(0, height / 2 + 0.01, -1.0);
        group.add(border);
      }

      // South Bank
      if (!hasSouthWater) {
        const border = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.04, 0.12), this.sandMat);
        border.position.set(0, height / 2 + 0.01, 1.0);
        group.add(border);
      }

    } else if (type === 'beach') {
      // 1. Eastern Water Half (ocean side)
      const wave = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 1.82), this.waveMat);
      wave.name = 'beach-wave';
      wave.position.set(0.45, height / 2 + 0.02, 0);
      group.add(wave);

      // 2. Wave Foam Line
      const foam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.045, 1.82), this.foamMat);
      foam.name = 'beach-foam';
      foam.position.set(0.0, height / 2 + 0.022, 0);
      group.add(foam);

      // 3. Small wooden beach driftwood / logs (placed on the sandy western half)
      const positions = [
        { x: -0.45, z: -0.3, s: 0.14 },
        { x: -0.25, z: 0.35, s: 0.1 }
      ];
      positions.forEach((pos) => {
        const drift = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 5), this.woodMat);
        drift.position.set(pos.x, height / 2 + 0.02, pos.z);
        drift.rotation.set(0, Math.random() * Math.PI, Math.PI / 2);
        drift.castShadow = true;
        group.add(drift);
      });

      // 4. Small green seagrass blades (placed on the dry sand)
      [-0.5, -0.3].forEach((xPos) => {
        const grass = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.15, 4), this.leafMat);
        grass.position.set(xPos, height / 2 + 0.075, Math.random() * 0.4 - 0.2);
        grass.rotation.set(0.1, 0.2, -0.05);
        group.add(grass);
      });

    } else if (type === 'gas') {
      // Small copper valves or gas cap pipes
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 6), this.woodMat); // dark color
      pipe.position.set(-0.3, height / 2 + 0.125, 0.3);
      pipe.castShadow = true;
      group.add(pipe);

      const valve = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), this.copperMat);
      valve.position.set(-0.3, height / 2 + 0.25, 0.3);
      group.add(valve);
    }
  }

  /**
   * Sets the current hovered tile and moves the hover box.
   */
  public setHover(tileId: string | null, tiles: Tile[]) {
    if (!tileId) {
      this.hoverMesh.position.y = 1000;
      return;
    }

    const tile = tiles.find((t) => t.id === tileId);
    if (tile) {
      const def = getTerrainDef(tile.terrainType);
      const worldPos = this.gridToWorld(tile.x, tile.z);
      this.hoverMesh.position.copy(worldPos);
      this.hoverMesh.position.y = def.height + 0.015; // Hover directly on top face
    }
  }

  /**
   * Sets the active selected tile and attaches the indicator ring/box.
   */
  public setSelect(tileId: string | null, tiles: Tile[]) {
    this.activeSelectId = tileId;
    if (!tileId) {
      this.selectMesh.position.y = 1000;
      return;
    }

    const tile = tiles.find((t) => t.id === tileId);
    if (tile) {
      const def = getTerrainDef(tile.terrainType);
      const worldPos = this.gridToWorld(tile.x, tile.z);
      this.selectMesh.position.copy(worldPos);
      
      // Stand directly around the tile top surface
      // Add standard offset
      this.baseSelectY = def.height + 0.1;
      this.selectMesh.position.y = this.baseSelectY;
    }
  }

  /**
   * Updates animations on the board (spins turbine blades, bobs selectors).
   */
  public update(time: number) {
    // 1. Rotate Wind Turbine rotors
    this.buildingMeshes.forEach((mesh) => {
      const rotor = mesh.getObjectByName('rotor');
      if (rotor) {
        // Spin blades dynamically!
        rotor.rotation.z += 0.045;
      }
    });

    // 2. Bob selection indicator smoothly up and down
    if (this.activeSelectId) {
      this.selectMesh.position.y = this.baseSelectY + Math.sin(time * 0.005) * 0.04;
    }

    // 3. Dynamic Wave & Foam Rolling on Coastal Beaches
    this.tileMeshes.forEach((mesh) => {
      const decorGroup = mesh.getObjectByName('decorations');
      if (decorGroup) {
        const wave = decorGroup.getObjectByName('beach-wave') as THREE.Mesh;
        const foam = decorGroup.getObjectByName('beach-foam') as THREE.Mesh;

        if (wave && foam) {
          // Unique wave phase offset based on tile's grid coordinate z
          const zCoord = mesh.userData.z ?? 0;
          const phase = zCoord * 0.7;
          
          // Sine wave oscillation for wave flow
          const scaleOffset = Math.sin(time * 0.0028 + phase) * 0.12;
          
          // Scale wave box horizontally (stretching onto the beach)
          wave.scale.x = 1.0 + scaleOffset;
          // Shift position to anchor the right edge to x = 0.9 (eastern border)
          wave.position.x = 0.9 - 0.45 * wave.scale.x;

          // Slide white foam exactly at the wave crest's leading left boundary
          foam.position.x = 0.9 * (1.0 - wave.scale.x);
        }
      }
    });
  }

  /**
   * Finds all active smokestack emitters from placed structures.
   */
  public getEmitters(): { emitter: THREE.Object3D; type: string }[] {
    const list: { emitter: THREE.Object3D; type: string }[] = [];
    
    this.buildingMeshes.forEach((bGroup) => {
      bGroup.traverse((child) => {
        if (child.name === 'smoke-emitter') {
          const type = bGroup.name.includes('coal') ? 'coal' : 'gas';
          list.push({ emitter: child, type });
        }
      });
    });

    return list;
  }

  /**
   * Controls flickering window lights during blackouts or low reliability.
   */
  public updateBlackoutFlicker(reliability: number) {
    // If grid is highly stable, keep lights fully emissive
    // If grid reliability is low, flicker lights
    const threshold = 85;
    const shouldFlicker = reliability < threshold;
    const isOutage = reliability < 40;

    this.buildingMeshes.forEach((bGroup) => {
      bGroup.traverse((child) => {
        if (child.name === 'window-lights' && child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat) {
            if (isOutage) {
              // Completely dark lights
              mat.emissiveIntensity = 0.0;
            } else if (shouldFlicker) {
              // Flicker lights randomly
              const gap = threshold - reliability;
              const flickerRoll = Math.random();
              mat.emissiveIntensity = flickerRoll > gap * 0.012 ? 0.8 : 0.05;
            } else {
              // Stable power glow
              mat.emissiveIntensity = 0.85;
            }
          }
        }
      });
    });
  }

  /**
   * Retrieves the raw list of tile meshes for raycasting.
   */
  public getRaycastTargets(): THREE.Mesh[] {
    return Array.from(this.tileMeshes.values());
  }

  public destroy() {
    this.tileMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.buildingMeshes.forEach((mesh) => {
      this.group.remove(mesh);
    });
    this.leafMat.dispose();
    this.woodMat.dispose();
    this.rockMat.dispose();
    this.sandMat.dispose();
    this.copperMat.dispose();
    this.furrowMat.dispose();
    this.waveMat.dispose();
    this.foamMat.dispose();
  }
}
