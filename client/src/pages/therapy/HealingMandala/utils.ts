import { MandalaAPI, PaintableEl, SessionData, CompletedSessionData, TemplateKey } from './types';
import { NS, MANDALA_HISTORY_KEY, MAX_HISTORY_SESSIONS } from './constants';

export const createMandalaAPI = (
  svgRef: React.MutableRefObject<SVGSVGElement | null>,
  selectedColor: string,
  palette: string[],
  petals: number,
  rings: number
): MandalaAPI => {
  return {
    petals,
    rings,
    totalPetals: petals,
    totalRings: rings,
    fill: (elementSelector: string | number[], color: string) => {
      if (!svgRef.current) return;
      let elements: NodeListOf<Element> | Element[] = [];
      
      if (typeof elementSelector === 'string') {
        elements = svgRef.current.querySelectorAll(`[data-part="${elementSelector}"]`);
      } else if (Array.isArray(elementSelector)) {
        elementSelector.forEach(idx => {
          const el = svgRef.current?.querySelector(`[data-part*="-${idx}"]`);
          if (el) (elements as Element[]).push(el);
        });
      }
      
      (elements as any[]).forEach((el: PaintableEl) => {
        el.setAttribute('fill', color);
      });
    },
    fillPetal: (index: number, color: string) => {
      if (!svgRef.current) return;
      const elements = svgRef.current.querySelectorAll(`[data-part$="-${index}"]`);
      elements.forEach((el: Element) => {
        (el as PaintableEl).setAttribute('fill', color);
      });
    },
    fillRing: (ringIndex: number, color: string) => {
      if (!svgRef.current) return;
      const elements = svgRef.current.querySelectorAll(`[data-ring="${ringIndex}"]`);
      elements.forEach((el: Element) => {
        (el as PaintableEl).setAttribute('fill', color);
      });
    },
    getColor: () => selectedColor,
    getPalette: () => palette,
    random: () => Math.random(),
  };
};

// Session Storage
export const saveSessionToStorage = (
  autosaveKey: string,
  sessionData: Omit<SessionData, 'lastSaveTime' | 'timestamp'>
): void => {
  const dataWithTimestamp: SessionData = {
    ...sessionData,
    lastSaveTime: Date.now(),
    timestamp: new Date().toISOString(),
  };
  
  try {
    // localStorage (not sessionStorage) so an in-progress mandala survives a
    // full browser/tab close, not just SPA navigation.
    localStorage.setItem(autosaveKey, JSON.stringify(dataWithTimestamp));
  } catch (error) {
    console.warn('Failed to save session:', error);
  }
};

export const getSessionFromStorage = (autosaveKey: string): SessionData | null => {
  try {
    const saved = localStorage.getItem(autosaveKey);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const clearSessionFromStorage = (autosaveKey: string): void => {
  localStorage.removeItem(autosaveKey);
};

// Session History (localStorage)
export const archiveCompletedSession = (completionData: CompletedSessionData): void => {
  try {
    const historyJson = localStorage.getItem(MANDALA_HISTORY_KEY) || '[]';
    const history: CompletedSessionData[] = JSON.parse(historyJson);
    
    history.push(completionData);
    
    if (history.length > MAX_HISTORY_SESSIONS) {
      history.shift();
    }
    
    localStorage.setItem(MANDALA_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to archive session:', error);
  }
};

export const getMandalaHistory = (): CompletedSessionData[] => {
  try {
    const historyJson = localStorage.getItem(MANDALA_HISTORY_KEY) || '[]';
    return JSON.parse(historyJson);
  } catch {
    return [];
  }
};

// SVG Export
export const exportSVGString = (svgElement: SVGSVGElement): string => {
  return new XMLSerializer().serializeToString(svgElement);
};

export const exportSVGAsBlob = (svgElement: SVGSVGElement): Blob => {
  const svgData = exportSVGString(svgElement);
  return new Blob([svgData], { type: 'image/svg+xml' });
};

export const calculateCompletionPercentage = (svgElement: SVGSVGElement): number => {
  const totalSegments = svgElement.querySelectorAll('[data-part]').length || 0;
  const paintedSegments = Array.from(svgElement.querySelectorAll('[data-part]') || [])
    .filter(el => el.getAttribute('fill') !== '#FCFCFC').length;
  
  return totalSegments > 0 ? (paintedSegments / totalSegments) * 100 : 0;
};

// Seeded Random Number Generator
export const createPRNG = (seed: number) => {
  let x = seed;
  return () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296;
};
