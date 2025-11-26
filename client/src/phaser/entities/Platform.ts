import Phaser from 'phaser';

export class Platform extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, color: number = 0x10b981) {
    super(scene, x, y, width, height, color);
    
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body
    
    // Add border/depth effect
    this.setStrokeStyle(3, 0x059669, 1);
    this.setDepth(4);
    
    // Add grass texture on top
    this.addGrassEffect(scene, x, y, width);
  }

  private addGrassEffect(scene: Phaser.Scene, x: number, y: number, width: number): void {
    // Add small grass strands on top of platform
    const grassCount = Math.floor(width / 20);
    for (let i = 0; i < grassCount; i++) {
      const grassX = x - width / 2 + (width / grassCount) * i;
      const grass = scene.add.rectangle(
        grassX,
        y - this.height / 2,
        2,
        8,
        0x22c55e,
        0.7
      );
      grass.setOrigin(0.5, 1);
      grass.setDepth(5);
      
      // Gentle sway
      scene.tweens.add({
        targets: grass,
        rotation: Phaser.Math.Between(-5, 5) * 0.01,
        duration: Phaser.Math.Between(1500, 2500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }
}

export class Hill extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);

    // Create curved hill shape using multiple circles
    const segments = 20;
    for (let i = 0; i < segments; i++) {
      const segX = (-width / 2) + (width / segments) * i;
      const segY = -Math.abs(Math.sin((i / segments) * Math.PI)) * height;
      
      const segment = scene.add.circle(
        segX,
        segY,
        width / segments / 2,
        0x10b981 // emerald-500
      );
      this.add(segment);
    }

    // Add overlay for smooth appearance
    const overlay = scene.add.ellipse(0, -height / 2, width, height, 0x059669, 0.3);
    this.add(overlay);

    scene.add.existing(this);
    this.setDepth(3);

    // Add some flowers on the hill
    this.addFlowers(scene, width, height);
  }

  private addFlowers(scene: Phaser.Scene, width: number, height: number): void {
    const flowerCount = 5;
    for (let i = 0; i < flowerCount; i++) {
      const flowerX = Phaser.Math.Between(-width / 3, width / 3);
      const flowerY = -height / 2 + Phaser.Math.Between(-20, 20);
      
      const flower = scene.add.text(flowerX, flowerY, '🌼', {
        fontSize: '16px'
      });
      flower.setOrigin(0.5);
      this.add(flower);
      
      // Gentle bob
      scene.tweens.add({
        targets: flower,
        y: flowerY - 3,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 400
      });
    }
  }
}
