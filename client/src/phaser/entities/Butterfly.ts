import Phaser from 'phaser';
import { ButterflySpeciesConfig, getRandomButterflySpecies } from '../config/butterflySpecies';

export class Butterfly extends Phaser.GameObjects.Container {
  private forewings: { left: Phaser.GameObjects.Graphics; right: Phaser.GameObjects.Graphics };
  private hindwings: { left: Phaser.GameObjects.Graphics; right: Phaser.GameObjects.Graphics };
  private butterflyBody: Phaser.GameObjects.Graphics;
  private antennae: Phaser.GameObjects.Graphics;
  private species: ButterflySpeciesConfig;
  private targetX: number;
  private targetY: number;
  private speed: number;
  protected gameScene: Phaser.Scene;
  private flapPhase: number = 0;
  private isGliding: boolean = false;
  private personality: number;
  private wanderAngle: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, speciesConfig?: ButterflySpeciesConfig) {
    super(scene, x, y);
    this.gameScene = scene;
    
    // Assign species (random if not specified)
    this.species = speciesConfig || getRandomButterflySpecies();
    this.speed = this.species.flight.speed;
    this.personality = Math.random();
    
    // Create visual elements
    this.createBody();
    this.createAntennae();
    this.createWings();
    
    scene.add.existing(this);
    this.setDepth(10);
    
    // Set initial random target
    this.setRandomTarget();
    
    // Start flight animation
    this.createFlightAnimation();
  }

  private createBody(): void {
    this.butterflyBody = this.gameScene.add.graphics();
    
    const bodyColor = this.species.body.color;
    const segments = this.species.body.segments;
    const segmentHeight = 3;
    
    // Head
    this.butterflyBody.fillStyle(bodyColor, 1);
    this.butterflyBody.fillCircle(0, -segments * segmentHeight / 2 - 2, 2);
    
    // Eyes
    this.butterflyBody.fillStyle(0x000000, 1);
    this.butterflyBody.fillCircle(-1, -segments * segmentHeight / 2 - 2, 0.5);
    this.butterflyBody.fillCircle(1, -segments * segmentHeight / 2 - 2, 0.5);
    
    // Thorax and abdomen (segmented)
    for (let i = 0; i < segments; i++) {
      const y = -segments * segmentHeight / 2 + i * segmentHeight;
      const width = i < 2 ? 3 : 2.5 - (i / segments) * 1.5; // Tapers
      
      this.butterflyBody.fillStyle(bodyColor, 1);
      this.butterflyBody.fillEllipse(0, y, width, segmentHeight * 0.8);
      
      // Segment lines
      if (i > 0) {
        this.butterflyBody.lineStyle(0.5, 0x000000, 0.3);
        this.butterflyBody.lineBetween(-width / 2, y - segmentHeight / 2, width / 2, y - segmentHeight / 2);
      }
    }
    
    // Add fuzzy appearance if hairy
    if (this.species.body.hairy) {
      this.butterflyBody.lineStyle(0.5, bodyColor, 0.4);
      for (let i = 0; i < 10; i++) {
        const y = -segments * segmentHeight / 2 + Math.random() * segments * segmentHeight;
        const x = (Math.random() - 0.5) * 2;
        this.butterflyBody.lineBetween(x, y, x + (Math.random() - 0.5), y + (Math.random() - 0.5) * 2);
      }
    }
    
    this.add(this.butterflyBody);
  }

  private createAntennae(): void {
    this.antennae = this.gameScene.add.graphics();
    
    const bodyColor = this.species.body.color;
    const segments = this.species.body.segments;
    const bodyLength = segments * 3;
    const antennaLength = bodyLength * 0.5; // 50% of body length
    const clubLength = antennaLength * 0.2; // Club is 20% of antenna
    
    // Antenna positioning (30-45° forward angle, V-shape)
    const baseX = 1;
    const baseY = -bodyLength / 2 - 2; // Top of head
    const spreadAngle = 30 * Math.PI / 180; // 30° spread between antennae
    const forwardAngle = 35 * Math.PI / 180; // 35° forward tilt
    
    this.antennae.lineStyle(0.6, bodyColor, 0.9);
    
    // Left antenna (curved with natural bend)
    this.antennae.beginPath();
    this.antennae.moveTo(-baseX, baseY);
    const leftMidX = -baseX - Math.sin(spreadAngle) * antennaLength * 0.6;
    const leftMidY = baseY - Math.cos(forwardAngle) * antennaLength * 0.6;
    const leftEndX = -baseX - Math.sin(spreadAngle) * antennaLength;
    const leftEndY = baseY - Math.cos(forwardAngle) * antennaLength + 1; // Slight droop
    this.antennae.lineTo(leftMidX, leftMidY);
    this.antennae.lineTo(leftEndX, leftEndY);
    this.antennae.strokePath();
    
    // Left club tip (small, 1.5x shaft width)
    this.antennae.fillStyle(bodyColor, 1);
    this.antennae.fillCircle(leftEndX, leftEndY, 0.9);
    
    // Right antenna (curved with natural bend)
    this.antennae.beginPath();
    this.antennae.moveTo(baseX, baseY);
    const rightMidX = baseX + Math.sin(spreadAngle) * antennaLength * 0.6;
    const rightMidY = baseY - Math.cos(forwardAngle) * antennaLength * 0.6;
    const rightEndX = baseX + Math.sin(spreadAngle) * antennaLength;
    const rightEndY = baseY - Math.cos(forwardAngle) * antennaLength + 1; // Slight droop
    this.antennae.lineTo(rightMidX, rightMidY);
    this.antennae.lineTo(rightEndX, rightEndY);
    this.antennae.strokePath();
    
    // Right club tip (small, 1.5x shaft width)
    this.antennae.fillCircle(rightEndX, rightEndY, 0.9);
    
    this.add(this.antennae);
  }

  private createWings(): void {
    const scale = this.species.wingSpan / 50; // Normalize to base size
    
    // Hindwings (drawn first, behind forewings)
    this.hindwings = {
      left: this.createWing('hindwing', 'left', scale),
      right: this.createWing('hindwing', 'right', scale)
    };
    
    // Forewings (on top)
    this.forewings = {
      left: this.createWing('forewing', 'left', scale),
      right: this.createWing('forewing', 'right', scale)
    };
    
    this.add([this.hindwings.left, this.hindwings.right, this.forewings.left, this.forewings.right]);
  }

  private createWing(type: 'forewing' | 'hindwing', side: 'left' | 'right', scale: number): Phaser.GameObjects.Graphics {
    const wing = this.gameScene.add.graphics();
    const pattern = type === 'forewing' ? this.species.patterns.forewings : this.species.patterns.hindwings;
    const isLeft = side === 'left';
    
    const wingWidth = type === 'forewing' ? 12 * scale : 10 * scale;
    const wingHeight = type === 'forewing' ? 16 * scale : 14 * scale;
    const offsetX = isLeft ? -2 : 2;
    const offsetY = type === 'forewing' ? -2 : 4;
    
    // Base wing shape (ellipse)
    wing.fillStyle(pattern.base, 1);
    wing.fillEllipse(offsetX * (isLeft ? 1 : 1), offsetY, wingWidth, wingHeight);
    
    // Border
    if (pattern.border) {
      wing.lineStyle(pattern.border.width, pattern.border.color, 1);
      wing.strokeEllipse(offsetX * (isLeft ? 1 : 1), offsetY, wingWidth, wingHeight);
      
      // Dotted border for monarch
      if ('dotted' in pattern.border && pattern.border.dotted) {
        wing.fillStyle(0xFFFFFF, 1);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const x = offsetX + Math.cos(angle) * wingWidth / 2;
          const y = offsetY + Math.sin(angle) * wingHeight / 2;
          wing.fillCircle(x * (isLeft ? -1 : 1), y, 1.5 * scale);
        }
      }
    }
    
    // Veins
    if (pattern.veins !== undefined) {
      wing.lineStyle(0.5 * scale, pattern.veins, 0.6);
      for (let i = 0; i < 5; i++) {
        const angle = -Math.PI / 4 + (i / 4) * Math.PI / 2;
        const length = Math.min(wingWidth, wingHeight) * 0.8;
        wing.lineBetween(
          offsetX * (isLeft ? -1 : 1),
          offsetY,
          offsetX * (isLeft ? -1 : 1) + Math.cos(angle) * length * (isLeft ? -1 : 1),
          offsetY + Math.sin(angle) * length
        );
      }
    }
    
    // Spots
    if (pattern.spots) {
      pattern.spots.forEach(spot => {
        wing.fillStyle(spot.color, 1);
        const spotX = offsetX + (spot.x - 0.5) * wingWidth;
        const spotY = offsetY + (spot.y - 0.5) * wingHeight;
        wing.fillCircle(spotX * (isLeft ? -1 : 1), spotY, spot.radius * scale);
      });
    }
    
    // Stripes (for swallowtail)
    if ('stripes' in pattern && pattern.stripes) {
      pattern.stripes.forEach(stripe => {
        wing.lineStyle(stripe.width * scale, stripe.color, 1);
        const angle = stripe.angle * Math.PI / 180;
        const length = Math.max(wingWidth, wingHeight);
        wing.lineBetween(
          offsetX * (isLeft ? -1 : 1) - Math.cos(angle) * length / 2,
          offsetY - Math.sin(angle) * length / 2,
          offsetX * (isLeft ? -1 : 1) + Math.cos(angle) * length / 2,
          offsetY + Math.sin(angle) * length / 2
        );
      });
    }
    
    // Tail (swallowtail hindwings)
    if ('tail' in pattern && pattern.tail) {
      wing.fillStyle(pattern.tail.color, 1);
      const tailX = offsetX * (isLeft ? -1 : 1);
      const tailY = offsetY + wingHeight / 2;
      wing.fillTriangle(
        tailX, tailY,
        tailX + (isLeft ? -3 : 3) * scale, tailY + pattern.tail.length * scale,
        tailX + (isLeft ? 3 : -3) * scale, tailY + pattern.tail.length * scale * 0.7
      );
    }
    
    wing.setPosition(isLeft ? -wingWidth / 3 : wingWidth / 3, 0);
    return wing;
  }

  private createFlightAnimation(): void {
    // Realistic flapping: 5-12 flaps per second (not 15-20)
    const baseFlapRate = this.species.flight.flapRate;
    const adjustedFlapRate = Math.max(5, Math.min(12, baseFlapRate * 0.6)); // Reduce to 60%, cap at 5-12
    const flapVariation = 1 + (Math.random() - 0.5) * 0.2; // ±10% variation per butterfly
    const finalFlapRate = adjustedFlapRate * flapVariation;
    
    // Duration for one complete flap cycle (open-close-open)
    const flapCycleDuration = 1000 / finalFlapRate;
    
    // Wing flapping with easing (not linear)
    this.gameScene.tweens.add({
      targets: this,
      flapPhase: Math.PI * 2,
      duration: flapCycleDuration,
      repeat: -1,
      ease: 'Quad.easeInOut', // Smooth acceleration/deceleration
      onUpdate: () => {
        this.updateWingPositions();
      }
    });
    
    // Regular gliding behavior (after 3-5 flaps)
    let flapCount = 0;
    const flapsBeforeGlide = Phaser.Math.Between(3, 5);
    
    this.gameScene.time.addEvent({
      delay: flapCycleDuration,
      callback: () => {
        flapCount++;
        if (flapCount >= flapsBeforeGlide) {
          flapCount = 0;
          // Enter glide phase
          if (Math.random() < this.species.flight.glideFrequency) {
            this.isGliding = true;
            const glideDuration = Phaser.Math.Between(500, 1500); // 0.5-1.5 seconds
            this.gameScene.time.delayedCall(glideDuration, () => {
              this.isGliding = false;
            });
          }
        }
      },
      loop: true
    });
  }

  private updateWingPositions(): void {
    if (this.isGliding) {
      // Gliding: Wings fully extended, horizontal
      this.forewings.left.setRotation(-Math.PI * 0.85); // Almost flat
      this.forewings.right.setRotation(Math.PI * 0.85);
      this.hindwings.left.setRotation(-Math.PI * 0.75);
      this.hindwings.right.setRotation(Math.PI * 0.75);
    } else {
      // Flapping: Smooth sine wave with hold frames
      let flapValue = Math.sin(this.flapPhase);
      
      // Add brief pause at fully open (±5% around peak)
      if (Math.abs(flapValue - 1) < 0.05) flapValue = 1;
      if (Math.abs(flapValue + 1) < 0.05) flapValue = -1;
      
      // Forewings: Maximum angle reduced for visibility
      const foreAngle = flapValue * (Math.PI / 4); // 45° max (was 60°)
      this.forewings.left.setRotation(-foreAngle);
      this.forewings.right.setRotation(foreAngle);
      
      // Hindwings: Slightly delayed phase, smaller angle
      const hindFlapValue = Math.sin(this.flapPhase + 0.3);
      const hindAngle = hindFlapValue * (Math.PI / 5); // 36° max
      this.hindwings.left.setRotation(-hindAngle);
      this.hindwings.right.setRotation(hindAngle);
    }
  }

  private setRandomTarget(): void {
    const wanderDist = this.species.behavior.wanderDistance;
    const wobble = this.species.flight.wobble;
    
    // Wandering pattern with personality-based variation
    this.wanderAngle += (Math.random() - 0.5) * wobble * Math.PI;
    
    this.targetX = this.x + Math.cos(this.wanderAngle) * (wanderDist * (0.5 + this.personality * 0.5));
    this.targetY = this.y + Math.sin(this.wanderAngle) * (wanderDist * (0.3 + this.personality * 0.3));
    
    // Keep within reasonable bounds
    this.targetX = Phaser.Math.Clamp(this.targetX, 100, 14000 - 100);
    this.targetY = Phaser.Math.Clamp(this.targetY, 100, 800);
  }

  public update(delta: number): void {
    // Move towards target with personality-based variation
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetX, this.targetY);
    const effectiveSpeed = this.speed * (this.isGliding ? 0.6 : 1) * (0.8 + this.personality * 0.4);
    
    const velocityX = Math.cos(angle) * effectiveSpeed * (delta / 1000);
    const velocityY = Math.sin(angle) * effectiveSpeed * (delta / 1000);
    
    // Add wobble to movement
    const wobbleX = Math.sin(this.gameScene.time.now / 200) * this.species.flight.wobble * 2;
    const wobbleY = Math.cos(this.gameScene.time.now / 300) * this.species.flight.wobble * 2;
    
    this.x += velocityX + wobbleX;
    this.y += velocityY + wobbleY;
    
    // Gentle floating
    this.y += Math.sin(this.gameScene.time.now / 1000 + this.personality * 10) * 0.3;
    
    // Check if reached target
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
    if (distance < 20) {
      this.setRandomTarget();
    }
    
    // Tilt body based on movement direction
    const tilt = Math.sin(angle) * 0.2;
    this.setRotation(tilt);
    
    // Iridescence shimmer effect for Blue Morpho
    if (this.species.iridescent) {
      const shimmer = 0.85 + Math.sin(this.gameScene.time.now / 200) * 0.15;
      this.setAlpha(shimmer);
    }
  }

  public getSpecies(): ButterflySpeciesConfig {
    return this.species;
  }
}
