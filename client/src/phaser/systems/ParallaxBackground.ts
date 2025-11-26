import Phaser from 'phaser';

interface ParallaxLayer {
  key: string;
  scrollFactor: number;
  image?: Phaser.GameObjects.TileSprite;
}

export class ParallaxBackground {
  private scene: Phaser.Scene;
  private layers: ParallaxLayer[];
  
  constructor(scene: Phaser.Scene, layers: { key: string; scrollFactor: number; color: number }[]) {
    this.scene = scene;
    this.layers = [];
    
    layers.forEach((layer, index) => {
      // Create colored tile sprite as background layer
      const tileSprite = scene.add.tileSprite(
        0,
        0,
        scene.scale.width * 2,
        scene.scale.height,
        '' // No texture, we'll use fillStyle
      );
      
      // Set color
      const graphics = scene.add.graphics();
      graphics.fillStyle(layer.color, 1);
      graphics.fillRect(0, 0, 100, 100);
      graphics.generateTexture(`bg-layer-${index}`, 100, 100);
      graphics.destroy();
      
      tileSprite.setTexture(`bg-layer-${index}`);
      tileSprite.setOrigin(0, 0);
      tileSprite.setScrollFactor(layer.scrollFactor);
      tileSprite.setDepth(-100 + index);
      
      this.layers.push({
        key: layer.key,
        scrollFactor: layer.scrollFactor,
        image: tileSprite
      });
    });
  }
  
  public update(camera: Phaser.Cameras.Scene2D.Camera): void {
    this.layers.forEach(layer => {
      if (layer.image) {
        // Update tile position based on camera scroll and parallax factor
        layer.image.tilePositionX = camera.scrollX * layer.scrollFactor;
      }
    });
  }
  
  public destroy(): void {
    this.layers.forEach(layer => {
      if (layer.image) {
        layer.image.destroy();
      }
    });
  }
}
