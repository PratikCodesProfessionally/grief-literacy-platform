/**
 * Crystal-Clear Text Rendering Optimizer
 * Enhances text clarity across browsers and lighting conditions
 */

export interface DisplayPreferences {
  theme: 'auto' | 'light' | 'dark' | 'night-reading';
  contrast: 'standard' | 'enhanced' | 'high';
  textSize: number; // -2 to +4
  lineSpacing: number; // 1.5 to 2.0
  readingWidth: number; // 600 to 800px
  autoAdjustEvening: boolean;
  reduceBlueLight: boolean;
  boldTextDarkMode: boolean;
}

export class TextRenderingOptimizer {
  private preferences: DisplayPreferences;
  private timeCheckInterval: number | null = null;

  constructor() {
    this.preferences = this.loadPreferences();
    this.init();
  }

  private init(): void {
    this.detectDisplayPreferences();
    this.applyPreferences();
    
    if (this.preferences.autoAdjustEvening) {
      this.startTimeBasedAdjustment();
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.preferences.theme === 'auto') {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });

    // Listen for system contrast changes
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      if (e.matches) {
        this.preferences.contrast = 'high';
        this.applyContrast();
      }
    });
  }

  /**
   * Detect and apply system display preferences
   */
  private detectDisplayPreferences(): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this.preferences.theme === 'auto') {
      this.applyTheme(prefersDark ? 'dark' : 'light');
    }

    if (prefersContrast && this.preferences.contrast === 'standard') {
      this.preferences.contrast = 'high';
      this.applyContrast();
    }

    if (prefersReducedMotion) {
      document.body.classList.add('reduced-motion');
    }
  }

  /**
   * Apply time-based theme adjustments
   */
  private startTimeBasedAdjustment(): void {
    this.applyTimeBasedTheme();
    
    // Check every hour
    this.timeCheckInterval = window.setInterval(() => {
      this.applyTimeBasedTheme();
    }, 3600000);
  }

  private applyTimeBasedTheme(): void {
    const hour = new Date().getHours();
    const body = document.body;

    if (this.preferences.theme !== 'auto') {
      return; // User has manual preference
    }

    if (hour >= 22 || hour < 6) {
      // Night mode (10pm - 6am)
      body.classList.add('night-reading-mode');
      body.classList.remove('evening-mode', 'dark', 'light');
    } else if (hour >= 18) {
      // Evening mode (6pm - 10pm)
      body.classList.add('evening-mode', 'dark');
      body.classList.remove('night-reading-mode', 'light');
    } else if (hour >= 6 && hour < 12) {
      // Morning - lighter theme
      body.classList.add('light');
      body.classList.remove('dark', 'night-reading-mode', 'evening-mode');
    } else {
      // Afternoon - standard light
      body.classList.add('light');
      body.classList.remove('dark', 'night-reading-mode', 'evening-mode');
    }
  }

  /**
   * Apply theme manually
   */
  private applyTheme(theme: DisplayPreferences['theme']): void {
    const body = document.body;
    body.classList.remove('light', 'dark', 'night-reading-mode', 'evening-mode');

    switch (theme) {
      case 'light':
        body.classList.add('light');
        break;
      case 'dark':
        body.classList.add('dark');
        break;
      case 'night-reading':
        body.classList.add('night-reading-mode');
        break;
      case 'auto':
        this.detectDisplayPreferences();
        break;
    }
  }

  /**
   * Apply contrast level
   */
  private applyContrast(): void {
    const body = document.body;
    body.classList.remove('high-contrast', 'enhanced-contrast');

    switch (this.preferences.contrast) {
      case 'high':
        body.classList.add('high-contrast');
        break;
      case 'enhanced':
        body.classList.add('enhanced-contrast');
        break;
      case 'standard':
        // Default contrast, no class needed
        break;
    }
  }

  /**
   * Apply all user preferences
   */
  private applyPreferences(): void {
    this.applyTheme(this.preferences.theme);
    this.applyContrast();
    this.applyTextSize();
    this.applyLineSpacing();
    this.applyReadingWidth();

    if (this.preferences.boldTextDarkMode) {
      document.documentElement.style.setProperty('--dark-font-weight', '500');
    }

    if (this.preferences.reduceBlueLight) {
      this.applyBlueLightReduction();
    }
  }

  /**
   * Apply text size adjustment
   */
  private applyTextSize(): void {
    const baseSize = 16; // 1rem = 16px
    const adjustedSize = baseSize + this.preferences.textSize;
    document.documentElement.style.fontSize = `${adjustedSize}px`;
  }

  /**
   * Apply line spacing adjustment
   */
  private applyLineSpacing(): void {
    document.documentElement.style.setProperty('--leading-relaxed', this.preferences.lineSpacing.toString());
  }

  /**
   * Apply reading width adjustment
   */
  private applyReadingWidth(): void {
    document.documentElement.style.setProperty('--reading-width', `${this.preferences.readingWidth}px`);
  }

  /**
   * Reduce blue light emission
   */
  private applyBlueLightReduction(): void {
    const hour = new Date().getHours();
    
    if (hour >= 18 || hour < 6) {
      // Evening/night: Apply sepia filter
      document.documentElement.style.filter = 'sepia(0.1)';
    } else {
      document.documentElement.style.filter = 'none';
    }
  }

  /**
   * Update preferences and save
   */
  public updatePreferences(newPreferences: Partial<DisplayPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
    this.applyPreferences();

    if (this.preferences.autoAdjustEvening && !this.timeCheckInterval) {
      this.startTimeBasedAdjustment();
    } else if (!this.preferences.autoAdjustEvening && this.timeCheckInterval) {
      window.clearInterval(this.timeCheckInterval);
      this.timeCheckInterval = null;
    }
  }

  /**
   * Get current preferences
   */
  public getPreferences(): DisplayPreferences {
    return { ...this.preferences };
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): DisplayPreferences {
    const stored = localStorage.getItem('display-preferences');
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse display preferences:', error);
      }
    }

    // Default preferences
    return {
      theme: 'auto',
      contrast: 'standard',
      textSize: 0,
      lineSpacing: 1.7,
      readingWidth: 680,
      autoAdjustEvening: true,
      reduceBlueLight: true,
      boldTextDarkMode: true,
    };
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    localStorage.setItem('display-preferences', JSON.stringify(this.preferences));
  }

  /**
   * Reset to default preferences
   */
  public resetToDefaults(): void {
    this.preferences = {
      theme: 'auto',
      contrast: 'standard',
      textSize: 0,
      lineSpacing: 1.7,
      readingWidth: 680,
      autoAdjustEvening: true,
      reduceBlueLight: true,
      boldTextDarkMode: true,
    };
    this.savePreferences();
    this.applyPreferences();
  }

  /**
   * Get contrast ratio between two colors
   */
  public static getContrastRatio(color1: string, color2: string): number {
    const getLuminance = (color: string): number => {
      // Simple luminance calculation for hex colors
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      const sRGB = [r, g, b].map(val => {
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast meets WCAG AAA standard (7:1)
   */
  public static meetsWCAGAAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 7;
  }

  /**
   * Cleanup on destroy
   */
  public destroy(): void {
    if (this.timeCheckInterval) {
      window.clearInterval(this.timeCheckInterval);
    }
  }
}

// Export singleton instance
export const textRenderingOptimizer = new TextRenderingOptimizer();
