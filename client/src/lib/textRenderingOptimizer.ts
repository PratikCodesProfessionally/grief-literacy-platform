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
  reduceBlueLight: boolean;
  boldTextDarkMode: boolean;
}

export class TextRenderingOptimizer {
  private preferences: DisplayPreferences;
  private darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.preferences = this.loadPreferences();
    this.init();
  }

  private init(): void {
    this.detectDisplayPreferences();
    this.applyPreferences();

    // Follow system theme changes
    this.darkQuery.addEventListener('change', () => {
      if (this.preferences.theme === 'auto') {
        this.applyTheme('auto');
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
    const prefersContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersContrast && this.preferences.contrast === 'standard') {
      this.preferences.contrast = 'high';
      this.applyContrast();
    }

    if (prefersReducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    }
  }

  /**
   * Apply the theme to <html>, the single place Tailwind's `dark:` variants and
   * the theme variables in index.css look for it. 'auto' follows the device.
   */
  private applyTheme(theme: DisplayPreferences['theme']): void {
    const root = document.documentElement;
    const dark = theme === 'dark' || theme === 'night-reading' || (theme === 'auto' && this.darkQuery.matches);

    root.classList.toggle('dark', dark);
    // Night reading layers a warmer palette on top of the dark theme.
    root.classList.toggle('night-reading-mode', theme === 'night-reading');
  }

  /**
   * Apply contrast level
   */
  private applyContrast(): void {
    const root = document.documentElement;
    root.classList.remove('high-contrast', 'enhanced-contrast');

    switch (this.preferences.contrast) {
      case 'high':
        root.classList.add('high-contrast');
        break;
      case 'enhanced':
        root.classList.add('enhanced-contrast');
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
}

// Export singleton instance
export const textRenderingOptimizer = new TextRenderingOptimizer();
