import Phaser from 'phaser';

/**
 * FallenLeaves - Ground layer system for autumn season
 * Creates scattered leaves on the ground with variation
 */
export class FallenLeaves extends Phaser.GameObjects.Container {
  private leaves: Phaser.GameObjects.Graphics[] = [];

  constructor(
    scene: Phaser.Scene,
    width: number,
    groundY: number,
    density: number = 0.5,
    colors: number[] = [0xffa726, 0xff7043, 0xef5350, 0xd4826f, 0xffd54f]
  ) {
    super(scene, 0, 0);

    const leafCount = Math.floor(width / 20 * density); // Density determines coverage

    for (let i = 0; i < leafCount; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = groundY + Phaser.Math.Between(-10, 10);
      const color = Phaser.Utils.Array.GetRandom(colors);
      const size = Phaser.Math.FloatBetween(6, 12);
      const rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
      
      const leaf = this.createLeafShape(x, y, size, color, rotation);
      this.leaves.push(leaf);
      this.add(leaf);
    }

    scene.add.existing(this);
    this.setDepth(2); // Above ground, below other objects
  }

  private createLeafShape(x: number, y: number, size: number, color: number, rotation: number): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    
    // Draw leaf shape (simple ellipse with point)
    graphics.fillStyle(color, 0.7);
    graphics.fillEllipse(0, 0, size, size * 0.6);
    
    // Add darker center vein
    const colorObj = Phaser.Display.Color.IntegerToColor(color);
    const darkerColor = Phaser.Display.Color.GetColor(
      Math.max(0, colorObj.red - 40),
      Math.max(0, colorObj.green - 40),
      Math.max(0, colorObj.blue - 40)
    );
    graphics.lineStyle(1, darkerColor, 0.5);
    graphics.lineBetween(-size / 2, 0, size / 2, 0);
    
    graphics.setPosition(x, y);
    graphics.setRotation(rotation);
    
    // Slight random alpha for depth variation
    graphics.setAlpha(Phaser.Math.FloatBetween(0.6, 0.85));
    
    return graphics;
  }

  /**
   * Animate wind blowing leaves across ground
   */
  public windGust(strength: number = 1.0): void {
    this.leaves.forEach((leaf, index) => {
      this.scene.tweens.add({
        targets: leaf,
        x: leaf.x + Phaser.Math.Between(20, 60) * strength,
        rotation: leaf.rotation + Phaser.Math.FloatBetween(-0.5, 0.5),
        duration: 800 + (index % 100) * 10,
        delay: (index % 50) * 20,
        ease: 'Sine.easeOut'
      });
    });
  }

  /**
   * Fade out and destroy (when changing seasons)
   */
  public fadeOut(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 600,
        onComplete: () => {
          this.destroy();
          resolve();
        }
      });
    });
  }
}
