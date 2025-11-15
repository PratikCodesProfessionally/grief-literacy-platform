import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../config/constants';

export class Player extends Phaser.GameObjects.Rectangle {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: any;
  private isMoving: boolean = false;
  private facingDirection: 'left' | 'right' = 'right';
  private velocity: { x: number; y: number } = { x: 0, y: 0 };
  private joystickInput: { x: number; y: number } | null = null;
  public interactPressed: boolean = false;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(
      scene, 
      x, 
      y, 
      GAME_CONSTANTS.PLAYER_WIDTH, 
      GAME_CONSTANTS.PLAYER_HEIGHT, 
      0x6366f1 // indigo-500
    );
    
    scene.add.existing(this);
    this.setOrigin(0.5, 0.5);
    this.setScale(GAME_CONSTANTS.PLAYER_SCALE);
    
    // Add simple shadow
    this.setStrokeStyle(3, 0x4338ca, 1); // indigo-700
    
    // Setup input
    this.setupInput(scene);
  }
  
  private setupInput(scene: Phaser.Scene): void {
    if (scene.input.keyboard) {
      // Arrow keys
      this.cursors = scene.input.keyboard.createCursorKeys();
      
      // WASD keys
      this.wasdKeys = scene.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        enter: Phaser.Input.Keyboard.KeyCodes.ENTER
      });
    }
  }
  
  update(delta: number): void {
    this.handleMovement(delta);
  }
  
  private handleMovement(delta: number): void {
    let moveX = 0;
    
    // Keyboard input
    if (this.cursors && this.wasdKeys) {
      const leftPressed = this.cursors.left.isDown || this.wasdKeys.left.isDown;
      const rightPressed = this.cursors.right.isDown || this.wasdKeys.right.isDown;
      
      if (leftPressed) {
        moveX = -1;
        this.facingDirection = 'left';
      } else if (rightPressed) {
        moveX = 1;
        this.facingDirection = 'right';
      }
      
      // Check interact
      this.interactPressed = 
        Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.space!) ||
        Phaser.Input.Keyboard.JustDown(this.wasdKeys.space) ||
        Phaser.Input.Keyboard.JustDown(this.wasdKeys.enter);
    }
    
    // Joystick input (mobile)
    if (this.joystickInput) {
      moveX = this.joystickInput.x;
      if (Math.abs(moveX) > 0.1) {
        this.facingDirection = moveX > 0 ? 'right' : 'left';
      }
    }
    
    // Update position
    this.isMoving = Math.abs(moveX) > 0.1;
    this.velocity.x = moveX * GAME_CONSTANTS.PLAYER_SPEED * (delta / 1000);
    
    this.x += this.velocity.x;
    
    // World bounds
    this.x = Phaser.Math.Clamp(this.x, 50, GAME_CONSTANTS.WORLD_WIDTH - 50);
    
    // Visual feedback: slight rotation when moving
    if (this.isMoving) {
      this.rotation = Math.sin(Date.now() / 200) * 0.05;
    } else {
      this.rotation = 0;
    }
  }
  
  public setJoystickInput(x: number, y: number): void {
    this.joystickInput = { x, y };
  }
  
  public clearJoystickInput(): void {
    this.joystickInput = null;
  }
  
  public setMobileInteract(pressed: boolean): void {
    this.interactPressed = pressed;
  }
  
  public getInteractPressed(): boolean {
    const pressed = this.interactPressed;
    this.interactPressed = false; // Reset after reading
    return pressed;
  }
  
  public getFacingDirection(): 'left' | 'right' {
    return this.facingDirection;
  }
}
