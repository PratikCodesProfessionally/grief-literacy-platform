import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Loads Kenney CC0 GLB models from /models/journey/, falling back to simple
// procedural geometry if a model is missing or fails to load. This guarantees
// the world always renders even before the (optional) GLB assets are added.

const MODEL_BASE = '/models/journey';
const loader = new GLTFLoader();

function loadGLB(file: string): Promise<THREE.Object3D | null> {
  return new Promise((resolve) => {
    loader.load(
      `${MODEL_BASE}/${file}`,
      (gltf) => resolve(gltf.scene),
      undefined,
      () => {
        console.warn(`[journey3d] Missing model ${file} — using procedural fallback.`);
        resolve(null);
      }
    );
  });
}

// ── Procedural fallbacks ─────────────────────────────────────────────────────

function proceduralCar(): THREE.Object3D {
  const car = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.5, metalness: 0.2 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 4), bodyMat);
  body.position.y = 0.6;
  body.castShadow = true;
  car.add(body);

  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, roughness: 0.2, metalness: 0.1 });
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 2), cabinMat);
  cabin.position.set(0, 1.15, -0.2);
  cabin.castShadow = true;
  car.add(cabin);

  const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
  const wheelOffsets: [number, number][] = [
    [-1.05, 1.3], [1.05, 1.3], [-1.05, -1.3], [1.05, -1.3],
  ];
  for (const [x, z] of wheelOffsets) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.45, z);
    wheel.castShadow = true;
    car.add(wheel);
  }
  // The car model faces -Z (forward).
  return car;
}

function proceduralTree(): THREE.Object3D {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.4, 2, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b5e34, roughness: 0.9 })
  );
  trunk.position.y = 1;
  trunk.castShadow = true;
  tree.add(trunk);

  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3, 10), foliageMat);
  cone.position.y = 3.2;
  cone.castShadow = true;
  tree.add(cone);
  const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.2, 10), foliageMat);
  cone2.position.y = 4.4;
  cone2.castShadow = true;
  tree.add(cone2);
  return tree;
}

// House with an open garage bay on the -Z (road-facing) side, plus a sign board.
function proceduralHouse(color: number): THREE.Object3D {
  const house = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.85 });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 7), wallMat);
  walls.position.y = 2.5;
  walls.castShadow = true;
  walls.receiveShadow = true;
  house.add(walls);

  // Roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(6.5, 3, 4),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
  );
  roof.position.y = 6.5;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  house.add(roof);

  // Garage bay — a darker recessed opening on the road-facing (-Z) wall.
  const bay = new THREE.Mesh(
    new THREE.BoxGeometry(4, 3.2, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 1 })
  );
  bay.position.set(0, 1.6, -3.5);
  house.add(bay);

  // Sign board above the garage.
  const post = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x92400e })
  );
  post.position.set(0, 5.2, -3.6);
  house.add(post);
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 1.4, 0.2),
    new THREE.MeshStandardMaterial({ color })
  );
  board.position.set(0, 6.2, -3.6);
  house.add(board);

  return house;
}

export interface JourneyAssets {
  car: THREE.Object3D;
  tree: () => THREE.Object3D;
  house: (color: number) => THREE.Object3D;
}

// Kenney vehicle GLBs are ~1 unit and may face +Z. Normalize a loaded car model
// to ~4 units long, centered on origin, sitting on the ground (y=0), facing -Z
// (our forward convention). Returns a wrapper the Car controller can rotate.
const CAR_TARGET_LENGTH = 4;
const CAR_FACING_OFFSET = Math.PI; // flip so the model's front points -Z

function normalizeCar(model: THREE.Object3D): THREE.Object3D {
  model.rotation.y = CAR_FACING_OFFSET;

  let box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = CAR_TARGET_LENGTH / Math.max(size.x, size.z, 0.001);
  model.scale.setScalar(scale);

  box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= box.min.y; // rest wheels on the ground

  model.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });

  const wrapper = new THREE.Group();
  wrapper.add(model);
  return wrapper;
}

/** Load all models (GLB if present, otherwise procedural). Always resolves. */
export async function loadJourneyAssets(): Promise<JourneyAssets> {
  const [carGlb, treeGlb, houseGlb] = await Promise.all([
    loadGLB('car.glb'),
    loadGLB('tree.glb'),
    loadGLB('house-garage.glb'),
  ]);

  const enableShadows = (obj: THREE.Object3D) => {
    obj.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
  };
  if (treeGlb) enableShadows(treeGlb);
  if (houseGlb) enableShadows(houseGlb);

  return {
    car: carGlb ? normalizeCar(carGlb) : proceduralCar(),
    tree: () => (treeGlb ? treeGlb.clone(true) : proceduralTree()),
    // GLB house ignores color tint; procedural uses it to distinguish stations.
    house: (color: number) => (houseGlb ? houseGlb.clone(true) : proceduralHouse(color)),
  };
}
