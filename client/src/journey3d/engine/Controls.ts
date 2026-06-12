// Input for the driving journey: keyboard (WASD / arrows) plus setters the
// on-screen mobile buttons call. Exposes normalized throttle (-1..1) and
// steering (-1..1) each frame.

export class Controls {
  private keys = new Set<string>();
  private touchThrottle = 0;
  private touchSteer = 0;
  private target: HTMLElement | Window;

  private readonly onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (DRIVE_KEYS.has(k)) {
      this.keys.add(k);
      e.preventDefault();
    }
  };
  private readonly onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  constructor(target: HTMLElement | Window = window) {
    this.target = target;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  /** Forward (+1) / reverse (-1) intent from keyboard or mobile button. */
  get throttle(): number {
    let t = this.touchThrottle;
    if (this.keys.has('w') || this.keys.has('arrowup')) t += 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) t -= 1;
    return Math.max(-1, Math.min(1, t));
  }

  /** Steer left (-1) / right (+1). */
  get steer(): number {
    let s = this.touchSteer;
    if (this.keys.has('a') || this.keys.has('arrowleft')) s -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) s += 1;
    return Math.max(-1, Math.min(1, s));
  }

  setTouchThrottle(v: number): void {
    this.touchThrottle = Math.max(-1, Math.min(1, v));
  }
  setTouchSteer(v: number): void {
    this.touchSteer = Math.max(-1, Math.min(1, v));
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.keys.clear();
  }
}

const DRIVE_KEYS = new Set([
  'w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
]);
