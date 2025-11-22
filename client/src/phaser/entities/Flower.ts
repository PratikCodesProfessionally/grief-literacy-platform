import Phaser from 'phaser';

export class Flower extends Phaser.GameObjects.Container {
  private petals: Phaser.GameObjects.Arc[] = [];
  private bloomTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number, size: number = 1) {
    super(scene, x, y);

    // Stem
    const stem = scene.add.rectangle(0, 0, 3 * size, 20 * size, 0x4ade80);
    this.add(stem);

    // Center of flower
    const center = scene.add.circle(0, -10 * size, 5 * size, 0xfbbf24, 1);
    this.add(center);

    // Petals (5 petals in circle)
    const petalCount = 5;
    const petalRadius = 8 * size;
    const petalDistance = 12 * size;

    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const petalX = Math.cos(angle) * petalDistance;
      const petalY = -10 * size + Math.sin(angle) * petalDistance;

      const petal = scene.add.circle(petalX, petalY, petalRadius, color, 1);
      petal.setScale(0); // Start hidden for bloom animation
      this.add(petal);
      this.petals.push(petal);
    }

    scene.add.existing(this);
    this.setDepth(3);
  }

  /**
   * Bloom animation - petals gradually appear
   */
  public bloom(delay: number = 0): void {
    this.petals.forEach((petal, index) => {
      this.scene.tweens.add({
        targets: petal,
        scale: 1,
        duration: 400,
        delay: delay + (index * 80),
        ease: 'Back.easeOut'
      });
    });

    // Gentle sway animation
    this.scene.tweens.add({
      targets: this,
      rotation: { from: -0.05, to: 0.05 },
      duration: 2000 + Phaser.Math.Between(0, 500),
      delay: delay,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Wither animation - petals shrink and fade
   */
  public wither(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.petals,
        scale: 0,
        alpha: 0,
        duration: 500,
        ease: 'Power2.easeIn',
        onComplete: () => {
          this.destroy();
          resolve();
        }
      });
    });
  }
}
