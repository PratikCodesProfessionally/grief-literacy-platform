import Phaser from 'phaser';

export enum CollectibleType {
  FLOWER = 'flower',
  STONE = 'stone',
  MEMORY = 'memory',
  STAR = 'star'
}

interface CollectibleConfig {
  type: CollectibleType;
  emoji: string;
  color: number;
  name: string;
  message: string;
}

const COLLECTIBLE_CONFIGS: Record<CollectibleType, CollectibleConfig> = {
  [CollectibleType.FLOWER]: {
    type: CollectibleType.FLOWER,
    emoji: '🌸',
    color: 0xff69b4,
    name: 'Hope Flower',
    message: 'You found a flower of hope!'
  },
  [CollectibleType.STONE]: {
    type: CollectibleType.STONE,
    emoji: '💎',
    color: 0x60a5fa,
    name: 'Healing Stone',
    message: 'A precious stone for your journey'
  },
  [CollectibleType.MEMORY]: {
    type: CollectibleType.MEMORY,
    emoji: '✨',
    color: 0xfbbf24,
    name: 'Memory Spark',
    message: 'A cherished memory preserved'
  },
  [CollectibleType.STAR]: {
    type: CollectibleType.STAR,
    emoji: '⭐',
    color: 0xfcd34d,
    name: 'Guiding Star',
    message: 'May this star light your path'
  }
};

export class Collectible extends Phaser.GameObjects.Container {
  private config: CollectibleConfig;
  private glow: Phaser.GameObjects.Arc;
  private icon: Phaser.GameObjects.Text;
  private collected: boolean = false;
  protected gameScene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, type: CollectibleType) {
    super(scene, x, y);
    this.gameScene = scene;
    this.config = COLLECTIBLE_CONFIGS[type];

    // Glow effect
    this.glow = scene.add.circle(0, 0, 20, this.config.color, 0.3);
    this.add(this.glow);

    // Icon
    this.icon = scene.add.text(0, 0, this.config.emoji, {
      fontSize: '32px',
      fontFamily: 'Arial'
    });
    this.icon.setOrigin(0.5);
    this.add(this.icon);

    scene.add.existing(this);

    // Floating animation
    scene.tweens.add({
      targets: this,
      y: y - 10,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Glow pulse
    scene.tweens.add({
      targets: this.glow,
      scale: 1.3,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Gentle rotation
    scene.tweens.add({
      targets: this.icon,
      rotation: Math.PI * 2,
      duration: 4000,
      repeat: -1,
      ease: 'Linear'
    });

    this.setDepth(10);
  }

  public collect(): { name: string; message: string } {
    if (this.collected) return { name: '', message: '' };
    
    this.collected = true;

    // Collection animation
    this.gameScene.tweens.add({
      targets: this,
      y: this.y - 80,
      alpha: 0,
      scale: 1.5,
      duration: 600,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.destroy();
      }
    });

    // Particle burst
    this.createParticleBurst();

    return {
      name: this.config.name,
      message: this.config.message
    };
  }

  private createParticleBurst(): void {
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const particle = this.gameScene.add.circle(
        this.x,
        this.y,
        4,
        this.config.color
      );
      particle.setDepth(this.depth + 1);

      this.gameScene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * 60,
        y: particle.y + Math.sin(angle) * 60,
        alpha: 0,
        scale: 0,
        duration: 800,
        ease: 'Power3',
        onComplete: () => particle.destroy()
      });
    }
  }

  public isPlayerNearby(playerX: number, playerY: number, range: number = 60): boolean {
    if (this.collected) return false;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    return distance < range;
  }

  public isCollected(): boolean {
    return this.collected;
  }
}
