import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { HealingWorldScene } from '../scenes/HealingWorldScene';

export const createGameConfig = (parent: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#e0f2fe', // sky-100
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
    expandParent: true,
    fullscreenTarget: parent
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
    antialias: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    pixelArt: false,
    roundPixels: true
  },
  fps: {
    target: 60,
    forceSetTimeOut: false
  },
  dom: {
    createContainer: true
  },
  input: {
    keyboard: true,
    touch: {
      capture: false,  // CHANGED: Don't capture events
      target: parent
    },
    activePointers: 10,  // INCREASED: Allow more touches
    mouse: {
      preventDefaultWheel: false,
      preventDefaultDown: false,  // CHANGED: Don't prevent default
      preventDefaultUp: false,    // CHANGED: Don't prevent default
      preventDefaultMove: false   // CHANGED: Don't prevent default
    }
  }
});
