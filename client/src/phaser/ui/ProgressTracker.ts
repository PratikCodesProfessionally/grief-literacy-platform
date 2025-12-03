import Phaser from 'phaser';
import { STATION_POSITIONS } from '../config/constants';

interface StationProgress {
  stationId: string;
  visited: boolean;
  completed: boolean;
  activitiesCompleted: number;
  totalActivities: number;
  lastVisited?: number; // timestamp
}

interface JourneyMilestone {
  id: string;
  title: string;
  description: string;
  requiredStations: string[];
  achieved: boolean;
  achievedAt?: number;
}

/**
 * ProgressTracker - Visual progress tracking for the healing journey
 * 
 * Features:
 * - Overall progress bar showing journey completion
 * - Station-specific progress indicators
 * - Journey path visualization connecting visited stations
 * - Milestone badges and achievements
 * - Persistent progress saved to localStorage
 */
export class ProgressTracker {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  
  // Progress data
  private stationProgress: Map<string, StationProgress> = new Map();
  private milestones: JourneyMilestone[] = [];
  
  // UI Elements
  private progressBar?: Phaser.GameObjects.Container;
  private progressFill?: Phaser.GameObjects.Rectangle;
  private progressText?: Phaser.GameObjects.Text;
  private pathGraphics?: Phaser.GameObjects.Graphics;
  private stationMarkers: Map<string, Phaser.GameObjects.Container> = new Map();
  private milestonePopup?: Phaser.GameObjects.Container;
  
  // Configuration
  private readonly STORAGE_KEY = 'grief_journey_progress';
  private readonly BAR_WIDTH = 200;
  private readonly BAR_HEIGHT = 12;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(950); // Below minimap but above world
    this.container.setScrollFactor(0);
    
    // Initialize milestones
    this.initializeMilestones();
    
    // Load saved progress
    this.loadProgress();
    
    // Create UI
    this.createProgressBar();
    this.createJourneyPath();
    this.createStationMarkers();
    
    // Handle resize
    this.scene.scale.on('resize', this.handleResize, this);
    this.handleResize();
  }
  
  private initializeMilestones(): void {
    this.milestones = [
      {
        id: 'first_steps',
        title: 'First Steps',
        description: 'You have begun your journey',
        requiredStations: [],
        achieved: false
      },
      {
        id: 'explorer',
        title: 'Explorer',
        description: 'Visit 3 different stations',
        requiredStations: ['any-3'],
        achieved: false
      },
      {
        id: 'creative_soul',
        title: 'Creative Soul',
        description: 'Complete an activity in the Art Therapy area',
        requiredStations: ['therapy'],
        achieved: false
      },
      {
        id: 'community_member',
        title: 'Community Member',
        description: 'Connect with the community',
        requiredStations: ['community'],
        achieved: false
      },
      {
        id: 'mindful_one',
        title: 'Mindful One',
        description: 'Practice meditation',
        requiredStations: ['meditation'],
        achieved: false
      },
      {
        id: 'complete_journey',
        title: 'Complete Journey',
        description: 'Visit all stations',
        requiredStations: ['therapy', 'community', 'tools', 'resources', 'meditation'],
        achieved: false
      }
    ];
  }
  
  private createProgressBar(): void {
    const margin = 16;
    const y = 60; // Below header
    
    this.progressBar = this.scene.add.container(margin, y);
    this.container.add(this.progressBar);
    
    // Background
    const bgBar = this.scene.add.rectangle(
      0, 0,
      this.BAR_WIDTH, this.BAR_HEIGHT,
      0x2D3748, 0.9
    );
    bgBar.setOrigin(0, 0);
    bgBar.setStrokeStyle(1, 0x4A5568);
    this.progressBar.add(bgBar);
    
    // Fill
    this.progressFill = this.scene.add.rectangle(
      2, 2,
      0, this.BAR_HEIGHT - 4,
      0x48BB78, 1
    );
    this.progressFill.setOrigin(0, 0);
    this.progressBar.add(this.progressFill);
    
    // Label
    const label = this.scene.add.text(0, -18, 'Your Journey', {
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
      color: '#E2E8F0'
    });
    this.progressBar.add(label);
    
    // Percentage text
    this.progressText = this.scene.add.text(this.BAR_WIDTH + 8, 0, '0%', {
      fontSize: '11px',
      fontFamily: 'Inter, sans-serif',
      fontStyle: 'bold',
      color: '#48BB78'
    });
    this.progressText.setOrigin(0, 0.5);
    this.progressBar.add(this.progressText);
    
    // Station indicators along the bar
    const stations = STATION_POSITIONS;
    const segmentWidth = (this.BAR_WIDTH - 4) / stations.length;
    
    stations.forEach((station, index) => {
      const x = 2 + segmentWidth * index + segmentWidth / 2;
      
      // Station dot
      const dot = this.scene.add.circle(x, this.BAR_HEIGHT / 2, 4, 0x4A5568);
      dot.setStrokeStyle(1, 0x718096);
      this.progressBar!.add(dot);
      
      // Store for updates
      dot.setData('stationId', station.id);
    });
    
    // Update display
    this.updateProgressBar();
  }
  
  private createJourneyPath(): void {
    // Create graphics for connecting path in the world
    this.pathGraphics = this.scene.add.graphics();
    this.pathGraphics.setDepth(5);
    
    this.drawJourneyPath();
  }
  
  private drawJourneyPath(): void {
    if (!this.pathGraphics) return;
    
    this.pathGraphics.clear();
    
    const stations = STATION_POSITIONS;
    const visitedStations = stations.filter(s => 
      this.stationProgress.get(s.id)?.visited
    );
    
    // Draw path connecting all stations (faded)
    this.pathGraphics.lineStyle(3, 0x4A5568, 0.3);
    
    for (let i = 0; i < stations.length - 1; i++) {
      const from = stations[i];
      const to = stations[i + 1];
      
      // Draw curved path
      this.drawCurvedPath(from.x, from.y, to.x, to.y, 0.3);
    }
    
    // Draw highlighted path for visited stations
    if (visitedStations.length > 1) {
      this.pathGraphics.lineStyle(4, 0x48BB78, 0.6);
      
      for (let i = 0; i < visitedStations.length - 1; i++) {
        const from = visitedStations[i];
        const to = visitedStations[i + 1];
        this.drawCurvedPath(from.x, from.y, to.x, to.y, 0.6);
      }
    }
    
    // Draw glowing dots at visited stations
    visitedStations.forEach(station => {
      this.pathGraphics!.fillStyle(0x48BB78, 0.8);
      this.pathGraphics!.fillCircle(station.x, station.y - 60, 8);
      
      // Glow effect
      this.pathGraphics!.fillStyle(0x48BB78, 0.2);
      this.pathGraphics!.fillCircle(station.x, station.y - 60, 16);
    });
  }
  
  private drawCurvedPath(x1: number, y1: number, x2: number, y2: number, alpha: number): void {
    if (!this.pathGraphics) return;
    
    // Control point for curve
    const midX = (x1 + x2) / 2;
    const midY = Math.min(y1, y2) - 50;
    
    // Draw as line segments
    const segments = 20;
    this.pathGraphics.beginPath();
    this.pathGraphics.moveTo(x1, y1 - 60);
    
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * midX + t * t * x2;
      const y = (1 - t) * (1 - t) * (y1 - 60) + 2 * (1 - t) * t * midY + t * t * (y2 - 60);
      this.pathGraphics.lineTo(x, y);
    }
    
    this.pathGraphics.strokePath();
  }
  
  private createStationMarkers(): void {
    STATION_POSITIONS.forEach(station => {
      const marker = this.createStationMarker(station);
      this.stationMarkers.set(station.id, marker);
    });
  }
  
  private createStationMarker(station: { id: string; x: number; y: number; name: string }): Phaser.GameObjects.Container {
    const marker = this.scene.add.container(station.x, station.y - 80);
    marker.setDepth(100);
    
    const progress = this.stationProgress.get(station.id);
    const isVisited = progress?.visited || false;
    const isCompleted = progress?.completed || false;
    
    // Progress ring
    const ringGraphics = this.scene.add.graphics();
    marker.add(ringGraphics);
    
    this.drawProgressRing(ringGraphics, progress);
    
    // Center icon
    const iconBg = this.scene.add.circle(0, 0, 12, isCompleted ? 0x48BB78 : (isVisited ? 0x4299E1 : 0x4A5568));
    marker.add(iconBg);
    
    // Icon text
    const icon = isCompleted ? '✓' : (isVisited ? '•' : '○');
    const iconText = this.scene.add.text(0, 0, icon, {
      fontSize: isCompleted ? '14px' : '10px',
      fontFamily: 'Arial',
      color: '#FFFFFF'
    });
    iconText.setOrigin(0.5);
    marker.add(iconText);
    
    // Store reference for updates
    marker.setData('ringGraphics', ringGraphics);
    marker.setData('iconBg', iconBg);
    marker.setData('iconText', iconText);
    
    // Hover interaction
    const hitArea = this.scene.add.circle(0, 0, 20, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    marker.add(hitArea);
    
    hitArea.on('pointerover', () => {
      this.showStationProgress(station, marker);
    });
    
    hitArea.on('pointerout', () => {
      this.hideStationProgress();
    });
    
    return marker;
  }
  
  private drawProgressRing(graphics: Phaser.GameObjects.Graphics, progress?: StationProgress): void {
    graphics.clear();
    
    const radius = 18;
    const lineWidth = 3;
    
    // Background ring
    graphics.lineStyle(lineWidth, 0x4A5568, 0.5);
    graphics.strokeCircle(0, 0, radius);
    
    if (progress && progress.totalActivities > 0) {
      const completion = progress.activitiesCompleted / progress.totalActivities;
      
      if (completion > 0) {
        // Progress arc
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * completion);
        
        graphics.lineStyle(lineWidth, 0x48BB78, 1);
        graphics.beginPath();
        graphics.arc(0, 0, radius, startAngle, endAngle);
        graphics.strokePath();
      }
    }
  }
  
  private showStationProgress(station: { id: string; name: string }, marker: Phaser.GameObjects.Container): void {
    this.hideStationProgress();
    
    const progress = this.stationProgress.get(station.id);
    
    const popup = this.scene.add.container(marker.x, marker.y - 50);
    popup.setDepth(200);
    
    const width = 160;
    const height = 70;
    
    // Background
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x1A202C, 0.95);
    bg.setStrokeStyle(1, 0x4A5568);
    popup.add(bg);
    
    // Station name (remove newlines)
    const displayName = station.name.replace(/\n/g, ' ');
    const nameText = this.scene.add.text(0, -height/2 + 12, displayName, {
      fontSize: '11px',
      fontFamily: 'Inter, sans-serif',
      fontStyle: 'bold',
      color: '#E2E8F0'
    });
    nameText.setOrigin(0.5);
    popup.add(nameText);
    
    // Progress info
    const activitiesCompleted = progress?.activitiesCompleted || 0;
    const totalActivities = progress?.totalActivities || 5;
    const progressPercent = Math.round((activitiesCompleted / totalActivities) * 100);
    
    const progressText = this.scene.add.text(0, 5, `${activitiesCompleted}/${totalActivities} Activities`, {
      fontSize: '10px',
      fontFamily: 'Inter, sans-serif',
      color: '#A0AEC0'
    });
    progressText.setOrigin(0.5);
    popup.add(progressText);
    
    // Mini progress bar
    const barWidth = 100;
    const barHeight = 6;
    const barBg = this.scene.add.rectangle(0, 22, barWidth, barHeight, 0x2D3748);
    barBg.setStrokeStyle(1, 0x4A5568);
    popup.add(barBg);
    
    const fillWidth = (barWidth - 2) * (progressPercent / 100);
    if (fillWidth > 0) {
      const barFill = this.scene.add.rectangle(-barWidth/2 + 1 + fillWidth/2, 22, fillWidth, barHeight - 2, 0x48BB78);
      popup.add(barFill);
    }
    
    // Percentage
    const percentText = this.scene.add.text(barWidth/2 + 8, 22, `${progressPercent}%`, {
      fontSize: '9px',
      fontFamily: 'Inter, sans-serif',
      color: '#48BB78'
    });
    percentText.setOrigin(0, 0.5);
    popup.add(percentText);
    
    // Fade in
    popup.setAlpha(0);
    this.scene.tweens.add({
      targets: popup,
      alpha: 1,
      duration: 150,
      ease: 'Quad.easeOut'
    });
    
    this.milestonePopup = popup;
  }
  
  private hideStationProgress(): void {
    if (this.milestonePopup) {
      this.milestonePopup.destroy();
      this.milestonePopup = undefined;
    }
  }
  
  private updateProgressBar(): void {
    const stations = STATION_POSITIONS;
    let totalProgress = 0;
    let visitedCount = 0;
    
    stations.forEach(station => {
      const progress = this.stationProgress.get(station.id);
      if (progress) {
        if (progress.visited) visitedCount++;
        if (progress.totalActivities > 0) {
          totalProgress += progress.activitiesCompleted / progress.totalActivities;
        }
      }
    });
    
    const overallProgress = stations.length > 0 ? totalProgress / stations.length : 0;
    const progressPercent = Math.round(overallProgress * 100);
    
    // Update fill
    if (this.progressFill) {
      const targetWidth = (this.BAR_WIDTH - 4) * overallProgress;
      this.scene.tweens.add({
        targets: this.progressFill,
        width: targetWidth,
        duration: 500,
        ease: 'Quad.easeOut'
      });
    }
    
    // Update text
    if (this.progressText) {
      this.progressText.setText(`${progressPercent}%`);
    }
    
    // Update station dots in progress bar
    this.progressBar?.getAll().forEach(child => {
      if (child instanceof Phaser.GameObjects.Arc) {
        const stationId = child.getData('stationId');
        const progress = this.stationProgress.get(stationId);
        
        if (progress?.completed) {
          child.setFillStyle(0x48BB78);
        } else if (progress?.visited) {
          child.setFillStyle(0x4299E1);
        }
      }
    });
  }
  
  // Public API
  
  public visitStation(stationId: string): void {
    let progress = this.stationProgress.get(stationId);
    
    if (!progress) {
      progress = {
        stationId,
        visited: false,
        completed: false,
        activitiesCompleted: 0,
        totalActivities: 5
      };
      this.stationProgress.set(stationId, progress);
    }
    
    if (!progress.visited) {
      progress.visited = true;
      progress.lastVisited = Date.now();
      
      this.saveProgress();
      this.updateProgressBar();
      this.drawJourneyPath();
      this.updateStationMarker(stationId);
      this.checkMilestones();
      
      // Show visit notification
      this.showVisitNotification(stationId);
    }
  }
  
  public completeActivity(stationId: string): void {
    let progress = this.stationProgress.get(stationId);
    
    if (!progress) {
      progress = {
        stationId,
        visited: true,
        completed: false,
        activitiesCompleted: 0,
        totalActivities: 5,
        lastVisited: Date.now()
      };
      this.stationProgress.set(stationId, progress);
    }
    
    progress.activitiesCompleted = Math.min(progress.activitiesCompleted + 1, progress.totalActivities);
    progress.completed = progress.activitiesCompleted >= progress.totalActivities;
    
    this.saveProgress();
    this.updateProgressBar();
    this.updateStationMarker(stationId);
    this.checkMilestones();
    
    // Show completion celebration if station completed
    if (progress.completed) {
      this.celebrateStationCompletion(stationId);
    }
  }
  
  private updateStationMarker(stationId: string): void {
    const marker = this.stationMarkers.get(stationId);
    if (!marker) return;
    
    const progress = this.stationProgress.get(stationId);
    const ringGraphics = marker.getData('ringGraphics') as Phaser.GameObjects.Graphics;
    const iconBg = marker.getData('iconBg') as Phaser.GameObjects.Arc;
    const iconText = marker.getData('iconText') as Phaser.GameObjects.Text;
    
    // Update ring
    this.drawProgressRing(ringGraphics, progress);
    
    // Update icon
    const isVisited = progress?.visited || false;
    const isCompleted = progress?.completed || false;
    
    iconBg.setFillStyle(isCompleted ? 0x48BB78 : (isVisited ? 0x4299E1 : 0x4A5568));
    iconText.setText(isCompleted ? '✓' : (isVisited ? '•' : '○'));
    iconText.setFontSize(isCompleted ? 14 : 10);
  }
  
  private showVisitNotification(stationId: string): void {
    const station = STATION_POSITIONS.find(s => s.id === stationId);
    if (!station) return;
    
    const notification = this.scene.add.container(
      this.scene.cameras.main.width / 2,
      80
    );
    notification.setScrollFactor(0);
    notification.setDepth(1000);
    notification.setAlpha(0);
    
    const bg = this.scene.add.rectangle(0, 0, 250, 40, 0x1A202C, 0.95);
    bg.setStrokeStyle(2, 0x4299E1);
    notification.add(bg);
    
    const displayName = station.name.replace(/\n/g, ' ');
    const text = this.scene.add.text(0, 0, `📍 ${displayName} visited!`, {
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      color: '#E2E8F0'
    });
    text.setOrigin(0.5);
    notification.add(text);
    
    // Animate
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      y: 100,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            y: 80,
            duration: 200,
            onComplete: () => notification.destroy()
          });
        });
      }
    });
  }
  
  private celebrateStationCompletion(stationId: string): void {
    const station = STATION_POSITIONS.find(s => s.id === stationId);
    if (!station) return;
    
    // Create celebration effect
    const celebration = this.scene.add.container(station.x, station.y - 100);
    celebration.setDepth(1000);
    
    // Confetti-like particles
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.rectangle(
        0, 0, 
        Phaser.Math.Between(4, 8),
        Phaser.Math.Between(4, 8),
        Phaser.Display.Color.RandomRGB().color
      );
      celebration.add(particle);
      
      const angle = (Math.PI * 2 / 20) * i;
      const distance = Phaser.Math.Between(50, 100);
      
      this.scene.tweens.add({
        targets: particle,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 30,
        alpha: 0,
        angle: Phaser.Math.Between(0, 360),
        duration: 1000,
        ease: 'Quad.easeOut'
      });
    }
    
    // Badge
    const badge = this.scene.add.container(0, 0);
    celebration.add(badge);
    
    const badgeBg = this.scene.add.circle(0, 0, 30, 0x48BB78);
    badge.add(badgeBg);
    
    const star = this.scene.add.text(0, 0, '⭐', { fontSize: '24px' });
    star.setOrigin(0.5);
    badge.add(star);
    
    badge.setScale(0);
    this.scene.tweens.add({
      targets: badge,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 500,
      onComplete: () => {
        this.scene.tweens.add({
          targets: celebration,
          alpha: 0,
          duration: 300,
          onComplete: () => celebration.destroy()
        });
      }
    });
  }
  
  private checkMilestones(): void {
    const visitedStations = Array.from(this.stationProgress.values())
      .filter(p => p.visited)
      .map(p => p.stationId);
    
    this.milestones.forEach(milestone => {
      if (milestone.achieved) return;
      
      let achieved = false;
      
      if (milestone.requiredStations.length === 0) {
        // First steps - achieved on first visit
        achieved = visitedStations.length > 0;
      } else if (milestone.requiredStations[0] === 'any-3') {
        // Explorer - visit any 3 stations
        achieved = visitedStations.length >= 3;
      } else {
        // Specific stations required
        achieved = milestone.requiredStations.every(id => visitedStations.includes(id));
      }
      
      if (achieved) {
        milestone.achieved = true;
        milestone.achievedAt = Date.now();
        this.showMilestoneAchieved(milestone);
        this.saveProgress();
      }
    });
  }
  
  private showMilestoneAchieved(milestone: JourneyMilestone): void {
    const popup = this.scene.add.container(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2
    );
    popup.setScrollFactor(0);
    popup.setDepth(2000);
    popup.setScale(0);
    
    // Background
    const bg = this.scene.add.rectangle(0, 0, 280, 140, 0x1A202C, 0.98);
    bg.setStrokeStyle(3, 0xF6AD55); // Gold border
    popup.add(bg);
    
    // Header
    const header = this.scene.add.text(0, -45, '🏆 Milestone Achieved!', {
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      fontStyle: 'bold',
      color: '#F6AD55'
    });
    header.setOrigin(0.5);
    popup.add(header);
    
    // Title
    const title = this.scene.add.text(0, -15, milestone.title, {
      fontSize: '18px',
      fontFamily: 'Inter, sans-serif',
      fontStyle: 'bold',
      color: '#FFFFFF'
    });
    title.setOrigin(0.5);
    popup.add(title);
    
    // Description
    const desc = this.scene.add.text(0, 15, milestone.description, {
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
      color: '#A0AEC0'
    });
    desc.setOrigin(0.5);
    popup.add(desc);
    
    // Close button
    const closeBtn = this.scene.add.text(0, 50, 'Continue', {
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
      fontStyle: 'bold',
      color: '#1A202C',
      backgroundColor: '#48BB78',
      padding: { x: 16, y: 8 }
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: popup,
        scale: 0,
        duration: 200,
        ease: 'Back.easeIn',
        onComplete: () => popup.destroy()
      });
    });
    popup.add(closeBtn);
    
    // Animate in
    this.scene.tweens.add({
      targets: popup,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }
  
  private loadProgress(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        
        // Load station progress
        if (data.stations) {
          data.stations.forEach((p: StationProgress) => {
            this.stationProgress.set(p.stationId, p);
          });
        }
        
        // Load milestones
        if (data.milestones) {
          data.milestones.forEach((m: { id: string; achieved: boolean; achievedAt?: number }) => {
            const milestone = this.milestones.find(ms => ms.id === m.id);
            if (milestone) {
              milestone.achieved = m.achieved;
              milestone.achievedAt = m.achievedAt;
            }
          });
        }
      }
    } catch (e) {
      console.warn('[PROGRESS] Failed to load progress:', e);
    }
  }
  
  private saveProgress(): void {
    try {
      const data = {
        stations: Array.from(this.stationProgress.values()),
        milestones: this.milestones.map(m => ({
          id: m.id,
          achieved: m.achieved,
          achievedAt: m.achievedAt
        }))
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[PROGRESS] Failed to save progress:', e);
    }
  }
  
  private handleResize(): void {
    // Reposition progress bar for mobile
    const { width, height } = this.scene.cameras.main;
    const isMobile = width < 768;
    
    if (this.progressBar) {
      this.progressBar.setPosition(isMobile ? 10 : 16, 60);
      this.progressBar.setScale(isMobile ? 0.8 : 1);
    }
  }
  
  public getProgress(): { overall: number; stations: StationProgress[] } {
    const stations = Array.from(this.stationProgress.values());
    let totalProgress = 0;
    
    STATION_POSITIONS.forEach(station => {
      const progress = this.stationProgress.get(station.id);
      if (progress && progress.totalActivities > 0) {
        totalProgress += progress.activitiesCompleted / progress.totalActivities;
      }
    });
    
    return {
      overall: STATION_POSITIONS.length > 0 ? totalProgress / STATION_POSITIONS.length : 0,
      stations
    };
  }
  
  public destroy(): void {
    this.scene.scale.off('resize', this.handleResize, this);
    this.container.destroy();
    this.pathGraphics?.destroy();
    this.stationMarkers.forEach(m => m.destroy());
    this.stationMarkers.clear();
  }
}
