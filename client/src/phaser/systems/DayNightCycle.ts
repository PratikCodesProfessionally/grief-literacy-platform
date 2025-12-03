import Phaser from 'phaser';

type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'dusk' | 'night';

interface TimeColors {
  sky: number;
  skyGradient: number;
  ambient: number;
  sunMoon: number;
  sunMoonGlow: number;
  stars: boolean;
  lightIntensity: number;
}

/**
 * DayNightCycle - Dynamic lighting based on real or simulated time
 * 
 * Features:
 * - Smooth color transitions between times of day
 * - Sun/moon position that moves across sky
 * - Star visibility at night
 * - Ambient light overlay affecting entire scene
 * - Optional real-time sync or manual control
 * - Lamp posts that glow at night
 */
export class DayNightCycle {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Rectangle;
  private skyGradient: Phaser.GameObjects.Graphics;
  private celestialBody: Phaser.GameObjects.Container;
  private stars: Phaser.GameObjects.Container;
  private timeIndicator?: Phaser.GameObjects.Container;
  
  private currentTime: number = 8; // 0-24 hours
  private targetTime: number = 8;
  private useRealTime: boolean = false;
  private transitionSpeed: number = 0.001; // Speed of time transition
  private manualControl: boolean = false;
  
  // Color configurations for different times
  private timeColors: Record<TimeOfDay, TimeColors> = {
    dawn: {
      sky: 0xFF9966,
      skyGradient: 0x4A5568,
      ambient: 0xFFAA77,
      sunMoon: 0xFFDD77,
      sunMoonGlow: 0xFF7744,
      stars: false,
      lightIntensity: 0.15
    },
    morning: {
      sky: 0x87CEEB,
      skyGradient: 0x4A90D9,
      ambient: 0xFFFFDD,
      sunMoon: 0xFFEE88,
      sunMoonGlow: 0xFFFF88,
      stars: false,
      lightIntensity: 0.05
    },
    afternoon: {
      sky: 0x5DA9E9,
      skyGradient: 0x3A8BC9,
      ambient: 0xFFFFFF,
      sunMoon: 0xFFFFAA,
      sunMoonGlow: 0xFFFF99,
      stars: false,
      lightIntensity: 0
    },
    evening: {
      sky: 0xFF8866,
      skyGradient: 0xCC6644,
      ambient: 0xFFBB88,
      sunMoon: 0xFF9944,
      sunMoonGlow: 0xFF6622,
      stars: false,
      lightIntensity: 0.2
    },
    dusk: {
      sky: 0x6B4E71,
      skyGradient: 0x2C3E50,
      ambient: 0x8866AA,
      sunMoon: 0xDDDDEE,
      sunMoonGlow: 0x9999CC,
      stars: true,
      lightIntensity: 0.35
    },
    night: {
      sky: 0x1A1A2E,
      skyGradient: 0x0D0D1A,
      ambient: 0x4444AA,
      sunMoon: 0xEEEEFF,
      sunMoonGlow: 0x6666AA,
      stars: true,
      lightIntensity: 0.5
    }
  };
  
  constructor(scene: Phaser.Scene, useRealTime: boolean = false) {
    this.scene = scene;
    this.useRealTime = useRealTime;
    
    // Container for celestial bodies and stars
    // Depth -195: Behind clouds (-180) but in front of sky gradient (-199)
    this.container = scene.add.container(0, 0);
    this.container.setDepth(-195);
    this.container.setScrollFactor(0);
    
    // Initialize with current time if using real time
    if (useRealTime) {
      const now = new Date();
      this.currentTime = now.getHours() + now.getMinutes() / 60;
      this.targetTime = this.currentTime;
    }
    
    // Create visual elements - NO sky gradient (ParallaxBackground handles sky)
    this.skyGradient = this.createSkyGradient(); // Keep but don't draw
    this.stars = this.createStars();
    this.celestialBody = this.createCelestialBody();
    this.overlay = this.createAmbientOverlay();
    
    // Create time indicator UI
    this.createTimeIndicator();
    
    // Initial update
    this.updateVisuals();
    
    // Handle resize
    scene.scale.on('resize', this.handleResize, this);
  }
  
  private createSkyGradient(): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    this.container.add(graphics);
    return graphics;
  }
  
  private createStars(): Phaser.GameObjects.Container {
    const stars = this.scene.add.container(0, 0);
    
    // Create random star positions
    const { width, height } = this.scene.cameras.main;
    const starCount = 80;
    
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(0, width * 2);
      const y = Phaser.Math.Between(0, height * 0.6);
      const size = Phaser.Math.Between(1, 3);
      
      const star = this.scene.add.circle(x, y, size, 0xFFFFFF, 0.8);
      star.setData('twinkleOffset', Math.random() * Math.PI * 2);
      star.setData('baseAlpha', 0.5 + Math.random() * 0.5);
      stars.add(star);
    }
    
    this.container.add(stars);
    return stars;
  }
  
  private createCelestialBody(): Phaser.GameObjects.Container {
    const body = this.scene.add.container(0, 0);
    
    // Glow effect (outer)
    const glow = this.scene.add.circle(0, 0, 50, 0xFFFF88, 0.3);
    glow.setData('type', 'glow');
    body.add(glow);
    
    // Main body
    const main = this.scene.add.circle(0, 0, 30, 0xFFEE88, 1);
    main.setData('type', 'main');
    body.add(main);
    
    // Moon craters (hidden during day)
    const crater1 = this.scene.add.circle(-8, -5, 6, 0xCCCCDD, 0.5);
    crater1.setData('type', 'crater');
    crater1.setVisible(false);
    body.add(crater1);
    
    const crater2 = this.scene.add.circle(10, 8, 4, 0xCCCCDD, 0.5);
    crater2.setData('type', 'crater');
    crater2.setVisible(false);
    body.add(crater2);
    
    this.container.add(body);
    return body;
  }
  
  private createAmbientOverlay(): Phaser.GameObjects.Rectangle {
    const { width, height } = this.scene.cameras.main;
    
    const overlay = this.scene.add.rectangle(
      width / 2, height / 2,
      width * 3, height * 2,
      0x000033, 0
    );
    overlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    
    // Add to scene directly (not container) so it affects everything
    overlay.setScrollFactor(0);
    overlay.setDepth(800); // Above world, below UI
    
    return overlay;
  }
  
  private createTimeIndicator(): void {
    const { width } = this.scene.cameras.main;
    
    this.timeIndicator = this.scene.add.container(width - 70, 190);
    this.timeIndicator.setScrollFactor(0);
    this.timeIndicator.setDepth(960);
    
    // Background
    const bg = this.scene.add.rectangle(0, 0, 80, 35, 0x1A202C, 0.85);
    bg.setStrokeStyle(1, 0x4A5568);
    this.timeIndicator.add(bg);
    
    // Time icon
    const icon = this.scene.add.text(-30, 0, '☀️', { fontSize: '16px' });
    icon.setOrigin(0.5);
    icon.setData('type', 'icon');
    this.timeIndicator.add(icon);
    
    // Time text
    const timeText = this.scene.add.text(10, 0, '08:00', {
      fontSize: '11px',
      fontFamily: 'Inter, sans-serif',
      fontStyle: 'bold',
      color: '#E2E8F0'
    });
    timeText.setOrigin(0.5);
    timeText.setData('type', 'text');
    this.timeIndicator.add(timeText);
    
    // Make clickable to toggle manual control
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      this.manualControl = !this.manualControl;
      if (!this.manualControl) {
        // Reset to real time or default
        if (this.useRealTime) {
          const now = new Date();
          this.targetTime = now.getHours() + now.getMinutes() / 60;
        }
      }
    });
    
    // Scroll to change time when manual
    bg.on('wheel', (_pointer: Phaser.Input.Pointer, _dx: number, dy: number) => {
      if (this.manualControl) {
        this.targetTime = (this.targetTime + (dy > 0 ? 1 : -1) + 24) % 24;
      }
    });
  }
  
  private getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 19) return 'evening';
    if (hour >= 19 && hour < 21) return 'dusk';
    return 'night';
  }
  
  private getInterpolatedColors(hour: number): TimeColors {
    const currentPeriod = this.getTimeOfDay(hour);
    const currentColors = this.timeColors[currentPeriod];
    
    // Determine next period and blend factor
    let nextPeriod: TimeOfDay;
    let blendFactor = 0;
    
    if (hour >= 5 && hour < 7) {
      nextPeriod = 'morning';
      blendFactor = (hour - 5) / 2;
    } else if (hour >= 7 && hour < 12) {
      nextPeriod = 'afternoon';
      blendFactor = (hour - 7) / 5;
    } else if (hour >= 12 && hour < 17) {
      nextPeriod = 'evening';
      blendFactor = (hour - 12) / 5;
    } else if (hour >= 17 && hour < 19) {
      nextPeriod = 'dusk';
      blendFactor = (hour - 17) / 2;
    } else if (hour >= 19 && hour < 21) {
      nextPeriod = 'night';
      blendFactor = (hour - 19) / 2;
    } else {
      nextPeriod = 'dawn';
      if (hour >= 21) {
        blendFactor = (hour - 21) / 8;
      } else {
        blendFactor = (hour + 3) / 8;
      }
    }
    
    const nextColors = this.timeColors[nextPeriod];
    
    // Interpolate colors
    return {
      sky: this.lerpColor(currentColors.sky, nextColors.sky, blendFactor),
      skyGradient: this.lerpColor(currentColors.skyGradient, nextColors.skyGradient, blendFactor),
      ambient: this.lerpColor(currentColors.ambient, nextColors.ambient, blendFactor),
      sunMoon: this.lerpColor(currentColors.sunMoon, nextColors.sunMoon, blendFactor),
      sunMoonGlow: this.lerpColor(currentColors.sunMoonGlow, nextColors.sunMoonGlow, blendFactor),
      stars: hour >= 19 || hour < 6,
      lightIntensity: Phaser.Math.Linear(currentColors.lightIntensity, nextColors.lightIntensity, blendFactor)
    };
  }
  
  private lerpColor(color1: number, color2: number, factor: number): number {
    const r1 = (color1 >> 16) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = color1 & 0xFF;
    
    const r2 = (color2 >> 16) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = color2 & 0xFF;
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return (r << 16) | (g << 8) | b;
  }
  
  private updateVisuals(): void {
    const colors = this.getInterpolatedColors(this.currentTime);
    const { width, height } = this.scene.cameras.main;
    
    // Skip sky gradient - ParallaxBackground handles the sky
    // Just clear it to be safe
    this.skyGradient.clear();
    
    // Update stars visibility and twinkling
    this.stars.setVisible(colors.stars);
    if (colors.stars) {
      const time = this.scene.time.now / 1000;
      this.stars.getAll().forEach((star) => {
        if (star instanceof Phaser.GameObjects.Arc) {
          const offset = star.getData('twinkleOffset') as number;
          const baseAlpha = star.getData('baseAlpha') as number;
          const twinkle = Math.sin(time * 2 + offset) * 0.3;
          star.setAlpha(Math.max(0.2, baseAlpha + twinkle));
        }
      });
    }
    
    // Update celestial body position
    const angle = ((this.currentTime - 6) / 24) * Math.PI * 2 - Math.PI / 2;
    const orbitWidth = width * 0.8;
    const orbitHeight = height * 0.4;
    const centerX = width / 2;
    const centerY = height * 0.5;
    
    const x = centerX + Math.cos(angle) * orbitWidth / 2;
    const y = centerY - Math.sin(angle) * orbitHeight;
    
    this.celestialBody.setPosition(x, y);
    
    // Update sun/moon appearance
    const isNight = this.currentTime >= 19 || this.currentTime < 6;
    this.celestialBody.getAll().forEach((part) => {
      const type = part.getData('type');
      if (part instanceof Phaser.GameObjects.Arc) {
        if (type === 'main') {
          part.setFillStyle(colors.sunMoon);
        } else if (type === 'glow') {
          part.setFillStyle(colors.sunMoonGlow, 0.3);
        } else if (type === 'crater') {
          part.setVisible(isNight);
        }
      }
    });
    
    // Update ambient overlay
    this.overlay.setFillStyle(colors.ambient, colors.lightIntensity);
    
    // Update time indicator
    if (this.timeIndicator) {
      const hours = Math.floor(this.currentTime);
      const minutes = Math.floor((this.currentTime % 1) * 60);
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const icon = isNight ? '🌙' : (this.currentTime >= 17 ? '🌅' : '☀️');
      
      this.timeIndicator.getAll().forEach((element) => {
        if (element instanceof Phaser.GameObjects.Text) {
          const type = element.getData('type');
          if (type === 'icon') {
            element.setText(icon);
          } else if (type === 'text') {
            element.setText(timeStr);
          }
        }
      });
    }
  }
  
  public update(delta: number): void {
    // Update time
    if (this.useRealTime && !this.manualControl) {
      const now = new Date();
      this.targetTime = now.getHours() + now.getMinutes() / 60;
    }
    
    // Smooth transition to target time
    const diff = this.targetTime - this.currentTime;
    if (Math.abs(diff) > 0.01) {
      // Handle wrap-around at midnight
      let adjustedDiff = diff;
      if (diff > 12) adjustedDiff = diff - 24;
      if (diff < -12) adjustedDiff = diff + 24;
      
      this.currentTime += adjustedDiff * this.transitionSpeed * delta;
      
      // Normalize time
      if (this.currentTime >= 24) this.currentTime -= 24;
      if (this.currentTime < 0) this.currentTime += 24;
    }
    
    // Update visuals
    this.updateVisuals();
  }
  
  private handleResize(): void {
    const { width, height } = this.scene.cameras.main;
    
    // Update overlay size
    this.overlay.setPosition(width / 2, height / 2);
    this.overlay.setSize(width * 3, height * 2);
    
    // Update time indicator position
    if (this.timeIndicator) {
      this.timeIndicator.setPosition(width - 70, 190);
    }
    
    // Redistribute stars
    this.stars.getAll().forEach((star) => {
      if (star instanceof Phaser.GameObjects.Arc) {
        star.setPosition(
          Phaser.Math.Between(0, width * 2),
          Phaser.Math.Between(0, height * 0.6)
        );
      }
    });
    
    // Redraw sky gradient
    this.updateVisuals();
  }
  
  // Public API
  
  public setTime(hour: number): void {
    this.targetTime = hour % 24;
    this.manualControl = true;
  }
  
  public setRealTime(enabled: boolean): void {
    this.useRealTime = enabled;
    this.manualControl = false;
  }
  
  public getTime(): number {
    return this.currentTime;
  }
  
  public getTimeOfDayName(): TimeOfDay {
    return this.getTimeOfDay(this.currentTime);
  }
  
  public isNight(): boolean {
    return this.currentTime >= 19 || this.currentTime < 6;
  }
  
  public destroy(): void {
    this.scene.scale.off('resize', this.handleResize, this);
    this.container.destroy();
    this.overlay.destroy();
  }
}
