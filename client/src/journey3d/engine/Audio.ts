// Gentle looping engine sound for the driving journey. Kept intentionally quiet
// for the calm tone of a grief app. Must be started after a user gesture
// (browser autoplay policy), and can be muted.
export class EngineSound {
  private engine: HTMLAudioElement;
  private started = false;
  private muted = false;
  private readonly maxVolume = 0.22;

  constructor() {
    this.engine = new Audio('/audio/journey/engine.ogg');
    this.engine.loop = true;
    this.engine.volume = 0;
    this.engine.preload = 'auto';
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
        /* blocked until a gesture; will retry on next call */
      });
  }

  /** speed01: 0 (idle) .. 1 (top speed) — drives volume + pitch. */
  setSpeed(speed01: number): void {
    if (!this.started || this.muted) return;
    this.engine.volume = 0.04 + speed01 * (this.maxVolume - 0.04);
    this.engine.playbackRate = 0.85 + speed01 * 0.8;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.engine.volume = 0;
      this.engine.pause();
    } else {
      this.start();
    }
  }

  dispose(): void {
    this.engine.pause();
    this.engine.src = '';
  }
}
