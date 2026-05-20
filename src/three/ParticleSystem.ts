import * as THREE from 'three';

interface SmokeParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  age: number;
  maxAge: number;
}

export class SmokestackParticleSystem {
  private container: THREE.Group;
  private particles: SmokeParticle[] = [];
  private smokeGeometry = new THREE.SphereGeometry(0.1, 4, 4);
  private smokeMaterial = new THREE.MeshBasicMaterial({
    color: 0x55555d,
    transparent: true,
    opacity: 0.8,
  });

  private lastSpawnTime = 0;
  private spawnInterval = 180; // Spawn every 180ms

  constructor(scene: THREE.Scene) {
    this.container = new THREE.Group();
    this.container.name = 'particle-container';
    scene.add(this.container);
  }

  /**
   * Spawns a smoke particle at the specified world coordinate.
   */
  public spawn(pos: THREE.Vector3) {
    const scale = 0.5 + Math.random() * 0.6;
    
    // Create a unique material instance so we can fade individual particles
    const mat = this.smokeMaterial.clone();
    mat.opacity = 0.6 + Math.random() * 0.2;
    mat.color.setHSL(0, 0, 0.3 + Math.random() * 0.15); // Variety of grey shades

    const mesh = new THREE.Mesh(this.smokeGeometry, mat);
    mesh.position.copy(pos);
    mesh.scale.setScalar(scale);

    this.container.add(mesh);

    const velocity = new THREE.Vector3(
      -0.08 + Math.random() * 0.16, // Slight left/right drift
      0.35 + Math.random() * 0.15,  // Primarily floating up
      -0.08 + Math.random() * 0.16  // Slight forward/backward drift
    );

    this.particles.push({
      mesh,
      velocity,
      age: 0,
      maxAge: 1200 + Math.random() * 800, // 1.2s to 2.0s life
    });
  }

  /**
   * Updates all active particles and manages spawns.
   */
  public update(time: number, deltaTimeMs: number, emitters: THREE.Object3D[], pollutionFactor: number) {
    const dt = deltaTimeMs / 1000;

    // 1. Spawn smoke particles at emitters
    // Emitters are smokestack tips found inside built Coal/Gas meshes
    if (time - this.lastSpawnTime > this.spawnInterval) {
      this.lastSpawnTime = time;
      
      // Only spawn if pollution is happening (i.e. pollution factor > 0)
      if (pollutionFactor > 0) {
        emitters.forEach((emitter) => {
          // Get world position of the emitter
          const worldPos = new THREE.Vector3();
          emitter.getWorldPosition(worldPos);
          
          // Spawn rate depends on pollution factor
          if (Math.random() < pollutionFactor * 0.8) {
            this.spawn(worldPos);
          }
        });
      }
    }

    // 2. Animate and recycle existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += deltaTimeMs;

      if (p.age >= p.maxAge) {
        // Recycle particle
        this.container.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
      } else {
        // Move particle
        p.mesh.position.addScaledVector(p.velocity, dt);

        // Expand particle slightly (smoke dissipation)
        const agePct = p.age / p.maxAge;
        p.mesh.scale.addScalar(dt * 0.25);

        // Fade out
        const mat = p.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - agePct) * 0.7;
      }
    }
  }

  /**
   * Cleans up all active particles.
   */
  public destroy() {
    this.particles.forEach((p) => {
      this.container.remove(p.mesh);
      (p.mesh.material as THREE.Material).dispose();
    });
    this.smokeGeometry.dispose();
    this.smokeMaterial.dispose();
    this.particles = [];
  }
}
