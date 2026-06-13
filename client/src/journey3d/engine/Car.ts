import * as THREE from 'three';
import { Controls } from './Controls';

export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Collider {
  x: number;
  z: number;
  radius: number;
}

const CAR_RADIUS = 1.4;

// Light arcade car: kinematic steering on the ground plane (no real physics).
// The model is assumed to face -Z forward (matches the procedural fallback).
export class Car {
  readonly object: THREE.Object3D;
  private heading = 0; // radians around +Y; 0 = facing -Z
  private speed = 0; // units/sec (positive = forward)
  private braking = false;
  private lastHitIndex = -1; // debounces repeated impacts with the same tree

  // Tuning (calm cruising, not racing)
  private readonly maxForward = 22;
  private readonly maxReverse = 8;
  private readonly accel = 18;
  private readonly brakeDrag = 26;
  private readonly idleDrag = 10;
  private readonly turnRate = 1.8; // rad/sec at full speed

  private readonly forward = new THREE.Vector3();
  private readonly camTarget = new THREE.Vector3();
  private readonly desiredCam = new THREE.Vector3();

  constructor(object: THREE.Object3D, startX = 0, startZ = 0, startHeading = 0) {
    this.object = object;
    this.heading = startHeading;
    this.object.position.set(startX, 0, startZ);
    this.object.rotation.y = this.heading;
  }

  get position(): THREE.Vector3 {
    return this.object.position;
  }

  /** Normalized speed magnitude (0 idle .. 1 top), for audio/effects. */
  get speed01(): number {
    return Math.min(1, Math.abs(this.speed) / this.maxForward);
  }

  /** True while actively braking and still rolling forward (for skid fx). */
  get isBraking(): boolean {
    return this.braking;
  }

  getForward(target: THREE.Vector3): THREE.Vector3 {
    return target.set(-Math.sin(this.heading), 0, -Math.cos(this.heading));
  }

  /**
   * Resolve collisions against tree colliders: push the car out and bounce it
   * back. Returns true on a NEW impact (debounced so holding against one tree
   * only fires once until the car leaves it).
   */
  collide(colliders: Collider[]): boolean {
    const p = this.object.position;
    let hitIndex = -1;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      const dx = p.x - c.x;
      const dz = p.z - c.z;
      const minDist = c.radius + CAR_RADIUS;
      const d = Math.hypot(dx, dz);
      if (d < minDist) {
        const nx = d > 1e-4 ? dx / d : 1;
        const nz = d > 1e-4 ? dz / d : 0;
        p.x = c.x + nx * minDist;
        p.z = c.z + nz * minDist;
        // Gentle bounce: shed most speed, nudge slightly backward.
        const back = Math.min(Math.abs(this.speed) * 0.25, 3);
        this.speed = (this.speed >= 0 ? -1 : 1) * back;
        hitIndex = i;
        break;
      }
    }
    if (hitIndex === -1) {
      this.lastHitIndex = -1;
      return false;
    }
    const isNew = hitIndex !== this.lastHitIndex;
    this.lastHitIndex = hitIndex;
    return isNew;
  }

  update(dt: number, controls: Controls, bounds: WorldBounds, camera: THREE.PerspectiveCamera): void {
    const throttle = controls.throttle;
    const steer = controls.steer;

    // Longitudinal: accelerate toward throttle intent, otherwise drag to 0.
    if (throttle > 0) {
      this.speed += this.accel * throttle * dt;
    } else if (throttle < 0) {
      this.speed += this.accel * throttle * dt; // reverse / brake
    } else {
      // Coast: ease speed back toward zero.
      const drag = this.idleDrag * dt;
      if (this.speed > 0) this.speed = Math.max(0, this.speed - drag);
      else if (this.speed < 0) this.speed = Math.min(0, this.speed + drag);
    }
    this.speed = THREE.MathUtils.clamp(this.speed, -this.maxReverse, this.maxForward);

    // Braking = pressing reverse while still rolling forward at speed.
    this.braking = throttle < -0.1 && this.speed > 3;

    // Steering scales with how fast we're going (can't pivot when parked).
    const speedFactor = THREE.MathUtils.clamp(Math.abs(this.speed) / this.maxForward, 0, 1);
    const dir = Math.sign(this.speed) || 1;
    this.heading -= steer * this.turnRate * speedFactor * dir * dt;
    this.object.rotation.y = this.heading;

    // Integrate position along the forward vector.
    this.forward.set(-Math.sin(this.heading), 0, -Math.cos(this.heading));
    this.object.position.addScaledVector(this.forward, this.speed * dt);

    // Keep within the play area; bumping a wall sheds speed.
    const p = this.object.position;
    if (p.x < bounds.minX || p.x > bounds.maxX || p.z < bounds.minZ || p.z > bounds.maxZ) {
      p.x = THREE.MathUtils.clamp(p.x, bounds.minX, bounds.maxX);
      p.z = THREE.MathUtils.clamp(p.z, bounds.minZ, bounds.maxZ);
      this.speed *= 0.5;
    }

    this.updateCamera(camera);
  }

  private updateCamera(camera: THREE.PerspectiveCamera): void {
    // Chase camera: behind and above, looking slightly ahead of the car.
    this.desiredCam.copy(this.object.position)
      .addScaledVector(this.forward, -9) // behind
      .add(new THREE.Vector3(0, 6, 0)); // above
    camera.position.lerp(this.desiredCam, 0.1);

    this.camTarget.copy(this.object.position).addScaledVector(this.forward, 4);
    this.camTarget.y += 1.2;
    camera.lookAt(this.camTarget);
  }

  /** Place the camera correctly on the first frame (no lerp). */
  snapCamera(camera: THREE.PerspectiveCamera): void {
    this.forward.set(-Math.sin(this.heading), 0, -Math.cos(this.heading));
    camera.position.copy(this.object.position).addScaledVector(this.forward, -9).add(new THREE.Vector3(0, 6, 0));
    this.camTarget.copy(this.object.position).addScaledVector(this.forward, 4);
    this.camTarget.y += 1.2;
    camera.lookAt(this.camTarget);
  }
}
