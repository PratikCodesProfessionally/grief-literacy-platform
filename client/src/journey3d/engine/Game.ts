import * as THREE from 'three';
import { loadJourneyAssets } from './assets';
import { Car } from './Car';
import { Controls } from './Controls';
import { buildWorld, World } from './world';
import { JourneySound } from './Audio';
import { StationConfig } from '../../phaser/config/constants';

export interface GameCallbacks {
  onQuote: (quote: string | null) => void;
  onNearGarage: (station: StationConfig | null) => void;
  onEnterGarage: (station: StationConfig) => void;
  onImpact: () => void;
}

const QUOTE_RADIUS = 14;
const GARAGE_NEAR_X = 9;
const GARAGE_NEAR_Z = 11;

export class Game {
  private container: HTMLElement;
  private callbacks: GameCallbacks;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private controls!: Controls;
  private car!: Car;
  private world!: World;
  private audio = new JourneySound();
  private muted = false;

  // Skid marks (a reused pool of dark dabs dropped while braking)
  private skidMarks: THREE.Mesh[] = [];
  private skidIndex = 0;
  private readonly fwdTmp = new THREE.Vector3();
  private readonly rightTmp = new THREE.Vector3();

  private currentQuote: string | null = null;
  private currentNearGarage: StationConfig | null = null;
  private entered = false;
  private disposed = false;

  constructor(container: HTMLElement, callbacks: GameCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  async init(): Promise<void> {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9fd2f0); // soft sky
    this.scene.fog = new THREE.Fog(0x9fd2f0, 60, 240);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);

    // Lights
    const hemi = new THREE.HemisphereLight(0xcfeaff, 0x6b8e23, 1.0);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.6);
    sun.position.set(40, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    const s = 60;
    sun.shadow.camera.left = -s;
    sun.shadow.camera.right = s;
    sun.shadow.camera.top = s;
    sun.shadow.camera.bottom = -s;
    this.scene.add(sun);
    this.scene.add(sun.target);

    // Assets + world + car
    const assets = await loadJourneyAssets();
    if (this.disposed) return;

    this.world = buildWorld(assets);
    this.scene.add(this.world.group);

    this.car = new Car(assets.car, this.world.carStart.x, this.world.carStart.z, this.world.carStart.heading);
    this.scene.add(this.car.object);
    // Keep the sun shadow following the car a bit.
    sun.target = this.car.object;

    this.createSkidMarks();
    this.controls = new Controls();
    this.car.snapCamera(this.camera);

    // Start the engine sound on the first user gesture (autoplay policy).
    window.addEventListener('keydown', this.startAudioOnce, { once: true });
    window.addEventListener('pointerdown', this.startAudioOnce, { once: true });

    window.addEventListener('resize', this.onResize);
    this.renderer.setAnimationLoop(this.loop);
  }

  private startAudioOnce = (): void => {
    if (!this.muted) this.audio.start();
  };

  private onResize = (): void => {
    if (!this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private loop = (): void => {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.car.update(dt, this.controls, this.world.bounds, this.camera);
    this.audio.setSpeed(this.car.speed01);

    // Skid: sound + tire marks while braking.
    const braking = this.car.isBraking;
    this.audio.setSkidding(braking);
    if (braking) this.dropSkidMark();

    // Impact: bounce off trees, play sound + fire the apology message.
    if (!this.entered && this.car.collide(this.world.treeColliders)) {
      this.audio.playImpact();
      this.callbacks.onImpact();
    }

    this.checkProximity();
    this.renderer.render(this.scene, this.camera);
  };

  private createSkidMarks(): void {
    const geo = new THREE.CircleGeometry(0.35, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x1a1a1a,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    for (let i = 0; i < 160; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2; // lie flat on the road
      m.position.set(0, -100, 0);
      m.visible = false;
      this.scene.add(m);
      this.skidMarks.push(m);
    }
  }

  private dropSkidMark(): void {
    const fwd = this.car.getForward(this.fwdTmp);
    const right = this.rightTmp.set(-fwd.z, 0, fwd.x); // forward × up
    const p = this.car.position;
    for (const side of [-0.7, 0.7]) {
      const m = this.skidMarks[this.skidIndex];
      this.skidIndex = (this.skidIndex + 1) % this.skidMarks.length;
      m.position.set(p.x - fwd.x * 1.2 + right.x * side, 0.03, p.z - fwd.z * 1.2 + right.z * side);
      m.visible = true;
    }
  }

  /** Toggle engine audio; returns the new muted state. */
  toggleMute(): boolean {
    this.muted = !this.muted;
    this.audio.setMuted(this.muted);
    return this.muted;
  }

  private checkProximity(): void {
    if (this.entered) return;
    const p = this.car.position;

    // Nearest quote tree
    let nearestQuote: string | null = null;
    let nearestDist = QUOTE_RADIUS;
    for (const tree of this.world.trees) {
      const dx = p.x - tree.position.x;
      const dz = p.z - tree.position.z;
      const d = Math.hypot(dx, dz);
      if (d < nearestDist) {
        nearestDist = d;
        nearestQuote = tree.quote;
      }
    }
    if (nearestQuote !== this.currentQuote) {
      this.currentQuote = nearestQuote;
      this.callbacks.onQuote(nearestQuote);
    }

    // Garages: near (prompt) + inside (enter)
    let near: StationConfig | null = null;
    for (const g of this.world.garages) {
      const dx = Math.abs(p.x - g.triggerX);
      const dz = Math.abs(p.z - g.triggerZ);
      if (dx < g.triggerHalf && dz < g.triggerHalf) {
        this.entered = true;
        this.callbacks.onEnterGarage(g.station);
        return;
      }
      if (dx < GARAGE_NEAR_X && dz < GARAGE_NEAR_Z) {
        near = g.station;
      }
    }
    if (near !== this.currentNearGarage) {
      this.currentNearGarage = near;
      this.callbacks.onNearGarage(near);
    }
  }

  setTouchThrottle(v: number): void {
    this.controls?.setTouchThrottle(v);
  }
  setTouchSteer(v: number): void {
    this.controls?.setTouchSteer(v);
  }

  dispose(): void {
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.startAudioOnce);
    window.removeEventListener('pointerdown', this.startAudioOnce);
    this.audio.dispose();
    this.renderer?.setAnimationLoop(null);
    this.controls?.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
    this.scene?.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry?.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      }
    });
  }
}
