import Phaser from 'phaser';

export interface NPCConfig {
  id: string;
  name: string;
  x: number;
  y: number;
  color: number;
  emoji: string;
  dialogue: string[];
  moveRange?: number;
  speed?: number;
}

export class NPC extends Phaser.GameObjects.Container {
  private npcBody: Phaser.GameObjects.Arc;
  private emoji: Phaser.GameObjects.Text;
  private nameLabel: Phaser.GameObjects.Text;
  private config: NPCConfig;
  private startX: number;
  private moveRange: number;
  private speed: number;
  private direction: number = 1;
  private currentDialogueIndex: number = 0;

  constructor(scene: Phaser.Scene, config: NPCConfig) {
    super(scene, config.x, config.y);
    
    this.config = config;
    this.startX = config.x;
    this.moveRange = config.moveRange || 300;
    this.speed = config.speed || 30;

    // Create NPC body (circle)
    this.npcBody = scene.add.circle(0, 0, 25, config.color);
    this.npcBody.setStrokeStyle(3, 0xffffff);
    this.add(this.npcBody);

    // Add emoji face
    this.emoji = scene.add.text(0, 0, config.emoji, {
      fontSize: '28px',
      fontFamily: 'Arial'
    });
    this.emoji.setOrigin(0.5);
    this.add(this.emoji);

    // Name label above
    this.nameLabel = scene.add.text(0, -40, config.name, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 }
    });
    this.nameLabel.setOrigin(0.5);
    this.add(this.nameLabel);

    scene.add.existing(this);

    // Add gentle bobbing animation
    scene.tweens.add({
      targets: this,
      y: config.y - 5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Add subtle pulse to body
    scene.tweens.add({
      targets: this.npcBody,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public update(delta: number): void {
    // Move NPC back and forth
    if (this.moveRange > 0) {
      this.x += this.speed * this.direction * (delta / 1000);

      // Check boundaries
      if (this.x > this.startX + this.moveRange) {
        this.x = this.startX + this.moveRange;
        this.direction = -1;
        this.flipEmoji();
      } else if (this.x < this.startX - this.moveRange) {
        this.x = this.startX - this.moveRange;
        this.direction = 1;
        this.flipEmoji();
      }
    }
  }

  private flipEmoji(): void {
    // Flip emoji when changing direction
    this.emoji.setScale(this.direction, 1);
  }

  public getDialogue(): string {
    const dialogue = this.config.dialogue[this.currentDialogueIndex];
    this.currentDialogueIndex = (this.currentDialogueIndex + 1) % this.config.dialogue.length;
    return dialogue;
  }

  public getName(): string {
    return this.config.name;
  }

  public getId(): string {
    return this.config.id;
  }

  public isPlayerNearby(playerX: number, playerY: number, range: number = 100): boolean {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    return distance < range;
  }
}
