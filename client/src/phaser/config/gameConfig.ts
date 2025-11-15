import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { HealingWorldScene } from '../scenes/HealingWorldScene';

export const createGameConfig = (parent: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#e0f2fe', // sky-100
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080,
    min: {
      width: 800,
      height: 600
    },
    max: {
      width: 1920,
      height: 1080
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // No gravity for 2D side-scroller
      debug: false // Set true for development debugging
    }
  },
  scene: [BootScene, HealingWorldScene],
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true
  },
  fps: {
    target: 60,
    forceSetTimeOut: false
  }
});
