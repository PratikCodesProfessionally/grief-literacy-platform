import Phaser from 'phaser';

export class Bench extends Phaser.GameObjects.Container {
  private quote: string;
  private showingQuote: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, quote: string) {
    super(scene, x, y);
    this.quote = quote;

    // Bench legs
    const leftLeg = scene.add.rectangle(-35, 15, 8, 30, 0x92400e); // brown-800
    const rightLeg = scene.add.rectangle(35, 15, 8, 30, 0x92400e);
    this.add([leftLeg, rightLeg]);

    // Bench seat
    const seat = scene.add.rectangle(0, 0, 90, 12, 0xfbbf24); // amber-400
    seat.setStrokeStyle(2, 0x92400e);
    this.add(seat);

    // Bench back
    const back = scene.add.rectangle(0, -20, 90, 30, 0xfbbf24);
    back.setStrokeStyle(2, 0x92400e);
    this.add(back);

    // Add decorative icon above bench
    const icon = scene.add.text(0, -50, '💭', {
      fontSize: '24px'
    });
    icon.setOrigin(0.5);
    icon.setAlpha(0.7);
    this.add(icon);

    // Gentle sway animation
    scene.tweens.add({
      targets: icon,
      y: -55,
      alpha: 1,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    scene.add.existing(this);
    this.setDepth(10);
  }

  public showQuote(scene: Phaser.Scene): Phaser.GameObjects.Container | null {
    if (this.showingQuote) return null;
    this.showingQuote = true;

    const quoteContainer = scene.add.container(this.x, this.y - 120);
    quoteContainer.setDepth(200);

    // Background
    const bg = scene.add.rectangle(0, 0, 400, 100, 0x1e293b, 0.95);
    bg.setStrokeStyle(3, 0x8b5cf6);

    // Quote text
    const text = scene.add.text(0, 0, this.quote, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 360 }
    });
    text.setOrigin(0.5);

    quoteContainer.add([bg, text]);

    // Fade in
    quoteContainer.setAlpha(0);
    scene.tweens.add({
      targets: quoteContainer,
      alpha: 1,
      y: this.y - 130,
      duration: 400,
      ease: 'Back.easeOut'
    });

    return quoteContainer;
  }

  public hideQuote(quoteContainer: Phaser.GameObjects.Container, scene: Phaser.Scene): void {
    scene.tweens.add({
      targets: quoteContainer,
      alpha: 0,
      y: quoteContainer.y - 10,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        quoteContainer.destroy();
        this.showingQuote = false;
      }
    });
  }

  public isPlayerNearby(playerX: number, playerY: number, range: number = 80): boolean {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    return distance < range;
  }
}

export class Fountain extends Phaser.GameObjects.Container {
  private particles: Phaser.GameObjects.Arc[] = [];
  protected gameScene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.gameScene = scene;

    // Base
    const base = scene.add.circle(0, 20, 60, 0x60a5fa); // blue-400
    base.setStrokeStyle(4, 0x3b82f6);
    this.add(base);

    // Middle tier
    const middle = scene.add.circle(0, 0, 40, 0x93c5fd); // blue-300
    middle.setStrokeStyle(3, 0x60a5fa);
    this.add(middle);

    // Top tier
    const top = scene.add.circle(0, -25, 25, 0xbfdbfe); // blue-200
    top.setStrokeStyle(2, 0x93c5fd);
    this.add(top);

    // Center spout
    const spout = scene.add.circle(0, -40, 8, 0xdbeafe); // blue-100
    this.add(spout);

    scene.add.existing(this);
    this.setDepth(15);

    // Start water animation
    this.createWaterEffect();
  }

  private createWaterEffect(): void {
    // Create water droplets
    this.gameScene.time.addEvent({
      delay: 100,
      callback: () => {
        this.createWaterDroplet();
      },
      loop: true
    });
  }

  private createWaterDroplet(): void {
    const droplet = this.gameScene.add.circle(
      this.x + Phaser.Math.Between(-5, 5),
      this.y - 40,
      3,
      0x60a5fa,
      0.8
    );
    droplet.setDepth(this.depth + 1);
    this.particles.push(droplet);

    // Animate droplet falling
    this.gameScene.tweens.add({
      targets: droplet,
      y: this.y + 20,
      x: droplet.x + Phaser.Math.Between(-15, 15),
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        droplet.destroy();
        const index = this.particles.indexOf(droplet);
        if (index > -1) {
          this.particles.splice(index, 1);
        }
      }
    });
  }

  public cleanup(): void {
    this.particles.forEach(p => p.destroy());
    this.particles = [];
  }
}
