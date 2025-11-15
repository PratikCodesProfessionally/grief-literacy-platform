import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }
  
  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading Healing Journey...', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff'
    });
    loadingText.setOrigin(0.5);
    
    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    });
    percentText.setOrigin(0.5);
    
    // Loading progress
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x0ea5e9, 1); // sky-500
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
    
    // Here you would load actual assets
    // For now, we'll just use a small delay to show the loading screen
    // this.load.image('player', '/assets/phaser/player.png');
    // this.load.image('station', '/assets/phaser/station.png');
    // etc.
    
    // Simulate loading
    for (let i = 0; i < 10; i++) {
      this.load.image(`placeholder-${i}`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    }
  }
  
  create(): void {
    // Fade in
    this.cameras.main.fadeIn(500, 224, 242, 254); // sky-100
    
    // Start main scene after fade
    this.time.delayedCall(600, () => {
      this.scene.start('HealingWorldScene');
    });
  }
}
