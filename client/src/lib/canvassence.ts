// Canvassence — a personal gallery of completed art-therapy creations.
// Stored in localStorage (device-local). Each activity captures its artwork as an
// image data URL and calls addArtwork() when the user marks a session complete.

export type ActivityKey =
  | 'healing-mandala'
  | 'symbolic-drawing'
  | 'emotion-color'
  | 'memory-collage'
  | 'digital-studio';

export interface GalleryArtwork {
  id: string;
  activity: ActivityKey;
  activityLabel: string;
  mood: string;
  image: string; // data URL (PNG or SVG) suitable for <img src>
  createdAt: string; // ISO timestamp
  title?: string;
}

const STORAGE_KEY = 'canvassence-gallery';
const MAX_ITEMS = 30;

export const ACTIVITY_LABELS: Record<ActivityKey, string> = {
  'healing-mandala': 'Healing Mandala',
  'symbolic-drawing': 'Symbolic Drawing',
  'emotion-color': 'Emotion Color Mapping',
  'memory-collage': 'Memory Collage',
  'digital-studio': 'Digital Studio',
};

export function getArtworks(): GalleryArtwork[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArtworks(list: GalleryArtwork[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/**
 * Add a new artwork to the front of the gallery. Caps the list at MAX_ITEMS and,
 * if localStorage rejects the write (quota), drops the oldest entries and retries.
 */
export function addArtwork(
  partial: Omit<GalleryArtwork, 'id' | 'createdAt' | 'activityLabel'> &
    Partial<Pick<GalleryArtwork, 'activityLabel'>>
): GalleryArtwork {
  const artwork: GalleryArtwork = {
    id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    activityLabel: partial.activityLabel ?? ACTIVITY_LABELS[partial.activity],
    ...partial,
  };

  let list = [artwork, ...getArtworks()].slice(0, MAX_ITEMS);

  // Retry on quota errors by shedding the oldest items.
  while (!writeArtworks(list) && list.length > 1) {
    list = list.slice(0, list.length - 1);
  }

  return artwork;
}

export function removeArtwork(id: string): void {
  writeArtworks(getArtworks().filter((a) => a.id !== id));
}

export function clearGallery(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ── Image helpers ──────────────────────────────────────────────────────────────

/** Wrap an SVG markup string into a data URL usable in <img src>. */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Downscale a PNG/JPEG data URL so the longest edge is at most maxPx, keeping
 * localStorage small. Returns the original on any failure.
 */
export function downscale(dataUrl: string, maxPx = 512): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, maxPx / Math.max(width, height));
      if (scale >= 1) return resolve(dataUrl);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Render a 5×5 Emotion Color Mapping grid (25 colors) to a PNG data URL. */
export function gridToPng(cells: string[], cols = 5): string {
  const size = 100; // px per cell
  const gap = 6;
  const rows = Math.ceil(cells.length / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * size + (cols + 1) * gap;
  canvas.height = rows * size + (rows + 1) * gap;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  cells.forEach((color, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = gap + c * (size + gap);
    const y = gap + r * (size + gap);
    ctx.fillStyle = color || '#ffffff';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  });
  return canvas.toDataURL('image/png');
}

type CollageItem =
  | { type: 'image'; src: string }
  | { type: 'note'; text: string; color: string };

/**
 * Compose Memory Collage items (uploaded images + colored notes) onto a single
 * canvas and return a PNG data URL. Images must be data URLs (not blob: URLs) so
 * they load reliably and persist. Lays items out in a simple responsive grid.
 */
export async function collageToPng(items: CollageItem[]): Promise<string> {
  const cols = items.length <= 1 ? 1 : items.length <= 4 ? 2 : 3;
  const rows = Math.ceil(items.length / cols);
  const tile = 220;
  const gap = 12;
  const canvas = document.createElement('canvas');
  canvas.width = cols * tile + (cols + 1) * gap;
  canvas.height = rows * tile + (rows + 1) * gap;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const x = gap + (i % cols) * (tile + gap);
    const y = gap + Math.floor(i / cols) * (tile + gap);

    if (item.type === 'image') {
      const img = await loadImage(item.src);
      if (img) {
        // cover-fit into the tile
        const scale = Math.max(tile / img.width, tile / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, tile, tile);
        ctx.clip();
        ctx.drawImage(img, x + (tile - w) / 2, y + (tile - h) / 2, w, h);
        ctx.restore();
      } else {
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(x, y, tile, tile);
      }
    } else {
      ctx.fillStyle = item.color || '#fff7b3';
      ctx.fillRect(x, y, tile, tile);
      ctx.fillStyle = '#1f2937';
      ctx.font = '16px sans-serif';
      ctx.textBaseline = 'top';
      wrapText(ctx, item.text, x + 12, y + 14, tile - 24, 22);
    }
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, tile - 1, tile - 1);
  }

  return canvas.toDataURL('image/png');
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(/\s+/);
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}
