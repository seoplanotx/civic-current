import * as THREE from 'three';
import type { BuildingType } from '../types';

/**
 * Procedural low-poly 3D models for all building types.
 * Constructed dynamically using Three.js primitives to avoid external assets.
 */
export function createBuildingMesh(type: BuildingType): THREE.Group {
  const group = new THREE.Group();
  group.name = `building-${type}`;

  // Common materials
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.8, roughness: 0.2 });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x55555d, roughness: 0.8 });
  const windowLightMat = new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffaa00, emissiveIntensity: 0.8 });
  const neonBlueMat = new THREE.MeshStandardMaterial({ color: 0x00d2ff, emissive: 0x00aaff, emissiveIntensity: 1.2 });
  const neonPurpleMat = new THREE.MeshStandardMaterial({ color: 0xa800ff, emissive: 0x8600c8, emissiveIntensity: 1.5 });
  const ferrisWheelMat = new THREE.MeshStandardMaterial({ color: 0xff4081, metalness: 0.3, roughness: 0.4 });
  const turfMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.9 });
  const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
  const bioDomeMat = new THREE.MeshStandardMaterial({ color: 0x81c784, roughness: 0.5 });
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x0a1e3f, roughness: 0.1, metalness: 0.9 });
  
  if (type === 'coalPlant') {
    // Main building structure
    const baseGeo = new THREE.BoxGeometry(1.2, 0.6, 1.0);
    const baseMesh = new THREE.Mesh(baseGeo, concreteMat);
    baseMesh.position.y = 0.3;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // Smokestacks (2 tall cylinders)
    const stackGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.4, 8);
    const bandGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.15, 8);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.7 });

    [-0.3, 0.3].forEach((offset) => {
      const stack = new THREE.Mesh(stackGeo, concreteMat);
      stack.position.set(offset, 0.8, 0.2);
      stack.castShadow = true;
      stack.receiveShadow = true;
      group.add(stack);

      // Add a red warning stripe near the top
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.set(offset, 1.2, 0.2);
      group.add(band);

      // Create a marker for particle systems (smokestack tip)
      const smokeMarker = new THREE.Object3D();
      smokeMarker.name = 'smoke-emitter';
      smokeMarker.position.set(offset, 1.5, 0.2);
      group.add(smokeMarker);
    });

  } else if (type === 'gasPlant') {
    // Central turbine generator (steel cylinder)
    const genGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12);
    genGeo.rotateZ(Math.PI / 2);
    const generator = new THREE.Mesh(genGeo, steelMat);
    generator.position.set(0, 0.3, -0.1);
    generator.castShadow = true;
    generator.receiveShadow = true;
    group.add(generator);

    // Fuel tanks (2 spherical/capsule shapes)
    const tankGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.6, 8);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.5, roughness: 0.4 });
    
    [-0.4, 0.4].forEach((offsetX) => {
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(offsetX, 0.3, 0.3);
      tank.castShadow = true;
      tank.receiveShadow = true;
      group.add(tank);
    });

    // Exhaust pipe (thin cylinder)
    const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8);
    const pipe = new THREE.Mesh(pipeGeo, steelMat);
    pipe.position.set(-0.2, 0.65, -0.3);
    pipe.castShadow = true;
    group.add(pipe);

    // Emitter marker
    const smokeMarker = new THREE.Object3D();
    smokeMarker.name = 'smoke-emitter';
    smokeMarker.position.set(-0.2, 1.2, -0.3);
    group.add(smokeMarker);

  } else if (type === 'windFarm') {
    // Tall tower
    const towerGeo = new THREE.CylinderGeometry(0.06, 0.09, 1.8, 8);
    const tower = new THREE.Mesh(towerGeo, steelMat);
    tower.position.y = 0.9;
    tower.castShadow = true;
    group.add(tower);

    // Nacelle (generator housing)
    const nacelleGeo = new THREE.BoxGeometry(0.2, 0.2, 0.4);
    const nacelle = new THREE.Mesh(nacelleGeo, steelMat);
    nacelle.position.set(0, 1.8, 0);
    nacelle.castShadow = true;
    group.add(nacelle);

    // Spinner/hub
    const hubGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const hub = new THREE.Mesh(hubGeo, steelMat);
    hub.position.set(0, 1.8, 0.22);
    group.add(hub);

    // Blade assembly
    const rotorGroup = new THREE.Group();
    rotorGroup.name = 'rotor';
    rotorGroup.position.set(0, 1.8, 0.25);

    const bladeGeo = new THREE.BoxGeometry(0.08, 0.7, 0.02);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

    // Three blades rotated at 120-degree increments
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.y = 0.35;
      blade.castShadow = true;
      
      const bladeHolder = new THREE.Group();
      bladeHolder.rotation.z = (i * Math.PI * 2) / 3;
      bladeHolder.add(blade);
      rotorGroup.add(bladeHolder);
    }
    
    group.add(rotorGroup);

  } else if (type === 'solarFarm') {
    const frameGeo = new THREE.BoxGeometry(0.05, 0.4, 0.05);
    const panelGeo = new THREE.BoxGeometry(0.6, 0.04, 0.4);
    
    // Create a 2x2 grid of tilted panels
    const offsets = [
      { x: -0.35, z: -0.25 },
      { x: 0.35, z: -0.25 },
      { x: -0.35, z: 0.25 },
      { x: 0.35, z: 0.25 }
    ];

    offsets.forEach((offset) => {
      const panelHolder = new THREE.Group();
      panelHolder.position.set(offset.x, 0.2, offset.z);

      const support = new THREE.Mesh(frameGeo, steelMat);
      support.position.y = 0.0;
      support.castShadow = true;
      panelHolder.add(support);

      const panel = new THREE.Mesh(panelGeo, solarMat);
      panel.position.set(0, 0.2, 0);
      panel.rotation.x = -Math.PI / 6; // Tilt panels to sun
      panel.castShadow = true;
      panelHolder.add(panel);

      group.add(panelHolder);
    });

  } else if (type === 'battery') {
    // Sleek battery module cubes
    const coreGeo = new THREE.BoxGeometry(1.2, 0.7, 1.2);
    const core = new THREE.Mesh(coreGeo, steelMat);
    core.position.y = 0.35;
    core.castShadow = true;
    core.receiveShadow = true;
    group.add(core);

    // Glowing LED arrays (strips along sides)
    const ledGeo = new THREE.BoxGeometry(0.04, 0.08, 0.9);
    
    // We add glowing strips on the sides
    [-0.61, 0.61].forEach((xOffset) => {
      const led = new THREE.Mesh(ledGeo, neonBlueMat);
      led.name = 'window-lights'; // Target for flicker
      led.position.set(xOffset, 0.35, 0);
      group.add(led);
    });

  } else if (type === 'housing') {
    // Create 3 tiny stylized gable houses inside the district
    const colors = [0xd9534f, 0x428bca, 0xf0ad4e]; // Red, blue, yellow house walls
    const positions = [
      { x: -0.3, z: -0.3, rot: Math.PI / 6 },
      { x: 0.3, z: -0.2, rot: -Math.PI / 4 },
      { x: -0.1, z: 0.3, rot: Math.PI / 12 }
    ];

    positions.forEach((pos, idx) => {
      const houseGroup = new THREE.Group();
      houseGroup.position.set(pos.x, 0, pos.z);
      houseGroup.rotation.y = pos.rot;

      // Base body
      const wallMat = new THREE.MeshStandardMaterial({ color: colors[idx], roughness: 0.6 });
      const bodyGeo = new THREE.BoxGeometry(0.35, 0.3, 0.35);
      const body = new THREE.Mesh(bodyGeo, wallMat);
      body.position.y = 0.15;
      body.castShadow = true;
      body.receiveShadow = true;
      houseGroup.add(body);

      // Gable roof (triangular prism via cone with 4 segments rotated)
      const roofGeo = new THREE.ConeGeometry(0.28, 0.22, 4);
      roofGeo.rotateY(Math.PI / 4); // Align square faces
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x6e2c2c, roughness: 0.8 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 0.41;
      roof.castShadow = true;
      houseGroup.add(roof);

      // Glowing yellow window
      const winGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
      const windowLight = new THREE.Mesh(winGeo, windowLightMat);
      windowLight.name = 'window-lights'; // Tagged for blackouts!
      windowLight.position.set(0, 0.18, 0.18);
      houseGroup.add(windowLight);

      group.add(houseGroup);
    });

  } else if (type === 'industry') {
    // Factory structure with angled saw-tooth roof
    const factBaseGeo = new THREE.BoxGeometry(1.2, 0.4, 1.1);
    const factBase = new THREE.Mesh(factBaseGeo, concreteMat);
    factBase.position.y = 0.2;
    factBase.castShadow = true;
    factBase.receiveShadow = true;
    group.add(factBase);

    // Saw-tooth roof segments (angled wedges)
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xa94442, roughness: 0.9 });
    const roofGeo = new THREE.BoxGeometry(0.3, 0.2, 1.1);
    
    // Wedge shapes via angled boxes
    [-0.35, 0, 0.35].forEach((offsetX) => {
      const segment = new THREE.Mesh(roofGeo, roofMat);
      segment.position.set(offsetX, 0.48, 0);
      segment.rotation.z = -Math.PI / 10;
      segment.castShadow = true;
      group.add(segment);
    });

    // Decorative container boxes
    const crateMat1 = new THREE.MeshStandardMaterial({ color: 0x22aa33, roughness: 0.6 }); // Green crate
    const crateMat2 = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.6 }); // Red crate

    const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.4), crateMat1);
    c1.position.set(0.4, 0.1, -0.4);
    c1.castShadow = true;
    group.add(c1);

    const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.4), crateMat2);
    c2.position.set(-0.4, 0.1, -0.4);
    c2.castShadow = true;
    group.add(c2);

  } else if (type === 'park') {
    // Lush park layout sitting flat on the tile
    const lawnMat = new THREE.MeshStandardMaterial({ color: 0x3cb371, roughness: 0.9 });
    const lawn = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 1.6), lawnMat);
    lawn.position.y = 0.025;
    lawn.receiveShadow = true;
    group.add(lawn);

    // Little pond (flat circle shape)
    const pondGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.02, 10);
    const pondMat = new THREE.MeshStandardMaterial({ color: 0x00bfff, roughness: 0.1 });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.position.set(0.3, 0.04, -0.2);
    group.add(pond);

    // Procedural tree mesh (cylinder trunk + nested green leaf spheres)
    const treeGroup = new THREE.Group();
    treeGroup.position.set(-0.35, 0, 0.35);

    const trunkGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.4, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.8 });
    const foliageGeo = new THREE.SphereGeometry(0.25, 6, 6);
    const leaves = new THREE.Mesh(foliageGeo, foliageMat);
    leaves.position.y = 0.45;
    leaves.castShadow = true;
    treeGroup.add(leaves);

    group.add(treeGroup);

    // Tiny park bench (primitives)
    const benchGroup = new THREE.Group();
    benchGroup.position.set(-0.25, 0.05, -0.35);
    benchGroup.rotation.y = Math.PI / 4;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.9 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.12), woodMat);
    seat.position.y = 0.06;
    seat.castShadow = true;
    benchGroup.add(seat);

    const legGeo = new THREE.BoxGeometry(0.03, 0.08, 0.03);
    const leg1 = new THREE.Mesh(legGeo, steelMat);
    leg1.position.set(-0.14, 0.04, 0);
    const leg2 = leg1.clone();
    leg2.position.x = 0.14;
    benchGroup.add(leg1);
    benchGroup.add(leg2);

    group.add(benchGroup);

  } else if (type === 'hydroDam') {
    // Concrete Dam Arch across the river tile
    const damGeo = new THREE.BoxGeometry(1.6, 0.6, 0.4);
    const dam = new THREE.Mesh(damGeo, concreteMat);
    dam.position.set(0, 0.3, 0);
    dam.castShadow = true;
    dam.receiveShadow = true;
    group.add(dam);

    // Overflows / water chutes (glowing neon blue tubes plunging down)
    [-0.4, 0, 0.4].forEach((xOffset) => {
      const chuteGeo = new THREE.BoxGeometry(0.15, 0.4, 0.08);
      const chute = new THREE.Mesh(chuteGeo, neonBlueMat);
      chute.position.set(xOffset, 0.25, 0.21);
      chute.rotation.x = Math.PI / 6;
      group.add(chute);
    });

    // Control room on top of dam
    const controlGeo = new THREE.BoxGeometry(0.3, 0.2, 0.25);
    const control = new THREE.Mesh(controlGeo, steelMat);
    control.position.set(-0.35, 0.7, 0);
    control.castShadow = true;
    group.add(control);

  } else if (type === 'tidalTurbine') {
    // Under-river tripod pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.6, 6);
    const pedestal = new THREE.Mesh(pedestalGeo, steelMat);
    pedestal.position.y = 0.3;
    pedestal.castShadow = true;
    group.add(pedestal);

    // Central generator shaft
    const shaftGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.5, 8);
    shaftGeo.rotateX(Math.PI / 2);
    const shaft = new THREE.Mesh(shaftGeo, steelMat);
    shaft.position.set(0, 0.6, 0);
    shaft.castShadow = true;
    group.add(shaft);

    // Rotor spinning assembly
    const rotorGroup = new THREE.Group();
    rotorGroup.name = 'rotor'; // Spins Z automatically in update loop!
    rotorGroup.position.set(0, 0.6, 0.26);

    const bladeGeo = new THREE.BoxGeometry(0.06, 0.5, 0.02);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x00d2ff, roughness: 0.3 });

    for (let i = 0; i < 2; i++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.y = 0.25;
      
      const bladeHolder = new THREE.Group();
      bladeHolder.rotation.z = (i * Math.PI);
      bladeHolder.add(blade);
      rotorGroup.add(bladeHolder);
    }
    
    group.add(rotorGroup);

  } else if (type === 'waveConverter') {
    // Three floating yellow-orange capsules lying flat, linked in a chain
    const colors = [0xff5722, 0xff9800, 0xff5722];
    
    [-0.45, 0, 0.45].forEach((zOffset, idx) => {
      const capGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8);
      capGeo.rotateZ(Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({ color: colors[idx], metalness: 0.5, roughness: 0.3 });
      
      const capsule = new THREE.Mesh(capGeo, capMat);
      capsule.position.set(0, 0.15, zOffset);
      capsule.castShadow = true;
      group.add(capsule);

      // Flashing solar warning indicator beacon
      const lightGeo = new THREE.SphereGeometry(0.04, 6, 6);
      const light = new THREE.Mesh(lightGeo, windowLightMat);
      light.name = 'window-lights';
      light.position.set(0, 0.29, zOffset);
      group.add(light);
    });

  } else if (type === 'marineGeothermal') {
    // Geothermal Offshore platform sitting on tall pillars
    const deckGeo = new THREE.BoxGeometry(1.2, 0.08, 1.2);
    const deck = new THREE.Mesh(deckGeo, concreteMat);
    deck.position.y = 0.45;
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    // Platform support pillars
    [-0.5, 0.5].forEach((x) => {
      [-0.5, 0.5].forEach((z) => {
        const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6);
        const leg = new THREE.Mesh(legGeo, steelMat);
        leg.position.set(x, 0.225, z);
        leg.castShadow = true;
        group.add(leg);
      });
    });

    // Central drilling rig derrick (tower of boxes)
    const rigGeo = new THREE.CylinderGeometry(0.02, 0.12, 0.7, 4);
    const rig = new THREE.Mesh(rigGeo, steelMat);
    rig.position.set(0, 0.8, 0);
    rig.castShadow = true;
    group.add(rig);

    // Steam exhaust pipestack
    const stackGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
    const stack = new THREE.Mesh(stackGeo, steelMat);
    stack.position.set(0.4, 0.7, -0.4);
    stack.castShadow = true;
    group.add(stack);

    // Steam emitter marker!
    const smokeMarker = new THREE.Object3D();
    smokeMarker.name = 'smoke-emitter';
    smokeMarker.position.set(0.4, 0.95, -0.4);
    group.add(smokeMarker);

  } else if (type === 'boardwalk') {
    // Wooden pier deck sitting low
    const deckGeo = new THREE.BoxGeometry(1.5, 0.05, 1.5);
    const deck = new THREE.Mesh(deckGeo, woodMat);
    deck.position.y = 0.03;
    deck.receiveShadow = true;
    group.add(deck);

    // Stylized colorful beach umbrellas
    const umbrellaColors = [0x00bcd4, 0xe91e63, 0xffeb3b];
    const umbrellaCoords = [
      { x: -0.4, z: -0.4 },
      { x: -0.4, z: 0.3 },
      { x: 0.4, z: 0.4 }
    ];

    umbrellaCoords.forEach((coord, idx) => {
      const poleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6);
      const pole = new THREE.Mesh(poleGeo, steelMat);
      pole.position.set(coord.x, 0.2, coord.z);
      pole.castShadow = true;
      group.add(pole);

      const topGeo = new THREE.ConeGeometry(0.18, 0.08, 8);
      const topMat = new THREE.MeshStandardMaterial({ color: umbrellaColors[idx], roughness: 0.6 });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.set(coord.x, 0.36, coord.z);
      top.castShadow = true;
      group.add(top);
    });

    // Spinning miniature Ferris Wheel!
    const wheelFrameGroup = new THREE.Group();
    wheelFrameGroup.position.set(0.3, 0.05, -0.3);

    // Support frames (A-shape)
    [-0.08, 0.08].forEach((zPos) => {
      const AFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.02, 0.6, 4), steelMat);
      AFrame.position.set(0, 0.3, zPos);
      AFrame.rotation.z = Math.PI / 12;
      AFrame.castShadow = true;
      wheelFrameGroup.add(AFrame);
      
      const AFrame2 = AFrame.clone();
      AFrame2.rotation.z = -Math.PI / 12;
      wheelFrameGroup.add(AFrame2);
    });

    // Rotor wheel that spins in the update loop!
    const wheelRotor = new THREE.Group();
    wheelRotor.name = 'rotor';
    wheelRotor.position.set(0, 0.6, 0);

    const ringGeo = new THREE.TorusGeometry(0.25, 0.02, 6, 12);
    const ring = new THREE.Mesh(ringGeo, ferrisWheelMat);
    wheelRotor.add(ring);

    // Spokes
    for (let i = 0; i < 6; i++) {
      const spokeGeo = new THREE.BoxGeometry(0.015, 0.5, 0.015);
      const spoke = new THREE.Mesh(spokeGeo, steelMat);
      spoke.rotation.z = (i * Math.PI) / 6;
      wheelRotor.add(spoke);
    }

    // Cabins
    for (let i = 0; i < 6; i++) {
      const cabinGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
      const cabin = new THREE.Mesh(cabinGeo, windowLightMat);
      const angle = (i * Math.PI * 2) / 6;
      cabin.position.set(Math.cos(angle) * 0.25, Math.sin(angle) * 0.25, 0);
      cabin.castShadow = true;
      wheelRotor.add(cabin);
    }

    wheelFrameGroup.add(wheelRotor);
    group.add(wheelFrameGroup);

  } else if (type === 'stadium') {
    // Grand stadium tiered arena bowl
    const bowlGeo = new THREE.CylinderGeometry(0.7, 0.6, 0.35, 12);
    const bowl = new THREE.Mesh(bowlGeo, concreteMat);
    bowl.position.y = 0.175;
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    group.add(bowl);

    // Inner green turf field
    const fieldGeo = new THREE.BoxGeometry(0.7, 0.05, 0.55);
    const field = new THREE.Mesh(fieldGeo, turfMat);
    field.position.y = 0.2;
    field.receiveShadow = true;
    group.add(field);

    // Stadium lighting poles (4 slender corner poles with grids of glowing white lights)
    const polePositions = [
      { x: -0.65, z: -0.5 },
      { x: 0.65, z: -0.5 },
      { x: -0.65, z: 0.5 },
      { x: 0.65, z: 0.5 }
    ];

    polePositions.forEach((pos) => {
      const poleGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.6, 4);
      const pole = new THREE.Mesh(poleGeo, steelMat);
      pole.position.set(pos.x, 0.3, pos.z);
      pole.castShadow = true;
      group.add(pole);

      const lightGridGeo = new THREE.BoxGeometry(0.12, 0.06, 0.04);
      const lights = new THREE.Mesh(lightGridGeo, windowLightMat);
      lights.position.set(pos.x, 0.6, pos.z);
      lights.rotation.y = Math.atan2(-pos.z, -pos.x); // Point lights inward
      group.add(lights);
    });

  } else if (type === 'speedway') {
    // Oval asphalt track path
    const trackGeo = new THREE.TorusGeometry(0.55, 0.15, 4, 16);
    trackGeo.rotateX(Math.PI / 2);
    const track = new THREE.Mesh(trackGeo, asphaltMat);
    track.position.y = 0.04;
    track.receiveShadow = true;
    group.add(track);

    // Inner infield grass
    const infield = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 4), turfMat);
    infield.scale.set(1, 0.05, 0.7);
    infield.position.y = 0.045;
    group.add(infield);

    // Tilted Solar Canopy Grandstands along one side
    const frameGeo = new THREE.BoxGeometry(0.04, 0.3, 0.04);
    const panelGeo = new THREE.BoxGeometry(0.8, 0.03, 0.3);

    const grandstand = new THREE.Group();
    grandstand.position.set(0, 0.1, -0.65);

    const support1 = new THREE.Mesh(frameGeo, steelMat);
    support1.position.set(-0.35, 0.1, 0);
    const support2 = support1.clone();
    support2.position.x = 0.35;
    grandstand.add(support1);
    grandstand.add(support2);

    const canopy = new THREE.Mesh(panelGeo, solarMat);
    canopy.position.set(0, 0.25, 0.08);
    canopy.rotation.x = Math.PI / 10;
    canopy.castShadow = true;
    grandstand.add(canopy);

    group.add(grandstand);

    // Two miniature colored blocks (red & yellow cars) on the speedway track!
    const carMat1 = new THREE.MeshStandardMaterial({ color: 0xe91e63, roughness: 0.4 });
    const car1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.05), carMat1);
    car1.position.set(-0.45, 0.07, 0.2);
    car1.rotation.y = Math.PI / 3;
    group.add(car1);

    const carMat2 = new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.4 });
    const car2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.05), carMat2);
    car2.position.set(0.5, 0.07, -0.15);
    car2.rotation.y = -Math.PI / 4;
    group.add(car2);

  } else if (type === 'wasteEnergy') {
    // Waste sorting hangar warehouse
    const hangarGeo = new THREE.BoxGeometry(1.2, 0.5, 1.0);
    const hangar = new THREE.Mesh(hangarGeo, concreteMat);
    hangar.position.y = 0.25;
    hangar.castShadow = true;
    hangar.receiveShadow = true;
    group.add(hangar);

    // Sloped hangar roof
    const roofGeo = new THREE.BoxGeometry(1.25, 0.1, 1.05);
    const roof = new THREE.Mesh(roofGeo, steelMat);
    roof.position.y = 0.52;
    roof.rotation.z = Math.PI / 24;
    roof.castShadow = true;
    group.add(roof);

    // Sorting crane Jib Arm
    const cranePole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), steelMat);
    cranePole.position.set(0.4, 0.45, 0.3);
    cranePole.castShadow = true;
    group.add(cranePole);

    const craneArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.03), steelMat);
    craneArm.position.set(0.28, 0.65, 0.3);
    craneArm.rotation.z = -Math.PI / 12;
    craneArm.castShadow = true;
    group.add(craneArm);

    // Tall metallic smokestack exhaust column
    const stackGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
    const stack = new THREE.Mesh(stackGeo, steelMat);
    stack.position.set(-0.4, 0.6, -0.3);
    stack.castShadow = true;
    group.add(stack);

    // Smoke emitter marker
    const smokeMarker = new THREE.Object3D();
    smokeMarker.name = 'smoke-emitter';
    smokeMarker.position.set(-0.4, 1.2, -0.3);
    group.add(smokeMarker);

  } else if (type === 'biofuelRefinery') {
    // Fermentation dome (green half-submerged sphere)
    const domeGeo = new THREE.SphereGeometry(0.45, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, bioDomeMat);
    dome.position.set(-0.35, 0, -0.15);
    dome.scale.y = 0.8;
    dome.castShadow = true;
    dome.receiveShadow = true;
    group.add(dome);

    // Fermenter tank silos (2 tall metal cylinders)
    [-0.35, 0.25].forEach((zPos) => {
      const siloGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
      const silo = new THREE.Mesh(siloGeo, steelMat);
      silo.position.set(0.35, 0.4, zPos);
      silo.castShadow = true;
      silo.receiveShadow = true;
      group.add(silo);

      const capGeo = new THREE.ConeGeometry(0.21, 0.08, 8);
      const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: 0xcd6e00 }));
      cap.position.set(0.35, 0.84, zPos);
      group.add(cap);
    });

    // Connecting horizontal pipings
    const pipeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6);
    pipeGeo.rotateZ(Math.PI / 2);
    const pipe = new THREE.Mesh(pipeGeo, steelMat);
    pipe.position.set(0, 0.35, 0);
    group.add(pipe);

  } else if (type === 'fusionReactor') {
    // Concrete ring base platform
    const baseGeo = new THREE.CylinderGeometry(0.75, 0.8, 0.15, 16);
    const base = new THREE.Mesh(baseGeo, concreteMat);
    base.position.y = 0.075;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Magnetic confinement chamber (toroidal fusion Tokamak ring core)
    const ringGeo = new THREE.TorusGeometry(0.42, 0.18, 10, 18);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, steelMat);
    ring.position.y = 0.32;
    ring.castShadow = true;
    group.add(ring);

    // Pulsing, glowing high-energy toroidal core path (emissive neon purple)
    const neonTorusGeo = new THREE.TorusGeometry(0.42, 0.05, 6, 18);
    neonTorusGeo.rotateX(Math.PI / 2);
    const neonTorus = new THREE.Mesh(neonTorusGeo, neonPurpleMat);
    neonTorus.position.y = 0.32;
    neonTorus.name = 'window-lights'; // Will glow beautifully
    group.add(neonTorus);

    // Top magnet cap shield
    const capGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.15, 8);
    const cap = new THREE.Mesh(capGeo, steelMat);
    cap.position.y = 0.525;
    cap.castShadow = true;
    group.add(cap);

  } else if (type === 'datacenter') {
    // Windowless monolithic dark warehouse cube
    const serverHangarGeo = new THREE.BoxGeometry(1.3, 0.55, 1.3);
    const serverHangarMat = new THREE.MeshStandardMaterial({ color: 0x22222b, roughness: 0.4, metalness: 0.7 });
    const hangar = new THREE.Mesh(serverHangarGeo, serverHangarMat);
    hangar.position.y = 0.275;
    hangar.castShadow = true;
    hangar.receiveShadow = true;
    group.add(hangar);

    // Server vertical neon blue LED strip lines
    [-0.66, 0.66].forEach((xPos) => {
      [-0.4, 0.4].forEach((zPos) => {
        const stripeGeo = new THREE.BoxGeometry(0.02, 0.4, 0.05);
        const stripe = new THREE.Mesh(stripeGeo, neonBlueMat);
        stripe.position.set(xPos, 0.275, zPos);
        group.add(stripe);
      });
    });

    // Massive rotating cooling HVAC fans on roof!
    [-0.3, 0.3].forEach((xPos) => {
      const fanEnclosure = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12), steelMat);
      fanEnclosure.position.set(xPos, 0.58, 0);
      group.add(fanEnclosure);

      // Rotating blades group name "rotor" makes it spin automatically!
      const fanRotor = new THREE.Group();
      fanRotor.name = 'rotor';
      fanRotor.position.set(xPos, 0.63, 0);
      fanRotor.rotation.x = Math.PI / 2; // Flat facing up

      const bladeGeo = new THREE.BoxGeometry(0.04, 0.38, 0.015);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x33333b, roughness: 0.5 });
      
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.rotation.z = (i * Math.PI) / 4;
        fanRotor.add(blade);
      }
      group.add(fanRotor);
    });

  } else if (type === 'supercapacitor') {
    // Concrete buffer foundation
    const foundation = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 1.3), concreteMat);
    foundation.position.y = 0.04;
    foundation.receiveShadow = true;
    group.add(foundation);

    // Three modern storage power modules (glowing battery towers)
    const locations = [
      { x: -0.35, z: 0.35 },
      { x: 0.35, z: 0.35 },
      { x: 0, z: -0.35 }
    ];

    locations.forEach((loc) => {
      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.55, 8), steelMat);
      cylinder.position.set(loc.x, 0.315, loc.z);
      cylinder.castShadow = true;
      group.add(cylinder);

      // Glowing power level ring
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.05, 8), neonBlueMat);
      ring.name = 'window-lights';
      ring.position.set(loc.x, 0.45, loc.z);
      group.add(ring);
    });

    // Heavy distribution bus bars connecting them
    const barsGeo = new THREE.BoxGeometry(0.8, 0.02, 0.04);
    const bus1 = new THREE.Mesh(barsGeo, steelMat);
    bus1.position.set(0, 0.6, 0.35);
    group.add(bus1);
  }

  // Lift the whole group slightly so it sits directly on top of the tile face
  return group;
}
