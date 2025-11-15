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
    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      this.x,
      this.y
    );
    
    return distance < GAME_CONSTANTS.INTERACTION_RANGE;
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
  }
}
