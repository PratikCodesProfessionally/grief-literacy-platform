export interface HealingMandalaProps {
  mood: string;
  onClose: () => void;
  onComplete?: (data?: CompletionData) => void;
  initialTemplate?: TemplateKey;
  autosaveKey?: string;
}

export interface CompletionData {
  imageBlob: Blob;
  sessionDuration: number;
  colorsUsed: string[];
  percentComplete: number;
  journalEntry?: string;
}

export interface SessionData {
  id: string;
  mood: string;
  template: TemplateKey;
  petals: number;
  rings: number;
  stroke: number;
  lineColor: string;
  selectedColor: string;
  activePalette: PaletteKey;
  svgContent: string;
  colorsUsed: string[];
  sessionStartTime: number;
  lastSaveTime: number;
  timestamp: string;
}

export interface CompletedSessionData {
  id: string;
  mood: string;
  template: TemplateKey;
  colorsUsed: string[];
  percentComplete: number;
  duration: number;
  completedAt: string;
  svgContent: string;
}

export interface MandalaAPI {
  petals: number;
  rings: number;
  totalPetals: number;
  totalRings: number;
  fill: (elementSelector: string | number[], color: string) => void;
  fillPetal: (index: number, color: string) => void;
  fillRing: (ringIndex: number, color: string) => void;
  getColor: () => string;
  getPalette: () => string[];
  random: () => number;
}

export type TemplateKey = 'traditional-floral' | 'dot-mandala' | 'geometric-sacred' | 'organic-lotus' | 'procedural';
export type PaintMode = 'paint' | 'erase' | 'eyedropper' | 'fill' | 'javascript';
export type PaletteKey = 'warmEarth' | 'coolBlues' | 'natureGreen' | 'sunset' | 'zen';
export type PaintableEl = SVGPathElement | SVGPolygonElement | SVGRectElement | SVGCircleElement;

export interface ColorPalette {
  name: string;
  colors: string[];
}

export interface ColorPalettes {
  warmEarth: ColorPalette;
  coolBlues: ColorPalette;
  natureGreen: ColorPalette;
  sunset: ColorPalette;
  zen: ColorPalette;
}
