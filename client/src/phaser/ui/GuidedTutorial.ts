import Phaser from 'phaser';
import { STATION_POSITIONS, GAME_CONSTANTS } from '../config/constants';

interface TutorialStep {
  id: string;
  title: string;
  message: string;
  target?: { x: number; y: number };
  targetType?: 'station' | 'minimap' | 'controls' | 'player';
  action?: 'move' | 'interact' | 'click' | 'zoom' | 'none';
  highlightArea?: { x: number; y: number; width: number; height: number };
  delay?: number;
}

/**
 * GuidedTutorial - Onboarding flow for new users
 * 
 * Features:
 * - Welcome introduction
 * - Step-by-step guidance
 * - Highlight areas of interest
 * - Skip option for returning users
 * - Progress tracking
 * - Contextual tips
 */
export class GuidedTutorial {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Rectangle;
  private spotlight?: Phaser.GameObjects.Graphics;
  private dialogBox?: Phaser.GameObjects.Container;
  private skipButton?: Phaser.GameObjects.Container;
  private progressDots?: Phaser.GameObjects.Container;
  
  private steps: TutorialStep[] = [];
  private currentStep: number = 0;
  private isActive: boolean = false;
  private isComplete: boolean = false;
  private onComplete?: () => void;
  
  private readonly STORAGE_KEY = 'grief_tutorial_complete';
  
  constructor(scene: Phaser.Scene, onComplete?: () => void) {
    this.scene = scene;
    this.onComplete = onComplete;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(2000);
    this.container.setScrollFactor(0);
    
    this.initializeSteps();
    
    // Check if tutorial already completed
    this.isComplete = localStorage.getItem(this.STORAGE_KEY) === 'true';
  }
  
  private initializeSteps(): void {
    const firstStation = STATION_POSITIONS[0];
    
    this.steps = [
      {
        id: 'welcome',
        title: 'Welcome 💜',
        message: 'This is your safe space for grief work.\nHere you will find tools and support\nfor your healing journey.',
        action: 'none',
        delay: 500
      },
      {
        id: 'movement',
        title: 'Movement',
        message: 'Use the arrow keys (←→) or\ntap on the sides of the screen\nto move around.',
        targetType: 'player',
        action: 'move'
      },
      {
        id: 'explore',
        title: 'Explore',
        message: 'You are in a peaceful landscape.\nMove to the right to discover\nthe various therapy stations.',
        action: 'move'
      },
      {
        id: 'stations',
        title: 'Therapy Stations',
        message: 'Each station offers different\ntools for your healing journey:\nArt, Community, Meditation and more.',
        target: { x: firstStation.x, y: firstStation.y },
        targetType: 'station',
        action: 'none'
      },
      {
        id: 'interact',
        title: 'Interact',
        message: 'Press SPACE or tap the green\nbutton when you are near\na station.',
        targetType: 'station',
        action: 'interact'
      },
      {
        id: 'minimap',
        title: 'Map',
        message: 'The map in the top right shows\nall stations. Click on it\nto navigate quickly.',
        targetType: 'minimap',
        action: 'click',
        highlightArea: { x: 0, y: 0, width: 200, height: 120 } // Will be positioned dynamically
      },
      {
        id: 'zoom',
        title: 'Zoom & Camera',
        message: 'Use the +/- keys or mouse wheel\nto zoom in or out.\nClick ◎ to center.',
        targetType: 'controls',
        action: 'zoom',
        highlightArea: { x: 0, y: 0, width: 50, height: 150 } // Will be positioned dynamically
      },
      {
        id: 'progress',
        title: 'Your Progress',
        message: 'In the top left you can see your\nprogress on the healing journey.\nEvery visit counts! 💪',
        action: 'none'
      },
      {
        id: 'ready',
        title: 'Ready! 🌟',
        message: 'You are now ready for your journey.\nTake all the time you need.\nEvery step is valuable.',
        action: 'none',
        delay: 300
      }
    ];
  }
  
  public shouldShowTutorial(): boolean {
    return !this.isComplete;
  }
  
  public start(): void {
    if (this.isActive || this.isComplete) return;
    
    this.isActive = true;
    this.currentStep = 0;
    
    // Create overlay
    this.createOverlay();
    this.createSkipButton();
    this.createProgressDots();
    
    // Show first step after delay
    this.scene.time.delayedCall(this.steps[0].delay || 300, () => {
      this.showStep(0);
    });
  }
  
  public forceStart(): void {
    // Reset completion status and start
    this.isComplete = false;
    localStorage.removeItem(this.STORAGE_KEY);
    this.start();
  }
  
  private createOverlay(): void {
    const { width, height } = this.scene.cameras.main;
    
    this.overlay = this.scene.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x000000, 0.7
    );
    this.overlay.setScrollFactor(0);
    this.container.add(this.overlay);
    
    // Spotlight graphics for highlighting areas
    this.spotlight = this.scene.add.graphics();
    this.spotlight.setScrollFactor(0);
    this.container.add(this.spotlight);
  }
  
  private createSkipButton(): void {
    const { width } = this.scene.cameras.main;
    
    this.skipButton = this.scene.add.container(width - 60, 30);
    
    const bg = this.scene.add.rectangle(0, 0, 100, 32, 0x4A5568, 0.8);
    bg.setStrokeStyle(1, 0x718096);
    this.skipButton.add(bg);
    
    const text = this.scene.add.text(0, 0, 'Skip', {
      fontSize: '11px',
      fontFamily: 'Inter, sans-serif',
      color: '#A0AEC0'
    });
    text.setOrigin(0.5);
    this.skipButton.add(text);
    
    let skipPressed = false;
    
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setFillStyle(0x718096, 0.9);
      text.setColor('#FFFFFF');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x4A5568, 0.8);
      text.setColor('#A0AEC0');
      skipPressed = false;
    });
    bg.on('pointerdown', () => {
      skipPressed = true;
    });
    bg.on('pointerup', () => {
      if (skipPressed) {
        skipPressed = false;
        this.skip();
      }
    });
    
    this.container.add(this.skipButton);
  }
  
  private createProgressDots(): void {
    const { width, height } = this.scene.cameras.main;
    
    this.progressDots = this.scene.add.container(width / 2, height - 50);
    
    const totalDots = this.steps.length;
    const dotSpacing = 16;
    const startX = -((totalDots - 1) * dotSpacing) / 2;
    
    this.steps.forEach((_, index) => {
      const dot = this.scene.add.circle(
        startX + index * dotSpacing,
        0,
        4,
        index === 0 ? 0x48BB78 : 0x4A5568
      );
      dot.setData('index', index);
      this.progressDots!.add(dot);
    });
    
    this.container.add(this.progressDots);
  }
  
  private updateProgressDots(): void {
    if (!this.progressDots) return;
    
    this.progressDots.getAll().forEach((dot) => {
      if (dot instanceof Phaser.GameObjects.Arc) {
        const index = dot.getData('index');
        if (index < this.currentStep) {
          dot.setFillStyle(0x48BB78); // Completed
        } else if (index === this.currentStep) {
          dot.setFillStyle(0x4299E1); // Current
          // Pulse animation
          this.scene.tweens.add({
            targets: dot,
            scale: { from: 1, to: 1.3 },
            duration: 500,
            yoyo: true,
            repeat: -1
          });
        } else {
          dot.setFillStyle(0x4A5568); // Upcoming
        }
      }
    });
  }
  
  private showStep(stepIndex: number): void {
    if (stepIndex >= this.steps.length) {
      this.complete();
      return;
    }
    
    const step = this.steps[stepIndex];
    this.currentStep = stepIndex;
    
    // Clear previous dialog
    if (this.dialogBox) {
      this.dialogBox.destroy();
    }
    
    // Update progress dots
    this.updateProgressDots();
    
    // Update spotlight
    this.updateSpotlight(step);
    
    // Create dialog box
    this.createDialogBox(step);
  }
  
  private updateSpotlight(step: TutorialStep): void {
    if (!this.spotlight) return;
    
    this.spotlight.clear();
    
    // Redraw overlay with cutout if needed
    if (step.highlightArea || step.targetType) {
      const { width, height } = this.scene.cameras.main;
      
      // Draw dark overlay
      this.spotlight.fillStyle(0x000000, 0.7);
      this.spotlight.fillRect(0, 0, width, height);
      
      // Create spotlight cutout based on target type
      let cutoutX = width / 2, cutoutY = height / 2;
      let cutoutW = 200, cutoutH = 150;
      let cutoutRadius = 80;
      
      switch (step.targetType) {
        case 'minimap':
          // Minimap is top-right
          cutoutX = width - 100;
          cutoutY = 80;
          cutoutRadius = 100;
          break;
        case 'controls':
          // Zoom controls are bottom-right
          cutoutX = width - 40;
          cutoutY = height - 120;
          cutoutW = 60;
          cutoutH = 180;
          break;
        case 'player':
          // Center of screen
          cutoutX = width / 2;
          cutoutY = height / 2;
          cutoutRadius = 100;
          break;
        case 'station':
          // First station relative position
          cutoutX = width / 2 + 100;
          cutoutY = height / 2;
          cutoutRadius = 120;
          break;
      }
      
      // Draw circular spotlight
      this.spotlight.fillStyle(0x000000, 0);
      this.spotlight.setBlendMode(Phaser.BlendModes.ERASE);
      this.spotlight.fillCircle(cutoutX, cutoutY, cutoutRadius);
      this.spotlight.setBlendMode(Phaser.BlendModes.NORMAL);
      
      // Add glow ring
      this.spotlight.lineStyle(3, 0x4299E1, 0.8);
      this.spotlight.strokeCircle(cutoutX, cutoutY, cutoutRadius + 5);
    }
    
    // Hide overlay if no highlight needed
    if (this.overlay) {
      this.overlay.setAlpha(step.targetType ? 0 : 0.7);
    }
  }
  
  private createDialogBox(step: TutorialStep): void {
    const { width, height } = this.scene.cameras.main;
    
    // Position dialog based on step target
    let dialogX = width / 2;
    let dialogY = height / 2;
    
    switch (step.targetType) {
      case 'minimap':
        dialogX = width / 2;
        dialogY = height / 2 + 50;
        break;
      case 'controls':
        dialogX = width / 2 - 100;
        dialogY = height / 2;
        break;
      case 'player':
      case 'station':
        dialogY = height - 150;
        break;
    }
    
    this.dialogBox = this.scene.add.container(dialogX, dialogY);
    this.dialogBox.setAlpha(0);
    
    // Background with gradient-like effect
    const boxWidth = 340;
    const boxHeight = 180;
    
    const bgShadow = this.scene.add.rectangle(4, 4, boxWidth, boxHeight, 0x000000, 0.3);
    this.dialogBox.add(bgShadow);
    
    const bg = this.scene.add.rectangle(0, 0, boxWidth, boxHeight, 0x1A202C, 0.98);
    bg.setStrokeStyle(2, 0x4299E1);
    this.dialogBox.add(bg);
    
    // Decorative corner
    const corner = this.scene.add.triangle(-boxWidth/2 + 12, -boxHeight/2 + 12, 0, 0, 20, 0, 0, 20, 0x4299E1);
    this.dialogBox.add(corner);
    
    // Step indicator
    const stepText = this.scene.add.text(
      boxWidth/2 - 30, -boxHeight/2 + 12,
      `${this.currentStep + 1}/${this.steps.length}`,
      {
        fontSize: '10px',
        fontFamily: 'Inter, sans-serif',
        color: '#718096'
      }
    );
    stepText.setOrigin(0.5);
    this.dialogBox.add(stepText);
    
    // Title
    const title = this.scene.add.text(0, -boxHeight/2 + 40, step.title, {
      fontSize: '18px',
      fontFamily: 'Inter, sans-serif',
      fontStyle: 'bold',
      color: '#FFFFFF'
    });
    title.setOrigin(0.5);
    this.dialogBox.add(title);
    
    // Message
    const message = this.scene.add.text(0, 10, step.message, {
      fontSize: '13px',
      fontFamily: 'Inter, sans-serif',
      color: '#E2E8F0',
      align: 'center',
      lineSpacing: 6
    });
    message.setOrigin(0.5);
    this.dialogBox.add(message);
    
    // Buttons container
    const buttonsY = boxHeight/2 - 35;
    
    // Back button (if not first step)
    if (this.currentStep > 0) {
      const backBtn = this.createButton('← Back', -60, buttonsY, () => {
        this.showStep(this.currentStep - 1);
      }, true);
      this.dialogBox.add(backBtn);
    }
    
    // Next/Done button
    const isLastStep = this.currentStep === this.steps.length - 1;
    const nextBtn = this.createButton(
      isLastStep ? 'Start! 🚀' : 'Next →',
      this.currentStep > 0 ? 60 : 0,
      buttonsY,
      () => {
        if (isLastStep) {
          this.complete();
        } else {
          this.showStep(this.currentStep + 1);
        }
      },
      false
    );
    this.dialogBox.add(nextBtn);
    
    this.container.add(this.dialogBox);
    
    // Animate in
    this.scene.tweens.add({
      targets: this.dialogBox,
      alpha: 1,
      scale: { from: 0.9, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    });
  }
  
  private createButton(
    text: string,
    x: number,
    y: number,
    onClick: () => void,
    isSecondary: boolean
  ): Phaser.GameObjects.Container {
    const btn = this.scene.add.container(x, y);
    
    const bg = this.scene.add.rectangle(
      0, 0, 100, 32,
      isSecondary ? 0x4A5568 : 0x48BB78,
      isSecondary ? 0.8 : 1
    );
    bg.setStrokeStyle(1, isSecondary ? 0x718096 : 0x68D391);
    btn.add(bg);
    
    const label = this.scene.add.text(0, 0, text, {
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
      fontStyle: 'bold',
      color: isSecondary ? '#E2E8F0' : '#1A202C'
    });
    label.setOrigin(0.5);
    btn.add(label);
    
    // Track if button was pressed (for proper click detection)
    let isPressed = false;
    
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setScale(1.05);
      bg.setFillStyle(isSecondary ? 0x718096 : 0x68D391);
    });
    bg.on('pointerout', () => {
      bg.setScale(1);
      bg.setFillStyle(isSecondary ? 0x4A5568 : 0x48BB78, isSecondary ? 0.8 : 1);
      isPressed = false;
    });
    bg.on('pointerdown', () => {
      isPressed = true;
      bg.setScale(0.95);
    });
    bg.on('pointerup', () => {
      if (isPressed) {
        isPressed = false;
        bg.setScale(1.05);
        // Small delay to prevent double-clicks and allow visual feedback
        this.scene.time.delayedCall(50, () => {
          onClick();
        });
      }
    });
    
    return btn;
  }
  
  private skip(): void {
    this.complete();
  }
  
  private complete(): void {
    this.isActive = false;
    this.isComplete = true;
    
    // Save completion status
    localStorage.setItem(this.STORAGE_KEY, 'true');
    
    // Animate out
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.destroy();
        this.onComplete?.();
      }
    });
  }
  
  public destroy(): void {
    this.container.destroy();
  }
  
  public isRunning(): boolean {
    return this.isActive;
  }
}
