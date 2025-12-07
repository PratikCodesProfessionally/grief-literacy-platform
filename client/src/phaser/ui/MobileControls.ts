import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GAME_CONSTANTS } from '../config/constants';

export class MobileControls {
  private scene: Phaser.Scene;
  private joystick: {
    base: Phaser.GameObjects.Arc;
    thumb: Phaser.GameObjects.Arc;
    isDragging: boolean;
    draggingPointerId: number | null;
  };
  private interactButton: Phaser.GameObjects.Container;
  private interactButtonPressed: boolean = false;
  private isVisible: boolean = false;
  private onInteractCallback?: () => void; // Callback for direct interaction
  
  constructor(scene: Phaser.Scene, onInteract?: () => void) {
    this.scene = scene;
    this.onInteractCallback = onInteract;
    
    this.joystick = this.createJoystick();
    this.interactButton = this.createInteractButton();
    
    // Initially hidden
    this.hide();
  }
  
  private createJoystick(): any {
    // Position based on screen size - optimized for tablets and phones
    const isSmallScreen = this.scene.scale.width < 768;
    const isTablet = this.scene.scale.width >= 768 && this.scene.scale.width <= 1024;
    const baseX = isSmallScreen ? 80 : isTablet ? 100 : 120;
    const baseY = this.scene.scale.height - (isSmallScreen ? 150 : isTablet ? 170 : 180);
    
    // Joystick base
    const base = this.scene.add.circle(
      baseX,
      baseY,
      GAME_CONSTANTS.JOYSTICK_RADIUS,
      0x475569, // gray-600
      0.7 // Increased opacity for better visibility
    );
    base.setScrollFactor(0);
    base.setDepth(1000);
    base.setStrokeStyle(3, 0xffffff, 0.8); // Thicker border for visibility
    
    // Joystick thumb
    const thumb = this.scene.add.circle(
      baseX,
      baseY,
      GAME_CONSTANTS.JOYSTICK_RADIUS * 0.5,
      0x0ea5e9, // sky-500
      1 // Full opacity
    );
    thumb.setScrollFactor(0);
    thumb.setDepth(1001);
    thumb.setStrokeStyle(3, 0xffffff, 1); // Thicker border
    
    const joystick = {
      base,
      thumb,
      isDragging: false,
      draggingPointerId: null
    };
    
    // Make base interactive
    base.setInteractive();
    
    // Input events
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const distance = Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        base.x,
        base.y
      );
      
      if (distance < GAME_CONSTANTS.JOYSTICK_RADIUS * 1.8) {
        joystick.isDragging = true;
        joystick.draggingPointerId = pointer.id;
      }
    });
    
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!joystick.isDragging || joystick.draggingPointerId !== pointer.id) return;
      
      const angle = Phaser.Math.Angle.Between(
        base.x,
        base.y,
        pointer.x,
        pointer.y
      );
      
      const distance = Math.min(
        Phaser.Math.Distance.Between(
          base.x,
          base.y,
          pointer.x,
          pointer.y
        ),
        GAME_CONSTANTS.JOYSTICK_RADIUS * 0.8
      );
      
      thumb.setPosition(
        base.x + Math.cos(angle) * distance,
        base.y + Math.sin(angle) * distance
      );
    });
    
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (joystick.draggingPointerId === pointer.id) {
        joystick.isDragging = false;
        joystick.draggingPointerId = null;
        thumb.setPosition(base.x, base.y);
      }
    });
    
    return joystick;
  }
  
  private createInteractButton(): Phaser.GameObjects.Container {
    // Position based on screen size - optimized for tablets and phones
    const isSmallScreen = this.scene.scale.width < 768;
    const isTablet = this.scene.scale.width >= 768 && this.scene.scale.width <= 1024;
    const btnX = this.scene.scale.width - (isSmallScreen ? 80 : isTablet ? 100 : 120);
    const btnY = this.scene.scale.height - (isSmallScreen ? 150 : isTablet ? 170 : 180);
    const buttonSize = isSmallScreen ? GAME_CONSTANTS.BUTTON_SIZE : isTablet ? GAME_CONSTANTS.BUTTON_SIZE * 1.2 : GAME_CONSTANTS.BUTTON_SIZE * 1.1;
    
    const container = this.scene.add.container(btnX, btnY);
    container.setScrollFactor(0);
    container.setDepth(1000);
    
    // Button background
    const bg = this.scene.add.circle(
      0,
      0,
      buttonSize / 2,
      0x8b5cf6, // violet-500
      0.95 // Increased opacity
    );
    bg.setStrokeStyle(4, 0xffffff, 0.9); // Thicker border for visibility
    
    // Button text
    const text = this.scene.add.text(0, 0, '↑', {
      fontFamily: 'Arial',
      fontSize: '48px', // Larger for better visibility
      color: '#ffffff',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);
    text.setShadow(2, 2, '#000000', 4); // Add shadow for better contrast
    
    // Add small instruction text below
    const instructionText = this.scene.add.text(0, 55, 'ENTER', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    instructionText.setOrigin(0.5);
    instructionText.setAlpha(0.8);
    
    container.add([bg, text, instructionText]);
    
    // Simplified touch handling - trigger immediately on pointerdown for instant response
    const handleTouchStart = (pointer: Phaser.Input.Pointer) => {
      // Immediate visual feedback
      bg.setScale(0.85);
      bg.setFillStyle(0x7c3aed);
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      // TRIGGER IMMEDIATELY on touch start for instant response
      console.log('[MOBILE] 🎯 Touch on interact button - TRIGGERING IMMEDIATELY');
      this.interactButtonPressed = true;
      
      // Prevent default to avoid any browser interference
      if (pointer.event) {
        pointer.event.preventDefault();
        pointer.event.stopPropagation();
      }
      
      // Reset visual state after short delay
      this.scene.time.delayedCall(100, () => {
        bg.setScale(1);
        bg.setFillStyle(0x8b5cf6);
      });
    };
    
    // Make the entire container interactive with proper touch handling
    container.setSize(buttonSize * 1.5, buttonSize * 1.5); // Larger hit area
    container.setInteractive({
      useHandCursor: true,
      hitArea: new Phaser.Geom.Circle(0, 0, buttonSize * 0.75), // Larger hit area
      hitAreaCallback: Phaser.Geom.Circle.Contains
    });
    
    // Add comprehensive touch event listeners - only pointerdown needed now
    container.on('pointerdown', handleTouchStart);
    
    // Prevent default browser behaviors that interfere
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Check if pointer is over our button
      const distance = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        container.x, container.y
      );
      
      if (distance <= buttonSize / 2) {
        // Prevent canvas pan/zoom when touching button
        pointer.event.preventDefault();
        pointer.event.stopPropagation();
      }
    });
    
    return container;
  }
  
  public update(player: Player): void {
    if (!this.isVisible) return;
    
    // Update joystick input
    if (this.joystick.isDragging) {
      const dx = this.joystick.thumb.x - this.joystick.base.x;
      const dy = this.joystick.thumb.y - this.joystick.base.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        const normalizedX = dx / (GAME_CONSTANTS.JOYSTICK_RADIUS * 0.8);
        console.log('[MOBILE] Joystick input:', { normalizedX, distance });
        player.setJoystickInput(normalizedX, 0);
      } else {
        player.clearJoystickInput();
      }
    } else {
      player.clearJoystickInput();
    }
    
    // Update interact button - use callback for direct interaction
    if (this.interactButtonPressed) {
      console.log('[MOBILE] ========== BUTTON PRESSED - TRIGGERING INTERACTION ==========');
      
      // Use callback if available for immediate station entry
      if (this.onInteractCallback) {
        console.log('[MOBILE] Using direct callback for interaction');
        this.onInteractCallback();
      }
      
      // Always set the player flag so shared interaction logic (NPCs, trees, fallback) still works
      player.setMobileInteract(true);
      
      this.interactButtonPressed = false;
    }
  }
  
  public show(): void {
    this.isVisible = true;
    this.joystick.base.setVisible(true);
    this.joystick.thumb.setVisible(true);
    this.interactButton.setVisible(true);
  }
  
  public hide(): void {
    this.isVisible = false;
    this.joystick.base.setVisible(false);
    this.joystick.thumb.setVisible(false);
    this.interactButton.setVisible(false);
  }
  
  public destroy(): void {
    this.joystick.base.destroy();
    this.joystick.thumb.destroy();
    this.interactButton.destroy();
  }
}
