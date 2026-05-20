/**
 * Throwback Era — procedural Three.js meshes for the pack's buildings.
 *
 * Built from primitives to avoid external assets. Aesthetic cues:
 *   - Warm palette (amber, brick red, cream)
 *   - Boxy / chunky proportions evocative of 80s/90s suburban architecture
 *   - Tactile details (signage, parking lots, gas pumps)
 *
 * These meshes are wired to the pack via the manifest's `buildingMeshes`
 * map in index.ts.
 */

import * as THREE from 'three';

const palette = {
  brickRed: 0xb33a3a,
  amber: 0xf59e0b,
  cream: 0xfff4d8,
  concrete: 0x808080,
  asphalt: 0x2f2f2f,
  chrome: 0xc8c8d0,
  neon: 0xff3366,
  greenSign: 0x4caf50,
  windowGlow: 0xffea00,
};

const mats = {
  brick: new THREE.MeshStandardMaterial({ color: palette.brickRed, roughness: 0.9 }),
  amber: new THREE.MeshStandardMaterial({ color: palette.amber, roughness: 0.6 }),
  cream: new THREE.MeshStandardMaterial({ color: palette.cream, roughness: 0.7 }),
  concrete: new THREE.MeshStandardMaterial({ color: palette.concrete, roughness: 0.85 }),
  asphalt: new THREE.MeshStandardMaterial({ color: palette.asphalt, roughness: 0.95 }),
  chrome: new THREE.MeshStandardMaterial({ color: palette.chrome, metalness: 0.9, roughness: 0.15 }),
  neonGlow: new THREE.MeshStandardMaterial({ color: palette.neon, emissive: palette.neon, emissiveIntensity: 1.2 }),
  greenSign: new THREE.MeshStandardMaterial({ color: palette.greenSign, emissive: palette.greenSign, emissiveIntensity: 0.6 }),
  windowGlow: new THREE.MeshStandardMaterial({ color: palette.windowGlow, emissive: palette.windowGlow, emissiveIntensity: 0.8 }),
};

/* ─────────────────────────────── factories ─────────────────────────────── */

function driveInDiner(): THREE.Group {
  const g = new THREE.Group();
  // Half-cylinder retro diner body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16, 1, false, 0, Math.PI),
    mats.cream
  );
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.4;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Red horizontal stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.06, 0.82), mats.brick);
  stripe.position.y = 0.35;
  g.add(stripe);

  // Neon "DINER" sign (vertical neon tube)
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), mats.neonGlow);
  sign.name = 'window-lights';
  sign.position.set(-0.55, 0.7, 0.45);
  g.add(sign);

  // Asphalt parking lot
  const lot = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 1.6), mats.asphalt);
  lot.position.y = 0.01;
  g.add(lot);

  return g;
}

function stripMall(): THREE.Group {
  const g = new THREE.Group();
  // Long single-story strip with 4 storefront bays
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 0.55), mats.cream);
  base.position.y = 0.2;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  // Flat overhang awning
  const awning = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.04, 0.65), mats.brick);
  awning.position.y = 0.41;
  g.add(awning);

  // Storefront window strip
  const windows = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.18, 0.04), mats.windowGlow);
  windows.name = 'window-lights';
  windows.position.set(0, 0.22, 0.28);
  g.add(windows);

  // Parking lot
  const lot = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 1.7), mats.asphalt);
  lot.position.y = 0.005;
  g.add(lot);

  return g;
}

function autoPlant(): THREE.Group {
  const g = new THREE.Group();
  // Wide low warehouse
  const hangar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 1.2), mats.concrete);
  hangar.position.y = 0.275;
  hangar.castShadow = true;
  hangar.receiveShadow = true;
  g.add(hangar);

  // Sawtooth roof segments
  [-0.45, 0, 0.45].forEach((x) => {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 1.22), mats.brick);
    seg.position.set(x, 0.6, 0);
    seg.rotation.z = -Math.PI / 12;
    g.add(seg);
  });

  // Big smokestack (this is a dirty industrial pack after all)
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 1.2, 8), mats.concrete);
  stack.position.set(0.55, 0.75, -0.45);
  stack.castShadow = true;
  g.add(stack);
  const smoke = new THREE.Object3D();
  smoke.name = 'smoke-emitter';
  smoke.position.set(0.55, 1.4, -0.45);
  g.add(smoke);

  // Boxy cars in the lot
  const carColors = [0xd72631, 0x1e88e5, 0xfbc02d];
  carColors.forEach((c, i) => {
    const car = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.1, 0.32),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 })
    );
    car.position.set(-0.6 + i * 0.3, 0.08, 0.55);
    g.add(car);
  });

  return g;
}

function tractHousing(): THREE.Group {
  const g = new THREE.Group();
  // 4 identical cookie-cutter houses arranged in a grid
  const cellPositions = [
    { x: -0.35, z: -0.35 },
    { x: 0.35, z: -0.35 },
    { x: -0.35, z: 0.35 },
    { x: 0.35, z: 0.35 },
  ];
  cellPositions.forEach((pos) => {
    const house = new THREE.Group();
    house.position.set(pos.x, 0, pos.z);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.25, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xf1e8d8, roughness: 0.7 })
    );
    body.position.y = 0.125;
    body.castShadow = true;
    house.add(body);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.16, 4),
      new THREE.MeshStandardMaterial({ color: palette.asphalt, roughness: 0.9 })
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.33;
    house.add(roof);

    const window = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.07, 0.02),
      mats.windowGlow
    );
    window.name = 'window-lights';
    window.position.set(0, 0.16, 0.18);
    house.add(window);

    g.add(house);
  });

  return g;
}

function dialUpIsp(): THREE.Group {
  const g = new THREE.Group();
  // Small office building
  const office = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), mats.cream);
  office.position.y = 0.25;
  office.castShadow = true;
  office.receiveShadow = true;
  g.add(office);

  // Beige cube modem icon on the roof (oversized for visibility)
  const modem = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.18, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xe8d7a0, roughness: 0.5 })
  );
  modem.position.y = 0.6;
  g.add(modem);

  // Two blinking LED indicators
  [-0.06, 0.06].forEach((x) => {
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), mats.greenSign);
    led.name = 'window-lights';
    led.position.set(x, 0.65, 0.11);
    g.add(led);
  });

  // Old-school satellite dish
  const dishStand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.15, 6), mats.chrome);
  dishStand.position.set(0.3, 0.58, 0.35);
  g.add(dishStand);
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    mats.chrome
  );
  dish.position.set(0.3, 0.7, 0.35);
  dish.rotation.x = -Math.PI / 4;
  g.add(dish);

  return g;
}

function gasMegaplex(): THREE.Group {
  const g = new THREE.Group();
  // Convenience store
  const store = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.7), mats.cream);
  store.position.set(0.35, 0.225, -0.2);
  store.castShadow = true;
  store.receiveShadow = true;
  g.add(store);

  // Giant illuminated canopy over the pumps
  const canopyTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.9), mats.amber);
  canopyTop.position.set(-0.3, 0.7, 0.1);
  g.add(canopyTop);
  // Canopy support pillar
  [-0.75, 0.15].forEach((x) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), mats.chrome);
    pillar.position.set(x, 0.35, 0.1);
    g.add(pillar);
  });

  // Three gas pumps under canopy
  [-0.55, -0.3, -0.05].forEach((x) => {
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.15), mats.chrome);
    pump.position.set(x, 0.15, 0.1);
    g.add(pump);
    const display = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.02), mats.windowGlow);
    display.name = 'window-lights';
    display.position.set(x, 0.25, 0.18);
    g.add(display);
  });

  // Asphalt
  const lot = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 1.7), mats.asphalt);
  lot.position.y = 0.005;
  g.add(lot);

  return g;
}

/* ─────────────────────────────── exports ───────────────────────────────── */

export const THROWBACK_MESHES: Record<string, () => THREE.Group> = {
  'throwback.drive_in_diner': driveInDiner,
  'throwback.strip_mall': stripMall,
  'throwback.auto_plant': autoPlant,
  'throwback.tract_housing': tractHousing,
  'throwback.dial_up_isp': dialUpIsp,
  'throwback.gas_megaplex': gasMegaplex,
};
