import * as THREE from 'three';

// Gentle particle layer for the driving world. Two jobs:
//
//  - burst(): a puff of leaves when the car bumps a tree, so the apology
//    message has something to look at.
//  - ambient drift: a few petals always falling around the car, which gives
//    the long straight road a sense of air and movement.
//
// Everything is pooled and shares three materials, so the whole layer is a
// handful of draw calls and never allocates during the drive.

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  spin: number;
  life: number;
  maxLife: number;
  ambient: boolean;
}

const LEAF_COLORS = [0x4ea662, 0x74c476, 0xf2b5c4];
const BURST_COUNT = 16;
const AMBIENT_COUNT = 24;
const GRAVITY = 5.2;

// How far from the car ambient petals are recycled.
const AMBIENT_RADIUS = 34;

export class Particles {
  private group = new THREE.Group();
  private pool: Particle[] = [];
  private materials: THREE.MeshBasicMaterial[];
  private geometry: THREE.PlaneGeometry;
  private cursor = 0;

  constructor(scene: THREE.Scene) {
    this.geometry = new THREE.PlaneGeometry(0.26, 0.2);
    this.materials = LEAF_COLORS.map(
      (color) =>
        new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
        })
    );

    // Burst pool first, then the ambient drifters.
    const total = BURST_COUNT * 3 + AMBIENT_COUNT;
    for (let i = 0; i < total; i++) {
      const mesh = new THREE.Mesh(this.geometry, this.materials[i % this.materials.length]);
      mesh.visible = false;
      this.group.add(mesh);
      this.pool.push({
        mesh,
        vel: new THREE.Vector3(),
        spin: 0,
        life: 0,
        maxLife: 1,
        ambient: i >= BURST_COUNT * 3,
      });
    }

    scene.add(this.group);
  }

  /** Puff of leaves at a bump, drifting up and out before settling. */
  burst(position: THREE.Vector3): void {
    let spawned = 0;
    for (let i = 0; i < this.pool.length && spawned < BURST_COUNT; i++) {
      const p = this.pool[this.cursor];
      this.cursor = (this.cursor + 1) % (BURST_COUNT * 3);
      if (p.ambient || p.life > 0) continue;

      p.mesh.position.copy(position);
      p.mesh.position.y += 1.1 + Math.random() * 1.4;
      p.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      p.mesh.scale.setScalar(0.8 + Math.random() * 0.7);
      p.vel.set((Math.random() - 0.5) * 4.4, 1.6 + Math.random() * 3.1, (Math.random() - 0.5) * 4.4);
      p.spin = (Math.random() - 0.5) * 6;
      p.maxLife = 1.5 + Math.random() * 1.1;
      p.life = p.maxLife;
      p.mesh.visible = true;
      spawned++;
    }
  }

  /**
   * Advance every live particle. `carPosition` keeps the ambient petals in the
   * neighbourhood of the car rather than stranded at the world origin.
   */
  update(dt: number, carPosition: THREE.Vector3): void {
    for (const p of this.pool) {
      if (p.ambient) {
        this.updateAmbient(p, dt, carPosition);
        continue;
      }
      if (p.life <= 0) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.mesh.visible = false;
        continue;
      }
      p.vel.y -= GRAVITY * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.z += p.spin * dt;
      p.mesh.rotation.x += p.spin * 0.6 * dt;

      // Settle on the ground instead of sinking through it.
      if (p.mesh.position.y < 0.05) {
        p.mesh.position.y = 0.05;
        p.vel.set(0, 0, 0);
        p.spin *= 0.2;
      }
      // Shrink away over the last third of life (cheaper than per-mesh fade).
      const t = p.life / p.maxLife;
      if (t < 0.35) p.mesh.scale.setScalar(Math.max(0.001, t * 2.6));
    }
  }

  private updateAmbient(p: Particle, dt: number, car: THREE.Vector3): void {
    if (p.life <= 0) {
      this.respawnAmbient(p, car, true);
      return;
    }
    p.life -= dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    p.mesh.rotation.z += p.spin * dt;
    p.mesh.rotation.y += p.spin * 0.4 * dt;

    // Recycle once it lands or drifts out of the car's neighbourhood.
    const dx = p.mesh.position.x - car.x;
    const dz = p.mesh.position.z - car.z;
    if (p.mesh.position.y < 0 || Math.hypot(dx, dz) > AMBIENT_RADIUS) {
      this.respawnAmbient(p, car, false);
    }
  }

  private respawnAmbient(p: Particle, car: THREE.Vector3, stagger: boolean): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 6 + Math.random() * (AMBIENT_RADIUS - 8);
    p.mesh.position.set(
      car.x + Math.cos(angle) * dist,
      6 + Math.random() * (stagger ? 9 : 4),
      car.z + Math.sin(angle) * dist
    );
    p.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    p.mesh.scale.setScalar(0.7 + Math.random() * 0.6);
    // Slow fall with a lateral breeze.
    p.vel.set(0.5 + Math.random() * 0.8, -(0.7 + Math.random() * 0.7), (Math.random() - 0.5) * 0.7);
    p.spin = (Math.random() - 0.5) * 1.8;
    p.maxLife = 14;
    p.life = p.maxLife;
    p.mesh.visible = true;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.geometry.dispose();
    this.materials.forEach((m) => m.dispose());
    this.pool.length = 0;
  }
}
