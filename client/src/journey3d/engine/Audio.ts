// Sound for the driving journey: a gentle looping engine, a skid loop while
// braking, and a one-shot impact. Kept quiet for the calm tone of a grief app.
// Must be started after a user gesture (autoplay policy), and can be muted.
export class JourneySound {
  private engine: HTMLAudioElement;
  private skid: HTMLAudioElement;
  private impact: HTMLAudioElement;
  private started = false;
  private muted = false;
  private skidding = false;
  private readonly engineMax = 0.22;
  private readonly skidMax = 0.3;

  constructor() {
    this.engine = makeAudio('/audio/journey/engine.ogg', true);
    this.skid = makeAudio('/audio/journey/skid.ogg', true);
    this.impact = makeAudio('/audio/journey/impact.ogg', false);
  }

  /** Begin playback (call from a user-gesture handler). */
  start(): void {
    if (this.started || this.muted) return;
    this.engine
      .play()
      .then(() => {
        this.started = true;
      })
      .catch(() => {
        /* blocked until a gesture; retried on next call */
      });
  }

  /** speed01: 0 (idle) .. 1 (top speed) — drives engine volume + pitch. */
  setSpeed(speed01: number): void {
    if (!this.started || this.muted) return;
    this.engine.volume = 0.04 + speed01 * (this.engineMax - 0.04);
    this.engine.playbackRate = 0.85 + speed01 * 0.8;
  }

  /** Toggle the skid loop (while braking). */
  setSkidding(on: boolean): void {
    if (this.skidding === on) return;
    this.skidding = on;
    if (!this.started || this.muted) return;
    if (on) {
      this.skid.volume = this.skidMax;
      this.skid.currentTime = 0;
      this.skid.play().catch(() => {});
    } else {
      this.skid.pause();
    }
  }

  /** One-shot impact sound (hitting a tree). */
  playImpact(): void {
    if (this.muted) return;
    this.impact.currentTime = 0;
    this.impact.play().catch(() => {});
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.engine.volume = 0;
      this.engine.pause();
      this.skid.pause();
    } else {
      this.start();
    }
  }

  dispose(): void {
    for (const a of [this.engine, this.skid, this.impact]) {
      a.pause();
      a.src = '';
    }
  }
}

function makeAudio(src: string, loop: boolean): HTMLAudioElement {
  const a = new Audio(src);
  a.loop = loop;
  a.volume = 0;
  a.preload = 'auto';
  return a;
}
