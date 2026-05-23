import Phaser from 'phaser';
import { StationConfig } from '../config/constants';

interface ZonePreviewData {
  description: string;
  estimatedTime: string;
  difficulty: 'gentle' | 'moderate' | 'intensive';
  status: 'not-started' | 'in-progress' | 'completed';
}

// Station metadata for previews
const STATION_METADATA: { [key: string]: ZonePreviewData } = {
  therapy: {
    description: 'Explore various therapeutic approaches including art therapy, music therapy, and creative expression.',
    estimatedTime: '15-30 min',
    difficulty: 'gentle',
    status: 'not-started'
  },
  community: {
    description: 'Connect with others on similar journeys. Share stories and find support in our community.',
    estimatedTime: '10-20 min',
    difficulty: 'moderate',
    status: 'not-started'
  },
  tools: {
    description: 'Practical healing tools and exercises to help process emotions and find peace.',
    estimatedTime: '5-15 min',
    difficulty: 'gentle',
    status: 'not-started'
  },
  resources: {
    description: 'Educational resources about grief, loss, and the healing process.',
    estimatedTime: '10-20 min',
    difficulty: 'gentle',
    status: 'not-started'
  },
  meditation: {
    description: 'Guided meditations and mindfulness exercises for inner calm and reflection.',
    estimatedTime: '10-20 min',
    difficulty: 'gentle',
    status: 'not-started'
  }
};

export class ZonePreviewCard {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private shadowBg: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private descriptionText: Phaser.GameObjects.Text;
  private timeText: Phaser.GameObjects.Text;
  private difficultyIndicator: Phaser.GameObjects.Container;
  private statusBadge: Phaser.GameObjects.Container;
  private iconDisplay: Phaser.GameObjects.Text;
  private isVisible: boolean = false;
  private currentStation?: StationConfig;
  
  // Card dimensions
  private cardWidth = 280;
  private cardHeight = 180;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Create main container (hidden initially)
    this.container = scene.add.container(0, 0);
    this.container.setDepth(500);
    this.container.setAlpha(0);
    this.container.setVisible(false);
    
    this.createCard();
  }
  
  private createCard(): void {
    // Shadow
    this.shadowBg = this.scene.add.rectangle(
      4, 4,
      this.cardWidth,
      this.cardHeight,
      0x000000,
      0.15
    );
    this.shadowBg.setOrigin(0.5, 1);
    this.container.add(this.shadowBg);
    
    // Main background
    this.background = this.scene.add.rectangle(
      0, 0,
      this.cardWidth,
      this.cardHeight,
      0xffffff,
      0.98
    );
    this.background.setOrigin(0.5, 1);
    this.background.setStrokeStyle(2, 0xe2e8f0, 1);
    this.container.add(this.background);
    
    // Top accent bar
    const accentBar = this.scene.add.rectangle(
      0, -this.cardHeight,
      this.cardWidth,
      6,
      0x0ea5e9, // sky-500
      1
    );
    accentBar.setOrigin(0.5, 0);
    this.container.add(accentBar);
    
    // Icon background circle
    const iconBg = this.scene.add.circle(
      -this.cardWidth / 2 + 35,
      -this.cardHeight + 45,
      28,
      0xf0f9ff, // sky-50
      1
    );
    iconBg.setStrokeStyle(2, 0xbae6fd, 1);
    this.container.add(iconBg);
    
    // Icon
    this.iconDisplay = this.scene.add.text(
      -this.cardWidth / 2 + 35,
      -this.cardHeight + 45,
      '🎨',
      { fontSize: '28px' }
    );
    this.iconDisplay.setOrigin(0.5);
    this.container.add(this.iconDisplay);
    
    // Title
    this.titleText = this.scene.add.text(
      -this.cardWidth / 2 + 75,
      -this.cardHeight + 25,
      'Station Name',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#1e293b' // slate-800
      }
    );
    this.titleText.setOrigin(0, 0);
    this.container.add(this.titleText);
    
    // Status badge
    this.statusBadge = this.createStatusBadge('not-started');
    this.statusBadge.setPosition(this.cardWidth / 2 - 55, -this.cardHeight + 35);
    this.container.add(this.statusBadge);
    
    // Divider line
    const divider = this.scene.add.rectangle(
      0, -this.cardHeight + 75,
      this.cardWidth - 30,
      1,
      0xe2e8f0, // slate-200
      1
    );
    this.container.add(divider);
    
    // Description
    this.descriptionText = this.scene.add.text(
      -this.cardWidth / 2 + 20,
      -this.cardHeight + 85,
      'Description text goes here...',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#64748b', // slate-500
        wordWrap: { width: this.cardWidth - 40 },
        lineSpacing: 4
      }
    );
    this.descriptionText.setOrigin(0, 0);
    this.container.add(this.descriptionText);
    
    // Bottom info section
    const bottomY = -25;
    
    // Time icon and text
    const clockIcon = this.scene.add.text(
      -this.cardWidth / 2 + 20,
      bottomY,
      '⏱️',
      { fontSize: '14px' }
    );
    this.container.add(clockIcon);
    
    this.timeText = this.scene.add.text(
      -this.cardWidth / 2 + 42,
      bottomY,
      '10-15 min',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#64748b'
      }
    );
    this.timeText.setOrigin(0, 0.2);
    this.container.add(this.timeText);
    
    // Difficulty indicator
    this.difficultyIndicator = this.createDifficultyIndicator('gentle');
    this.difficultyIndicator.setPosition(this.cardWidth / 2 - 90, bottomY);
    this.container.add(this.difficultyIndicator);
    
    // "Press to enter" hint
    const enterHint = this.scene.add.text(
      0,
      -8,
      '↑ Press to enter',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#94a3b8', // slate-400
        fontStyle: 'italic'
      }
    );
    enterHint.setOrigin(0.5, 1);
    this.container.add(enterHint);
  }
  
  private createStatusBadge(status: 'not-started' | 'in-progress' | 'completed'): Phaser.GameObjects.Container {
    const badgeContainer = this.scene.add.container(0, 0);
    
    const statusConfig = {
      'not-started': { color: 0xf1f5f9, textColor: '#64748b', text: 'New', borderColor: 0xe2e8f0 },
      'in-progress': { color: 0xfef3c7, textColor: '#d97706', text: 'In Progress', borderColor: 0xfbbf24 },
      'completed': { color: 0xdcfce7, textColor: '#16a34a', text: 'Completed ✓', borderColor: 0x22c55e }
    };
    
    const config = statusConfig[status];
    
    // Badge background
    const badgeBg = this.scene.add.rectangle(
      0, 0,
      status === 'completed' ? 85 : status === 'in-progress' ? 75 : 45,
      22,
      config.color,
      1
    );
    badgeBg.setStrokeStyle(1, config.borderColor, 1);
    badgeContainer.add(badgeBg);
    
    // Badge text
    const badgeText = this.scene.add.text(
      0, 0,
      config.text,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: config.textColor
      }
    );
    badgeText.setOrigin(0.5);
    badgeContainer.add(badgeText);
    
    return badgeContainer;
  }
  
  private createDifficultyIndicator(difficulty: 'gentle' | 'moderate' | 'intensive'): Phaser.GameObjects.Container {
    const indicatorContainer = this.scene.add.container(0, 0);
    
    const difficultyConfig = {
      'gentle': { dots: 1, color: 0x22c55e, label: 'Gentle' },
      'moderate': { dots: 2, color: 0xf59e0b, label: 'Moderate' },
      'intensive': { dots: 3, color: 0xef4444, label: 'Intensive' }
    };
    
    const config = difficultyConfig[difficulty];
    
    // Label
    const label = this.scene.add.text(
      0, 0,
      config.label,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#64748b'
      }
    );
    label.setOrigin(0, 0.3);
    indicatorContainer.add(label);
    
    // Dots
    for (let i = 0; i < 3; i++) {
      const dot = this.scene.add.circle(
        label.width + 10 + i * 10,
        0,
        4,
        i < config.dots ? config.color : 0xe2e8f0,
        1
      );
      indicatorContainer.add(dot);
    }
    
    return indicatorContainer;
  }
  
  public show(station: StationConfig, x: number, y: number): void {
    if (this.isVisible && this.currentStation?.id === station.id) return;
    
    this.currentStation = station;
    const metadata = STATION_METADATA[station.id] || {
      description: 'Explore this healing space.',
      estimatedTime: '10-15 min',
      difficulty: 'gentle' as const,
      status: 'not-started' as const
    };
    
    // Update content
    this.iconDisplay.setText(station.icon);
    this.titleText.setText(station.name.replace('\n', ' '));
    this.descriptionText.setText(metadata.description);
    this.timeText.setText(metadata.estimatedTime);
    
    // Update status badge
    this.statusBadge.destroy();
    this.statusBadge = this.createStatusBadge(metadata.status);
    this.statusBadge.setPosition(this.cardWidth / 2 - 55, -this.cardHeight + 35);
    this.container.add(this.statusBadge);
    
    // Update difficulty
    this.difficultyIndicator.destroy();
    this.difficultyIndicator = this.createDifficultyIndicator(metadata.difficulty);
    this.difficultyIndicator.setPosition(this.cardWidth / 2 - 90, -25);
    this.container.add(this.difficultyIndicator);
    
    // Position card above the station sign
    this.container.setPosition(x, y - 60);
    
    // Animate in
    this.container.setVisible(true);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      y: y - 80, // Float up slightly
      duration: 200,
      ease: 'Power2'
    });
    
    this.isVisible = true;
  }
  
  public hide(): void {
    if (!this.isVisible) return;
    
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      y: this.container.y + 20,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        this.container.setVisible(false);
        this.isVisible = false;
        this.currentStation = undefined;
      }
    });
  }
  
  public updateStatus(stationId: string, status: 'not-started' | 'in-progress' | 'completed'): void {
    if (STATION_METADATA[stationId]) {
      STATION_METADATA[stationId].status = status;
    }
    
    // If showing this station, refresh
    if (this.currentStation?.id === stationId && this.isVisible) {
      this.statusBadge.destroy();
      this.statusBadge = this.createStatusBadge(status);
      this.statusBadge.setPosition(this.cardWidth / 2 - 55, -this.cardHeight + 35);
      this.container.add(this.statusBadge);
    }
  }
  
  public getStatus(stationId: string): 'not-started' | 'in-progress' | 'completed' {
    return STATION_METADATA[stationId]?.status || 'not-started';
  }
  
  public destroy(): void {
    this.container.destroy();
  }
}
