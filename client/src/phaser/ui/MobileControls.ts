import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GAME_CONSTANTS } from '../config/constants';

export class MobileControls {
  private scene: Phaser.Scene;
  private joystick: {
    base: Phaser.GameObjects.Arc;
    thumb: Phaser.GameObjects.Arc;
    isDragging: boolean;
  };
  private interactButton: Phaser.GameObjects.Container;
  private interactButtonPressed: boolean = false;
  private isVisible: boolean = false;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    this.joystick = this.createJoystick();
    this.interactButton = this.createInteractButton();
    
    // Initially hidden
    this.hide();
  }
  
  private createJoystick(): any {
    // Position based on screen size - much higher on screen
    const isSmallScreen = this.scene.scale.width < 768;
    const baseX = isSmallScreen ? 80 : 120;
    const baseY = this.scene.scale.height - (isSmallScreen ? 150 : 180);
    
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
      isDragging: false
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
      }
    });
    
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!joystick.isDragging) return;
      
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
    
    this.scene.input.on('pointerup', () => {
      if (!joystick.isDragging) return;
      
      joystick.isDragging = false;
      thumb.setPosition(base.x, base.y);
    });
    
    return joystick;
  }
  
  private createInteractButton(): Phaser.GameObjects.Container {
    // Position based on screen size - much higher on screen
    const isSmallScreen = this.scene.scale.width < 768;
    const btnX = this.scene.scale.width - (isSmallScreen ? 80 : 120);
    const btnY = this.scene.scale.height - (isSmallScreen ? 150 : 180);
    const buttonSize = isSmallScreen ? GAME_CONSTANTS.BUTTON_SIZE : GAME_CONSTANTS.BUTTON_SIZE * 1.1;
    
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
    bg.setInteractive({ useHandCursor: true });
    
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
    
    // Improved touch handling for mobile
    let touchActive = false;
    
    const handleTouchStart = (pointer: any) => {
      touchActive = true;
      this.interactButtonPressed = true;
      bg.setScale(0.85);
      bg.setFillStyle(0x7c3aed);
      
      // Visual feedback - pulse effect
      this.scene.tweens.add({
        targets: bg,
        scale: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
      });
      
      console.log('Button pressed!'); // Debug
    };
    
    const handleTouchEnd = () => {
      touchActive = false;
      bg.setScale(1);
      bg.setFillStyle(0x8b5cf6);
    };
    
    // Make the entire container interactive, not just bg
    container.setSize(buttonSize, buttonSize);
    container.setInteractive();
    
    // Use container events for better touch detection
    container.on('pointerdown', (pointer: any) => {
      handleTouchStart(pointer);
    });
    
    container.on('pointerup', () => {
      handleTouchEnd();
    });
    
    container.on('pointerout', () => {
      if (touchActive) {
        handleTouchEnd();
      }
    });
    
    // Also keep bg interactive as backup
    bg.setInteractive();
    bg.on('pointerdown', handleTouchStart);
    bg.on('pointerup', handleTouchEnd);
    
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
        player.setJoystickInput(normalizedX, 0);
      } else {
        player.clearJoystickInput();
      }
    } else {
      player.clearJoystickInput();
    }
    
    // Update interact button - simplified for reliability
    if (this.interactButtonPressed) {
      console.log('[MOBILE] ========== BUTTON PRESSED - SETTING INTERACT ==========');
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
