import Phaser from 'phaser';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonConfig {
  name: string;
  skyColors: {
    top: number;
    bottom: number;
  };
  groundColor: number;
  snowCoverage?: number;  // 0-1, percentage of snow coverage
  treeColors: {
    foliage: number[];
    trunk: number;
    snowCovered?: boolean;
    foliageDensity?: number; // 0-1, how much foliage remains
    bareTreePercentage?: number; // 0-1, how many branches are visible
  };
  particleConfig?: {
    texture: string;
    color: number;
    count: number;
    gravityY?: number;
    speedX?: number;
    rotation?: boolean;
    scale?: { start: number; end: number };
    alpha?: { start: number; end: number };
  };
  butterflyCount: number;
  flowers?: {
    enabled: boolean;
    colors: number[];
    count: number;
    types?: string[]; // tulips, daffodils, wildflowers, etc.
  };
  ambientLight: number;
  // Advanced visual effects
  atmosphericEffects?: {
    fog?: { enabled: boolean; density: number; color: number };
    heatShimmer?: boolean;
    windStrength?: number; // 0-1
  };
  groundDetails?: {
    fallenLeaves?: { enabled: boolean; density: number; colors: number[] };
    snowDepth?: number; // Visual depth in pixels
    moisture?: number; // 0-1, affects color/shine
    tracks?: boolean; // Show footprints/tracks
  };
  roadCondition?: {
    coverage: 'clear' | 'leaves' | 'snow' | 'wet';
    colorTint: number;
  };
}

export const SEASON_CONFIGS: Record<Season, SeasonConfig> = {
  spring: {
    name: 'Spring',
    skyColors: {
      top: 0x87ceeb,    // Sky blue
      bottom: 0xb0e0e6  // Powder blue
    },
    groundColor: 0x7cb342, // Fresh vibrant green
    treeColors: {
      foliage: [0x4ade80, 0x22c55e, 0x16a34a, 0x84cc16], // Light greens with variation
      trunk: 0x8b4513,
      snowCovered: false,
      foliageDensity: 0.75,  // 75% full, still filling in
      bareTreePercentage: 0.2  // 20% branches visible
    },
    particleConfig: {
      texture: 'petal',
      color: 0xffc0cb, // Pink cherry blossoms
      count: 40,
      gravityY: 40,
      speedX: 25,
      rotation: true,
      scale: { start: 0.6, end: 0.2 },
      alpha: { start: 0.9, end: 0.3 }
    },
    butterflyCount: 18,  // 60-70% of summer
    flowers: {
      enabled: true,
      colors: [0xffc0cb, 0xffeb3b, 0xffffff, 0xba68c8, 0x64b5f6], // Pink, yellow, white, purple, light blue
      count: 35,
      types: ['tulip', 'daffodil', 'crocus', 'wildflower']
    },
    ambientLight: 1.0,
    atmosphericEffects: {
      windStrength: 0.3  // Light breeze
    },
    groundDetails: {
      moisture: 0.4,  // Dewy, slightly damp appearance
      tracks: false
    },
    roadCondition: {
      coverage: 'wet',
      colorTint: 0x808080  // Slightly darker from moisture
    }
  },
  
  summer: {
    name: 'Summer',
    skyColors: {
      top: 0x4a90e2,    // Deep blue
      bottom: 0x87ceeb  // Light blue  
    },
    groundColor: 0x558b2f, // Deep, rich green
    treeColors: {
      foliage: [0x2e7d32, 0x1b5e20, 0x33691e, 0x558b2f], // Dark lush greens
      trunk: 0x6d4c41,
      snowCovered: false,
      foliageDensity: 1.0,  // 100% full, maximum density
      bareTreePercentage: 0  // No bare branches
    },
    butterflyCount: 25,  // 100% Maximum
    flowers: {
      enabled: true,
      colors: [0xff5252, 0xffeb3b, 0xff4081, 0x7c4dff, 0xff6e40, 0xf06292], // Full spectrum
      count: 50,  // Maximum abundance
      types: ['rose', 'sunflower', 'wildflower', 'hydrangea']
    },
    ambientLight: 1.15,  // Bright summer light
    atmosphericEffects: {
      heatShimmer: true,  // Heat distortion effect
      windStrength: 0.2  // Gentle warm breeze
    },
    groundDetails: {
      moisture: 0.1  // Dry ground
    },
    roadCondition: {
      coverage: 'clear',
      colorTint: 0xd0d0d0  // Sun-bleached lighter
    }
  },
  
  autumn: {
    name: 'Autumn',
    skyColors: {
      top: 0x78909c,    // Gray-blue
      bottom: 0xffb74d  // Warm amber-orange
    },
    groundColor: 0x8d6e63, // Brown with leaf coverage
    treeColors: {
      foliage: [0xffa726, 0xff7043, 0xef5350, 0xd4826f, 0xffd54f], // Orange(40%), Red(30%), Yellow(20%), Brown(10%)
      trunk: 0x5d4037,
      snowCovered: false,
      foliageDensity: 0.65,  // 60-70% remaining
      bareTreePercentage: 0.35  // More branches showing
    },
    particleConfig: {
      texture: 'leaf',
      color: 0xff8a65, // Mixed autumn colors
      count: 80,  // More falling leaves
      gravityY: 60,  // Slow, gentle fall
      speedX: 40,  // Wind effect
      rotation: true,
      scale: { start: 0.7, end: 0.3 },
      alpha: { start: 0.95, end: 0.4 }
    },
    butterflyCount: 10,  // 30-40% of summer
    flowers: {
      enabled: true,
      colors: [0xffa726, 0xffb74d, 0xd84315], // Late chrysanthemums
      count: 8,  // 10-20% remaining
      types: ['chrysanthemum']
    },
    ambientLight: 0.92,  // Golden light
    atmosphericEffects: {
      windStrength: 0.5  // Stronger wind
    },
    groundDetails: {
      fallenLeaves: {
        enabled: true,
        density: 0.5,  // 40-60% ground coverage
        colors: [0xffa726, 0xff7043, 0xef5350, 0xd4826f, 0xffd54f]
      },
      moisture: 0.2
    },
    roadCondition: {
      coverage: 'leaves',
      colorTint: 0x9e9e9e  // Partially covered
    }
  },
  
  winter: {
    name: 'Winter',
    skyColors: {
      top: 0x607d8b,    // Cold slate
      bottom: 0xe1f5fe  // Ice blue with white
    },
    groundColor: 0xfafafa, // Pure white snow
    snowCoverage: 1.0,  // 100% snow coverage
    treeColors: {
      foliage: [0xffffff, 0xf5f5f5, 0xe0e0e0], // Pure white snow on branches
      trunk: 0x424242,  // Dark bark
      snowCovered: true,
      foliageDensity: 0.1,  // Minimal dead leaves
      bareTreePercentage: 0.8  // Mostly bare branches
    },
    particleConfig: {
      texture: 'snowflake',
      color: 0xffffff,
      count: 120,  // Heavy snowfall
      gravityY: 25,  // Light, floating snow
      speedX: 20,  // Wind drift and swirls
      rotation: false,
      scale: { start: 0.4, end: 0.1 },
      alpha: { start: 0.95, end: 0.6 }
    },
    butterflyCount: 0,  // Zero butterflies
    flowers: {
      enabled: false,
      colors: [],
      count: 0
    },
    ambientLight: 0.95,  // Bright white reflected light from snow
    atmosphericEffects: {
      fog: {
        enabled: true,
        density: 0.15,
        color: 0xe0e0e0
      },
      windStrength: 0.4  // Occasional gusts
    },
    groundDetails: {
      snowDepth: 12,  // 10-15cm visual depth
      tracks: true,  // Footprints visible
      moisture: 0
    },
    roadCondition: {
      coverage: 'snow',
      colorTint: 0xe0e0e0  // Packed snow
    }
  }
};

export class SeasonManager {
  private scene: Phaser.Scene;
  private currentSeason: Season = 'spring';
  private particles: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private skyGradient?: Phaser.GameObjects.Graphics;
  private ground?: Phaser.GameObjects.Rectangle;
  
  constructor(scene: Phaser.Scene, initialSeason: Season = 'spring') {
    this.scene = scene;
    this.currentSeason = initialSeason;
  }
  
  public getCurrentSeason(): Season {
    return this.currentSeason;
  }
  
  public getSeasonConfig(): SeasonConfig {
    return SEASON_CONFIGS[this.currentSeason];
  }
  
  public changeSeason(newSeason: Season): void {
    if (this.currentSeason === newSeason) return;
    
    console.log(`🍂 Changing season from ${this.currentSeason} to ${newSeason}`);
    this.currentSeason = newSeason;
    
    // Clear existing particles
    this.clearParticles();
    
    // Apply new season effects
    this.applySeasonEffects();
    
    // Emit season change event
    this.scene.events.emit('seasonChanged', newSeason);
  }
  
  public nextSeason(): void {
    const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
    const currentIndex = seasons.indexOf(this.currentSeason);
    const nextIndex = (currentIndex + 1) % seasons.length;
    this.changeSeason(seasons[nextIndex]);
  }
  
  public createSkyGradient(width: number, height: number): Phaser.GameObjects.Graphics {
    const config = this.getSeasonConfig();
    
    if (this.skyGradient) {
      this.skyGradient.destroy();
    }
    
    this.skyGradient = this.scene.add.graphics();
    this.skyGradient.setDepth(-100);
    
    // Phaser Graphics uses fillGradientStyle for vertical gradients
    // Parameters: topLeft, topRight, bottomLeft, bottomRight
    this.skyGradient.fillGradientStyle(
      config.skyColors.top,
      config.skyColors.top,
      config.skyColors.bottom,
      config.skyColors.bottom,
      1
    );
    this.skyGradient.fillRect(0, 0, width, height);
    
    return this.skyGradient;
  }
  
  public createGround(width: number, y: number, height: number = 200): Phaser.GameObjects.Rectangle {
    const config = this.getSeasonConfig();
    
    if (this.ground) {
      this.ground.destroy();
    }
    
    this.ground = this.scene.add.rectangle(width / 2, y + height / 2, width, height, config.groundColor);
    this.ground.setDepth(1);
    
    return this.ground;
  }
  
  private applySeasonEffects(): void {
    const config = this.getSeasonConfig();
    
    // Update sky
    if (this.skyGradient) {
      this.skyGradient.clear();
      this.skyGradient.fillGradientStyle(
        config.skyColors.top, 
        config.skyColors.top, 
        config.skyColors.bottom, 
        config.skyColors.bottom
      );
      this.skyGradient.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    }
    
    // Update ground
    if (this.ground) {
      this.ground.setFillStyle(config.groundColor);
    }
    
    // Create seasonal particles
    if (config.particleConfig) {
      this.createSeasonalParticles(config.particleConfig);
    }
  }
  
  private createSeasonalParticles(particleConfig: SeasonConfig['particleConfig']): void {
    if (!particleConfig) return;
    
    // Create simple circle graphics for particles
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(particleConfig.color, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture(particleConfig.texture, 8, 8);
    graphics.destroy();
    
    // Create particle emitter with seasonal properties
    const particles = this.scene.add.particles(0, 0, particleConfig.texture, {
      x: { min: 0, max: this.scene.scale.width },
      y: { min: -50, max: 0 },
      speedY: { min: particleConfig.gravityY || 30, max: (particleConfig.gravityY || 30) + 40 },
      speedX: { min: -(particleConfig.speedX || 20), max: (particleConfig.speedX || 20) },
      lifespan: 10000,
      scale: { start: 0.5, end: 0.2 },
      alpha: { start: 0.9, end: 0 },
      blendMode: 'NORMAL',
      frequency: 150,
      maxParticles: particleConfig.count,
      rotate: particleConfig.rotation ? { min: -180, max: 180 } : 0,
      angle: { min: 0, max: 360 }
    });
    
    particles.setDepth(100);
    this.particles.push(particles);
  }
  
  private clearParticles(): void {
    this.particles.forEach(emitter => emitter.destroy());
    this.particles = [];
  }
  
  public destroy(): void {
    this.clearParticles();
    this.skyGradient?.destroy();
    this.ground?.destroy();
  }
}
