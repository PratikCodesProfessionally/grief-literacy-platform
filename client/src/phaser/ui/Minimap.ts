import Phaser from 'phaser';
import { GAME_CONSTANTS, STATION_POSITIONS, StationConfig } from '../config/constants';

interface MinimapConfig {
  width: number;
  height: number;
  margin: number;
  backgroundColor: number;
  backgroundAlpha: number;
  borderColor: number;
  borderWidth: number;
  playerColor: number;
  playerSize: number;
  zoneColors: { [key: string]: number };
}

const DEFAULT_CONFIG: MinimapConfig = {
  width: 180,
  height: 100,
  margin: 16,
  backgroundColor: 0xffffff,
  backgroundAlpha: 0.85,
  borderColor: 0x64748b,
  borderWidth: 2,
  playerColor: 0xef4444,
  playerSize: 6,
  zoneColors: {
    therapy: 0x0ea5e9,
    community: 0x06b6d4,
    tools: 0x3b82f6,
    resources: 0x14b8a6,
    meditation: 0x8b5cf6,
    default: 0x94a3b8
  }
};

export class Minimap {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private playerDot: Phaser.GameObjects.Arc;
  private playerPulse: Phaser.GameObjects.Arc;
  private viewportIndicator: Phaser.GameObjects.Rectangle;
  private zoneMarkers: Map<string, Phaser.GameObjects.Container> = new Map();
  private config: MinimapConfig;
  private isVisible: boolean = true;
  private toggleButton: Phaser.GameObjects.Container;
  private scaleX: number;
  private scaleY: number;
  private groundIndicator: Phaser.GameObjects.Rectangle;
  private pathIndicator: Phaser.GameObjects.Rectangle;
  
  constructor(scene: Phaser.Scene, config: Partial<MinimapConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Calculate scale factors
    this.scaleX = this.config.width / GAME_CONSTANTS.WORLD_WIDTH;
    this.scaleY = this.config.height / scene.scale.height;
    
    // Create main container (fixed to camera)
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);
    
    // Position in top-right corner
    this.updatePosition();
    
    // Create minimap elements
    this.createBackground();
    this.createTerrain();
    this.createZoneMarkers();
    this.createViewportIndicator();
    this.createPlayerDot();
    this.createToggleButton();
    this.createTitle();
    
    // Add pulse animation for player
    this.addPlayerPulseAnimation();
    
    // Make zones clickable
    this.setupZoneInteraction();
    
    // Handle resize
    scene.scale.on('resize', this.handleResize, this);
  }
  
  private updatePosition(): void {
    const x = this.scene.scale.width - this.config.width - this.config.margin;
    const y = this.config.margin;
    this.container.setPosition(x, y);
  }
  
  private createBackground(): void {
    // Shadow for depth
    const shadow = this.scene.add.rectangle(
      3, 3,
      this.config.width,
      this.config.height,
      0x000000,
      0.2
    );
    shadow.setOrigin(0, 0);
    this.container.add(shadow);
    
    // Main background
    this.background = this.scene.add.rectangle(
      0, 0,
      this.config.width,
      this.config.height,
      this.config.backgroundColor,
      this.config.backgroundAlpha
    );
    this.background.setOrigin(0, 0);
    this.container.add(this.background);
    
    // Border
    this.border = this.scene.add.rectangle(
      0, 0,
      this.config.width,
      this.config.height
    );
    this.border.setOrigin(0, 0);
    this.border.setStrokeStyle(this.config.borderWidth, this.config.borderColor, 1);
    this.border.setFillStyle(0x000000, 0);
    this.container.add(this.border);
    
    // Rounded corner effect (visual only)
    const cornerRadius = 8;
    const corners = [
      { x: 0, y: 0 },
      { x: this.config.width, y: 0 },
      { x: 0, y: this.config.height },
      { x: this.config.width, y: this.config.height }
    ];
    
    corners.forEach(corner => {
      const dot = this.scene.add.circle(corner.x, corner.y, cornerRadius / 2, this.config.backgroundColor);
      this.container.add(dot);
    });
  }
  
  private createTerrain(): void {
    // Sky gradient (simplified)
    const skyHeight = this.config.height * 0.7;
    const sky = this.scene.add.rectangle(
      0, 0,
      this.config.width,
      skyHeight,
      0x93c5fd, // sky-300
      0.5
    );
    sky.setOrigin(0, 0);
    this.container.add(sky);
    
    // Mountains silhouette (simplified)
    const mountainGraphics = this.scene.add.graphics();
    mountainGraphics.fillStyle(0x94a3b8, 0.4); // slate-400
    
    const mountainY = skyHeight - 15;
    const peakCount = 8;
    const peakWidth = this.config.width / peakCount;
    
    mountainGraphics.beginPath();
    mountainGraphics.moveTo(0, skyHeight);
    
    for (let i = 0; i <= peakCount; i++) {
      const x = i * peakWidth;
      const peakHeight = Phaser.Math.Between(10, 25);
      const y = mountainY - peakHeight;
      
      if (i === 0) {
        mountainGraphics.lineTo(x, y);
      } else {
        const midX = x - peakWidth / 2;
        const midY = mountainY - Phaser.Math.Between(5, 12);
        mountainGraphics.lineTo(midX, midY);
        mountainGraphics.lineTo(x, y);
      }
    }
    
    mountainGraphics.lineTo(this.config.width, skyHeight);
    mountainGraphics.closePath();
    mountainGraphics.fillPath();
    
    this.container.add(mountainGraphics);
    
    // Ground
    const groundY = this.config.height * 0.75;
    this.groundIndicator = this.scene.add.rectangle(
      0, groundY,
      this.config.width,
      this.config.height - groundY,
      0x059669, // emerald-600
      0.7
    );
    this.groundIndicator.setOrigin(0, 0);
    this.container.add(this.groundIndicator);
    
    // Path
    const pathY = groundY + 5;
    this.pathIndicator = this.scene.add.rectangle(
      0, pathY,
      this.config.width,
      8,
      0xfbbf24, // amber-400
      0.5
    );
    this.pathIndicator.setOrigin(0, 0);
    this.container.add(this.pathIndicator);
  }
  
  private createZoneMarkers(): void {
    STATION_POSITIONS.forEach(station => {
      const markerContainer = this.scene.add.container(0, 0);
      
      // Convert world position to minimap position
      const mapX = station.x * this.scaleX;
      const mapY = this.config.height * 0.78; // All on the path
      
      // Zone color
      const color = this.config.zoneColors[station.id] || this.config.zoneColors.default;
      
      // Marker background (rounded rectangle effect)
      const markerBg = this.scene.add.rectangle(
        mapX, mapY,
        16, 12,
        color,
        0.9
      );
      markerBg.setStrokeStyle(1, 0xffffff, 0.8);
      markerContainer.add(markerBg);
      
      // Icon (smaller)
      const icon = this.scene.add.text(
        mapX, mapY,
        station.icon,
        {
          fontSize: '8px'
        }
      );
      icon.setOrigin(0.5);
      markerContainer.add(icon);
      
      // Store reference
      this.zoneMarkers.set(station.id, markerContainer);
      
      // Make interactive
      markerBg.setInteractive({ useHandCursor: true });
      markerBg.setData('station', station);
      
      this.container.add(markerContainer);
    });
  }
  
  private createViewportIndicator(): void {
    // Shows current camera view area
    const camera = this.scene.cameras.main;
    const viewWidth = (camera.width / GAME_CONSTANTS.WORLD_WIDTH) * this.config.width;
    const viewHeight = (camera.height / this.scene.scale.height) * this.config.height;
    
    this.viewportIndicator = this.scene.add.rectangle(
      0, 0,
      viewWidth,
      viewHeight
    );
    this.viewportIndicator.setOrigin(0, 0);
    this.viewportIndicator.setStrokeStyle(1, 0x3b82f6, 0.8); // blue-500
    this.viewportIndicator.setFillStyle(0x3b82f6, 0.1);
    this.container.add(this.viewportIndicator);
  }
  
  private createPlayerDot(): void {
    // Pulse effect (behind main dot)
    this.playerPulse = this.scene.add.circle(0, 0, this.config.playerSize * 2, this.config.playerColor, 0.3);
    this.container.add(this.playerPulse);
    
    // Main player dot
    this.playerDot = this.scene.add.circle(0, 0, this.config.playerSize, this.config.playerColor, 1);
    this.playerDot.setStrokeStyle(2, 0xffffff, 1);
    this.container.add(this.playerDot);
    
    // Direction indicator (small triangle)
    const dirIndicator = this.scene.add.triangle(
      0, -this.config.playerSize - 4,
      0, 0,
      4, 6,
      -4, 6,
      0xffffff,
      0.9
    );
    this.playerDot.setData('dirIndicator', dirIndicator);
    this.container.add(dirIndicator);
  }
  
  private addPlayerPulseAnimation(): void {
    this.scene.tweens.add({
      targets: this.playerPulse,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 1200,
      repeat: -1,
      onRepeat: () => {
        this.playerPulse.setScale(1);
        this.playerPulse.setAlpha(0.3);
      }
    });
  }
  
  private createToggleButton(): void {
    this.toggleButton = this.scene.add.container(0, 0);
    
    const buttonX = this.config.width + 8;
    const buttonY = 0;
    
    // Button background
    const buttonBg = this.scene.add.rectangle(
      buttonX, buttonY,
      28, 28,
      0xffffff,
      0.9
    );
    buttonBg.setOrigin(0, 0);
    buttonBg.setStrokeStyle(1, 0x64748b, 1);
    buttonBg.setInteractive({ useHandCursor: true });
    
    // Toggle icon
    const toggleIcon = this.scene.add.text(
      buttonX + 14,
      buttonY + 14,
      '🗺️',
      { fontSize: '14px' }
    );
    toggleIcon.setOrigin(0.5);
    
    buttonBg.on('pointerdown', () => {
      this.toggle();
      if (navigator.vibrate) navigator.vibrate(10);
    });
    
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0xf1f5f9, 1);
    });
    
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0xffffff, 0.9);
    });
    
    this.toggleButton.add(buttonBg);
    this.toggleButton.add(toggleIcon);
    this.container.add(this.toggleButton);
  }
  
  private createTitle(): void {
    const title = this.scene.add.text(
      this.config.width / 2,
      -12,
      'Healing Journey',
      {
        fontSize: '10px',
        fontFamily: 'Arial',
        color: '#475569', // slate-600
        fontStyle: 'bold'
      }
    );
    title.setOrigin(0.5, 1);
    this.container.add(title);
  }
  
  private setupZoneInteraction(): void {
    this.zoneMarkers.forEach((marker, stationId) => {
      const markerBg = marker.list[0] as Phaser.GameObjects.Rectangle;
      
      markerBg.on('pointerover', () => {
        markerBg.setScale(1.3);
        
        // Show tooltip
        const station = markerBg.getData('station') as StationConfig;
        this.showZoneTooltip(station, markerBg.x, markerBg.y);
      });
      
      markerBg.on('pointerout', () => {
        markerBg.setScale(1);
        this.hideZoneTooltip();
      });
      
      markerBg.on('pointerdown', () => {
        const station = markerBg.getData('station') as StationConfig;
        this.navigateToZone(station);
        
        if (navigator.vibrate) navigator.vibrate(30);
      });
    });
  }
  
  private zoneTooltip?: Phaser.GameObjects.Container;
  
  private showZoneTooltip(station: StationConfig, x: number, y: number): void {
    this.hideZoneTooltip();
    
    this.zoneTooltip = this.scene.add.container(x, y - 25);
    
    // Tooltip background
    const tooltipBg = this.scene.add.rectangle(
      0, 0,
      80, 24,
      0x1e293b, // slate-800
      0.95
    );
    tooltipBg.setStrokeStyle(1, 0x475569, 1);
    
    // Station name
    const name = this.scene.add.text(
      0, 0,
      station.name.replace('\n', ' '),
      {
        fontSize: '8px',
        fontFamily: 'Arial',
        color: '#ffffff',
        align: 'center'
      }
    );
    name.setOrigin(0.5);
    
    this.zoneTooltip.add(tooltipBg);
    this.zoneTooltip.add(name);
    this.container.add(this.zoneTooltip);
  }
  
  private hideZoneTooltip(): void {
    if (this.zoneTooltip) {
      this.zoneTooltip.destroy();
      this.zoneTooltip = undefined;
    }
  }
  
  private navigateToZone(station: StationConfig): void {
    // Smoothly pan camera to station
    const camera = this.scene.cameras.main;
    const targetX = station.x - camera.width / 2;
    
    // Clamp to world bounds
    const clampedX = Phaser.Math.Clamp(targetX, 0, GAME_CONSTANTS.WORLD_WIDTH - camera.width);
    
    // Smooth pan animation
    this.scene.tweens.add({
      targets: camera,
      scrollX: clampedX,
      duration: 800,
      ease: 'Power2'
    });
  }
  
  public update(playerX: number, playerY: number): void {
    if (!this.isVisible) return;
    
    // Update player position on minimap
    const mapX = playerX * this.scaleX;
    const mapY = this.config.height * 0.78; // Keep on path level
    
    this.playerDot.setPosition(mapX, mapY);
    this.playerPulse.setPosition(mapX, mapY);
    
    // Update direction indicator
    const dirIndicator = this.playerDot.getData('dirIndicator') as Phaser.GameObjects.Triangle;
    if (dirIndicator) {
      dirIndicator.setPosition(mapX, mapY - this.config.playerSize - 4);
    }
    
    // Update viewport indicator
    const camera = this.scene.cameras.main;
    const viewX = camera.scrollX * this.scaleX;
    const viewWidth = (camera.width / GAME_CONSTANTS.WORLD_WIDTH) * this.config.width;
    
    this.viewportIndicator.setPosition(viewX, 0);
    this.viewportIndicator.setSize(viewWidth, this.config.height);
  }
  
  public toggle(): void {
    this.isVisible = !this.isVisible;
    
    // Animate visibility
    if (this.isVisible) {
      this.container.setVisible(true);
      this.scene.tweens.add({
        targets: this.container,
        alpha: 1,
        duration: 200,
        ease: 'Power2'
      });
    } else {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          // Keep toggle button visible
          this.container.setAlpha(0.3);
        }
      });
    }
  }
  
  public show(): void {
    if (!this.isVisible) {
      this.toggle();
    }
  }
  
  public hide(): void {
    if (this.isVisible) {
      this.toggle();
    }
  }
  
  private handleResize(): void {
    this.updatePosition();
    
    // Update viewport indicator size
    const camera = this.scene.cameras.main;
    const viewWidth = (camera.width / GAME_CONSTANTS.WORLD_WIDTH) * this.config.width;
    const viewHeight = (camera.height / this.scene.scale.height) * this.config.height;
    this.viewportIndicator.setSize(viewWidth, viewHeight);
  }
  
  public setZoneStatus(stationId: string, status: 'new' | 'in-progress' | 'completed' | 'recommended'): void {
    const marker = this.zoneMarkers.get(stationId);
    if (!marker) return;
    
    // Remove existing status indicator
    const existingStatus = marker.getData('statusIndicator') as Phaser.GameObjects.Arc;
    if (existingStatus) {
      existingStatus.destroy();
    }
    
    const markerBg = marker.list[0] as Phaser.GameObjects.Rectangle;
    
    // Status colors
    const statusColors: { [key: string]: number } = {
      'new': 0xef4444,        // red
      'in-progress': 0xf59e0b, // amber
      'completed': 0x22c55e,   // green
      'recommended': 0xa855f7  // purple
    };
    
    // Add status dot
    const statusDot = this.scene.add.circle(
      markerBg.x + 6,
      markerBg.y - 5,
      3,
      statusColors[status] || 0x94a3b8,
      1
    );
    statusDot.setStrokeStyle(1, 0xffffff, 1);
    
    // Pulse animation for 'new' and 'recommended'
    if (status === 'new' || status === 'recommended') {
      this.scene.tweens.add({
        targets: statusDot,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
    
    marker.add(statusDot);
    marker.setData('statusIndicator', statusDot);
  }
  
  public destroy(): void {
    this.scene.scale.off('resize', this.handleResize, this);
    this.hideZoneTooltip();
    this.container.destroy();
  }
}
