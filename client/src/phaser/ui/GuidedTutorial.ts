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
  private debugText?: Phaser.GameObjects.Text;
  
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
        title: 'Hello',
        message: 'This is a quiet space, created for you.\nThere\'s no rush here. No expectations.\nJust gentle tools when you\'re ready.',
        action: 'none',
        delay: 500
      },
      {
        id: 'movement',
        title: 'Moving Around',
        message: 'Use the joystick on the left\nto walk through this world.\nGo at your own pace.',
        targetType: 'player',
        action: 'move'
      },
      {
        id: 'stations',
        title: 'Places to Visit',
        message: 'You\'ll find different spaces here \nfor reflection, creativity, connection.\nEach one is here when you need it.',
        target: { x: firstStation.x, y: firstStation.y },
        targetType: 'station',
        action: 'none'
      },
      {
        id: 'interact',
        title: 'Entering a Space',
        message: 'When you\'re near a place,\nthe purple button appears.\nTap it to go inside.',
        targetType: 'station',
        action: 'interact'
      },
      {
        id: 'ready',
        title: 'That\'s All',
        message: 'Take your time exploring.\nThere\'s no right way to do this.\nWe\'re glad you\'re here.',
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
    
    // Create minimal overlay for debug only (UI handled by React)
    this.createDebugOverlay();
    
    // FALLBACK: Add keyboard support for buttons
    this.setupKeyboardFallback();
    
    // Show first step after delay (UI handled by React overlay)
    this.scene.time.delayedCall(this.steps[0].delay || 300, () => {
      this.showStep(0);
    });
  }
  
  private setupKeyboardFallback(): void {
    // Use arrow keys or spacebar to navigate tutorial
    this.scene.input.keyboard?.on('keydown-RIGHT', () => {
      console.log('[KEYBOARD] Right arrow pressed');
      this.showStep(this.currentStep + 1);
    });
    
    this.scene.input.keyboard?.on('keydown-SPACE', () => {
      console.log('[KEYBOARD] Space pressed');
      this.showStep(this.currentStep + 1);
    });
    
    this.scene.input.keyboard?.on('keydown-ESC', () => {
      console.log('[KEYBOARD] Escape pressed - skipping');
      this.skip();
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
    
    // CRITICAL MOBILE FIX: Make overlay non-interactive to prevent event blocking
    // This ensures touch events reach the buttons instead of being consumed by overlay
    // this.overlay.setInteractive(); // REMOVED - was blocking button interactions
    
    // Spotlight graphics for highlighting areas
    this.spotlight = this.scene.add.graphics();
    this.spotlight.setScrollFactor(0);
    this.container.add(this.spotlight);
  }
  
  private createSkipButton(): void {
    const { width } = this.scene.cameras.main;
    
    this.skipButton = this.scene.add.container(width - 70, 30);
    
    // MOBILE OPTIMIZATION: Much larger touch target
    const isMobile = this.scene.sys.game.device.os.android || 
                     this.scene.sys.game.device.os.iOS ||
                     this.scene.sys.game.device.os.iPad ||
                     this.scene.sys.game.device.os.iPhone ||
                     ('ontouchstart' in window);
    
    const btnWidth = isMobile ? 120 : 100;
    const btnHeight = isMobile ? 48 : 36;
    
    const bg = this.scene.add.rectangle(0, 0, btnWidth, btnHeight, 0x4A5568, 0.8);
    bg.setStrokeStyle(2, 0x718096);
    this.skipButton.add(bg);
    
    const text = this.scene.add.text(0, 0, 'Skip', {
      fontSize: isMobile ? '14px' : '12px',
      fontFamily: 'Inter, sans-serif',
      color: '#A0AEC0'
    });
    text.setOrigin(0.5);
    this.skipButton.add(text);
    
    // MOBILE OPTIMIZATION: Enhanced interactivity
    bg.setInteractive({
      useHandCursor: true,
      hitArea: new Phaser.Geom.Rectangle(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains
    });
    
    bg.on('pointerover', () => {
      if (!isMobile) {
        bg.setFillStyle(0x718096, 0.9);
        text.setColor('#FFFFFF');
      }
    });
    
    bg.on('pointerout', () => {
      bg.setFillStyle(0x4A5568, 0.8);
      text.setColor('#A0AEC0');
    });
    
    // MOBILE OPTIMIZATION: Comprehensive touch handling for skip button
    bg.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      console.log('[TUTORIAL SKIP] Clicked');
      this.updateDebugText('✓ SKIP CLICKED');
      
      // Visual feedback
      bg.setScale(0.95);
      bg.setFillStyle(0x2D3748);
      
      // Haptic feedback
      if (isMobile && navigator.vibrate) {
        navigator.vibrate(20);
      }
      
      // Stop event propagation immediately
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      
      // Execute skip after brief delay for visual feedback
      this.scene.time.delayedCall(100, () => {
        console.log('[TUTORIAL SKIP] Executing skip');
        this.skip();
      });
      
      // Reset visual state
      this.scene.time.delayedCall(300, () => {
        bg.setScale(1);
        bg.setFillStyle(0x4A5568, 0.8);
      });
    });
    
    // MOBILE OPTIMIZATION: Ensure skip button is at high z-index
    this.skipButton.setDepth(2500);
    
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
  
  private createDebugOverlay(): void {
    // Debug overlay removed - Tutorial UI now handled by React
    // No longer needed since mobile buttons work via HTML overlay
  }
  
  private updateDebugText(message: string): void {
    // Debug text removed - no longer needed
    console.log('[TUTORIAL]', message);
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
    
    // Update debug text
    this.updateDebugText(`Tutorial: Step ${stepIndex + 1}/${this.steps.length} - ${step.title}`);
    
    // Emit event for React overlay (UI handled by React component)
    this.scene.events.emit('tutorial-step-changed', {
      step: stepIndex,
      title: step.title,
      message: step.message,
      isLastStep: stepIndex === this.steps.length - 1
    });
    
    console.log('[TUTORIAL] Step changed:', stepIndex, step.title);
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
    
    // MOBILE OPTIMIZATION: Ensure dialog box is at high z-index but below buttons
    this.dialogBox.setDepth(2000);
    
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
    
    // Back button (if not first step) - ADD DIRECTLY TO SCENE
    if (this.currentStep > 0) {
      const backBtn = this.createButton('← Back', (width/2 - 60), (height/2 + dialogY - buttonsY), () => {
        this.showStep(this.currentStep - 1);
      }, true);
      // Add to scene, not to dialog box
      this.scene.add.existing(backBtn);
      backBtn.setScrollFactor(0);
    }
    
    // Next/Done button - ADD DIRECTLY TO SCENE
    const isLastStep = this.currentStep === this.steps.length - 1;
    const nextBtn = this.createButton(
      isLastStep ? 'Start! 🚀' : 'Next →',
      (width/2 + (this.currentStep > 0 ? 60 : 0)),
      (height/2 + dialogY - buttonsY),
      () => {
        if (isLastStep) {
          this.complete();
        } else {
          this.showStep(this.currentStep + 1);
        }
      },
      false
    );
    // Add to scene, not to dialog box
    this.scene.add.existing(nextBtn);
    nextBtn.setScrollFactor(0);
    
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
    
    // MOBILE OPTIMIZATION: Much larger touch targets for mobile devices
    const isMobile = this.scene.sys.game.device.os.android || 
                     this.scene.sys.game.device.os.iOS ||
                     this.scene.sys.game.device.os.iPad ||
                     this.scene.sys.game.device.os.iPhone ||
                     ('ontouchstart' in window);
    
    const btnWidth = isMobile ? 200 : 110;  // MUCH wider for testing
    const btnHeight = isMobile ? 80 : 38;   // MUCH taller for testing
    
    const bg = this.scene.add.rectangle(
      0, 0, btnWidth, btnHeight,
      isSecondary ? 0x4A5568 : 0x48BB78,
      isSecondary ? 0.8 : 1
    );
    bg.setStrokeStyle(3, isSecondary ? 0xFF0000 : 0xFF0000); // RED stroke for visibility
    btn.add(bg);
    
    const label = this.scene.add.text(0, 0, text, {
      fontSize: isMobile ? '20px' : '13px',  // LARGER for testing
      fontFamily: 'Inter, sans-serif',
      fontStyle: 'bold',
      color: '#FFFFFF'
    });
    label.setOrigin(0.5);
    btn.add(label);
    
    // ULTRA SIMPLE: Make button interactive with absolute minimum config
    bg.setInteractive();
    
    // Log when button is created
    console.log('[BUTTON CREATED]', text, {
      position: { x, y },
      size: { width: btnWidth, height: btnHeight },
      depth: btn.depth,
      visible: bg.visible
    });
    
    // Debug: Add visual debug square behind button
    const debugSquare = this.scene.add.rectangle(0, 0, btnWidth + 10, btnHeight + 10, 0xFFFF00, 0.2);
    btn.add(debugSquare);
    
    // CRITICAL EVENT: pointerup
    bg.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      console.log('[BUTTON HIT] pointerup event fired!', text);
      this.updateDebugText(`HIT: ${text}`);
      
      // VISUAL FEEDBACK
      bg.setFillStyle(0xFF0000);
      
      // HAPTIC
      if (isMobile && navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // STOP PROPAGATION
      if (pointer.event) {
        pointer.event.preventDefault();
        pointer.event.stopPropagation();
      }
      
      // EXECUTE
      this.scene.time.delayedCall(100, () => {
        console.log('[BUTTON EXECUTE]', text);
        onClick();
      });
      
      // RESET
      this.scene.time.delayedCall(300, () => {
        bg.setFillStyle(isSecondary ? 0x4A5568 : 0x48BB78);
      });
    });
    
    // ALSO TRY pointerdown
    bg.on('pointerdown', () => {
      console.log('[BUTTON HIT] pointerdown event!', text);
    });
    
    btn.setDepth(3000);
    
    return btn;
  }
  
  private skip(): void {
    console.log('[TUTORIAL] skip() called');
    this.complete();
  }
  
  private complete(): void {
    console.log('[TUTORIAL] complete() called');
    this.isActive = false;
    this.isComplete = true;
    
    // Emit completion event for React overlay
    this.scene.events.emit('tutorial-completed');
    
    // Remove debug text
    if (this.debugText) {
      this.debugText.destroy();
      this.debugText = undefined;
    }
    
    // Remove keyboard listeners to prevent interference
    this.scene.input.keyboard?.off('keydown-RIGHT');
    this.scene.input.keyboard?.off('keydown-SPACE');
    this.scene.input.keyboard?.off('keydown-ESC');
    
    // Save completion status
    localStorage.setItem(this.STORAGE_KEY, 'true');
    
    // Destroy container immediately (no animation) to avoid blocking touch
    this.container.destroy();
    
    console.log('[TUTORIAL] Tutorial cleanup complete - touch events should work now');
    
    this.onComplete?.();
  }
  
  public destroy(): void {
    this.container.destroy();
  }
  
  public isRunning(): boolean {
    return this.isActive;
  }
}
