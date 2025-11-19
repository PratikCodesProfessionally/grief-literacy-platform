import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { InteractionZone } from '../entities/InteractionZone';
import { NPC } from '../entities/NPC';
import { Butterfly } from '../entities/Butterfly';
import { Tree } from '../entities/Tree';
import { Fountain } from '../entities/InteractiveObjects';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { MobileControls } from '../ui/MobileControls';
import { GAME_CONSTANTS, STATION_POSITIONS, NPC_CONFIGS, BENCH_QUOTES } from '../config/constants';

export class HealingWorldScene extends Phaser.Scene {
  private player!: Player;
  private parallaxBg!: ParallaxBackground;
  private interactionZones: InteractionZone[] = [];
  private npcs: NPC[] = [];
  private butterflies: Butterfly[] = [];
  private trees: Tree[] = [];
  private fountains: Fountain[] = [];
  private mobileControls?: MobileControls;
  private currentPrompt?: Phaser.GameObjects.Container;
  private currentNPCDialogue?: Phaser.GameObjects.Container;
  private currentTreeQuote?: Phaser.GameObjects.Container;
  private isMobile: boolean = false;
  private isTablet: boolean = false;
  private helpText?: Phaser.GameObjects.Text;
  private scaleRatio: number = 1;
  
  // Navigation callback (set from React)
  public onNavigate?: (route: string) => void;
  
  constructor() {
    super({ key: 'HealingWorldScene' });
  }
  
  create(): void {
    // Calculate scale ratio for responsive design
    this.calculateScaleRatio();
    
    // Handle resize events
    this.scale.on('resize', this.handleResize, this);
    
    // Detect mobile and tablet
    const userAgent = navigator.userAgent.toLowerCase();
    this.isTablet = /ipad|android(?!.*mobile)|tablet/.test(userAgent) ||
                    (window.innerWidth >= 768 && window.innerWidth <= 1024);
    
    this.isMobile = this.sys.game.device.os.android || 
                    this.sys.game.device.os.iOS ||
                    this.sys.game.device.os.iPad ||
                    this.sys.game.device.os.iPhone ||
                    ('ontouchstart' in window);
    
    // Set world bounds with scaled dimensions
    const worldWidth = GAME_CONSTANTS.WORLD_WIDTH;
    const worldHeight = this.scale.height;
    
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    
    // Create world elements
    this.createParallaxBackground();
    this.createGround();
    this.createInteractiveObjects();
    this.createStations();
    this.createNPCs();
    this.createButterflies();
    this.createPlayer();
    this.setupCamera();
    this.createUI();
    
    // Mobile controls
    if (this.isMobile) {
      this.createMobileControls();
    }
    
    // Add ambient effects
    this.addAmbientEffects();
    
    // Fade in
    this.cameras.main.fadeIn(800, 224, 242, 254); // sky-100
  }
  
  private createParallaxBackground(): void {
    this.parallaxBg = new ParallaxBackground(this, [
      { key: 'sky', scrollFactor: GAME_CONSTANTS.PARALLAX_SKY, color: 0xe0f2fe }, // sky-100
      { key: 'mountains', scrollFactor: GAME_CONSTANTS.PARALLAX_MOUNTAINS, color: 0xbae6fd }, // sky-200
      { key: 'midground', scrollFactor: GAME_CONSTANTS.PARALLAX_MIDGROUND, color: 0x7dd3fc }, // sky-300
      { key: 'foreground', scrollFactor: GAME_CONSTANTS.PARALLAX_FOREGROUND, color: 0x38bdf8 } // sky-400
    ]);
  }
  
  private createGround(): void {
    // Use responsive height
    const groundY = this.scale.height - 180;
    
    // Create simple ground
    const ground = this.add.rectangle(
      GAME_CONSTANTS.WORLD_WIDTH / 2,
      groundY,
      GAME_CONSTANTS.WORLD_WIDTH,
      180,
      0x059669 // emerald-600 (grass)
    );
    ground.setOrigin(0.5, 0);
    ground.setDepth(2);
    ground.setData('isGround', true);
    
    // Add grass texture (darker stripes)
    for (let i = 0; i < 50; i++) {
      const grassStripe = this.add.rectangle(
        (GAME_CONSTANTS.WORLD_WIDTH / 50) * i,
        groundY + (i % 2) * 5,
        GAME_CONSTANTS.WORLD_WIDTH / 50,
        15,
        0x047857, // emerald-700
        0.3
      );
      grassStripe.setOrigin(0, 0);
      grassStripe.setDepth(2);
    }
    
    // Add path
    const path = this.add.rectangle(
      GAME_CONSTANTS.WORLD_WIDTH / 2,
      groundY + 20,
      GAME_CONSTANTS.WORLD_WIDTH,
      60,
      0xfbbf24 // amber-400 (path)
    );
    path.setOrigin(0.5, 0);
    path.setDepth(3);
    path.setAlpha(0.6);
    
    // Add path texture (dashed lines)
    for (let i = 0; i < 100; i++) {
      const dash = this.add.rectangle(
        (GAME_CONSTANTS.WORLD_WIDTH / 100) * i,
        groundY + 50,
        40,
        2,
        0xf59e0b, // amber-500
        0.4
      );
      dash.setDepth(3);
    }
  }
  
  private createStations(): void {
    STATION_POSITIONS.forEach((station, index) => {
      const groundY = this.scale.height - 180;
      const signX = station.x;
      const signY = groundY - 80; // Position sign above ground
      
      // Create wooden sign post
      const post = this.add.rectangle(
        signX,
        groundY - 40,
        12,
        80,
        0x92400e // brown-800 (dark wood)
      );
      post.setDepth(5);
      
      // Create sign board
      const signBoard = this.add.rectangle(
        signX,
        signY,
        160,
        100,
        0xfef3c7 // amber-100 (light wood)
      );
      signBoard.setStrokeStyle(3, 0x92400e, 1); // brown border
      signBoard.setDepth(6);
      
      // Add decorative corners
      const cornerSize = 8;
      const corners = [
        [signX - 75, signY - 45], // top-left
        [signX + 75, signY - 45], // top-right
        [signX - 75, signY + 45], // bottom-left
        [signX + 75, signY + 45]  // bottom-right
      ];
      
      corners.forEach(([x, y]) => {
        const corner = this.add.circle(x, y, cornerSize / 2, 0x92400e);
        corner.setDepth(7);
      });
      
      // Add icon/emoji
      const icon = this.add.text(
        signX,
        signY - 25,
        station.icon,
        {
          fontFamily: 'Arial',
          fontSize: '32px'
        }
      );
      icon.setOrigin(0.5);
      icon.setDepth(8);
      
      // Add station name on sign
      const nameText = this.add.text(
        signX,
        signY + 15,
        station.name,
        {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#78350f', // amber-900
          align: 'center',
          fontStyle: 'bold'
        }
      );
      nameText.setOrigin(0.5);
      nameText.setDepth(8);
      
      // Create interaction zone around sign
      const zone = new InteractionZone(
        this,
        signX,
        signY,
        200,
        150,
        station.id,
        station.name,
        station.color,
        () => this.handleStationInteraction(station.route)
      );
      
      this.interactionZones.push(zone);
      
      // Add subtle sway effect to sign
      this.tweens.add({
        targets: [signBoard, icon, nameText],
        rotation: { from: -0.02, to: 0.02 },
        duration: 2000 + (index * 200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }
  
  private createPlayer(): void {
    const groundY = this.scale.height - 180;
    const playerY = groundY - 25; // Position player on ground (half height of ~50px)
    
    this.player = new Player(
      this,
      GAME_CONSTANTS.PLAYER_START_X,
      playerY
    );
    this.player.setDepth(50);
    
    // Add player name/label
    const playerLabel = this.add.text(
      0,
      -60,
      'You',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#6366f1',
        padding: { x: 8, y: 4 }
      }
    );
    playerLabel.setOrigin(0.5);
    playerLabel.setDepth(51);
    
    // Follow player
    this.events.on('update', () => {
      playerLabel.setPosition(this.player.x, this.player.y - 60);
    });
  }
  
  private setupCamera(): void {
    const camera = this.cameras.main;
    
    // Follow player smoothly
    camera.startFollow(this.player, true, 
      GAME_CONSTANTS.CAMERA_LERP, 
      GAME_CONSTANTS.CAMERA_LERP
    );
    
    // Set camera bounds
    camera.setBounds(
      0, 
      0, 
      GAME_CONSTANTS.WORLD_WIDTH, 
      GAME_CONSTANTS.WORLD_HEIGHT
    );
    
    // Set deadzone
    camera.setDeadzone(
      GAME_CONSTANTS.CAMERA_DEADZONE_WIDTH,
      GAME_CONSTANTS.CAMERA_DEADZONE_HEIGHT
    );
  }
  
  private createUI(): void {
    // Title
    const title = this.add.text(
      this.scale.width / 2,
      40,
      'Healing Journey',
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#1e293b',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 6
      }
    );
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(100);
    
    // Help text
    this.helpText = this.add.text(
      this.scale.width / 2,
      this.scale.height - 30,
      this.isMobile ? 'Use joystick to move, press ↑ button to enter stations' : 'Use Arrow Keys or WASD to move • Press SPACE or ↑ to enter stations',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#475569',
        backgroundColor: '#f1f5f9',
        padding: { x: 16, y: 8 }
      }
    );
    this.helpText.setOrigin(0.5);
    this.helpText.setAlpha(0.9);
    this.helpText.setScrollFactor(0);
    this.helpText.setDepth(99);
  }
  
  private createMobileControls(): void {
    this.mobileControls = new MobileControls(this);
    this.mobileControls.show();
  }
  
  private addAmbientEffects(): void {
    // Add floating particles
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      const x = Phaser.Math.Between(0, GAME_CONSTANTS.WORLD_WIDTH);
      const y = Phaser.Math.Between(100, 600);
      
      const particle = this.add.circle(x, y, 3, 0xffffff, 0.6);
      particle.setDepth(1);
      
      this.tweens.add({
        targets: particle,
        y: y + Phaser.Math.Between(-50, 50),
        x: x + Phaser.Math.Between(-30, 30),
        alpha: { from: 0.3, to: 0.8 },
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }
  
  private createInteractiveObjects(): void {
    const groundY = this.scale.height - 180;
    
    // Place trees with quotes
    const treePositions = [
      { x: 1800, quote: BENCH_QUOTES[0], size: 'large' as const },
      { x: 3800, quote: BENCH_QUOTES[1], size: 'medium' as const },
      { x: 6500, quote: BENCH_QUOTES[2], size: 'large' as const },
      { x: 9200, quote: BENCH_QUOTES[3], size: 'medium' as const },
      { x: 11800, quote: BENCH_QUOTES[4], size: 'large' as const },
      { x: 13000, quote: BENCH_QUOTES[5], size: 'medium' as const }
    ];
    
    treePositions.forEach(({ x, quote, size }) => {
      const tree = new Tree(this, x, groundY - 40, quote, size);
      this.trees.push(tree);
    });
    
    // Place fountains
    const fountainPositions = [2500, 7800, 12800];
    fountainPositions.forEach(x => {
      const fountain = new Fountain(this, x, groundY - 80);
      this.fountains.push(fountain);
    });
  }
  
  private createNPCs(): void {
    NPC_CONFIGS.forEach(config => {
      const npc = new NPC(this, config);
      this.npcs.push(npc);
    });
  }
  
  private createButterflies(): void {
    const groundY = this.scale.height - 180;
    const butterflyColors = [0xff6b9d, 0xfbbf24, 0x60a5fa, 0xa78bfa, 0x34d399];
    
    // Distribute butterflies across the world
    for (let i = 0; i < 25; i++) {
      const x = Phaser.Math.Between(500, GAME_CONSTANTS.WORLD_WIDTH - 500);
      const y = Phaser.Math.Between(groundY - 400, groundY - 100);
      const color = Phaser.Utils.Array.GetRandom(butterflyColors);
      
      const butterfly = new Butterfly(this, x, y, color);
      this.butterflies.push(butterfly);
    }
  }
  
  update(time: number, delta: number): void {
    // Update player
    this.player.update(delta);
    
    // Update parallax
    this.parallaxBg.update(this.cameras.main);
    
    // Update NPCs
    this.npcs.forEach(npc => npc.update(delta));
    
    // Update butterflies
    this.butterflies.forEach(butterfly => butterfly.update(delta));
    
    // Check interactions
    this.checkInteractions();
    this.checkNPCInteractions();
    this.checkButterflyCollections();
    this.checkTreeInteractions();
    
    // Update mobile controls
    if (this.mobileControls) {
      this.mobileControls.update(this.player);
    }
  }
  
  private checkInteractions(): void {
    let nearStation: InteractionZone | null = null;
    
    // Find nearest station in range
    for (const zone of this.interactionZones) {
      const inRange = zone.isPlayerInRange(this.player);
      zone.highlight(inRange);
      
      if (inRange) {
        nearStation = zone;
      }
    }
    
    // Show/hide prompt
    if (nearStation && !this.currentPrompt) {
      console.log('[SCENE] 📍 Showing prompt for:', nearStation.displayName);
      this.showInteractionPrompt(nearStation);
    } else if (!nearStation && this.currentPrompt) {
      this.hideInteractionPrompt();
    }
    
    // Handle interaction - CRITICAL: Check press status FIRST
    if (nearStation) {
      const interactPressed = this.player.getInteractPressed();
      if (interactPressed) {
        console.log('[SCENE] 🚀🚀🚀 TRIGGERING INTERACTION FOR:', nearStation.displayName);
        console.log('[SCENE] Zone position:', nearStation.x, nearStation.y);
        console.log('[SCENE] Player position:', this.player.x, this.player.y);
        nearStation.interact();
      }
    }
  }
  
  private showInteractionPrompt(zone: InteractionZone): void {
    const promptContainer = this.add.container(
      zone.x,
      zone.y + GAME_CONSTANTS.PROMPT_Y_OFFSET
    );
    promptContainer.setDepth(200);
    
    // Background
    const bg = this.add.rectangle(0, 0, 320, 70, 0x1e293b, 0.9);
    bg.setStrokeStyle(3, 0x0ea5e9, 1); // sky-500
    
    // Text
    const text = this.add.text(0, 0, `Press ${this.isMobile ? '↑' : 'SPACE'} to enter`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);
    
    promptContainer.add([bg, text]);
    
    // Fade in
    promptContainer.setAlpha(0);
    this.tweens.add({
      targets: promptContainer,
      alpha: 1,
      y: zone.y + GAME_CONSTANTS.PROMPT_Y_OFFSET - 10,
      duration: GAME_CONSTANTS.PROMPT_FADE_DURATION,
      ease: 'Back.easeOut'
    });
    
    // Pulse effect
    this.tweens.add({
      targets: promptContainer,
      scale: { from: 1, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.currentPrompt = promptContainer;
  }
  
  private hideInteractionPrompt(): void {
    if (this.currentPrompt) {
      this.tweens.add({
        targets: this.currentPrompt,
        alpha: 0,
        scale: 0.9,
        duration: GAME_CONSTANTS.PROMPT_FADE_DURATION,
        ease: 'Power2',
        onComplete: () => {
          this.currentPrompt?.destroy();
          this.currentPrompt = undefined;
        }
      });
    }
  }
  
  private handleStationInteraction(route: string): void {
    // Fade out camera
    this.cameras.main.fadeOut(GAME_CONSTANTS.SCENE_TRANSITION_DURATION, 224, 242, 254);
    
    // Navigate after fade
    this.time.delayedCall(GAME_CONSTANTS.SCENE_TRANSITION_DURATION, () => {
      if (this.onNavigate) {
        this.onNavigate(route);
      }
    });
  }
  
  private checkNPCInteractions(): void {
    const interactPressed = this.player.getInteractPressed();
    
    for (const npc of this.npcs) {
      if (npc.isPlayerNearby(this.player.x, this.player.y)) {
        if (interactPressed && !this.currentNPCDialogue) {
          console.log('Interacting with NPC:', npc.getName()); // Debug
          this.showNPCDialogue(npc);
        }
        return;
      }
    }
  }
  
  private showNPCDialogue(npc: NPC): void {
    const dialogue = npc.getDialogue();
    
    const dialogueContainer = this.add.container(npc.x, npc.y - 100);
    dialogueContainer.setDepth(250);
    
    // Background
    const bg = this.add.rectangle(0, 0, 350, 80, 0xf1f5f9, 0.98);
    bg.setStrokeStyle(3, 0xf472b6);
    
    // NPC name
    const nameText = this.add.text(0, -20, npc.getName(), {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#f472b6',
      fontStyle: 'bold'
    });
    nameText.setOrigin(0.5);
    
    // Dialogue text
    const dialogueText = this.add.text(0, 10, dialogue, {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#1e293b',
      align: 'center',
      wordWrap: { width: 320 }
    });
    dialogueText.setOrigin(0.5);
    
    dialogueContainer.add([bg, nameText, dialogueText]);
    
    // Fade in
    dialogueContainer.setAlpha(0);
    this.tweens.add({
      targets: dialogueContainer,
      alpha: 1,
      y: npc.y - 110,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    this.currentNPCDialogue = dialogueContainer;
    
    // Auto-hide after 4 seconds
    this.time.delayedCall(4000, () => {
      if (this.currentNPCDialogue === dialogueContainer) {
        this.hideNPCDialogue();
      }
    });
  }
  
  private hideNPCDialogue(): void {
    if (!this.currentNPCDialogue) return;
    
    this.tweens.add({
      targets: this.currentNPCDialogue,
      alpha: 0,
      y: this.currentNPCDialogue.y - 10,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.currentNPCDialogue?.destroy();
        this.currentNPCDialogue = undefined;
      }
    });
  }
  
  private checkButterflyCollections(): void {
    for (const butterfly of this.butterflies) {
      if (butterfly.isPlayerNearby(this.player.x, this.player.y)) {
        butterfly.collect();
        this.showFloatingMessage('Beautiful! 🦋', this.player.x, this.player.y - 80, 0xff6b9d);
        break; // Only collect one at a time
      }
    }
  }
  
  private checkTreeInteractions(): void {
    const interactPressed = this.player.getInteractPressed();
    
    for (const tree of this.trees) {
      if (tree.isPlayerNearby(this.player.x, this.player.y)) {
        if (interactPressed && !this.currentTreeQuote) {
          console.log('Interacting with tree'); // Debug
          this.currentTreeQuote = tree.showQuote(this);
          
          // Auto-hide after 8 seconds
          this.time.delayedCall(8000, () => {
            if (this.currentTreeQuote) {
              tree.hideQuote(this.currentTreeQuote, this);
              this.currentTreeQuote = undefined;
            }
          });
        }
        return;
      }
    }
  }
  
  private showFloatingMessage(text: string, x: number, y: number, color: number): void {
    const message = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: `#${color.toString(16).padStart(6, '0')}`,
      padding: { x: 12, y: 6 },
      align: 'center'
    });
    message.setOrigin(0.5);
    message.setDepth(300);
    
    this.tweens.add({
      targets: message,
      y: y - 50,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => message.destroy()
    });
  }
  
  public cleanup(): void {
    // Clean up when component unmounts
    if (this.parallaxBg) {
      this.parallaxBg.destroy();
    }
    
    this.interactionZones.forEach(zone => zone.destroy());
    this.interactionZones = [];
    
    this.npcs.forEach(npc => npc.destroy());
    this.npcs = [];
    
    this.butterflies.forEach(butterfly => butterfly.destroy());
    this.butterflies = [];
    
    this.trees.forEach(tree => tree.destroy());
    this.trees = [];
    
    this.fountains.forEach(fountain => {
      fountain.cleanup();
      fountain.destroy();
    });
    this.fountains = [];
    
    if (this.mobileControls) {
      this.mobileControls.destroy();
      this.mobileControls = undefined;
    }
    
    // Remove resize listener
    this.scale.off('resize', this.handleResize, this);
  }
  
  private calculateScaleRatio(): void {
    // Calculate scale ratio based on screen size for responsive design
    const baseHeight = 1080;
    this.scaleRatio = this.scale.height / baseHeight;
  }
  
  private handleResize(gameSize: Phaser.Structs.Size): void {
    // Recalculate scale ratio
    this.calculateScaleRatio();
    
    // Update camera
    const width = gameSize.width;
    const height = gameSize.height;
    
    this.cameras.main.setViewport(0, 0, width, height);
    
    // Update world bounds
    this.physics.world.setBounds(0, 0, GAME_CONSTANTS.WORLD_WIDTH, height);
    
    // Reposition ground if needed
    const ground = this.children.getAll().find(child => 
      child instanceof Phaser.GameObjects.Rectangle && child.fillColor === 0x059669
    );
    if (ground) {
      (ground as Phaser.GameObjects.Rectangle).setY(height - 180);
    }
    
    // Update mobile controls position if they exist
    if (this.mobileControls && this.isMobile) {
      this.mobileControls.destroy();
      this.createMobileControls();
    }
  }
}
