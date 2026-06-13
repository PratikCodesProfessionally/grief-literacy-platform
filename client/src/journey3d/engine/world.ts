import * as THREE from 'three';
import { JourneyAssets } from './assets';
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
}

const TREE_COLLIDER_RADIUS = 1.6;

const ROAD_HALF = 6; // road is 12 wide, centered on x=0
const HOUSE_OFFSET = 15; // houses sit this far off the road center
const STATION_SPACING = 75;
const STATION_START_Z = -55;

// Build the drivable world: a straight grass plane with a road down the middle,
// houses (each with a garage + sign board) at the 5 therapeutic stations, and
// trees carrying the positive quotes. Reuses STATION_POSITIONS + BENCH_QUOTES.
export function buildWorld(assets: JourneyAssets): World {
  const group = new THREE.Group();

  const lastZ = STATION_START_Z - (STATION_POSITIONS.length - 1) * STATION_SPACING;
  const roadEndZ = lastZ - 60;

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, Math.abs(roadEndZ) + 80),
    new THREE.MeshStandardMaterial({ color: 0x86b049, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = (roadEndZ + 20) / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Road ribbon
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD_HALF * 2, Math.abs(roadEndZ) + 60),
    new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.95 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.01, (roadEndZ + 20) / 2);
  road.receiveShadow = true;
  group.add(road);

  // Dashed centre line
  const dashMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.8 });
  for (let z = 0; z > roadEndZ; z -= 6) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 2.5), dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0, 0.02, z);
    group.add(dash);
  }

  // Houses + garages at each station
  const garages: GarageInstance[] = [];
  STATION_POSITIONS.forEach((station, i) => {
    const z = STATION_START_Z - i * STATION_SPACING;
    const rightSide = i % 2 === 0;
    const houseX = rightSide ? HOUSE_OFFSET : -HOUSE_OFFSET;

    const house = assets.house(station.color);
    house.position.set(houseX, 0, z);
    // Rotate so the garage bay (model faces -Z) points toward the road centre.
    house.rotation.y = rightSide ? Math.PI / 2 : -Math.PI / 2;
    group.add(house);

    // Garage trigger sits right at the garage mouth (~the house's road-facing
    // wall), and is small — you only enter when you actually pull in, not when
    // merely driving past on the road.
    const triggerX = rightSide ? HOUSE_OFFSET - 4 : -(HOUSE_OFFSET - 4);
    garages.push({
      station,
      triggerX,
      triggerZ: z,
      triggerHalf: 2.6,
      signPosition: new THREE.Vector3(houseX, 6, z),
    });
  });

  // Trees: one per positive quote, alternating roadside between the stations,
  // plus decorative trees with no quote.
  const trees: TreeInstance[] = [];
  const treeColliders: Collider[] = [];
  BENCH_QUOTES.forEach((quote, i) => {
    const z = STATION_START_Z - i * STATION_SPACING + STATION_SPACING / 2;
    const rightSide = i % 2 === 1;
    const x = rightSide ? ROAD_HALF + 4 : -(ROAD_HALF + 4);
    const treeObj = assets.tree();
    treeObj.position.set(x, 0, z);
    group.add(treeObj);
    trees.push({ quote, position: new THREE.Vector3(x, 0, z) });
    treeColliders.push({ x, z, radius: TREE_COLLIDER_RADIUS });
  });

  // Decorative (quote-less) trees scattered farther out.
  for (let i = 0; i < 24; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (HOUSE_OFFSET + 6 + Math.random() * 20);
    const z = -Math.random() * (Math.abs(roadEndZ) + 40);
    const scale = 0.8 + Math.random() * 0.6;
    const treeObj = assets.tree();
    treeObj.position.set(x, 0, z);
    treeObj.scale.setScalar(scale);
    group.add(treeObj);
    treeColliders.push({ x, z, radius: TREE_COLLIDER_RADIUS * scale });
  }

  return {
    group,
    bounds: { minX: -45, maxX: 45, minZ: roadEndZ - 10, maxZ: 20 },
    trees,
    garages,
    treeColliders,
    carStart: { x: 0, z: 10, heading: 0 },
  };
}
