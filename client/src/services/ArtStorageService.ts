/**
 * @fileoverview Art Storage Service for Art Therapy Platform
 * 
 * This service provides storage capabilities for artwork created in therapy activities.
 * Features:
 * - Save artwork data (canvas, drawings, mandalas, collages)
 * - Load and manage artwork history
 * - Export artwork in multiple formats
 * - Associate mood and metadata with artwork
 */

import { StorageItem } from './StorageService';

/**
 * Types of art activities supported
 */
export type ArtActivityType = 'emotion-color' | 'memory-collage' | 'symbolic-drawing' | 'healing-mandala' | 'digital-canvas';

/**
 * Base interface for artwork items
 */
export interface Artwork extends StorageItem {
  title: string;
  activityType: ArtActivityType;
  mood: string;
  notes?: string;
  thumbnail?: string; // Base64 encoded thumbnail
}

/**
 * Emotion Color Mapping artwork
 */
export interface EmotionColorArtwork extends Artwork {
  activityType: 'emotion-color';
  cells: string[]; // Array of color values
  selectedColor: string;
}

/**
 * Memory Collage artwork
 */
export interface MemoryCollageArtwork extends Artwork {
  activityType: 'memory-collage';
  items: Array<
    | { type: 'image'; src: string; dataUrl?: string }
    | { type: 'note'; text: string; color: string }
  >;
}

/**
 * Symbolic Drawing artwork
 */
export interface SymbolicDrawingArtwork extends Artwork {
  activityType: 'symbolic-drawing';
  canvasDataUrl: string; // Canvas as base64 PNG
  strokes: Array<{
    color: string;
    size: number;
    points: Array<{ x: number; y: number }>;
  }>;
}

/**
 * Healing Mandala artwork
 */
export interface HealingMandalaArtwork extends Artwork {
  activityType: 'healing-mandala';
  svgData: string; // SVG as string
  config: {
    petals: number;
    rings: number;
    stroke: number;
    lineColor: string;
  };
}

/**
 * Union type for all artwork types
 */
export type AnyArtwork = EmotionColorArtwork | MemoryCollageArtwork | SymbolicDrawingArtwork | HealingMandalaArtwork;

/**
 * Art Storage Service Class
 */
export class ArtStorageService {
  private readonly STORAGE_KEY = 'art-therapy-artworks';

  /**
   * Save artwork to local storage
   */
  async saveArtwork(artwork: Omit<AnyArtwork, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnyArtwork> {
    const id = this.generateId();
    const timestamp = new Date();
    const newArtwork = {
      ...artwork,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
    } as AnyArtwork;

    const artworks = await this.getAllArtworks();
    artworks.push(newArtwork);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(artworks));

    return newArtwork;
  }

  /**
   * Get a specific artwork by ID
   */
  async getArtwork(id: string): Promise<AnyArtwork | null> {
    const artworks = await this.getAllArtworks();
    return artworks.find(art => art.id === id) || null;
  }

  /**
   * Get all artworks
   */
  async getAllArtworks(): Promise<AnyArtwork[]> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    
    try {
      const artworks = JSON.parse(data);
      // Convert date strings back to Date objects
      return artworks.map((art: any) => ({
        ...art,
        createdAt: new Date(art.createdAt),
        updatedAt: new Date(art.updatedAt),
      }));
    } catch (error) {
      console.error('Error parsing artworks:', error);
      return [];
    }
  }

  /**
   * Get artworks by activity type
   */
  async getArtworksByType(activityType: ArtActivityType): Promise<AnyArtwork[]> {
    const artworks = await this.getAllArtworks();
    return artworks.filter(art => art.activityType === activityType);
  }

  /**
   * Update artwork
   */
  async updateArtwork(id: string, updates: Partial<AnyArtwork>): Promise<AnyArtwork | null> {
    const artworks = await this.getAllArtworks();
    const index = artworks.findIndex(art => art.id === id);
    
    if (index === -1) return null;

    const updatedArtwork = {
      ...artworks[index],
      ...updates,
      updatedAt: new Date(),
    };

    artworks[index] = updatedArtwork;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(artworks));

    return updatedArtwork;
  }

  /**
   * Delete artwork
   */
  async deleteArtwork(id: string): Promise<boolean> {
    const artworks = await this.getAllArtworks();
    const filtered = artworks.filter(art => art.id !== id);
    
    if (filtered.length === artworks.length) return false;

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  /**
   * Export artwork as JSON
   */
  exportAsJSON(artwork: AnyArtwork): void {
    const dataStr = JSON.stringify(artwork, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    this.downloadBlob(blob, `${artwork.title || 'artwork'}-${artwork.id}.json`);
  }

  /**
   * Generate thumbnail from canvas
   */
  generateThumbnail(canvas: HTMLCanvasElement, maxWidth: number = 200, maxHeight: number = 200): string {
    const thumbnailCanvas = document.createElement('canvas');
    const ctx = thumbnailCanvas.getContext('2d');
    if (!ctx) return '';

    const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
    thumbnailCanvas.width = canvas.width * scale;
    thumbnailCanvas.height = canvas.height * scale;

    ctx.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
    return thumbnailCanvas.toDataURL('image/png');
  }

  /**
   * Generate thumbnail from SVG
   */
  async generateThumbnailFromSVG(svgData: string, maxWidth: number = 200, maxHeight: number = 200): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };

      img.src = url;
    });
  }

  /**
   * Helper to download blob
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalArtworks: number;
    byType: Record<ArtActivityType, number>;
    oldestDate: Date | null;
    newestDate: Date | null;
  }> {
    const artworks = await this.getAllArtworks();
    const stats = {
      totalArtworks: artworks.length,
      byType: {
        'emotion-color': 0,
        'memory-collage': 0,
        'symbolic-drawing': 0,
        'healing-mandala': 0,
        'digital-canvas': 0,
      } as Record<ArtActivityType, number>,
      oldestDate: null as Date | null,
      newestDate: null as Date | null,
    };

    if (artworks.length > 0) {
      artworks.forEach(art => {
        stats.byType[art.activityType]++;
      });

      const sorted = [...artworks].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      stats.oldestDate = sorted[0].createdAt;
      stats.newestDate = sorted[sorted.length - 1].createdAt;
    }

    return stats;
  }
}

// Export singleton instance
export const artStorageService = new ArtStorageService();
