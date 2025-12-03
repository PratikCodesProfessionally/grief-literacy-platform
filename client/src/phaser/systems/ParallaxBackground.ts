import Phaser from 'phaser';

interface ParallaxLayer {
  key: string;
  scrollFactor: number;
  image?: Phaser.GameObjects.TileSprite;
  graphics?: Phaser.GameObjects.Graphics;
}

interface MountainPeak {
  x: number;
  height: number;
  width: number;
  sharpness: number; // 0 = rounded, 1 = sharp
}

// Helper function to draw quadratic bezier curves using line segments
// Phaser Graphics doesn't have quadraticCurveTo, so we approximate with line segments
function drawQuadraticCurve(
  graphics: Phaser.GameObjects.Graphics,
  startX: number,
  startY: number,
  controlX: number,
  controlY: number,
  endX: number,
  endY: number,
  segments: number = 10
): void {
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const t1 = 1 - t;
    
    // Quadratic bezier formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
    const x = t1 * t1 * startX + 2 * t1 * t * controlX + t * t * endX;
    const y = t1 * t1 * startY + 2 * t1 * t * controlY + t * t * endY;
    
    graphics.lineTo(x, y);
  }
}

export class ParallaxBackground {
  private scene: Phaser.Scene;
  private layers: ParallaxLayer[];
  private mountainLayers: Phaser.GameObjects.Graphics[] = [];
  private cloudLayers: Phaser.GameObjects.Graphics[] = [];
  private skyGraphics?: Phaser.GameObjects.Graphics;
  
  constructor(scene: Phaser.Scene, layers: { key: string; scrollFactor: number; color: number }[]) {
    this.scene = scene;
    this.layers = [];
    
    // Create photorealistic sky gradient (Golden Hour - therapeutic)
    this.createRealisticSky();
    
    // Create atmospheric cloud layers
    this.createCloudLayers();
    
    // Create multiple mountain layers with realistic depth
    this.createRealisticMountains();
    
    // Create atmospheric haze
    this.createAtmosphericHaze();
    
    // Original layers (now subtle background)
    layers.forEach((layer, index) => {
      const tileSprite = scene.add.tileSprite(0, 0, scene.scale.width * 2, scene.scale.height, '');
      
      const graphics = scene.add.graphics();
      graphics.fillStyle(layer.color, 1);
      graphics.fillRect(0, 0, 100, 100);
      graphics.generateTexture(`bg-layer-${index}`, 100, 100);
      graphics.destroy();
      
      tileSprite.setTexture(`bg-layer-${index}`);
      tileSprite.setOrigin(0, 0);
      tileSprite.setScrollFactor(layer.scrollFactor);
      tileSprite.setDepth(-200 + index);
      tileSprite.setAlpha(0.1); // Very subtle
      
      this.layers.push({ key: layer.key, scrollFactor: layer.scrollFactor, image: tileSprite });
    });
  }
  
  private createRealisticSky(): void {
    const width = this.scene.scale.width * 4;
    const height = this.scene.scale.height;
    
    this.skyGraphics = this.scene.add.graphics();
    this.skyGraphics.setScrollFactor(0);
    this.skyGraphics.setDepth(-199);
    
    // Golden Hour sky gradient (therapeutic, calming)
    const gradientSteps = 50;
    const stepHeight = height / gradientSteps;
    
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      
      let r, g, b;
      
      if (t < 0.15) {
        // Zenith - Deep blue transitioning to softer blue
        const zt = t / 0.15;
        r = Math.floor(Phaser.Math.Linear(30, 70, zt));
        g = Math.floor(Phaser.Math.Linear(58, 100, zt));
        b = Math.floor(Phaser.Math.Linear(138, 170, zt));
      } else if (t < 0.4) {
        // Upper sky - Soft blue
        const ut = (t - 0.15) / 0.25;
        r = Math.floor(Phaser.Math.Linear(70, 147, ut));
        g = Math.floor(Phaser.Math.Linear(100, 197, ut));
        b = Math.floor(Phaser.Math.Linear(170, 253, ut));
      } else if (t < 0.65) {
        // Mid sky - Blue to pale yellow transition
        const mt = (t - 0.4) / 0.25;
        r = Math.floor(Phaser.Math.Linear(147, 255, mt));
        g = Math.floor(Phaser.Math.Linear(197, 248, mt));
        b = Math.floor(Phaser.Math.Linear(253, 225, mt));
      } else if (t < 0.85) {
        // Lower sky - Warm golden
        const lt = (t - 0.65) / 0.2;
        r = Math.floor(Phaser.Math.Linear(255, 255, lt));
        g = Math.floor(Phaser.Math.Linear(248, 218, lt));
        b = Math.floor(Phaser.Math.Linear(225, 185, lt));
      } else {
        // Horizon - Warm peach/orange glow
        const ht = (t - 0.85) / 0.15;
        r = Math.floor(Phaser.Math.Linear(255, 255, ht));
        g = Math.floor(Phaser.Math.Linear(218, 182, ht));
        b = Math.floor(Phaser.Math.Linear(185, 135, ht));
      }
      
      const color = Phaser.Display.Color.GetColor(r, g, b);
      this.skyGraphics.fillStyle(color, 1);
      this.skyGraphics.fillRect(-200, i * stepHeight, width + 400, stepHeight + 2);
    }
    
    // Add sun glow (top right, golden hour position)
    this.addSunGlow();
  }
  
  private addSunGlow(): void {
    if (!this.skyGraphics) return;
    
    const sunX = this.scene.scale.width * 0.85;
    const sunY = this.scene.scale.height * 0.25;
    
    // Outer glow rings
    const glowColors = [
      { radius: 180, color: 0xFFF8DC, alpha: 0.08 },
      { radius: 140, color: 0xFFE4B5, alpha: 0.12 },
      { radius: 100, color: 0xFFD700, alpha: 0.18 },
      { radius: 70, color: 0xFFA500, alpha: 0.25 },
      { radius: 45, color: 0xFFB84D, alpha: 0.4 },
    ];
    
    glowColors.forEach(({ radius, color, alpha }) => {
      this.skyGraphics!.fillStyle(color, alpha);
      this.skyGraphics!.fillCircle(sunX, sunY, radius);
    });
    
    // Sun core
    this.skyGraphics!.fillStyle(0xFFF8E7, 0.95);
    this.skyGraphics!.fillCircle(sunX, sunY, 28);
    this.skyGraphics!.fillStyle(0xFFFFFF, 1);
    this.skyGraphics!.fillCircle(sunX, sunY, 20);
  }
  
  private createCloudLayers(): void {
    const width = this.scene.scale.width * 4;
    const height = this.scene.scale.height;
    
    // High cirrus clouds (wispy, distant)
    const cirrusGraphics = this.scene.add.graphics();
    cirrusGraphics.setScrollFactor(0.02);
    cirrusGraphics.setDepth(-180);
    cirrusGraphics.setAlpha(0.4);
    
    for (let c = 0; c < 12; c++) {
      const cloudX = Phaser.Math.Between(-100, width);
      const cloudY = Phaser.Math.Between(50, height * 0.25);
      
      // Wispy cirrus shape
      cirrusGraphics.fillStyle(0xFFFFFF, 0.3);
      const wispLength = Phaser.Math.Between(150, 400);
      const wispHeight = Phaser.Math.Between(8, 20);
      
      cirrusGraphics.beginPath();
      cirrusGraphics.moveTo(cloudX, cloudY);
      
      // Create wispy curved shape
      for (let w = 0; w <= 10; w++) {
        const wx = cloudX + (w / 10) * wispLength;
        const wy = cloudY + Math.sin(w * 0.8) * wispHeight * (1 - w / 12);
        cirrusGraphics.lineTo(wx, wy);
      }
      
      for (let w = 10; w >= 0; w--) {
        const wx = cloudX + (w / 10) * wispLength;
        const wy = cloudY + wispHeight * 0.3 + Math.sin(w * 0.8 + 1) * wispHeight * 0.5;
        cirrusGraphics.lineTo(wx, wy);
      }
      
      cirrusGraphics.closePath();
      cirrusGraphics.fillPath();
    }
    
    this.cloudLayers.push(cirrusGraphics);
    
    // Mid-level cumulus clouds
    const cumulusGraphics = this.scene.add.graphics();
    cumulusGraphics.setScrollFactor(0.05);
    cumulusGraphics.setDepth(-170);
    cumulusGraphics.setAlpha(0.5);
    
    for (let c = 0; c < 8; c++) {
      const cloudX = Phaser.Math.Between(0, width);
      const cloudY = Phaser.Math.Between(height * 0.15, height * 0.35);
      const cloudScale = Phaser.Math.FloatBetween(0.6, 1.2);
      
      this.drawFluffyCloud(cumulusGraphics, cloudX, cloudY, cloudScale);
    }
    
    this.cloudLayers.push(cumulusGraphics);
  }
  
  private drawFluffyCloud(graphics: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
    const puffs = [
      { ox: 0, oy: 0, rx: 45 * scale, ry: 30 * scale },
      { ox: -35 * scale, oy: 10 * scale, rx: 35 * scale, ry: 25 * scale },
      { ox: 40 * scale, oy: 8 * scale, rx: 40 * scale, ry: 28 * scale },
      { ox: -15 * scale, oy: -15 * scale, rx: 30 * scale, ry: 22 * scale },
      { ox: 20 * scale, oy: -12 * scale, rx: 32 * scale, ry: 24 * scale },
      { ox: -50 * scale, oy: 20 * scale, rx: 25 * scale, ry: 18 * scale },
      { ox: 55 * scale, oy: 18 * scale, rx: 28 * scale, ry: 20 * scale },
    ];
    
    // Cloud shadow (subtle)
    graphics.fillStyle(0xB8C5D6, 0.3);
    puffs.forEach(puff => {
      graphics.fillEllipse(x + puff.ox + 5, y + puff.oy + 8, puff.rx * 0.95, puff.ry * 0.9);
    });
    
    // Main cloud body
    graphics.fillStyle(0xFFFFFF, 0.7);
    puffs.forEach(puff => {
      graphics.fillEllipse(x + puff.ox, y + puff.oy, puff.rx, puff.ry);
    });
    
    // Highlight on top
    graphics.fillStyle(0xFFFFFF, 0.9);
    puffs.slice(0, 3).forEach(puff => {
      graphics.fillEllipse(x + puff.ox, y + puff.oy - 5, puff.rx * 0.7, puff.ry * 0.6);
    });
  }
  
  private createRealisticMountains(): void {
    const width = this.scene.scale.width * 4;
    const height = this.scene.scale.height;
    const groundY = height - 180;
    
    // Layer 1: Farthest mountains (atmospheric, hazy)
    this.createMountainLayer({
      width,
      groundY,
      baseColor: 0xB8C5D6,      // Light blue-gray
      shadowColor: 0x9FAFBF,    // Slightly darker
      highlightColor: 0xD4DEE8, // Lighter highlight
      peakCount: 15,
      minHeight: 180,
      maxHeight: 320,
      scrollFactor: 0.1,        // 10% speed
      depth: -165,
      opacity: 0.45,
      hasSnow: true,
      snowLine: 0.3,
      isDistant: true
    });
    
    // Layer 2: Mid-distance mountains
    this.createMountainLayer({
      width,
      groundY,
      baseColor: 0x7A8CA3,      // Medium blue-gray
      shadowColor: 0x5C6E82,    // Darker shadow
      highlightColor: 0x9AAEC0, // Lighter
      peakCount: 10,
      minHeight: 220,
      maxHeight: 380,
      scrollFactor: 0.3,        // 30% speed
      depth: -155,
      opacity: 0.75,
      hasSnow: true,
      snowLine: 0.4,
      isDistant: false
    });
    
    // Layer 3: Near mountains (detailed, high contrast)
    this.createMountainLayer({
      width,
      groundY,
      baseColor: 0x4A5D6F,      // Dark blue-gray
      shadowColor: 0x2D3E4F,    // Deep shadow
      highlightColor: 0x6B7F92, // Mid highlight
      peakCount: 7,
      minHeight: 150,
      maxHeight: 280,
      scrollFactor: 0.6,        // 60% speed
      depth: -145,
      opacity: 0.9,
      hasSnow: true,
      snowLine: 0.5,
      isDistant: false
    });
    
    // Layer 4: Foreground hills with forest
    this.createForegroundHills(width, groundY);
  }
  
  private createMountainLayer(config: {
    width: number;
    groundY: number;
    baseColor: number;
    shadowColor: number;
    highlightColor: number;
    peakCount: number;
    minHeight: number;
    maxHeight: number;
    scrollFactor: number;
    depth: number;
    opacity: number;
    hasSnow: boolean;
    snowLine: number;
    isDistant: boolean;
  }): void {
    const graphics = this.scene.add.graphics();
    graphics.setScrollFactor(config.scrollFactor);
    graphics.setDepth(config.depth);
    graphics.setAlpha(config.opacity);
    
    // Generate natural mountain peaks
    const peaks = this.generateNaturalPeaks(config.width, config.peakCount, config.minHeight, config.maxHeight);
    
    // Draw mountain range
    this.drawMountainRange(graphics, peaks, config);
    
    this.mountainLayers.push(graphics);
  }
  
  private generateNaturalPeaks(width: number, count: number, minHeight: number, maxHeight: number): MountainPeak[] {
    const peaks: MountainPeak[] = [];
    const avgSpacing = width / count;
    
    for (let i = 0; i < count + 2; i++) {
      // Natural irregular spacing
      const baseX = (i - 1) * avgSpacing;
      const offsetX = Phaser.Math.Between(-avgSpacing * 0.3, avgSpacing * 0.3);
      
      peaks.push({
        x: baseX + offsetX,
        height: Phaser.Math.Between(minHeight, maxHeight),
        width: Phaser.Math.Between(avgSpacing * 0.6, avgSpacing * 1.2),
        sharpness: Phaser.Math.FloatBetween(0.3, 0.9) // Mix of rounded and sharp
      });
    }
    
    return peaks;
  }
  
  private drawMountainRange(
    graphics: Phaser.GameObjects.Graphics,
    peaks: MountainPeak[],
    config: {
      groundY: number;
      baseColor: number;
      shadowColor: number;
      highlightColor: number;
      hasSnow: boolean;
      snowLine: number;
      isDistant: boolean;
    }
  ): void {
    // Sort peaks by height for proper layering within the range
    const sortedPeaks = [...peaks].sort((a, b) => a.height - b.height);
    
    for (const peak of sortedPeaks) {
      const peakY = config.groundY - peak.height;
      const leftBase = peak.x - peak.width * 0.5;
      const rightBase = peak.x + peak.width * 0.5;
      
      // Calculate control points for natural curved shape
      const sharpFactor = peak.sharpness;
      const leftControl = peak.x - peak.width * 0.2 * sharpFactor;
      const rightControl = peak.x + peak.width * 0.2 * sharpFactor;
      const controlHeight = peakY + peak.height * 0.3 * (1 - sharpFactor);
      
      // Shadow side (left) - darker, cooler
      graphics.fillStyle(config.shadowColor, 1);
      graphics.beginPath();
      graphics.moveTo(leftBase, config.groundY);
      drawQuadraticCurve(graphics, leftBase, config.groundY, leftControl, controlHeight, peak.x, peakY);
      graphics.lineTo(peak.x, config.groundY);
      graphics.closePath();
      graphics.fillPath();
      
      // Light side (right) - base color, warmer
      graphics.fillStyle(config.baseColor, 1);
      graphics.beginPath();
      graphics.moveTo(peak.x, config.groundY);
      graphics.lineTo(peak.x, peakY);
      drawQuadraticCurve(graphics, peak.x, peakY, rightControl, controlHeight, rightBase, config.groundY);
      graphics.closePath();
      graphics.fillPath();
      
      // Highlight ridge (sun-facing edge)
      if (!config.isDistant) {
        graphics.lineStyle(2, config.highlightColor, 0.6);
        graphics.beginPath();
        graphics.moveTo(peak.x + 3, peakY);
        const ridgeControlX = rightControl * 0.8 + peak.x * 0.2;
        const ridgeControlY = controlHeight * 0.7 + config.groundY * 0.3;
        const ridgeEndX = rightBase * 0.6 + peak.x * 0.4;
        drawQuadraticCurve(graphics, peak.x + 3, peakY, ridgeControlX, ridgeControlY, ridgeEndX, config.groundY);
        graphics.strokePath();
      }
      
      // Snow cap
      if (config.hasSnow) {
        this.drawSnowCap(graphics, peak, config.groundY, config.snowLine, config.isDistant);
      }
    }
  }
  
  private drawSnowCap(
    graphics: Phaser.GameObjects.Graphics,
    peak: MountainPeak,
    groundY: number,
    snowLine: number,
    isDistant: boolean
  ): void {
    const peakY = groundY - peak.height;
    const snowHeight = peak.height * snowLine;
    const snowY = peakY + snowHeight;
    
    // Snow color varies by distance (atmospheric perspective)
    const snowColor = isDistant ? 0xE8EEF4 : 0xFFFFFF;
    const snowShadow = isDistant ? 0xC5D0DC : 0xD4E1ED;
    
    // Main snow area with natural irregular edge
    graphics.fillStyle(snowColor, isDistant ? 0.7 : 0.95);
    graphics.beginPath();
    
    const snowWidth = peak.width * 0.35;
    const segments = 12;
    
    // Left edge of snow (irregular)
    graphics.moveTo(peak.x - snowWidth, snowY);
    
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const angle = t * Math.PI;
      const baseX = peak.x - snowWidth + t * snowWidth * 2;
      
      // Create natural snow line variation
      const variation = Math.sin(t * Math.PI * 4) * snowHeight * 0.08 +
                       Math.sin(t * Math.PI * 7) * snowHeight * 0.04;
      const y = s === 0 || s === segments 
        ? snowY 
        : snowY + variation - (Math.sin(angle) * snowHeight * 0.15);
      
      graphics.lineTo(baseX, y);
    }
    
    // Up to peak
    graphics.lineTo(peak.x, peakY);
    graphics.closePath();
    graphics.fillPath();
    
    // Snow shadow on left side
    graphics.fillStyle(snowShadow, 0.5);
    graphics.beginPath();
    graphics.moveTo(peak.x - snowWidth * 0.8, snowY);
    drawQuadraticCurve(
      graphics,
      peak.x - snowWidth * 0.8, snowY,
      peak.x - snowWidth * 0.4, peakY + snowHeight * 0.6,
      peak.x - snowWidth * 0.1, peakY
    );
    graphics.lineTo(peak.x, peakY);
    drawQuadraticCurve(
      graphics,
      peak.x, peakY,
      peak.x - snowWidth * 0.2, peakY + snowHeight * 0.4,
      peak.x - snowWidth * 0.5, snowY
    );
    graphics.closePath();
    graphics.fillPath();
    
    // Bright highlight on right side of peak
    if (!isDistant) {
      graphics.fillStyle(0xFFFFFF, 0.9);
      graphics.beginPath();
      graphics.moveTo(peak.x, peakY);
      graphics.lineTo(peak.x + snowWidth * 0.2, peakY + snowHeight * 0.4);
      graphics.lineTo(peak.x + snowWidth * 0.1, peakY + snowHeight * 0.5);
      graphics.lineTo(peak.x - snowWidth * 0.05, peakY + snowHeight * 0.2);
      graphics.closePath();
      graphics.fillPath();
    }
  }
  
  private createForegroundHills(width: number, groundY: number): void {
    const graphics = this.scene.add.graphics();
    graphics.setScrollFactor(0.7);
    graphics.setDepth(-135);
    graphics.setAlpha(0.95);
    
    // Dark forested hills
    const hillCount = 12;
    const avgSpacing = width / hillCount;
    
    for (let i = 0; i < hillCount + 2; i++) {
      const hillX = (i - 1) * avgSpacing + Phaser.Math.Between(-avgSpacing * 0.2, avgSpacing * 0.2);
      const hillHeight = Phaser.Math.Between(60, 140);
      const hillWidth = Phaser.Math.Between(avgSpacing * 0.8, avgSpacing * 1.4);
      const hillY = groundY - hillHeight;
      
      // Hill shadow side
      graphics.fillStyle(0x1A2E1A, 1); // Very dark green
      graphics.beginPath();
      graphics.moveTo(hillX - hillWidth * 0.5, groundY);
      drawQuadraticCurve(graphics, hillX - hillWidth * 0.5, groundY, hillX - hillWidth * 0.2, hillY + hillHeight * 0.3, hillX, hillY);
      graphics.lineTo(hillX, groundY);
      graphics.closePath();
      graphics.fillPath();
      
      // Hill light side
      graphics.fillStyle(0x2D4A2D, 1); // Dark green
      graphics.beginPath();
      graphics.moveTo(hillX, groundY);
      graphics.lineTo(hillX, hillY);
      drawQuadraticCurve(graphics, hillX, hillY, hillX + hillWidth * 0.2, hillY + hillHeight * 0.3, hillX + hillWidth * 0.5, groundY);
      graphics.closePath();
      graphics.fillPath();
      
      // Add pine tree silhouettes on hills
      this.addPineTreeSilhouettes(graphics, hillX, hillY, hillWidth, hillHeight);
    }
    
    this.mountainLayers.push(graphics);
  }
  
  private addPineTreeSilhouettes(
    graphics: Phaser.GameObjects.Graphics,
    hillX: number,
    hillY: number,
    hillWidth: number,
    hillHeight: number
  ): void {
    const treeCount = Math.floor(hillWidth / 25);
    
    for (let t = 0; t < treeCount; t++) {
      const treeX = hillX - hillWidth * 0.4 + (t / treeCount) * hillWidth * 0.8;
      const distFromCenter = Math.abs(treeX - hillX) / (hillWidth * 0.5);
      const slopeY = hillY + hillHeight * distFromCenter * 0.8;
      const treeHeight = Phaser.Math.Between(15, 35);
      
      // Simple triangle pine tree silhouette
      graphics.fillStyle(0x0D1F0D, 0.8);
      graphics.beginPath();
      graphics.moveTo(treeX, slopeY - treeHeight);
      graphics.lineTo(treeX - treeHeight * 0.35, slopeY);
      graphics.lineTo(treeX + treeHeight * 0.35, slopeY);
      graphics.closePath();
      graphics.fillPath();
    }
  }
  
  private createAtmosphericHaze(): void {
    const width = this.scene.scale.width * 4;
    const height = this.scene.scale.height;
    const groundY = height - 180;
    
    const hazeGraphics = this.scene.add.graphics();
    hazeGraphics.setScrollFactor(0);
    hazeGraphics.setDepth(-130);
    
    // Ground fog gradient
    const fogHeight = 120;
    const fogSteps = 15;
    
    for (let f = 0; f < fogSteps; f++) {
      const t = f / fogSteps;
      const y = groundY - fogHeight + (t * fogHeight);
      const alpha = 0.25 * (1 - t); // Fade from bottom to top
      
      hazeGraphics.fillStyle(0xF0F4F8, alpha);
      hazeGraphics.fillRect(-200, y, width + 400, fogHeight / fogSteps + 1);
    }
    
    // Distant horizon haze
    const horizonHazeHeight = 200;
    for (let h = 0; h < 10; h++) {
      const t = h / 10;
      const y = groundY - horizonHazeHeight * 2 + (t * horizonHazeHeight);
      const alpha = 0.15 * (1 - t);
      
      hazeGraphics.fillStyle(0xB8C5D6, alpha);
      hazeGraphics.fillRect(-200, y, width + 400, horizonHazeHeight / 10 + 1);
    }
    
    this.mountainLayers.push(hazeGraphics);
  }
  
  public update(camera: Phaser.Cameras.Scene2D.Camera): void {
    this.layers.forEach(layer => {
      if (layer.image) {
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
    this.mountainLayers.forEach(m => m.destroy());
    this.cloudLayers.forEach(c => c.destroy());
    if (this.skyGraphics) {
      this.skyGraphics.destroy();
    }
  }
}
