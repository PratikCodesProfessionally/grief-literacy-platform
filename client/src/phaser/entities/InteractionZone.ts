import Phaser from 'phaser';
import { Player } from './Player';
import { GAME_CONSTANTS } from '../config/constants';

export class InteractionZone {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public id: string;
  public displayName: string;
  
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private interactiveRect?: Phaser.GameObjects.Rectangle;
  private callback: () => void;
  
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    id: string,
    displayName: string,
    color: number,
    callback: () => void
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.id = id;
    this.displayName = displayName;
    this.callback = callback;
    
    // Create visual zone representation
    this.graphics = scene.add.graphics();
    this.drawZone(color);
    
    // Make zone interactive for direct touch on mobile
    this.makeInteractive();
  }
  
  private makeInteractive(): void {
    // Create an invisible interactive area
    const interactiveRect = this.scene.add.rectangle(
      this.x,
      this.y,
      this.width,
      this.height,
      0x000000,
      0 // Invisible
    );
    interactiveRect.setDepth(15); // Above zone graphics but below UI
    
    // Make it interactive with proper touch handling
    interactiveRect.setInteractive({
      useHandCursor: true,
      hitArea: new Phaser.Geom.Rectangle(
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains
    });
    
    // Enhanced touch event handling
    let touchStartX = 0;
    let touchStartY = 0;
    let isValidTap = false;
    const TOUCH_TOLERANCE = 15; // px tolerance for accidental movement
    
    interactiveRect.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      touchStartX = pointer.x;
      touchStartY = pointer.y;
      isValidTap = true;
      
      // Visual feedback - highlight zone
      this.highlight(true);
      
      // Prevent event propagation to canvas
      pointer.event.preventDefault();
      pointer.event.stopPropagation();
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      console.log(`[ZONE] 🎯 Touch start on ${this.displayName}`);
    });
    
    interactiveRect.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const deltaX = Math.abs(pointer.x - touchStartX);
      const deltaY = Math.abs(pointer.y - touchStartY);
      
      // If moved too much, cancel tap
      if (deltaX > TOUCH_TOLERANCE || deltaY > TOUCH_TOLERANCE) {
        isValidTap = false;
        this.highlight(false);
      }
    });
    
    interactiveRect.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!isValidTap) {
        this.highlight(false);
        return;
      }
      
      const deltaX = Math.abs(pointer.x - touchStartX);
      const deltaY = Math.abs(pointer.y - touchStartY);
      
      // Check final position for valid tap
      if (deltaX <= TOUCH_TOLERANCE && deltaY <= TOUCH_TOLERANCE) {
        console.log(`[ZONE] ✅ Valid tap on ${this.displayName}, triggering interaction`);
        
        // Success haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        // Trigger the interaction
        this.interact();
      }
      
      // Reset state
      isValidTap = false;
      this.highlight(false);
    });
    
    interactiveRect.on('pointerout', () => {
      isValidTap = false;
      this.highlight(false);
    });
    
    interactiveRect.on('pointercancel', () => {
      isValidTap = false;
      this.highlight(false);
    });
    
    // Store reference for cleanup
    this.interactiveRect = interactiveRect;
  }
  
  private drawZone(color: number): void {
    // Zone background
    this.graphics.fillStyle(color, 0.3);
    this.graphics.fillRoundedRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height,
      20
    );
    
    // Zone border
    this.graphics.lineStyle(4, color, 0.8);
    this.graphics.strokeRoundedRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height,
      20
    );
  }
  
  public isPlayerInRange(player: Player): boolean {
    // Use horizontal distance only since player walks on ground level
    // but interaction zones are positioned at sign level (higher up)
    const horizontalDistance = Math.abs(player.x - this.x);
    const fullDistance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      this.x,
      this.y
    );
    
    // Use horizontal distance for primary check (more forgiving for 2D sidescroller)
    const inRange = horizontalDistance < GAME_CONSTANTS.INTERACTION_RANGE;
    
    if (inRange) {
      console.log(`[ZONE] ${this.displayName} - Player in range! hDist=${horizontalDistance.toFixed(0)}, fullDist=${fullDistance.toFixed(0)}`);
    }
    
    return inRange;
  }
  
  public interact(): void {
    this.callback();
  }
  
  public highlight(active: boolean): void {
    if (active) {
      this.graphics.setAlpha(1);
    } else {
      this.graphics.setAlpha(0.6);
    }
  }
  
  public destroy(): void {
    this.graphics.destroy();
    if (this.interactiveRect) {
      this.interactiveRect.destroy();
    }
  }
}
