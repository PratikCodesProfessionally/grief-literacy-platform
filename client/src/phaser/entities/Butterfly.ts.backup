import Phaser from 'phaser';

export class Butterfly extends Phaser.GameObjects.Container {
  private leftWing: Phaser.GameObjects.Arc;
  private rightWing: Phaser.GameObjects.Arc;
  private butterflyBody: Phaser.GameObjects.Rectangle;
  private collected: boolean = false;
  private targetX: number;
  private targetY: number;
  private speed: number = 100;
  protected gameScene: Phaser.Scene;
  public collectable: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number = 0xff6b9d) {
    super(scene, x, y);
    this.gameScene = scene;

    // Body
    this.butterflyBody = scene.add.rectangle(0, 0, 4, 12, 0x000000);
    this.add(this.butterflyBody);

    // Left wing
    this.leftWing = scene.add.circle(-8, 0, 8, color);
    this.leftWing.setStrokeStyle(1, 0xffffff, 0.8);
    this.add(this.leftWing);

    // Right wing
    this.rightWing = scene.add.circle(8, 0, 8, color);
    this.rightWing.setStrokeStyle(1, 0xffffff, 0.8);
    this.add(this.rightWing);

    scene.add.existing(this);

    // Wing flapping animation
    this.createFlappingAnimation();

    // Set initial random target
    this.setRandomTarget();

    // Random gentle movement pattern
    this.createFloatingPattern();
  }

  private createFlappingAnimation(): void {
    // Left wing flap
    this.gameScene.tweens.add({
      targets: this.leftWing,
      scaleX: 0.7,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Right wing flap (offset)
    this.gameScene.tweens.add({
      targets: this.rightWing,
      scaleX: 0.7,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 100
    });
  }

  private createFloatingPattern(): void {
    // Gentle up-down floating
    this.gameScene.tweens.add({
      targets: this,
      y: this.y - 20,
      duration: Phaser.Math.Between(1500, 2500),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private setRandomTarget(): void {
    // Set a new random target position
    this.targetX = this.x + Phaser.Math.Between(-200, 200);
    this.targetY = this.y + Phaser.Math.Between(-100, 100);
  }

  public update(delta: number): void {
    if (this.collected) return;

    // Move towards target
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetX, this.targetY);
    const velocityX = Math.cos(angle) * this.speed * (delta / 1000);
    const velocityY = Math.sin(angle) * this.speed * (delta / 1000);

    this.x += velocityX;
    this.y += velocityY;

    // Check if reached target
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
    if (distance < 10) {
      this.setRandomTarget();
    }

    // Slight rotation based on movement direction
    this.setRotation(Math.sin(this.gameScene.time.now / 500) * 0.2);
  }

  public collect(): void {
    if (this.collected) return;
    this.collected = true;
    this.collectable = false;

    // Collection animation
    this.gameScene.tweens.add({
      targets: this,
      y: this.y - 100,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });

    // Sparkle effect
    this.createSparkles();
  }

  private createSparkles(): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const sparkle = this.gameScene.add.circle(
        this.x,
        this.y,
        3,
        0xffffff,
        0.8
      );
      sparkle.setDepth(this.depth + 1);

      this.gameScene.tweens.add({
        targets: sparkle,
        x: sparkle.x + Math.cos(angle) * 40,
        y: sparkle.y + Math.sin(angle) * 40,
        alpha: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  public isPlayerNearby(playerX: number, playerY: number, range: number = 50): boolean {
    if (this.collected) return false;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    return distance < range;
  }
}
