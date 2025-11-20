import Phaser from 'phaser';
import { Season } from '../systems/SeasonManager';

export class Tree extends Phaser.GameObjects.Container {
  private quote: string;
  private showingQuote: boolean = false;
  private foliageCircles: Phaser.GameObjects.Arc[] = [];
  private trunk: Phaser.GameObjects.Rectangle;
  private snowLayer?: Phaser.GameObjects.Graphics;
  private decorElements: Phaser.GameObjects.Arc[] = [];

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
    this.trunk = scene.add.rectangle(0, 0, trunkWidth, trunkHeight, 0x8b4513); // brown
    this.trunk.setStrokeStyle(2, 0x654321);
    this.add(this.trunk);

    // Tree foliage (multiple circles for natural look)
    const foliageColors = [0x22c55e, 0x16a34a, 0x15803d]; // default spring greens
    
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
      this.foliageCircles.push(circle1);
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
      this.foliageCircles.push(circle2);
    }

    // Top layer
    const topCircle = scene.add.circle(0, -100 * scale, 45 * scale, foliageColors[0], 1);
    this.add(topCircle);
    this.foliageCircles.push(topCircle);

    // Add some decorative elements (fruits/leaves)
    for (let i = 0; i < 5; i++) {
      const decorX = Phaser.Math.Between(-50, 50) * scale;
      const decorY = Phaser.Math.Between(-100, -40) * scale;
      const decor = scene.add.circle(decorX, decorY, 4 * scale, 0xfbbf24, 0.8); // amber
      this.add(decor);
      this.decorElements.push(decor);
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

  /**
   * Update tree appearance based on current season
   */
  public updateSeason(season: Season, colors: { foliage: number[], trunk: number, snowCovered?: boolean }): void {
    // Update foliage colors with smooth tween
    this.foliageCircles.forEach((circle, index) => {
      const targetColor = colors.foliage[index % colors.foliage.length];
      this.scene.tweens.add({
        targets: circle,
        fillColor: { from: circle.fillColor, to: targetColor },
        duration: 800,
        ease: 'Sine.easeInOut'
      });
    });

    // Update trunk color
    this.scene.tweens.add({
      targets: this.trunk,
      fillColor: { from: this.trunk.fillColor, to: colors.trunk },
      duration: 800,
      ease: 'Sine.easeInOut'
    });

    // Winter: Add snow layer
    if (season === 'winter' && colors.snowCovered) {
      this.addSnowLayer();
    } else {
      this.removeSnowLayer();
    }

    // Update decorative elements based on season
    this.decorElements.forEach(decor => {
      if (season === 'autumn') {
        decor.setFillStyle(colors.foliage[0], 0.9); // Autumn colors
        decor.setVisible(true);
      } else if (season === 'spring') {
        decor.setFillStyle(0xffc0cb, 0.8); // Pink blossoms
        decor.setVisible(true);
      } else if (season === 'winter') {
        decor.setVisible(false); // Hide in winter
      } else {
        decor.setFillStyle(0x4ade80, 0.7); // Green summer
        decor.setVisible(true);
      }
    });
  }

  private addSnowLayer(): void {
    if (this.snowLayer) return;

    this.snowLayer = this.scene.add.graphics();
    
    // Draw snow caps on foliage with realistic accumulation
    this.snowLayer.fillStyle(0xffffff, 0.95);
    
    // Top snow (thickest accumulation)
    this.snowLayer.fillCircle(0, -100, 28);
    // Add shadow/depth under snow
    this.snowLayer.fillStyle(0xe0e0e0, 0.5);
    this.snowLayer.fillEllipse(0, -96, 26, 8);
    
    // Middle layer snow
    this.snowLayer.fillStyle(0xffffff, 0.95);
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 35;
      this.snowLayer.fillCircle(x, -70, 24);
      // Shadow
      this.snowLayer.fillStyle(0xe0e0e0, 0.5);
      this.snowLayer.fillEllipse(x, -67, 22, 7);
      this.snowLayer.fillStyle(0xffffff, 0.95);
    }
    
    // Bottom layer snow
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 40;
      this.snowLayer.fillCircle(x, -40, 22);
      // Shadow
      this.snowLayer.fillStyle(0xe0e0e0, 0.5);
      this.snowLayer.fillEllipse(x, -37, 20, 6);
      this.snowLayer.fillStyle(0xffffff, 0.95);
    }
    
    // Snow on trunk (windward side accumulation)
    this.snowLayer.fillStyle(0xffffff, 0.9);
    this.snowLayer.fillRect(-15, -5, 30, 10);
    this.snowLayer.fillRect(-12, 5, 24, 8);
    
    // Add icicles hanging from branches
    this.addIcicles();
    
    this.add(this.snowLayer);
    this.snowLayer.setAlpha(0);
    this.scene.tweens.add({
      targets: this.snowLayer,
      alpha: 1,
      duration: 800,
      ease: 'Power2'
    });
  }

  private addIcicles(): void {
    if (!this.snowLayer) return;

    // Icicle positions under snow accumulation
    const iciclePositions = [
      { x: 0, y: -72, length: 12 },
      { x: -35, y: -48, length: 8 },
      { x: 35, y: -48, length: 10 },
      { x: -25, y: -18, length: 6 },
      { x: 20, y: -18, length: 7 },
      { x: -40, y: -42, length: 9 }
    ];

    iciclePositions.forEach(pos => {
      // Draw icicle (thin triangle)
      this.snowLayer!.fillStyle(0xe0f7fa, 0.85); // Ice blue-white
      
      this.snowLayer!.beginPath();
      this.snowLayer!.moveTo(pos.x - 2, pos.y); // Top left
      this.snowLayer!.lineTo(pos.x + 2, pos.y); // Top right
      this.snowLayer!.lineTo(pos.x, pos.y + pos.length); // Point
      this.snowLayer!.closePath();
      this.snowLayer!.fillPath();
      
      // Add highlight (shiny edge)
      this.snowLayer!.lineStyle(1, 0xffffff, 0.6);
      this.snowLayer!.lineBetween(pos.x - 1, pos.y, pos.x, pos.y + pos.length - 2);
    });
  }

  private removeSnowLayer(): void {
    if (!this.snowLayer) return;

    this.scene.tweens.add({
      targets: this.snowLayer,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        this.snowLayer?.destroy();
        this.snowLayer = undefined;
      }
    });
  }
}
