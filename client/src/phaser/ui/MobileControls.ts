import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GAME_CONSTANTS } from '../config/constants';

export class MobileControls {
  private scene: Phaser.Scene;
  private joystick: {
    base: Phaser.GameObjects.Circle;
    thumb: Phaser.GameObjects.Circle;
    isDragging: boolean;
  };
  private interactButton: Phaser.GameObjects.Container;
  private isVisible: boolean = false;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    this.joystick = this.createJoystick();
    this.interactButton = this.createInteractButton();
    
    // Initially hidden
    this.hide();
  }
  
  private createJoystick(): any {
    const baseX = 120;
    const baseY = this.scene.scale.height - 120;
    
    // Joystick base
    const base = this.scene.add.circle(
      baseX,
      baseY,
      GAME_CONSTANTS.JOYSTICK_RADIUS,
      0x475569, // gray-600
      GAME_CONSTANTS.JOYSTICK_BASE_ALPHA
    );
    base.setScrollFactor(0);
    base.setDepth(1000);
    base.setStrokeStyle(2, 0xffffff, 0.5);
    
    // Joystick thumb
    const thumb = this.scene.add.circle(
      baseX,
      baseY,
      GAME_CONSTANTS.JOYSTICK_RADIUS * 0.5,
      0x0ea5e9, // sky-500
      0.9
    );
    thumb.setScrollFactor(0);
    thumb.setDepth(1001);
    thumb.setStrokeStyle(2, 0xffffff, 0.8);
    
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
    const btnX = this.scene.scale.width - 120;
    const btnY = this.scene.scale.height - 120;
    
    const container = this.scene.add.container(btnX, btnY);
    container.setScrollFactor(0);
    container.setDepth(1000);
    
    // Button background
    const bg = this.scene.add.circle(
      0,
      0,
      GAME_CONSTANTS.BUTTON_SIZE / 2,
      0x8b5cf6, // violet-500
      0.9
    );
    bg.setStrokeStyle(3, 0xffffff, 0.8);
    bg.setInteractive();
    
    // Button text
    const text = this.scene.add.text(0, 0, '↑', {
      fontFamily: 'Arial',
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);
    
    container.add([bg, text]);
    
    // Touch events
    let isPressed = false;
    
    bg.on('pointerdown', () => {
      isPressed = true;
      bg.setScale(0.9);
      bg.setFillStyle(0x7c3aed); // violet-600
    });
    
    bg.on('pointerup', () => {
      isPressed = false;
      bg.setScale(1);
      bg.setFillStyle(0x8b5cf6); // violet-500
    });
    
    bg.on('pointerout', () => {
      if (isPressed) {
        isPressed = false;
        bg.setScale(1);
        bg.setFillStyle(0x8b5cf6);
      }
    });
    
    // Store pressed state
    (container as any).isPressed = () => isPressed;
    
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
    
    // Update interact button
    const pressed = (this.interactButton as any).isPressed();
    player.setMobileInteract(pressed);
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
