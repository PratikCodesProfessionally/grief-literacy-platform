import Phaser from 'phaser';

export class Tree extends Phaser.GameObjects.Container {
  private quote: string;
  private showingQuote: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, quote: string, size: 'small' | 'medium' | 'large' = 'medium') {
    super(scene, x, y);

    const scales = {
      small: 0.7,
      medium: 1,
      large: 1.3
    };
    const scale = scales[size];

    this.quote = quote;

    // Tree trunk
    const trunkWidth = 30 * scale;
    const trunkHeight = 80 * scale;
    const trunk = scene.add.rectangle(0, 0, trunkWidth, trunkHeight, 0x8b4513); // brown
    trunk.setStrokeStyle(2, 0x654321);
    this.add(trunk);

    // Tree foliage (multiple circles for natural look)
    const foliageColors = [0x22c55e, 0x16a34a, 0x15803d]; // shades of green
    
    // Bottom layer
    for (let i = 0; i < 3; i++) {
      const circle1 = scene.add.circle(
        (i - 1) * 40 * scale,
        -40 * scale,
        35 * scale,
        foliageColors[i % 3],
        1
      );
      this.add(circle1);
    }

    // Middle layer
    for (let i = 0; i < 3; i++) {
      const circle2 = scene.add.circle(
        (i - 1) * 35 * scale,
        -70 * scale,
        40 * scale,
        foliageColors[(i + 1) % 3],
        1
      );
      this.add(circle2);
    }

    // Top layer
    const topCircle = scene.add.circle(0, -100 * scale, 45 * scale, foliageColors[0], 1);
    this.add(topCircle);

    // Add some decorative elements (fruits/leaves)
    for (let i = 0; i < 5; i++) {
      const decorX = Phaser.Math.Between(-50, 50) * scale;
      const decorY = Phaser.Math.Between(-100, -40) * scale;
      const decor = scene.add.circle(decorX, decorY, 4 * scale, 0xfbbf24, 0.8); // amber
      this.add(decor);
    }

    // Gentle sway animation
    scene.tweens.add({
      targets: this,
      rotation: { from: -0.02, to: 0.02 },
      duration: 3000 + Phaser.Math.Between(0, 1000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    scene.add.existing(this);
    this.setDepth(5);
  }

  public showQuote(scene: Phaser.Scene): Phaser.GameObjects.Container | null {
    if (this.showingQuote) return null;
    this.showingQuote = true;

    const quoteContainer = scene.add.container(this.x, this.y - 180);
    quoteContainer.setDepth(200);

    // Background
    const bg = scene.add.rectangle(0, 0, 450, 120, 0xf0fdf4, 0.98); // green-50
    bg.setStrokeStyle(3, 0x22c55e); // green-500

    // Quote text
    const text = scene.add.text(0, 0, this.quote, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#166534', // green-800
      align: 'center',
      wordWrap: { width: 410 },
      fontStyle: 'italic'
    });
    text.setOrigin(0.5);

    // Decorative leaf icons
    const leafLeft = scene.add.text(-200, -40, '🍃', { fontSize: '24px' });
    const leafRight = scene.add.text(200, -40, '🍃', { fontSize: '24px' });
    leafLeft.setOrigin(0.5);
    leafRight.setOrigin(0.5);

    quoteContainer.add([bg, leafLeft, leafRight, text]);

    // Fade in
    quoteContainer.setAlpha(0);
    scene.tweens.add({
      targets: quoteContainer,
      alpha: 1,
      y: this.y - 190,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Gentle float animation
    scene.tweens.add({
      targets: [leafLeft, leafRight],
      y: -45,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
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

  public isPlayerNearby(playerX: number, playerY: number, range: number = 100): boolean {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    return distance < range;
  }
}
