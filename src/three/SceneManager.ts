import * as THREE from 'three';
import { TileMapMesh } from './TileMapMesh';
import { SmokestackParticleSystem } from './ParticleSystem';
import type { Tile } from '../types';

export class SceneManager {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  
  // Custom managers
  private tileMap: TileMapMesh;
  private particles: SmokestackParticleSystem;

  // Raycasting
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Callbacks
  private onTileSelect: (tileId: string | null) => void;

  // Render loop tracking
  private animationFrameId: number | null = null;
  private lastTime = 0;

  // Camera orbit and zoom state
  private theta = Math.PI / 4; // Azimuthal angle (horizontal)
  private phi = Math.acos(10.9 / 21.9843); // Polar angle (vertical pitch)
  private radius = 21.9843; // Distance to target
  private zoomSize = 9.2; // View bounds (zoom size for orthographic)
  private target = new THREE.Vector3(0, 0.6, 0);

  // Dragging state
  private isDragging = false;
  private hasDragged = false;
  private startPointerX = 0;
  private startPointerY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;

  constructor(
    canvas: HTMLCanvasElement,
    tiles: Tile[],
    onTileSelect: (tileId: string | null) => void
  ) {
    this.canvas = canvas;
    this.onTileSelect = onTileSelect;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // 1. Initialize WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Initialize Scene
    this.scene = new THREE.Scene();
    
    // Default bright blue sky background and Exp2 Fog
    this.scene.background = new THREE.Color(0xeef6fc);
    this.scene.fog = new THREE.FogExp2(0xeef6fc, 0.015);

    // 3. Initialize Isometric Orthographic Camera
    const aspect = width / height;
    this.camera = new THREE.OrthographicCamera(
      -this.zoomSize * aspect,
      this.zoomSize * aspect,
      this.zoomSize,
      -this.zoomSize,
      0.1,
      1000
    );
    this.updateCameraPosition();

    // 4. Lights Setup
    const ambientLight = new THREE.AmbientLight(0xfffdf6, 1.4); // warm light
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(14, 18, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    
    // Fit Ortho shadow camera bounds to our 10x10 map
    const d = 12;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;

    this.scene.add(dirLight);

    // 5. Instantiate TileMap and Particles
    this.tileMap = new TileMapMesh(this.scene);
    this.particles = new SmokestackParticleSystem(this.scene);

    this.tileMap.syncMap(tiles);

    // 6. Setup Event Listeners
    this.setupListeners();

    // 7. Start Render Loop
    this.lastTime = performance.now();
    this.animate(this.lastTime);
  }

  /**
   * Syncs the 3D grid with updated React tile state data.
   */
  public updateTiles(tiles: Tile[]) {
    this.tileMap.syncMap(tiles);
  }

  /**
   * Applies an equipped cosmetic theme's terrain colors to the live board.
   * Forwards to the TileMapMesh, which recolors cached tile materials in place.
   */
  public applyTheme(colors: Partial<Record<string, string>>) {
    this.tileMap.applyTheme(colors);
  }

  /**
   * Syncs the selection and hover graphics.
   */
  public setSelectedAndHover(selectedId: string | null, hoveredId: string | null, tiles: Tile[]) {
    this.tileMap.setSelect(selectedId, tiles);
    this.tileMap.setHover(hoveredId, tiles);
  }

  /**
   * Translates pollution to smog visual feedback: fog density and sky color.
   */
  public updateSmog(pollution: number, reliability: number) {
    // 1. Dynamic smog color mapping: from light sky blue to toxic coal-grey
    const pollutionPct = pollution / 100;
    const cleanSky = new THREE.Color(0xeef6fc);
    const smogSky = new THREE.Color(0x3e3e44);
    
    const skyColor = cleanSky.clone().lerp(smogSky, pollutionPct);
    
    this.scene.background = skyColor;
    
    // Update Fog
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(skyColor);
      this.scene.fog.density = 0.015 + pollutionPct * 0.028; // thicker fog when polluted
    }

    // 2. Flicker lights on housing districts during outages
    this.tileMap.updateBlackoutFlicker(reliability);
  }

  /**
   * Main Render and Animation Tick Loop.
   */
  private animate = (time: number) => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    // 1. Update Tilemap animations (turbines, hover effects)
    this.tileMap.update(time);

    // 2. Update Industrial smokestack particles
    const emitters = this.tileMap.getEmitters().map((e) => e.emitter);
    
    // Fetch pollution factor to determine how much smoke to release
    const pollutionEmitterFactor = emitters.length > 0 ? 0.8 : 0;
    this.particles.update(time, deltaTime, emitters, pollutionEmitterFactor);

    // 3. Render Scene
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Recalculates the camera position in spherical coordinates relative to target.
   */
  private updateCameraPosition() {
    const sinPhi = Math.sin(this.phi);
    const cosPhi = Math.cos(this.phi);
    const sinTheta = Math.sin(this.theta);
    const cosTheta = Math.cos(this.theta);

    const x = this.target.x + this.radius * sinPhi * sinTheta;
    const y = this.target.y + this.radius * cosPhi;
    const z = this.target.z + this.radius * sinPhi * cosTheta;

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  /**
   * Recalculates the orthographic camera's frustum limits.
   */
  private updateFrustum() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const aspect = width / height;

    this.camera.left = -this.zoomSize * aspect;
    this.camera.right = this.zoomSize * aspect;
    this.camera.top = this.zoomSize;
    this.camera.bottom = -this.zoomSize;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Configures canvas window resizing, pointer actions for orbit/hover, and wheel zoom.
   */
  private setupListeners() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private onPointerDown = (e: PointerEvent) => {
    this.isDragging = true;
    this.hasDragged = false;
    this.startPointerX = e.clientX;
    this.startPointerY = e.clientY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.canvas.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    const bounds = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1;

    if (this.isDragging) {
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;

      const dist = Math.hypot(e.clientX - this.startPointerX, e.clientY - this.startPointerY);
      if (dist > 4) {
        this.hasDragged = true;
      }

      // Sensible rotation speeds
      const sensitivity = 0.005;
      this.theta -= dx * sensitivity;
      this.phi -= dy * sensitivity;

      // Clamp vertical polar angle to avoid gimbal lock or floor clipping
      this.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.phi));

      this.updateCameraPosition();

      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    } else {
      // Normal hover checks when not dragging
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.tileMap.getRaycastTargets());

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        if (mesh.userData && mesh.userData.tileId) {
          this.canvas.dispatchEvent(
            new CustomEvent('tile-hover', { detail: mesh.userData.tileId })
          );
          return;
        }
      }
      this.canvas.dispatchEvent(new CustomEvent('tile-hover', { detail: null }));
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.isDragging) {
      this.canvas.releasePointerCapture(e.pointerId);
      this.isDragging = false;
    }

    // Only select the tile if the user performed a clean click/tap without dragging
    if (!this.hasDragged) {
      const bounds = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1;
      this.mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.tileMap.getRaycastTargets());

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        if (clickedMesh.userData && clickedMesh.userData.tileId) {
          this.onTileSelect(clickedMesh.userData.tileId);
          return;
        }
      }
      
      this.onTileSelect(null);
    }
    
    this.hasDragged = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();

    // Zoom speed scaled by the current zoom size to feel natural
    const zoomFactor = 0.003;
    this.zoomSize += e.deltaY * zoomFactor * this.zoomSize;

    // Clamp zoomSize
    this.zoomSize = Math.max(4.0, Math.min(18.0, this.zoomSize));

    this.updateFrustum();
  };

  /**
   * Handles resizing of canvas container.
   */
  public handleResize() {
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    this.updateFrustum();
  }

  /**
   * Cleans up all event listeners and geometries/materials.
   */
  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    
    this.tileMap.destroy();
    this.particles.destroy();
    this.renderer.dispose();
  }
}
