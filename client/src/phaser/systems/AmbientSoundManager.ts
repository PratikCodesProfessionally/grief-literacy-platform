import Phaser from 'phaser';
import { STATION_POSITIONS } from '../config/constants';

interface SoundLayer {
  key: string;
  baseVolume: number;
  currentVolume: number;
  sound?: Phaser.Sound.BaseSound;
  isPlaying: boolean;
}

interface ZoneSoundConfig {
  stationId: string;
  soundKey: string;
  maxVolume: number;
  fadeDistance: number;
}

/**
 * AmbientSoundManager - Manages layered ambient audio for the healing world
 * 
 * Features:
 * - Base ambient layer (wind, nature) always playing
 * - Zone-specific sounds that fade in/out based on proximity
 * - Master volume control with mute toggle
 * - Smooth crossfades between areas
 * 
 * Note: This system uses Web Audio API through Phaser's sound manager.
 * Audio files need to be loaded in the preload phase.
 */
export class AmbientSoundManager {
  private scene: Phaser.Scene;
  private masterVolume: number = 0.5;
  private isMuted: boolean = false;
  private isEnabled: boolean = true;
  
  // Sound layers
  private baseLayers: SoundLayer[] = [];
  private zoneSounds: Map<string, SoundLayer> = new Map();
  
  // UI elements
  private uiContainer?: Phaser.GameObjects.Container;
  private volumeSlider?: Phaser.GameObjects.Rectangle;
  private volumeFill?: Phaser.GameObjects.Rectangle;
  private muteButton?: Phaser.GameObjects.Container;
  private volumeLabel?: Phaser.GameObjects.Text;
  
  // Zone sound configurations
  private zoneConfigs: ZoneSoundConfig[] = [
    { stationId: 'therapy', soundKey: 'ambient_creative', maxVolume: 0.4, fadeDistance: 400 },
    { stationId: 'community', soundKey: 'ambient_voices', maxVolume: 0.3, fadeDistance: 350 },
    { stationId: 'tools', soundKey: 'ambient_healing', maxVolume: 0.35, fadeDistance: 400 },
    { stationId: 'resources', soundKey: 'ambient_library', maxVolume: 0.3, fadeDistance: 350 },
    { stationId: 'meditation', soundKey: 'ambient_meditation', maxVolume: 0.5, fadeDistance: 500 }
  ];
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Check if audio is available
    if (!scene.sound) {
      console.warn('[AUDIO] Sound system not available');
      this.isEnabled = false;
      return;
    }
    
    // Check if WebAudio context is available (for advanced features)
    const soundManager = scene.sound as Phaser.Sound.WebAudioSoundManager;
    if (!soundManager.context) {
      console.warn('[AUDIO] WebAudio context not available, using basic audio');
    }
    
    // Create UI
    this.createUI();
    
    // Initialize base ambient sounds (these would need actual audio files)
    this.initializeBaseLayers();
    
    // Initialize zone-specific sounds
    this.initializeZoneSounds();
    
    // Load saved preferences
    this.loadPreferences();
    
    // Handle visibility change (pause when tab hidden)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }
  
  private createUI(): void {
    // Position in bottom-right corner (above minimap area)
    const x = this.scene.scale.width - 160;
    const y = this.scene.scale.height - 50;
    
    this.uiContainer = this.scene.add.container(x, y);
    this.uiContainer.setScrollFactor(0);
    this.uiContainer.setDepth(998);
    
    // Background panel
    const bgPanel = this.scene.add.rectangle(0, 0, 140, 40, 0xffffff, 0.9);
    bgPanel.setStrokeStyle(1, 0xe2e8f0, 1);
    this.uiContainer.add(bgPanel);
    
    // Sound icon
    const soundIcon = this.scene.add.text(-55, 0, '🔊', { fontSize: '18px' });
    soundIcon.setOrigin(0.5);
    this.uiContainer.add(soundIcon);
    
    // Volume slider background
    const sliderBg = this.scene.add.rectangle(10, 0, 80, 8, 0xe2e8f0, 1);
    sliderBg.setOrigin(0, 0.5);
    sliderBg.setInteractive({ useHandCursor: true });
    this.uiContainer.add(sliderBg);
    this.volumeSlider = sliderBg;
    
    // Volume slider fill
    this.volumeFill = this.scene.add.rectangle(10, 0, 80 * this.masterVolume, 8, 0x3b82f6, 1);
    this.volumeFill.setOrigin(0, 0.5);
    this.uiContainer.add(this.volumeFill);
    
    // Volume label
    this.volumeLabel = this.scene.add.text(55, -18, `${Math.round(this.masterVolume * 100)}%`, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#64748b'
    });
    this.volumeLabel.setOrigin(0.5);
    this.uiContainer.add(this.volumeLabel);
    
    // Mute button
    this.createMuteButton();
    
    // Setup slider interaction
    this.setupSliderInteraction();
  }
  
  private createMuteButton(): void {
    this.muteButton = this.scene.add.container(-55, 0);
    
    const muteIcon = this.scene.add.text(0, 0, this.isMuted ? '🔇' : '🔊', { fontSize: '18px' });
    muteIcon.setOrigin(0.5);
    muteIcon.setInteractive({ useHandCursor: true });
    
    muteIcon.on('pointerdown', () => {
      this.toggleMute();
      muteIcon.setText(this.isMuted ? '🔇' : '🔊');
      if (navigator.vibrate) navigator.vibrate(10);
    });
    
    muteIcon.on('pointerover', () => {
      muteIcon.setScale(1.2);
    });
    
    muteIcon.on('pointerout', () => {
      muteIcon.setScale(1);
    });
    
    this.muteButton.add(muteIcon);
    this.uiContainer?.add(this.muteButton);
  }
  
  private setupSliderInteraction(): void {
    if (!this.volumeSlider) return;
    
    let isDragging = false;
    
    this.volumeSlider.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      this.updateVolumeFromPointer(pointer);
    });
    
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        this.updateVolumeFromPointer(pointer);
      }
    });
    
    this.scene.input.on('pointerup', () => {
      if (isDragging) {
        isDragging = false;
        this.savePreferences();
      }
    });
  }
  
  private updateVolumeFromPointer(pointer: Phaser.Input.Pointer): void {
    if (!this.volumeSlider || !this.volumeFill || !this.uiContainer) return;
    
    const sliderX = this.uiContainer.x + 10;
    const sliderWidth = 80;
    
    const relativeX = pointer.x - sliderX;
    const normalizedX = Phaser.Math.Clamp(relativeX / sliderWidth, 0, 1);
    
    this.setMasterVolume(normalizedX);
  }
  
  public setMasterVolume(volume: number): void {
    this.masterVolume = Phaser.Math.Clamp(volume, 0, 1);
    
    // Update UI
    if (this.volumeFill) {
      this.volumeFill.setSize(80 * this.masterVolume, 8);
    }
    if (this.volumeLabel) {
      this.volumeLabel.setText(`${Math.round(this.masterVolume * 100)}%`);
    }
    
    // Update all playing sounds
    this.updateAllVolumes();
    
    // Unmute if volume changed
    if (this.masterVolume > 0 && this.isMuted) {
      this.isMuted = false;
      this.updateMuteIcon();
    }
  }
  
  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.updateAllVolumes();
    this.updateMuteIcon();
    this.savePreferences();
  }
  
  private updateMuteIcon(): void {
    if (this.muteButton && this.muteButton.list[0]) {
      const icon = this.muteButton.list[0] as Phaser.GameObjects.Text;
      icon.setText(this.isMuted ? '🔇' : '🔊');
    }
  }
  
  private initializeBaseLayers(): void {
    // Note: These sounds would need to be preloaded
    // For now, we create placeholder entries
    this.baseLayers = [
      { key: 'ambient_wind', baseVolume: 0.15, currentVolume: 0, isPlaying: false },
      { key: 'ambient_nature', baseVolume: 0.2, currentVolume: 0, isPlaying: false },
      { key: 'ambient_birds', baseVolume: 0.1, currentVolume: 0, isPlaying: false }
    ];
    
    // Try to play base layers if audio files exist
    this.baseLayers.forEach(layer => {
      this.tryPlaySound(layer, layer.baseVolume);
    });
  }
  
  private initializeZoneSounds(): void {
    this.zoneConfigs.forEach(config => {
      const layer: SoundLayer = {
        key: config.soundKey,
        baseVolume: config.maxVolume,
        currentVolume: 0,
        isPlaying: false
      };
      this.zoneSounds.set(config.stationId, layer);
    });
  }
  
  private tryPlaySound(layer: SoundLayer, targetVolume: number): void {
    if (!this.isEnabled) return;
    
    // Check if sound exists in cache
    const soundExists = this.scene.cache.audio.exists(layer.key);
    
    if (soundExists && !layer.sound) {
      try {
        layer.sound = this.scene.sound.add(layer.key, {
          loop: true,
          volume: 0
        });
        layer.sound.play();
        layer.isPlaying = true;
      } catch (e) {
        console.warn(`[AUDIO] Could not play sound: ${layer.key}`);
      }
    }
    
    // Update volume even if sound doesn't exist (for future loading)
    layer.currentVolume = targetVolume;
    
    if (layer.sound && layer.isPlaying) {
      const effectiveVolume = this.isMuted ? 0 : targetVolume * this.masterVolume;
      (layer.sound as Phaser.Sound.WebAudioSound).setVolume(effectiveVolume);
    }
  }
  
  private updateAllVolumes(): void {
    // Update base layers
    this.baseLayers.forEach(layer => {
      if (layer.sound && layer.isPlaying) {
        const effectiveVolume = this.isMuted ? 0 : layer.currentVolume * this.masterVolume;
        (layer.sound as Phaser.Sound.WebAudioSound).setVolume(effectiveVolume);
      }
    });
    
    // Update zone sounds
    this.zoneSounds.forEach(layer => {
      if (layer.sound && layer.isPlaying) {
        const effectiveVolume = this.isMuted ? 0 : layer.currentVolume * this.masterVolume;
        (layer.sound as Phaser.Sound.WebAudioSound).setVolume(effectiveVolume);
      }
    });
  }
  
  public update(playerX: number, playerY: number): void {
    if (!this.isEnabled) return;
    
    // Update zone-specific sounds based on player proximity
    this.zoneConfigs.forEach(config => {
      const station = STATION_POSITIONS.find(s => s.id === config.stationId);
      if (!station) return;
      
      // Calculate distance to zone
      const dx = playerX - station.x;
      const dy = playerY - station.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate volume based on distance (inverse, clamped)
      let targetVolume = 0;
      if (distance < config.fadeDistance) {
        // Linear fade: full volume at center, 0 at fadeDistance
        targetVolume = config.maxVolume * (1 - distance / config.fadeDistance);
      }
      
      // Get or create sound layer
      const layer = this.zoneSounds.get(config.stationId);
      if (layer) {
        // Smooth volume transition
        const smoothFactor = 0.1;
        layer.currentVolume = Phaser.Math.Linear(layer.currentVolume, targetVolume, smoothFactor);
        
        // Apply volume
        if (layer.sound && layer.isPlaying) {
          const effectiveVolume = this.isMuted ? 0 : layer.currentVolume * this.masterVolume;
          (layer.sound as Phaser.Sound.WebAudioSound).setVolume(effectiveVolume);
        }
      }
    });
  }
  
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Pause all sounds when tab is hidden
      this.baseLayers.forEach(layer => {
        if (layer.sound && layer.isPlaying) {
          (layer.sound as Phaser.Sound.WebAudioSound).pause();
        }
      });
      this.zoneSounds.forEach(layer => {
        if (layer.sound && layer.isPlaying) {
          (layer.sound as Phaser.Sound.WebAudioSound).pause();
        }
      });
    } else {
      // Resume sounds when tab is visible
      this.baseLayers.forEach(layer => {
        if (layer.sound && layer.isPlaying) {
          (layer.sound as Phaser.Sound.WebAudioSound).resume();
        }
      });
      this.zoneSounds.forEach(layer => {
        if (layer.sound && layer.isPlaying) {
          (layer.sound as Phaser.Sound.WebAudioSound).resume();
        }
      });
    }
  }
  
  private loadPreferences(): void {
    try {
      const prefs = localStorage.getItem('grief-platform-audio-prefs');
      if (prefs) {
        const { masterVolume, isMuted } = JSON.parse(prefs);
        this.masterVolume = masterVolume ?? 0.5;
        this.isMuted = isMuted ?? false;
        
        // Update UI
        if (this.volumeFill) {
          this.volumeFill.setSize(80 * this.masterVolume, 8);
        }
        if (this.volumeLabel) {
          this.volumeLabel.setText(`${Math.round(this.masterVolume * 100)}%`);
        }
        this.updateMuteIcon();
        this.updateAllVolumes();
      }
    } catch (e) {
      console.warn('[AUDIO] Could not load audio preferences');
    }
  }
  
  private savePreferences(): void {
    try {
      localStorage.setItem('grief-platform-audio-prefs', JSON.stringify({
        masterVolume: this.masterVolume,
        isMuted: this.isMuted
      }));
    } catch (e) {
      console.warn('[AUDIO] Could not save audio preferences');
    }
  }
  
  public destroy(): void {
    // Stop all sounds
    this.baseLayers.forEach(layer => {
      if (layer.sound) {
        layer.sound.destroy();
      }
    });
    this.zoneSounds.forEach(layer => {
      if (layer.sound) {
        layer.sound.destroy();
      }
    });
    
    // Remove event listener
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Destroy UI
    if (this.uiContainer) {
      this.uiContainer.destroy();
    }
  }
}
