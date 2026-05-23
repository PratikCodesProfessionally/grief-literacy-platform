import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../config/constants';

interface CameraControllerConfig {
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  panMomentum: number;
  elasticBoundary: number;
  smoothFollow: number;
}

const DEFAULT_CONFIG: CameraControllerConfig = {
  minZoom: 0.5,
  maxZoom: 1.5,
  zoomStep: 0.1,
  panMomentum: 0.92,      // Momentum decay (0.9 = slow stop, 0.99 = long glide)
  elasticBoundary: 100,   // Pixels to allow overscroll before bounce
  smoothFollow: 0.08      // Camera follow smoothness (lower = smoother)
};

export class CameraController {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;
  private config: CameraControllerConfig;
  
  // UI elements
  private uiContainer: Phaser.GameObjects.Container;
  private zoomInButton: Phaser.GameObjects.Container;
  private zoomOutButton: Phaser.GameObjects.Container;
  private centerButton: Phaser.GameObjects.Container;
  private zoomLabel: Phaser.GameObjects.Text;
  
  // Pan momentum
  private panVelocityX: number = 0;
  private panVelocityY: number = 0;
  private isPanning: boolean = false;
  private lastPanX: number = 0;
  private lastPanY: number = 0;
  
  // Follow target
  private followTarget?: Phaser.GameObjects.GameObject & { x: number; y: number };
  private isFollowing: boolean = true;
  
  // Elastic boundaries
  private worldBounds: { x: number; y: number; width: number; height: number };
  
  constructor(scene: Phaser.Scene, config: Partial<CameraControllerConfig> = {}) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Store world bounds
    this.worldBounds = {
      x: 0,
      y: 0,
      width: GAME_CONSTANTS.WORLD_WIDTH,
      height: scene.scale.height
    };
    
    // Create UI
    this.uiContainer = scene.add.container(0, 0);
    this.uiContainer.setScrollFactor(0);
    this.uiContainer.setDepth(999);
    
    this.createZoomControls();
    this.createCenterButton();
    this.setupInputHandlers();
    this.updatePosition();
    
    // Handle resize
    scene.scale.on('resize', this.handleResize, this);
  }
  
  private updatePosition(): void {
    // Position controls in bottom-left corner
    const x = 20;
    const y = this.scene.scale.height - 160;
    this.uiContainer.setPosition(x, y);
  }
  
  private createZoomControls(): void {
    const buttonSize = 44;
    const spacing = 8;
    
    // Zoom container background
    const bgPanel = this.scene.add.rectangle(
      buttonSize / 2 + 4,
      buttonSize + spacing / 2 + 4,
      buttonSize + 16,
      buttonSize * 2 + spacing + 24,
      0xffffff,
      0.9
    );
    bgPanel.setStrokeStyle(1, 0xe2e8f0, 1);
    this.uiContainer.add(bgPanel);
    
    // Zoom In Button (+)
    this.zoomInButton = this.createButton(
      buttonSize / 2 + 4,
      buttonSize / 2 + 4,
      buttonSize,
      '+',
      () => this.zoomIn()
    );
    this.uiContainer.add(this.zoomInButton);
    
    // Zoom Out Button (-)
    this.zoomOutButton = this.createButton(
      buttonSize / 2 + 4,
      buttonSize + spacing + buttonSize / 2 + 4,
      buttonSize,
      '−',
      () => this.zoomOut()
    );
    this.uiContainer.add(this.zoomOutButton);
    
    // Zoom label
    this.zoomLabel = this.scene.add.text(
      buttonSize / 2 + 4,
      buttonSize * 2 + spacing + 20,
      '100%',
      {
        fontSize: '10px',
        fontFamily: 'Arial',
        color: '#64748b'
      }
    );
    this.zoomLabel.setOrigin(0.5);
    this.uiContainer.add(this.zoomLabel);
  }
  
  private createCenterButton(): void {
    const buttonSize = 44;
    
    // Center button (below zoom controls)
    this.centerButton = this.createButton(
      buttonSize / 2 + 4,
      buttonSize * 2 + 60 + buttonSize / 2,
      buttonSize,
      '◎',
      () => this.centerOnPlayer()
    );
    
    // Add tooltip
    const tooltip = this.scene.add.text(
      buttonSize + 16,
      buttonSize * 2 + 60 + buttonSize / 2,
      'Center',
      {
        fontSize: '11px',
        fontFamily: 'Arial',
        color: '#64748b',
        backgroundColor: '#ffffff',
        padding: { x: 6, y: 3 }
      }
    );
    tooltip.setOrigin(0, 0.5);
    tooltip.setAlpha(0);
    this.centerButton.setData('tooltip', tooltip);
    
    // Show tooltip on hover
    const buttonBg = this.centerButton.list[0] as Phaser.GameObjects.Rectangle;
    buttonBg.on('pointerover', () => {
      tooltip.setAlpha(1);
    });
    buttonBg.on('pointerout', () => {
      tooltip.setAlpha(0);
    });
    
    this.uiContainer.add(this.centerButton);
    this.uiContainer.add(tooltip);
  }
  
  private createButton(
    x: number,
    y: number,
    size: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Button background
    const bg = this.scene.add.rectangle(0, 0, size, size, 0xffffff, 1);
    bg.setStrokeStyle(1, 0xd1d5db, 1);
    bg.setInteractive({ useHandCursor: true });
    
    // Button label
    const text = this.scene.add.text(0, 0, label, {
      fontSize: label.length > 1 ? '18px' : '24px',
      fontFamily: 'Arial',
      color: '#374151',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);
    
    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(0xf3f4f6, 1);
      this.scene.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });
    
    bg.on('pointerout', () => {
      bg.setFillStyle(0xffffff, 1);
      this.scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });
    
    bg.on('pointerdown', () => {
      bg.setFillStyle(0xe5e7eb, 1);
      if (navigator.vibrate) navigator.vibrate(10);
    });
    
    bg.on('pointerup', () => {
      bg.setFillStyle(0xf3f4f6, 1);
      onClick();
    });
    
    container.add(bg);
    container.add(text);
    
    return container;
  }
  
  private setupInputHandlers(): void {
    // Mouse wheel zoom
    this.scene.input.on('wheel', (
      pointer: Phaser.Input.Pointer,
      gameObjects: Phaser.GameObjects.GameObject[],
      deltaX: number,
      deltaY: number
    ) => {
      if (deltaY < 0) {
        this.zoomIn(0.05);
      } else {
        this.zoomOut(0.05);
      }
    });
    
    // Keyboard shortcuts
    if (this.scene.input.keyboard) {
      // + / = key for zoom in
      this.scene.input.keyboard.on('keydown-PLUS', () => this.zoomIn());
      this.scene.input.keyboard.on('keydown-EQUAL', () => this.zoomIn());
      
      // - key for zoom out
      this.scene.input.keyboard.on('keydown-MINUS', () => this.zoomOut());
      
      // C key to center
      this.scene.input.keyboard.on('keydown-C', () => this.centerOnPlayer());
      
      // Home key to reset view
      this.scene.input.keyboard.on('keydown-HOME', () => this.resetView());
    }
    
    // Pan with middle mouse button or touch drag
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Middle mouse button or two-finger touch starts panning
      if (pointer.middleButtonDown() || (pointer.isDown && this.scene.input.pointer2?.isDown)) {
        this.startPan(pointer);
      }
    });
    
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isPanning) {
        this.updatePan(pointer);
      }
    });
    
    this.scene.input.on('pointerup', () => {
      if (this.isPanning) {
        this.endPan();
      }
    });
  }
  
  private startPan(pointer: Phaser.Input.Pointer): void {
    this.isPanning = true;
    this.isFollowing = false;
    this.lastPanX = pointer.x;
    this.lastPanY = pointer.y;
    this.panVelocityX = 0;
    this.panVelocityY = 0;
  }
  
  private updatePan(pointer: Phaser.Input.Pointer): void {
    const deltaX = pointer.x - this.lastPanX;
    const deltaY = pointer.y - this.lastPanY;
    
    // Move camera (inverted for natural dragging)
    this.camera.scrollX -= deltaX / this.camera.zoom;
    this.camera.scrollY -= deltaY / this.camera.zoom;
    
    // Store velocity for momentum
    this.panVelocityX = -deltaX / this.camera.zoom;
    this.panVelocityY = -deltaY / this.camera.zoom;
    
    this.lastPanX = pointer.x;
    this.lastPanY = pointer.y;
    
    // Apply elastic boundaries during drag
    this.applyElasticBoundaries(0.3);
  }
  
  private endPan(): void {
    this.isPanning = false;
  }
  
  public zoomIn(amount: number = this.config.zoomStep): void {
    const newZoom = Math.min(this.camera.zoom + amount, this.config.maxZoom);
    this.animateZoom(newZoom);
  }
  
  public zoomOut(amount: number = this.config.zoomStep): void {
    const newZoom = Math.max(this.camera.zoom - amount, this.config.minZoom);
    this.animateZoom(newZoom);
  }
  
  private animateZoom(targetZoom: number): void {
    this.scene.tweens.add({
      targets: this.camera,
      zoom: targetZoom,
      duration: 200,
      ease: 'Power2',
      onUpdate: () => {
        this.updateZoomLabel();
      }
    });
  }
  
  private updateZoomLabel(): void {
    const percentage = Math.round(this.camera.zoom * 100);
    this.zoomLabel.setText(`${percentage}%`);
  }
  
  public centerOnPlayer(): void {
    if (!this.followTarget) return;
    
    this.isFollowing = true;
    
    // Animate camera to player position
    const targetX = this.followTarget.x - this.camera.width / 2;
    const targetY = this.followTarget.y - this.camera.height / 2;
    
    this.scene.tweens.add({
      targets: this.camera,
      scrollX: Phaser.Math.Clamp(targetX, 0, this.worldBounds.width - this.camera.width),
      scrollY: Phaser.Math.Clamp(targetY, 0, this.worldBounds.height - this.camera.height),
      duration: 500,
      ease: 'Power2'
    });
  }
  
  public resetView(): void {
    this.animateZoom(1);
    this.centerOnPlayer();
  }
  
  public setFollowTarget(target: Phaser.GameObjects.GameObject & { x: number; y: number }): void {
    this.followTarget = target;
    this.isFollowing = true;
  }
  
  public update(delta: number): void {
    // Apply momentum when not panning
    if (!this.isPanning && (Math.abs(this.panVelocityX) > 0.1 || Math.abs(this.panVelocityY) > 0.1)) {
      this.camera.scrollX += this.panVelocityX;
      this.camera.scrollY += this.panVelocityY;
      
      // Decay momentum
      this.panVelocityX *= this.config.panMomentum;
      this.panVelocityY *= this.config.panMomentum;
      
      // Apply elastic boundaries
      this.applyElasticBoundaries(0.1);
    }
    
    // Follow target with smooth interpolation
    if (this.isFollowing && this.followTarget && !this.isPanning) {
      const targetX = this.followTarget.x - this.camera.width / 2;
      const targetY = this.followTarget.y - this.camera.height / 2;
      
      // Smooth follow with lerp
      const smoothX = Phaser.Math.Linear(this.camera.scrollX, targetX, this.config.smoothFollow);
      const smoothY = Phaser.Math.Linear(this.camera.scrollY, targetY, this.config.smoothFollow);
      
      // Clamp to bounds
      this.camera.scrollX = Phaser.Math.Clamp(smoothX, 0, this.worldBounds.width - this.camera.width);
      this.camera.scrollY = Phaser.Math.Clamp(smoothY, 0, Math.max(0, this.worldBounds.height - this.camera.height));
    }
    
    // Always snap back from elastic boundaries when not interacting
    if (!this.isPanning && Math.abs(this.panVelocityX) < 0.1 && Math.abs(this.panVelocityY) < 0.1) {
      this.applyElasticBoundaries(0.15);
    }
  }
  
  private applyElasticBoundaries(strength: number): void {
    const minX = 0;
    const maxX = Math.max(0, this.worldBounds.width - this.camera.width / this.camera.zoom);
    const minY = 0;
    const maxY = Math.max(0, this.worldBounds.height - this.camera.height / this.camera.zoom);
    
    // Calculate overscroll
    let targetX = this.camera.scrollX;
    let targetY = this.camera.scrollY;
    
    if (this.camera.scrollX < minX) {
      targetX = Phaser.Math.Linear(this.camera.scrollX, minX, strength);
    } else if (this.camera.scrollX > maxX) {
      targetX = Phaser.Math.Linear(this.camera.scrollX, maxX, strength);
    }
    
    if (this.camera.scrollY < minY) {
      targetY = Phaser.Math.Linear(this.camera.scrollY, minY, strength);
    } else if (this.camera.scrollY > maxY) {
      targetY = Phaser.Math.Linear(this.camera.scrollY, maxY, strength);
    }
    
    this.camera.scrollX = targetX;
    this.camera.scrollY = targetY;
  }
  
  private handleResize(): void {
    this.updatePosition();
    
    // Update world bounds
    this.worldBounds.height = this.scene.scale.height;
  }
  
  public destroy(): void {
    this.scene.scale.off('resize', this.handleResize, this);
    this.uiContainer.destroy();
  }
}
