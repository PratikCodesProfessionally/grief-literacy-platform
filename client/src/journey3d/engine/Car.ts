import * as THREE from 'three';
import { Controls } from './Controls';

export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

// Light arcade car: kinematic steering on the ground plane (no real physics).
// The model is assumed to face -Z forward (matches the procedural fallback).
export class Car {
  readonly object: THREE.Object3D;
  private heading = 0; // radians around +Y; 0 = facing -Z
  private speed = 0; // units/sec (positive = forward)

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
