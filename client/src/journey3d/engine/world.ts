import * as THREE from 'three';
import { JourneyAssets, HouseHandle } from './assets';
import { WorldBounds, Collider } from './Car';
import { STATION_POSITIONS, BENCH_QUOTES, StationConfig } from '../../phaser/config/constants';

export interface TreeInstance {
  quote: string;
  position: THREE.Vector3;
}

export interface GarageInstance {
  station: StationConfig;
  triggerX: number;
  triggerZ: number;
  triggerHalf: number;
  signPosition: THREE.Vector3; // for the "Enter {name}" prompt anchor
}

export interface World {
  group: THREE.Group;
  bounds: WorldBounds;
  trees: TreeInstance[];
  garages: GarageInstance[];
  treeColliders: Collider[]; // for impact detection (all trees)
  carStart: { x: number; z: number; heading: number };
  /** How many distinct quotes exist to be found, for the HUD. */
  quotePoolSize: number;
  /** Re-seat everything around the car. Call once per frame before collisions. */
  update: (carX: number, carZ: number) => void;
}

const TREE_COLLIDER_RADIUS = 1.6;

const ROAD_HALF = 6; // road is 12 wide, centered on x=0
const HOUSE_OFFSET = 15; // houses sit this far off the road center

// Roadside furniture lives in these lanes, just off the tarmac.
const LAMP_X = 7.0;
const QUOTE_TREE_X = 9.0;

// The road never ends. Everything on it is a fixed pool laid out on a lattice
// that wraps around the car, so the drive can continue indefinitely in either
// direction for the cost of a fixed number of objects.
//
// Each pool's wrap distance is count * spacing, and objects stay within half of
// that of the car — so every pool must span comfortably past the fog line.
const GARAGE_SPACING = 75;
const GARAGE_COUNT = 8; // wraps every 600 units
// Offset the garage lattice so the drive opens on clear road rather than with
// the car already parked alongside a house.
const GARAGE_PHASE = -38;
const QUOTE_TREE_SPACING = 30;
const QUOTE_TREE_COUNT = 18; // wraps every 540 units
const LAMP_SPACING = 26;
const LAMP_COUNT = 20; // wraps every 520 units
const DECOR_SPACING = 18;
const DECOR_COUNT = 32; // wraps every 576 units

const DASH_SPACING = 6;
const DASH_COUNT = 110;
const RUMBLE_SPACING = 4.5;
const RUMBLE_COUNT = 150;

// Ground, road and shoulder lines are uniform along their length, so they can
// simply follow the car. Long enough to reach past the fog in both directions.
const SURFACE_LENGTH = 1000;

// Keep the verge clear this far either side of a garage, so nothing stands in
// the way of the turn-in. The car's turning circle is ~12 units.
const GARAGE_CLEARANCE_Z = 14;

// Heights for the flat layers stacked on the grass. Kept well apart (rather
// than the hairline gaps you can get away with on a small ground plane) so
// none of them z-fight at the far end of the road.
export const ROAD_Y = 0.05;
const MARKING_Y = 0.12;

/**
 * Slide `z` by whole multiples of `lattice` until it is the copy nearest the
 * car. This is what makes the road endless: an object that falls behind
 * reappears the same distance ahead, still on its lattice.
 */
function wrapToCar(z: number, carZ: number, lattice: number): number {
  return z - Math.round((z - carZ) / lattice) * lattice;
}

// Fisher-Yates over a copy: the quotes are handed out in a different order
// every drive, and keep coming as trees recycle.
function shuffled<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// ── Mountains ────────────────────────────────────────────────────────────────

// Low, broad peaks with snow above the snow line — a range on the horizon
// rather than a row of spikes. Each layer is two instanced meshes (rock and
// snow), so the whole range costs four draw calls.
//
// The ratio of height to base radius is what reads as "steep"; keeping it well
// under 1 gives slopes you could imagine walking up.
const SNOW_LINE = 26; // peaks taller than this get a cap
const SNOW_CAP_FRACTION = 0.34; // the top third of the cone turns to snow
// The cap must be a little fatter than the rock beneath it. A cone scaled about
// its own apex is self-similar — its surface would land exactly on the rock's,
// and the depth buffer would flicker between the two as the camera moves.
// Widening only the radius tilts the slope out so the snow strictly encloses
// the peak, and leaves a small lip at the snow line that reads as snow depth.
const SNOW_CAP_BULGE = 1.09;

interface MountainLayer {
  radius: [number, number];
  height: [number, number];
  ringRadius: number;
  count: number;
  rock: number;
  snow: number;
}

// Both layers are opaque: overlapping half-transparent peaks have no stable
// draw order, which is its own source of shimmer. Distance is carried by
// colour and fog instead.
const MOUNTAIN_LAYERS: MountainLayer[] = [
  { radius: [34, 62], height: [16, 30], ringRadius: 250, count: 40, rock: 0x7f95a6, snow: 0xeef5fa },
  { radius: [58, 104], height: [24, 40], ringRadius: 330, count: 32, rock: 0xa3b8c8, snow: 0xf3f8fc },
];

// ── Photographic horizon ─────────────────────────────────────────────────────

// A photograph of the Alps wrapped around the inside of a very large cylinder
// centred on the car. Sitting beyond the grass, its base is hidden by the
// ground's own horizon, so the range appears to rise out of the fields.
const BACKDROP_RADIUS = 900;
const BACKDROP_HEIGHT = 212;
const BACKDROP_CENTRE_Y = 61; // spans y -45 .. 167 — the chase camera looks
// down the road, so only the lower slice of the sky is ever on screen; a taller
// band simply runs off the top of the frame and leaves no sky at all. At this
// height twelve copies also happen to land on the photo's own aspect ratio, so
// the peaks are neither stretched nor squashed.
const BACKDROP_REPEATS = 12; // mirrored copies around the full circle

// Which slice of the photo to use, in image coordinates (0 = bottom, 1 = top).
// Trimmed to the peaks and the slopes below them: the picture's own foreground
// meadow would fight with the game's grass, and its heavy evening sky would
// fight with the game's daylight.
const BACKDROP_CROP_BOTTOM = 0.28;
const BACKDROP_CROP_HEIGHT = 0.64;

// Haze: the whole range is blended slightly into the sky, and the last of it
// dissolves completely at the top so the photo's dark sky never meets the
// game's blue as a hard line.
const BACKDROP_OPACITY = 0.94;
const BACKDROP_FADE_FROM = 0.72; // band height at which the fade begins

/** Vertical alpha ramp: solid low down, gone by the top of the band. */
function backdropFadeTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Canvas y runs the other way to texture v, so the ramp is drawn inverted.
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#000000'); // top of the band: transparent
    gradient.addColorStop(1 - BACKDROP_FADE_FROM, '#ffffff');
    gradient.addColorStop(1, '#ffffff'); // horizon: solid
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function buildAlpsBackdrop(photo: THREE.Texture): THREE.Mesh {
  photo.repeat.set(BACKDROP_REPEATS, BACKDROP_CROP_HEIGHT);
  photo.offset.set(0, BACKDROP_CROP_BOTTOM);

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      BACKDROP_RADIUS,
      BACKDROP_RADIUS,
      BACKDROP_HEIGHT,
      72,
      1,
      true // open-ended: it is a band, not a drum
    ),
    new THREE.MeshBasicMaterial({
      map: photo,
      alphaMap: backdropFadeTexture(),
      transparent: true,
      side: THREE.BackSide, // seen from the inside
      depthWrite: false,
      opacity: BACKDROP_OPACITY,
      // Far beyond the fog's reach; the haze above does that job instead.
      fog: false,
    })
  );
  mesh.position.y = BACKDROP_CENTRE_Y;
  mesh.renderOrder = -1; // drawn before the world, behind everything in it
  return mesh;
}

function buildMountains(): THREE.Group {
  const group = new THREE.Group();

  const between = ([lo, hi]: [number, number]) => lo + Math.random() * (hi - lo);
  const unitCone = new THREE.ConeGeometry(1, 1, 7);

  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);

  for (const layer of MOUNTAIN_LAYERS) {
    // Size each peak first, so the snow mesh can be allocated exactly.
    const peaks = Array.from({ length: layer.count }, (_, i) => {
      const angle = (i / layer.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.14;
      const ring = layer.ringRadius + (Math.random() - 0.5) * 70;
      return {
        x: Math.cos(angle) * ring,
        z: Math.sin(angle) * ring,
        radius: between(layer.radius),
        height: between(layer.height),
        spin: Math.random() * Math.PI,
      };
    });

    const rockMat = new THREE.MeshStandardMaterial({
      color: layer.rock,
      roughness: 1,
      flatShading: true,
    });
    const rocks = new THREE.InstancedMesh(unitCone, rockMat, peaks.length);
    peaks.forEach((p, i) => {
      position.set(p.x, p.height / 2 - 4, p.z);
      quaternion.setFromAxisAngle(up, p.spin);
      scale.set(p.radius, p.height, p.radius);
      rocks.setMatrixAt(i, matrix.compose(position, quaternion, scale));
    });
    rocks.instanceMatrix.needsUpdate = true;
    group.add(rocks);

    // Snow only on the peaks that break the snow line.
    const capped = peaks.filter((p) => p.height > SNOW_LINE);
    if (capped.length === 0) continue;

    const snowMat = new THREE.MeshStandardMaterial({
      color: layer.snow,
      roughness: 0.85,
      flatShading: true,
      // Belt and braces against the coincident-surface flicker: bias the snow
      // towards the camera so any remaining depth tie resolves the same way
      // every frame instead of shimmering.
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const snow = new THREE.InstancedMesh(unitCone, snowMat, capped.length);
    capped.forEach((p, i) => {
      // Shares the rock cone's apex, but sits slightly proud of its slope.
      const capHeight = p.height * SNOW_CAP_FRACTION;
      const capRadius = p.radius * SNOW_CAP_FRACTION * SNOW_CAP_BULGE;
      position.set(p.x, p.height - 4 - capHeight / 2, p.z);
      quaternion.setFromAxisAngle(up, p.spin);
      scale.set(capRadius, capHeight, capRadius);
      snow.setMatrixAt(i, matrix.compose(position, quaternion, scale));
    });
    snow.instanceMatrix.needsUpdate = true;
    group.add(snow);
  }

  return group;
}

// ── Roadside props ───────────────────────────────────────────────────────────

// Lamp post with an emissive head. Deliberately NOT a collider, so the only
// thing the car can bump into (and apologise to) is still a tree.
function buildLamp(): THREE.Group {
  const lamp = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.09, 4.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.6, roughness: 0.4 })
  );
  pole.position.y = 2.1;
  pole.castShadow = true;
  lamp.add(pole);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xfff3cd,
      emissive: 0xffc861,
      emissiveIntensity: 1.6,
    })
  );
  head.position.y = 4.25;
  lamp.add(head);
  return lamp;
}

/** Lay `places.length` copies of `geometry` flat as a single draw call. */
function instancedStrip(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  places: { x: number; y: number; z: number }[]
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, places.length);
  const matrix = new THREE.Matrix4();
  places.forEach((p, i) => mesh.setMatrixAt(i, matrix.makeTranslation(p.x, p.y, p.z)));
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

// ── World ────────────────────────────────────────────────────────────────────

interface GarageSlot {
  house: HouseHandle;
  garage: GarageInstance;
}

interface TreeSlot {
  object: THREE.Object3D;
  instance: TreeInstance;
  collider: Collider;
}

interface DecorSlot {
  object: THREE.Object3D;
  collider: Collider;
}

/**
 * Build the endless drivable world: grass and a road that follow the car, and
 * pools of houses, quote trees, lamps and scenery that wrap around it. The
 * stations repeat in order, so every garage comes round again however far you
 * drive — and the drive itself has no end.
 */
export function buildWorld(assets: JourneyAssets): World {
  const group = new THREE.Group();

  // Grass, road and shoulders: uniform along their length, so they just follow.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(760, SURFACE_LENGTH),
    new THREE.MeshStandardMaterial({
      color: 0x86b049,
      roughness: 1,
      // The ground is a single enormous quad, so depth interpolation across it
      // is coarse. Nudging it away from the camera stops the road and its
      // markings from z-fighting with the grass they sit on.
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // The photographed Alps if the image loaded, otherwise the procedural peaks.
  const horizon: THREE.Object3D = assets.backdrop
    ? buildAlpsBackdrop(assets.backdrop)
    : buildMountains();
  group.add(horizon);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD_HALF * 2, SURFACE_LENGTH),
    new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.95 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = ROAD_Y;
  road.receiveShadow = true;
  group.add(road);

  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xf7f3df, roughness: 0.6 });
  const edges: THREE.Mesh[] = [];
  for (const x of [-(ROAD_HALF - 0.45), ROAD_HALF - 0.45]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, SURFACE_LENGTH), edgeMat);
    edge.position.set(x, MARKING_Y, 0);
    group.add(edge);
    edges.push(edge);
  }

  // Dashes and rumble strips repeat, so they wrap on their own spacing — the
  // strip only ever shifts by a whole dash, which is invisible.
  const rumbleMat = new THREE.MeshStandardMaterial({ color: 0xbfc9b4, roughness: 0.8 });
  const rumblePlaces: { x: number; y: number; z: number }[] = [];
  for (const x of [-ROAD_HALF + 0.08, ROAD_HALF - 0.08]) {
    for (let i = 0; i < RUMBLE_COUNT; i++) {
      rumblePlaces.push({ x, y: MARKING_Y, z: (i - RUMBLE_COUNT / 2) * RUMBLE_SPACING });
    }
  }
  const rumble = instancedStrip(new THREE.BoxGeometry(0.3, 0.05, 2.2), rumbleMat, rumblePlaces);
  group.add(rumble);

  const dashMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.8 });
  const dashPlaces: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < DASH_COUNT; i++) {
    dashPlaces.push({ x: 0, y: MARKING_Y, z: (i - DASH_COUNT / 2) * DASH_SPACING });
  }
  const dashes = instancedStrip(new THREE.BoxGeometry(0.4, 0.02, 2.5), dashMat, dashPlaces);
  group.add(dashes);

  // Pools. Positions are seeded on their lattice and corrected by the first
  // update() call, which pulls each one to the copy nearest the car.
  const garageSlots: GarageSlot[] = [];
  const garages: GarageInstance[] = [];
  for (let i = 0; i < GARAGE_COUNT; i++) {
    const house = assets.house();
    group.add(house.object);
    const garage: GarageInstance = {
      station: STATION_POSITIONS[0],
      triggerX: HOUSE_OFFSET - 4,
      triggerZ: GARAGE_PHASE - i * GARAGE_SPACING,
      triggerHalf: 2.6,
      signPosition: new THREE.Vector3(),
    };
    garages.push(garage);
    garageSlots.push({ house, garage });
  }

  const quotes = shuffled(BENCH_QUOTES);
  let nextQuote = 0;
  const takeQuote = (): string => quotes[nextQuote++ % quotes.length];

  const treeSlots: TreeSlot[] = [];
  const trees: TreeInstance[] = [];
  const treeColliders: Collider[] = [];
  for (let i = 0; i < QUOTE_TREE_COUNT; i++) {
    const object = assets.tree();
    group.add(object);
    const instance: TreeInstance = { quote: takeQuote(), position: new THREE.Vector3() };
    instance.position.z = -i * QUOTE_TREE_SPACING;
    const collider: Collider = { x: 0, z: 0, radius: TREE_COLLIDER_RADIUS };
    trees.push(instance);
    treeColliders.push(collider);
    treeSlots.push({ object, instance, collider });
  }

  const lamps: THREE.Object3D[] = [];
  for (let i = 0; i < LAMP_COUNT; i++) {
    const lamp = buildLamp();
    lamp.position.z = -i * LAMP_SPACING;
    group.add(lamp);
    lamps.push(lamp);
  }

  const decorSlots: DecorSlot[] = [];
  for (let i = 0; i < DECOR_COUNT; i++) {
    const object = assets.tree();
    const scale = 0.8 + Math.random() * 0.6;
    object.scale.setScalar(scale);
    object.rotation.y = Math.random() * Math.PI * 2;
    object.position.z = -i * DECOR_SPACING;
    group.add(object);
    const collider: Collider = { x: 0, z: 0, radius: TREE_COLLIDER_RADIUS * scale };
    treeColliders.push(collider);
    decorSlots.push({ object, collider });
  }

  const GARAGE_LATTICE = GARAGE_COUNT * GARAGE_SPACING;
  const TREE_LATTICE = QUOTE_TREE_COUNT * QUOTE_TREE_SPACING;
  const LAMP_LATTICE = LAMP_COUNT * LAMP_SPACING;
  const DECOR_LATTICE = DECOR_COUNT * DECOR_SPACING;

  /** True if a prop at (x, z) would stand in a garage's turn-in. */
  const blocksGarageApproach = (x: number, z: number): boolean =>
    garages.some(
      (g) => Math.sign(g.triggerX) === Math.sign(x) && Math.abs(z - g.triggerZ) < GARAGE_CLEARANCE_Z
    );

  /** Place one house for the lattice slot it has just wrapped into. */
  const seatGarage = (slot: GarageSlot, z: number): void => {
    const lattice = Math.round((z - GARAGE_PHASE) / GARAGE_SPACING);
    const count = STATION_POSITIONS.length;
    // Stations cycle in order for ever; the side alternates so the drive keeps
    // its rhythm rather than lining every house up on one shoulder.
    const station = STATION_POSITIONS[((lattice % count) + count) % count];
    const rightSide = Math.abs(lattice % 2) === 0;
    const houseX = rightSide ? HOUSE_OFFSET : -HOUSE_OFFSET;

    slot.house.object.position.set(houseX, 0, z);
    slot.house.object.rotation.y = rightSide ? Math.PI / 2 : -Math.PI / 2;
    slot.house.setAccent(station.color);

    slot.garage.station = station;
    slot.garage.triggerX = rightSide ? HOUSE_OFFSET - 4 : -(HOUSE_OFFSET - 4);
    slot.garage.triggerZ = z;
    slot.garage.signPosition.set(houseX, 6, z);
  };

  const seatTree = (slot: TreeSlot, z: number, fresh: boolean): void => {
    const lattice = Math.round(z / QUOTE_TREE_SPACING);
    let side = Math.abs(lattice % 2) === 0 ? -1 : 1;
    // A quote tree must never park in front of a garage mouth. The stations sit
    // on one side at a time, so the far shoulder is always free.
    if (blocksGarageApproach(side * QUOTE_TREE_X, z)) side = -side;

    const x = side * QUOTE_TREE_X;
    slot.object.position.set(x, 0, z);
    slot.instance.position.set(x, 0, z);
    slot.collider.x = x;
    slot.collider.z = z;
    if (fresh) slot.instance.quote = takeQuote();
  };

  const seatLamp = (lamp: THREE.Object3D, z: number): void => {
    const lattice = Math.round(z / LAMP_SPACING);
    let side = Math.abs(lattice % 2) === 0 ? 1 : -1;
    if (blocksGarageApproach(side * LAMP_X, z)) side = -side;
    lamp.position.set(side * LAMP_X, 0, z);
  };

  const seatDecor = (slot: DecorSlot, z: number): void => {
    const side = Math.random() < 0.5 ? 1 : -1;
    const x = side * (HOUSE_OFFSET + 6 + Math.random() * 34);
    slot.object.position.set(x, 0, z);
    slot.collider.x = x;
    slot.collider.z = z;
  };

  let seeded = false;

  const update = (carX: number, carZ: number): void => {
    // Surfaces simply track the car.
    ground.position.z = carZ;
    road.position.z = carZ;
    horizon.position.set(carX, horizon.position.y, carZ);
    for (const edge of edges) edge.position.z = carZ;

    // Repeating markings shift by whole units of their own spacing.
    dashes.position.z = Math.round(carZ / DASH_SPACING) * DASH_SPACING;
    rumble.position.z = Math.round(carZ / RUMBLE_SPACING) * RUMBLE_SPACING;

    // Garages first: the props below consult their positions for clearance.
    for (const slot of garageSlots) {
      const z =
        GARAGE_PHASE + wrapToCar(slot.garage.triggerZ - GARAGE_PHASE, carZ - GARAGE_PHASE, GARAGE_LATTICE);
      if (seeded && z === slot.garage.triggerZ) continue;
      seatGarage(slot, z);
    }
    for (const slot of treeSlots) {
      const z = wrapToCar(slot.instance.position.z, carZ, TREE_LATTICE);
      const moved = z !== slot.instance.position.z;
      if (seeded && !moved) continue;
      seatTree(slot, z, seeded && moved);
    }
    for (const lamp of lamps) {
      const z = wrapToCar(lamp.position.z, carZ, LAMP_LATTICE);
      if (seeded && z === lamp.position.z) continue;
      seatLamp(lamp, z);
    }
    for (const slot of decorSlots) {
      const z = wrapToCar(slot.object.position.z, carZ, DECOR_LATTICE);
      if (seeded && z === slot.object.position.z) continue;
      seatDecor(slot, z);
    }

    seeded = true;
  };

  const carStart = { x: 0, z: 0, heading: 0 };
  update(carStart.x, carStart.z);

  return {
    group,
    bounds: {
      minX: -45,
      maxX: 45,
      // The road runs for ever; only the width is fenced.
      minZ: -Number.MAX_SAFE_INTEGER,
      maxZ: Number.MAX_SAFE_INTEGER,
    },
    trees,
    garages,
    treeColliders,
    carStart,
    quotePoolSize: BENCH_QUOTES.length,
    update,
  };
}
