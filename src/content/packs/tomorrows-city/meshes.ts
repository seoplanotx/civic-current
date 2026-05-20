/**
 * Tomorrow's City — procedural Three.js meshes.
 *
 * Aesthetic: cool palette (cyan, magenta, deep blue), tall and slender
 * proportions, lots of emissive accents for that "high-tech glow" feel.
 *
 * All meshes use the `window-lights` tagged children so they participate
 * in the blackout/flicker effects from TileMapMesh.updateBlackoutFlicker.
 */

import * as THREE from 'three';

const palette = {
  deepBlue: 0x0a1a3f,
  steelBlue: 0x4a5d7e,
  cyan: 0x22d3ee,
  magenta: 0xff3ea5,
  white: 0xf0f4ff,
  graphite: 0x1a1a1f,
};

const mats = {
  glass: new THREE.MeshStandardMaterial({
    color: palette.deepBlue,
    metalness: 0.6,
    roughness: 0.2,
    transparent: true,
    opacity: 0.9,
  }),
  steel: new THREE.MeshStandardMaterial({ color: palette.steelBlue, metalness: 0.85, roughness: 0.25 }),
  graphite: new THREE.MeshStandardMaterial({ color: palette.graphite, roughness: 0.4 }),
  cyanGlow: new THREE.MeshStandardMaterial({ color: palette.cyan, emissive: palette.cyan, emissiveIntensity: 1.4 }),
  magentaGlow: new THREE.MeshStandardMaterial({ color: palette.magenta, emissive: palette.magenta, emissiveIntensity: 1.4 }),
  whiteGlow: new THREE.MeshStandardMaterial({ color: palette.white, emissive: palette.white, emissiveIntensity: 0.6 }),
  pad: new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.6 }),
};

/* ─────────────────────────────── factories ─────────────────────────────── */

function vertiport(): THREE.Group {
  const g = new THREE.Group();
  // Elevated platform on a central pillar
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.0, 10), mats.steel);
  pillar.position.y = 0.5;
  pillar.castShadow = true;
  g.add(pillar);

  // Top landing pad — wide hexagonal
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 6), mats.pad);
  pad.position.y = 1.04;
  pad.castShadow = true;
  pad.receiveShadow = true;
  g.add(pad);

  // Cyan landing-zone ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 6, 24), mats.cyanGlow);
  ring.name = 'window-lights';
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.09;
  g.add(ring);

  // Cross marking
  [0, Math.PI / 2].forEach((rotY) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.015, 0.06), mats.whiteGlow);
    bar.name = 'window-lights';
    bar.rotation.y = rotY;
    bar.position.y = 1.085;
    g.add(bar);
  });

  // Tiny eVTOL silhouette parked on pad
  const evtolBody = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mats.glass);
  evtolBody.scale.set(1.4, 0.6, 1.0);
  evtolBody.position.set(0.0, 1.18, 0.0);
  g.add(evtolBody);
  [-0.18, 0.18].forEach((x) => {
    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.015, 8), mats.cyanGlow);
    rotor.position.set(x, 1.21, 0);
    g.add(rotor);
  });

  return g;
}

function aiDatacenter(): THREE.Group {
  const g = new THREE.Group();
  // Black monolith server hall
  const hall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 1.2), mats.graphite);
  hall.position.y = 0.35;
  hall.castShadow = true;
  hall.receiveShadow = true;
  g.add(hall);

  // Vertical cyan LED columns
  [-0.7, -0.3, 0.3, 0.7].forEach((x) => {
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.04), mats.cyanGlow);
    led.name = 'window-lights';
    led.position.set(x, 0.35, 0.62);
    g.add(led);
  });

  // Magenta accent stripe on roof
  const accent = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.1), mats.magentaGlow);
  accent.name = 'window-lights';
  accent.position.set(0, 0.72, -0.5);
  g.add(accent);

  // Roof-mounted cooling exchangers — finned cylinders
  [-0.45, 0, 0.45].forEach((x) => {
    const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12), mats.steel);
    fin.position.set(x, 0.8, 0.2);
    fin.castShadow = true;
    g.add(fin);
  });

  return g;
}

function avHub(): THREE.Group {
  const g = new THREE.Group();
  // Open-air sloped hub with charging stalls
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1.3), mats.pad);
  base.position.y = 0.03;
  base.receiveShadow = true;
  g.add(base);

  // Curved canopy
  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16, 1, true, 0, Math.PI),
    mats.steel
  );
  canopy.rotation.z = Math.PI / 2;
  canopy.position.y = 0.6;
  canopy.castShadow = true;
  g.add(canopy);

  // Charging bay light strips
  [-0.6, -0.2, 0.2, 0.6].forEach((z) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.05), mats.cyanGlow);
    strip.name = 'window-lights';
    strip.position.set(-0.5, 0.07, z * 0.5);
    g.add(strip);
  });

  // Two parked AV pods
  [{ x: -0.35, z: -0.3 }, { x: 0.35, z: 0.3 }].forEach((pos) => {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16), mats.glass);
    pod.rotation.z = Math.PI / 2;
    pod.position.set(pos.x, 0.18, pos.z);
    pod.castShadow = true;
    g.add(pod);
  });

  return g;
}

function verticalFarm(): THREE.Group {
  const g = new THREE.Group();
  // Tall slender tower
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.6, 0.55), mats.glass);
  tower.position.y = 0.8;
  tower.castShadow = true;
  tower.receiveShadow = true;
  g.add(tower);

  // Green grow-light layers running up the tower
  for (let i = 0; i < 6; i++) {
    const y = 0.2 + i * 0.25;
    const layer = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.05, 0.6),
      new THREE.MeshStandardMaterial({
        color: 0x66ff7e,
        emissive: 0x66ff7e,
        emissiveIntensity: 1.0,
      })
    );
    layer.name = 'window-lights';
    layer.position.y = y;
    g.add(layer);
  }

  // Top observation cap
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.25, 6), mats.steel);
  cap.position.y = 1.72;
  cap.castShadow = true;
  g.add(cap);

  return g;
}

function quantumLab(): THREE.Group {
  const g = new THREE.Group();
  // Low concrete bunker (suppress vibrations)
  const bunker = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 1.3), mats.steel);
  bunker.position.y = 0.225;
  bunker.castShadow = true;
  bunker.receiveShadow = true;
  g.add(bunker);

  // Central chandelier-style cryogenic dilution refrigerator
  const cryoTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.05, 0.4, 10), mats.steel);
  cryoTop.position.y = 0.6;
  g.add(cryoTop);
  const cryoMid = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.2, 10), mats.cyanGlow);
  cryoMid.name = 'window-lights';
  cryoMid.position.y = 0.45;
  g.add(cryoMid);
  const cryoBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 0.18, 10), mats.steel);
  cryoBottom.position.y = 0.32;
  g.add(cryoBottom);

  // Magenta pulse halo around the cryo
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.012, 6, 24), mats.magentaGlow);
  halo.name = 'window-lights';
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.5;
  g.add(halo);

  return g;
}

function droneDepot(): THREE.Group {
  const g = new THREE.Group();
  // Hexagonal flat hangar
  const hangar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.3, 6), mats.steel);
  hangar.position.y = 0.15;
  hangar.castShadow = true;
  hangar.receiveShadow = true;
  g.add(hangar);

  // Six docking bays around perimeter — small cyan markers
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.18), mats.cyanGlow);
    marker.name = 'window-lights';
    marker.position.set(Math.cos(angle) * 0.55, 0.32, Math.sin(angle) * 0.55);
    marker.rotation.y = -angle;
    g.add(marker);
  }

  // Three drones hovering at different heights
  [
    { x: 0.0, y: 0.7, z: 0.0 },
    { x: 0.35, y: 0.55, z: -0.2 },
    { x: -0.3, y: 0.85, z: 0.2 },
  ].forEach((pos) => {
    const drone = new THREE.Group();
    drone.position.set(pos.x, pos.y, pos.z);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.1), mats.graphite);
    drone.add(body);
    // 4 rotor arms
    [
      [0.07, 0.07],
      [-0.07, 0.07],
      [0.07, -0.07],
      [-0.07, -0.07],
    ].forEach(([rx, rz]) => {
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.008, 8), mats.cyanGlow);
      rotor.position.set(rx, 0.025, rz);
      drone.add(rotor);
    });
    g.add(drone);
  });

  return g;
}

/* ─────────────────────────────── exports ───────────────────────────────── */

export const TOMORROWS_MESHES: Record<string, () => THREE.Group> = {
  'tomorrow.vertiport': vertiport,
  'tomorrow.ai_datacenter': aiDatacenter,
  'tomorrow.av_hub': avHub,
  'tomorrow.vertical_farm': verticalFarm,
  'tomorrow.quantum_lab': quantumLab,
  'tomorrow.drone_depot': droneDepot,
};
