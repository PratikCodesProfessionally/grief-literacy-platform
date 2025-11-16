import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../config/constants';

export class Player extends Phaser.GameObjects.Container {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: any;
  private isMoving: boolean = false;
  private facingDirection: 'left' | 'right' = 'right';
  private velocity: { x: number; y: number } = { x: 0, y: 0 };
  private joystickInput: { x: number; y: number } | null = null;
  public interactPressed: boolean = false;
  
  private torso!: Phaser.GameObjects.Ellipse;
  private head!: Phaser.GameObjects.Arc;
  private leftLeg!: Phaser.GameObjects.Rectangle;
  private rightLeg!: Phaser.GameObjects.Rectangle;
  private leftArm!: Phaser.GameObjects.Rectangle;
  private rightArm!: Phaser.GameObjects.Rectangle;
  private walkAnimation: number = 0;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    scene.add.existing(this);
    this.setSize(GAME_CONSTANTS.PLAYER_WIDTH, GAME_CONSTANTS.PLAYER_HEIGHT);
    
    this.createCharacter();
    
    // Setup input
    this.setupInput(scene);
  }
  
  private createCharacter(): void {
    const bodyColor = 0x3b82f6; // blue-500
    const skinColor = 0xfbbf24; // amber-400
    const accentColor = 0x1e40af; // blue-800
    
    // Shadow
    const shadow = this.scene.add.ellipse(0, 35, 40, 15, 0x000000, 0.3);
    this.add(shadow);
    
    // Legs
    this.leftLeg = this.scene.add.rectangle(-8, 15, 10, 30, bodyColor);
    this.rightLeg = this.scene.add.rectangle(8, 15, 10, 30, bodyColor);
    this.add(this.leftLeg);
    this.add(this.rightLeg);
    
    // Body (torso)
    this.torso = this.scene.add.ellipse(0, -5, 35, 45, bodyColor);
    this.add(this.torso);
    
    // Arms
    this.leftArm = this.scene.add.rectangle(-18, 0, 8, 25, bodyColor);
    this.rightArm = this.scene.add.rectangle(18, 0, 8, 25, bodyColor);
    this.leftArm.setOrigin(0.5, 0.3);
    this.rightArm.setOrigin(0.5, 0.3);
    this.add(this.leftArm);
    this.add(this.rightArm);
    
    // Head
    this.head = this.scene.add.circle(0, -25, 15, skinColor);
    this.add(this.head);
    
    // Eyes
    const leftEye = this.scene.add.circle(-5, -27, 2, 0x000000);
    const rightEye = this.scene.add.circle(5, -27, 2, 0x000000);
    this.add(leftEye);
    this.add(rightEye);
    
    // Smile
    const smile = this.scene.add.arc(0, -22, 6, 0, 180, false, 0x000000);
    smile.setStrokeStyle(1.5, 0x000000);
    smile.isFilled = false;
    this.add(smile);
    
    // Hair/Hat
    const hair = this.scene.add.arc(0, -32, 16, 180, 360, false, accentColor);
    this.add(hair);
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
    this.animateWalking(delta);
  }
  
  private animateWalking(delta: number): void {
    if (this.isMoving) {
      // Update walk animation
      this.walkAnimation += delta * 0.008;
      
      // Leg animation (alternating walk)
      const legAngle = Math.sin(this.walkAnimation) * 0.3;
      this.leftLeg.rotation = legAngle;
      this.rightLeg.rotation = -legAngle;
      
      // Arm animation (opposite to legs for natural walk)
      const armAngle = Math.sin(this.walkAnimation) * 0.2;
      this.leftArm.rotation = -armAngle;
      this.rightArm.rotation = armAngle;
      
      // Slight body bob
      this.torso.y = -5 + Math.abs(Math.sin(this.walkAnimation)) * 2;
      this.head.y = -25 + Math.abs(Math.sin(this.walkAnimation)) * 2;
    } else {
      // Reset to idle position
      this.leftLeg.rotation = Phaser.Math.Linear(this.leftLeg.rotation, 0, 0.1);
      this.rightLeg.rotation = Phaser.Math.Linear(this.rightLeg.rotation, 0, 0.1);
      this.leftArm.rotation = Phaser.Math.Linear(this.leftArm.rotation, 0, 0.1);
      this.rightArm.rotation = Phaser.Math.Linear(this.rightArm.rotation, 0, 0.1);
      this.torso.y = Phaser.Math.Linear(this.torso.y, -5, 0.1);
      this.head.y = Phaser.Math.Linear(this.head.y, -25, 0.1);
    }
    
    // Flip character based on direction
    this.setScale(this.facingDirection === 'left' ? -1 : 1, 1);
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
