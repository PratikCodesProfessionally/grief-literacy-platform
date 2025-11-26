import Phaser from 'phaser';

/**
 * SnowLayer - Ground layer system for winter season
 * Creates snow coverage with depth, tracks, and texture variation
 */
export class SnowLayer extends Phaser.GameObjects.Container {
  private snowBase: Phaser.GameObjects.Graphics;
  private tracks: Phaser.GameObjects.Graphics;
  private snowDepth: number;

  constructor(
    scene: Phaser.Scene,
    width: number,
    groundY: number,
    depth: number = 12 // Visual depth in pixels
  ) {
    super(scene, 0, 0);

    this.snowDepth = depth;

    // Create base snow layer with slight texture variation
    this.snowBase = scene.add.graphics();
    this.snowBase.fillStyle(0xfafafa, 1); // Pure white
    
    // Main snow rectangle with slight undulation
    const points: Phaser.Geom.Point[] = [];
    const segments = 100;
    
    for (let i = 0; i <= segments; i++) {
      const x = (width / segments) * i;
      const y = groundY + Phaser.Math.FloatBetween(-2, 2); // Slight variation
      points.push(new Phaser.Geom.Point(x, y));
    }
    
    // Draw snow surface
    this.snowBase.beginPath();
    this.snowBase.moveTo(0, groundY + 200);
    this.snowBase.lineTo(0, points[0].y);
    
    points.forEach(point => {
      this.snowBase.lineTo(point.x, point.y);
    });
    
    this.snowBase.lineTo(width, groundY + 200);
    this.snowBase.closePath();
    this.snowBase.fillPath();
    
    // Add subtle shadow/depth at edges
    this.snowBase.fillStyle(0xe0e0e0, 0.3);
    for (let i = 0; i < points.length - 1; i++) {
      if (points[i].y < points[i + 1].y) {
        this.snowBase.fillRect(points[i].x, points[i].y, 
                              points[i + 1].x - points[i].x, depth / 2);
      }
    }
    
    this.add(this.snowBase);
    
    // Create tracks layer (initially empty)
    this.tracks = scene.add.graphics();
    this.add(this.tracks);

    scene.add.existing(this);
    this.setDepth(2);
  }

  /**
   * Add footprint/track at position
   */
  public addTrack(x: number, y: number, isLeft: boolean = true): void {
    this.tracks.fillStyle(0xd0d0d0, 0.4); // Slightly darker snow (compressed)
    
    // Footprint shape (simple ellipse)
    const width = 15;
    const height = 25;
    const offsetX = isLeft ? -5 : 5;
    
    this.tracks.fillEllipse(x + offsetX, y, width, height);
    
    // Add toes (small circles)
    this.tracks.fillStyle(0xc0c0c0, 0.3);
    for (let i = 0; i < 3; i++) {
      this.tracks.fillCircle(
        x + offsetX + (i - 1) * 4,
        y - height / 2 - 3,
        3
      );
    }
  }

  /**
   * Add sparkle effect to snow (sunlight reflection)
   */
  public addSparkles(count: number = 20): void {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, this.scene.scale.width);
      const y = Phaser.Math.Between(0, 100);
      
      const sparkle = this.scene.add.circle(x, y, 2, 0xffffff, 0.8);
      sparkle.setDepth(10);
      this.add(sparkle);
      
      // Twinkle animation
      this.scene.tweens.add({
        targets: sparkle,
        alpha: { from: 0.2, to: 1 },
        scale: { from: 0.5, to: 1.2 },
        duration: Phaser.Math.Between(800, 1500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1000)
      });
    }
  }

  /**
   * Fade out and destroy (when changing seasons)
   */
  public fadeOut(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          this.destroy();
          resolve();
        }
      });
    });
  }
}
