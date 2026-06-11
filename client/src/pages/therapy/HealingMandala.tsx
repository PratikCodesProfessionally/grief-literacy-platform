import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Paintbrush, Eraser, Droplet, Sparkles, Download, Undo2, Redo2, RotateCcw, ChevronDown, ChevronUp, Palette, ZoomIn, ZoomOut } from 'lucide-react';
import { addArtwork, svgToDataUrl } from '@/lib/canvassence';

interface HealingMandalaProps {
  mood: string;
  onClose: () => void;
  onComplete?: (data?: CompletionData) => void;
  initialTemplate?: TemplateKey;
  autosaveKey?: string;
}

interface CompletionData {
  imageBlob: Blob;
  sessionDuration: number;
  colorsUsed: string[];
  percentComplete: number;
  journalEntry?: string;
}

type TemplateKey = 'traditional-floral' | 'dot-mandala' | 'geometric-sacred' | 'organic-lotus' | 'procedural';
type PaintableEl = SVGPathElement | SVGPolygonElement | SVGRectElement | SVGCircleElement;

export const HealingMandala: React.FC<HealingMandalaProps> = ({ 
  mood, 
  onClose, 
  onComplete,
  initialTemplate = 'traditional-floral',
  autosaveKey = 'mandala-session'
}) => {
  // ── UI state ───────────────────────────────────────────────────────────────────
  const [template, setTemplate] = React.useState<TemplateKey>(initialTemplate);
  const [petals, setPetals] = React.useState(16);
  const [rings, setRings] = React.useState(6);
  const [stroke, setStroke] = React.useState(2);
  const [symmetryMode, setSymmetryMode] = React.useState<number>(1); // 1, 4, 8, 16
  
  // Adjust defaults when template changes
  React.useEffect(() => {
    if (template === 'traditional-floral') {
      setPetals(prev => prev > 24 || prev < 8 ? 12 : prev);
      setRings(prev => prev > 12 || prev < 4 ? 6 : prev);
    } else if (template === 'dot-mandala') {
      setPetals(prev => prev > 16 || prev < 8 ? 12 : prev);
      setRings(prev => prev > 15 || prev < 5 ? 9 : prev);
    } else if (template === 'procedural') {
      setPetals(prev => prev > 40 || prev < 8 ? 16 : prev);
      setRings(prev => prev > 10 || prev < 3 ? 6 : prev);
    }
  }, [template]);
  
  const [lineColor, setLineColor] = React.useState('#2D3436');
  const [selectedColor, setSelectedColor] = React.useState('#FF8E53');
  const [mode, setMode] = React.useState<'paint' | 'erase' | 'eyedropper' | 'fill' | 'javascript'>('paint');
  const [activePalette, setActivePalette] = React.useState<'warmEarth' | 'coolBlues' | 'natureGreen' | 'sunset' | 'zen'>('sunset');
  
  // JavaScript mode state
  const [jsCode, setJsCode] = React.useState('');
  const [jsError, setJsError] = React.useState<string | null>(null);
  const [showJsEditor, setShowJsEditor] = React.useState(false);

  const [seed, setSeed] = React.useState(1);
  const [sessionStartTime, setSessionStartTime] = React.useState(Date.now());
  const [colorsUsed, setColorsUsed] = React.useState<Set<string>>(new Set());
  
  // ── Session Persistence State ─────────────────────────────────────────────────
  const [sessionId] = React.useState(mood + '-' + Date.now());
  const [lastSaveTime, setLastSaveTime] = React.useState(Date.now());
  const [hasActiveSession, setHasActiveSession] = React.useState(false);
  const [showSessionRestorePrompt, setShowSessionRestorePrompt] = React.useState(false);
  
  // ── Responsive state ──────────────────────────────────────────────────────────
  const [viewportSize, setViewportSize] = React.useState({ width: 0, height: 0 });
  const [isLandscape, setIsLandscape] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [canvasSize, setCanvasSize] = React.useState(600);
  const [zoomLevel, setZoomLevel] = React.useState(1);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(['paint-tools']));
  
  // ── Responsive viewport detection ─────────────────────────────────────────────
  React.useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const landscape = width > height;
      
      setViewportSize({ width, height });
      setIsLandscape(landscape);
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
      
      // Calculate canvas size based on viewport
      let newCanvasSize;
      if (width >= 1024) {
        // Desktop: Fixed 600px
        newCanvasSize = 600;
      } else if (width >= 768) {
        // Tablet
        if (landscape) {
          newCanvasSize = Math.min(550, width * 0.7);
        } else {
          newCanvasSize = Math.min(500, width * 0.85);
        }
      } else {
        // Mobile
        if (landscape) {
          newCanvasSize = Math.min(400, height * 0.6);
        } else {
          newCanvasSize = Math.min(width * 0.9, 500);
        }
      }
      newCanvasSize = Math.max(newCanvasSize, 280); // Minimum size
      setCanvasSize(newCanvasSize);
    };
    
    updateViewport();   
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);
  
  // ── Touch event handling for mobile ───────────────────────────────────────────
  const [touchStartPos, setTouchStartPos] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  
  const handleTouchStart = React.useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setIsDragging(false);
  }, []);
  
  const handleTouchMove = React.useCallback((e: TouchEvent) => {
    if (!touchStartPos) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    
    // If moved more than 10px, consider it a drag/pan gesture
    if (deltaX > 10 || deltaY > 10) {
      setIsDragging(true);
    }
  }, [touchStartPos]);
  
  const handleTouchEnd = React.useCallback(() => {
    setTouchStartPos({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);
  
  // ── Scroll performance optimization ───────────────────────────────────────────
  const [scrollY, setScrollY] = React.useState(0);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  React.useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Debounce scroll end detection
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setScrollY(0); // Reset scroll state
      }, 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const [undoStack, setUndoStack] = React.useState<string[]>([]);
  const [redoStack, setRedoStack] = React.useState<string[]>([]);
  const pendingRestoreRef = React.useRef<string | null>(null);
  const completedRef = React.useRef(false);
  const [renderNonce, setRenderNonce] = React.useState(0);

  // ── Premium Therapeutic Color Palettes ────────────────────────────────────────
  const palettes = {
    warmEarth: {
      name: 'Warm Earth',
      colors: ['#E8B4A4', '#D4A59A', '#C4948B', '#9B7E7A', '#705D56', '#DEB887', '#CD853F', '#8B4513', '#A0522D', '#D2691E']
    },
    coolBlues: {
      name: 'Cool Blues',
      colors: ['#A8DADC', '#457B9D', '#1D3557', '#81B2CA', '#5A8FB4', '#6495ED', '#4682B4', '#5F9EA0', '#4A90A4', '#87CEEB']
    },
    natureGreen: {
      name: 'Nature Green',
      colors: ['#B7CE63', '#8FB339', '#6A994E', '#52734D', '#344E41', '#90EE90', '#3CB371', '#2E8B57', '#228B22', '#006400']
    },
    sunset: {
      name: 'Sunset Glow',
      colors: ['#FF6B6B', '#FF8E53', '#FFA45B', '#FFB84D', '#F9CA24', '#FF7F50', '#FF6347', '#FFA07A', '#FA8072', '#E9967A']
    },
    zen: {
      name: 'Zen Gray',
      colors: ['#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#2D3436', '#1A1A1A', '#000000']
    }
  };

  const palette = palettes[activePalette].colors;

  // ── JavaScript Execution API for filling petals ──────────────────────────────────
  const getMandalaAPI = () => {
    return {
      petals,
      rings,
      totalPetals: petals,
      totalRings: rings,
      fill: (elementSelector: string | number[], color: string) => {
        if (!svgRef.current) return;
        let elements:  Element[] = [];
        
        if (typeof elementSelector === 'string') {
          // CSS selector like "petal-0", "ring-2", "*"
          elements =Array.from(svgRef.current.querySelectorAll(`[data-part="${elementSelector}"]`));
        } else if (Array.isArray(elementSelector)) {
          // Array of indices: [0, 1, 2]
          elementSelector.forEach(idx => {
            const el = svgRef.current?.querySelector(`[data-part*="-${idx}"]`);
            if (el) elements.push(el);
          });
        }
        
        (elements as any[]).forEach((el: PaintableEl) => {
          el.setAttribute('fill', color);
        });
      },
      fillPetal: (index: number, color: string) => {
        if (!svgRef.current) return;
        // Fill all parts of a petal by finding parts that contain the index
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

  const executeJavaScript = () => {
    if (!jsCode.trim()) return;
    
    setJsError(null);
    snapshot();
    setRedoStack([]);
    
    try {
      const mandala = getMandalaAPI();
      // Create a function from the code and execute it with mandala API
      // eslint-disable-next-line no-new-func
      const userFunc = new Function('mandala', jsCode);
      userFunc(mandala);
      
      // Track colors used
      palette.forEach(c => {
        if (!colorsUsed.has(c)) {
          setColorsUsed(new Set([...colorsUsed, c]));
        }
      });
      
      // Auto-save after JavaScript execution
      setTimeout(() => {
        if (svgRef.current) {
          const sessionData = {
            id: sessionId,
            mood,
            template,
            petals,
            rings,
            stroke,
            lineColor,
            selectedColor,
            activePalette,
            svgContent: svgRef.current.outerHTML,
            colorsUsed: Array.from(colorsUsed),
            sessionStartTime,
            lastSaveTime: Date.now(),
            timestamp: new Date().toISOString(),
          };
          
          try {
            const activeSessionKey = `mandala-active-session-${mood}`;
            localStorage.setItem(activeSessionKey, JSON.stringify(sessionData));
          } catch (error) {
            console.warn('Failed to save session:', error);
          }
        }
      }, 100);
    } catch (error) {
      setJsError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // ── Session Persistence (Auto-save & Restoration) ──────────────────────────────
  const saveSessionToStorage = React.useCallback(() => {
    if (!svgRef.current) return;
    
    const sessionData = {
      id: sessionId,
      mood,
      template,
      petals,
      rings,
      stroke,
      lineColor,
      selectedColor,
      activePalette,
      svgContent: svgRef.current.outerHTML,
      colorsUsed: Array.from(colorsUsed),
      sessionStartTime,
      lastSaveTime: Date.now(),
      timestamp: new Date().toISOString(),
    };
    
    try {
      // Save to localStorage (persists across browser sessions)
      const activeSessionKey = `mandala-active-session-${mood}`;
      localStorage.setItem(activeSessionKey, JSON.stringify(sessionData));
      setLastSaveTime(Date.now());
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }, [sessionId, mood, template, petals, rings, stroke, lineColor, selectedColor, activePalette, colorsUsed, sessionStartTime]);

  const getSessionFromStorage = React.useCallback(() => {
    try {
      // Load from localStorage (persists across browser sessions)
      const activeSessionKey = `mandala-active-session-${mood}`;
      const saved = localStorage.getItem(activeSessionKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [mood]);

  const loadSession = React.useCallback((sessionData: any) => {
    pendingRestoreRef.current = sessionData.svgContent || null;
    setTemplate(sessionData.template);
    setPetals(sessionData.petals);
    setRings(sessionData.rings);
    setStroke(sessionData.stroke);
    setLineColor(sessionData.lineColor);
    setSelectedColor(sessionData.selectedColor);
    setActivePalette(sessionData.activePalette);
    setColorsUsed(new Set(sessionData.colorsUsed));
    setSessionStartTime(sessionData.sessionStartTime);
    setRenderNonce((n) => n + 1); // force the render effect to run and inject the artwork
  }, []);

  const completeAndArchiveSession = React.useCallback(async () => {
    if (!svgRef.current) return;
    completedRef.current = true;

    const sessionDuration = Date.now() - sessionStartTime;
    const completionData = {
      id: sessionId,
      mood,
      template,
      colorsUsed: Array.from(colorsUsed),
      percentComplete: 100,
      duration: sessionDuration,
      completedAt: new Date().toISOString(),
      svgContent: svgRef.current.outerHTML,
    };
    
    try {
      // Get existing history
      const historyKey = 'mandala-history';
      const historyJson = localStorage.getItem(historyKey) || '[]';
      const history = JSON.parse(historyJson);
      
      // Add new completed session
      history.push(completionData);
      
      // Keep only last 50 sessions
      if (history.length > 50) {
        history.shift();
      }
      
      localStorage.setItem(historyKey, JSON.stringify(history));

      // Also save to the unified Canvassence gallery for display.
      addArtwork({
        activity: 'healing-mandala',
        mood,
        image: svgToDataUrl(svgRef.current.outerHTML),
      });

      // Clear active session from localStorage
      const activeSessionKey = `mandala-active-session-${mood}`;
      localStorage.removeItem(activeSessionKey);
      setHasActiveSession(false);
      
      // Call onComplete callback
      if (onComplete) {
        const svgAsBlob = new Blob([svgRef.current.outerHTML], { type: 'image/svg+xml' });
        onComplete({
          imageBlob: svgAsBlob,
          sessionDuration,
          colorsUsed: Array.from(colorsUsed),
          percentComplete: 100,
        });
      }
    } catch (error) {
      console.warn('Failed to archive session:', error);
    }
  }, [sessionId, mood, template, colorsUsed, sessionStartTime, onComplete]);

  const clearUnsavedSession = React.useCallback(() => {
    // Clear from localStorage
    const activeSessionKey = `mandala-active-session-${mood}`;
    localStorage.removeItem(activeSessionKey);
    setHasActiveSession(false);
    setShowSessionRestorePrompt(false);
  }, [mood]);

  const handleClose = React.useCallback(() => {  
    if (!completedRef.current) saveSessionToStorage();
    onClose();
  }, [saveSessionToStorage, onClose]);

  // Auto-save every 30 seconds
  React.useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveSessionToStorage();
    }, 30000);
    
    return () => clearInterval(autoSaveInterval);
  }, [saveSessionToStorage]);

  // Check for existing session on mount
  React.useEffect(() => {
    const existingSession = getSessionFromStorage();
    if (existingSession && existingSession.mood === mood) {
      setHasActiveSession(true);
      setShowSessionRestorePrompt(true);
    }
  }, [mood, getSessionFromStorage]);

  // ── Simple deterministic RNG for procedural variety ───────────────────────────
  const prng = React.useMemo(() => {
    let x = seed;
    return () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296;
  }, [seed]);

  // ── Save current SVG for undo ─────────────────────────────────────────────────
  const snapshot = React.useCallback(() => {
    if (!svgRef.current) return;
    const s = new XMLSerializer().serializeToString(svgRef.current);
    setUndoStack((st) => [...st.slice(-14), s]); // keep last 15
  }, []);

  const undo = () => {
    if (!undoStack.length || !svgRef.current) return;
    const current = new XMLSerializer().serializeToString(svgRef.current);
    setRedoStack((st) => [...st, current]);
    
    const last = undoStack[undoStack.length - 1];
    setUndoStack((st) => st.slice(0, -1));
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(last, 'image/svg+xml');
    const newSvg = doc.documentElement as unknown as SVGSVGElement;
    svgRef.current.replaceWith(newSvg);
    svgRef.current = newSvg;
    attachPaintHandlers();
  };

  const redo = () => {
    if (!redoStack.length || !svgRef.current) return;
    snapshot();
    
    const next = redoStack[redoStack.length - 1];
    setRedoStack((st) => st.slice(0, -1));
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(next, 'image/svg+xml');
    const newSvg = doc.documentElement as unknown as SVGSVGElement;
    svgRef.current.replaceWith(newSvg);
    svgRef.current = newSvg;
    attachPaintHandlers();
  };

  // ── Build Traditional Floral Mandala ──────────────────────────────────────────────────
  const buildTraditionalFloral = () => {
    const size = 600;
    const NS = 'http://www.w3.org/2000/svg';
    
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-300 -300 600 600');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('class', 'w-full h-full');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    const g = document.createElementNS(NS, 'g');
    svg.appendChild(g);
    
    // DEBUG: Large red circle at center to verify centering
    const debugDot = document.createElementNS(NS, 'circle');
    debugDot.setAttribute('cx', '0');
    debugDot.setAttribute('cy', '0');
    debugDot.setAttribute('r', '50');
    debugDot.setAttribute('fill', 'red');
    debugDot.setAttribute('opacity', '0.5');
    debugDot.setAttribute('stroke', 'blue');
    debugDot.setAttribute('stroke-width', '3');
    g.appendChild(debugDot);
    
    // Inner ornate center
    const centerMedallion = document.createElementNS(NS, 'circle');
    centerMedallion.setAttribute('r', '20');
    centerMedallion.setAttribute('fill', '#FCFCFC');
    centerMedallion.setAttribute('stroke', lineColor);
    centerMedallion.setAttribute('stroke-width', String(stroke * 1.5));
    centerMedallion.setAttribute('stroke-linecap', 'round');
    centerMedallion.setAttribute('stroke-linejoin', 'round');
    centerMedallion.setAttribute('data-part', 'center-medallion');
    centerMedallion.style.cursor = 'pointer';
    centerMedallion.style.transition = 'fill 150ms cubic-bezier(0.4, 0, 0.2, 1)';
    g.appendChild(centerMedallion);
    
    // Scalloped inner ring
    for (let i = 0; i < 12; i++) {
      const angle = (i * 360 / 12);
      const scallop = document.createElementNS(NS, 'circle');
      const x = 30 * Math.cos((angle * Math.PI) / 180);
      const y = 30 * Math.sin((angle * Math.PI) / 180);
      scallop.setAttribute('cx', String(x));
      scallop.setAttribute('cy', String(y));
      scallop.setAttribute('r', '8');
      scallop.setAttribute('fill', '#FCFCFC');
      scallop.setAttribute('stroke', lineColor);
      scallop.setAttribute('stroke-width', String(stroke));
      scallop.setAttribute('stroke-linecap', 'round');
      scallop.setAttribute('stroke-linejoin', 'round');
      scallop.setAttribute('data-part', `scallop-${i}`);
      scallop.style.cursor = 'pointer';
      scallop.style.transition = 'fill 150ms cubic-bezier(0.4, 0, 0.2, 1)';
      g.appendChild(scallop);
    }
    
    // Mid-layer: Pointed petals with internal details - dynamic layers based on rings slider
    const layerCount = rings; // Use rings slider value (4-12 for traditional-floral)
    const petalLayers = [];
    
    for (let i = 0; i < layerCount; i++) {
      const r1 = 50 + (i * 25);  // Start radius increases with each layer
      const r2 = r1 + 40;        // End radius is always 40px beyond start
      const shape = i % 2 === 0 ? 'teardrop' : 'pointed'; // Alternate shapes
      petalLayers.push({ count: petals, r1, r2, shape });
    }
    
    petalLayers.forEach((layer, layerIdx) => {
      for (let i = 0; i < layer.count; i++) {
        const angle = (i * 360 / layer.count) + (layerIdx * 180 / layer.count);
        const petal = document.createElementNS(NS, 'path');
        
        const path = layer.shape === 'teardrop' 
          ? `M 0 ${-layer.r1} C 20 ${-layer.r1 - 20}, 30 ${-layer.r2}, 0 ${-layer.r2} C -30 ${-layer.r2}, -20 ${-layer.r1 - 20}, 0 ${-layer.r1} Z`
          : `M 0 ${-layer.r1} L 15 ${-layer.r1 - 30} L 25 ${-layer.r2} L 0 ${-layer.r2 - 10} L -25 ${-layer.r2} L -15 ${-layer.r1 - 30} Z`;
        
        petal.setAttribute('d', path);
        petal.setAttribute('transform', `rotate(${angle})`);
        petal.setAttribute('fill', '#FCFCFC');
        petal.setAttribute('stroke', lineColor);
        petal.setAttribute('stroke-width', String(stroke));
        petal.setAttribute('stroke-linecap', 'round');
        petal.setAttribute('stroke-linejoin', 'round');
        petal.setAttribute('data-part', `petal-layer${layerIdx}-${i}`);
        petal.setAttribute('data-ring', String(layerIdx));
        petal.style.cursor = 'pointer';
        petal.style.transition = 'fill 150ms cubic-bezier(0.4, 0, 0.2, 1)';
        g.appendChild(petal);
      }
    });
    
    // Outer decorative leaves
    for (let i = 0; i < petals; i++) {
      const angle = (i * 360 / petals);
      const leaf = document.createElementNS(NS, 'path');
      const r1 = 170;
      const r2 = 220;
      const path = `M 0 ${-r1} C 35 ${-r1 - 25}, 40 ${-r2}, 0 ${-r2 + 10} C -40 ${-r2}, -35 ${-r1 - 25}, 0 ${-r1} Z`;
      leaf.setAttribute('d', path);
      leaf.setAttribute('transform', `rotate(${angle})`);
      leaf.setAttribute('fill', '#FCFCFC');
      leaf.setAttribute('stroke', lineColor);
      leaf.setAttribute('stroke-width', String(stroke * 1.2));
      leaf.setAttribute('stroke-linecap', 'round');
      leaf.setAttribute('stroke-linejoin', 'round');
      leaf.setAttribute('data-part', `outer-leaf-${i}`);
      leaf.style.cursor = 'pointer';
      leaf.style.transition = 'fill 150ms cubic-bezier(0.4, 0, 0.2, 1)';
      g.appendChild(leaf);
      
      // Internal vein
      const vein = document.createElementNS(NS, 'line');
      const vx1 = 0, vy1 = -r1;
      const vx2 = 0, vy2 = -r2 + 10;
      vein.setAttribute('x1', String(vx1));
      vein.setAttribute('y1', String(vy1));
      vein.setAttribute('x2', String(vx2));
      vein.setAttribute('y2', String(vy2));
      vein.setAttribute('transform', `rotate(${angle})`);
      vein.setAttribute('stroke', lineColor);
      vein.setAttribute('stroke-width', String(stroke * 0.5));
      vein.setAttribute('stroke-linecap', 'round');
      g.appendChild(vein);
    }
    
    return svg;
  };

  // ── Build Dot Mandala ─────────────────────────────────────────────────────────────────
  const buildDotMandala = () => {
    const size = 600;
    const NS = 'http://www.w3.org/2000/svg';
    
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-300 -300 600 600');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('class', 'w-full h-full');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    const g = document.createElementNS(NS, 'g');
    svg.appendChild(g);
    
    // Center white circle
    const center = document.createElementNS(NS, 'circle');
    center.setAttribute('r', '30');
    center.setAttribute('fill', '#FCFCFC');
    center.setAttribute('stroke', lineColor);
    center.setAttribute('stroke-width', String(stroke * 2));
    center.setAttribute('stroke-linecap', 'round');
    center.setAttribute('data-part', 'center');
    center.style.cursor = 'pointer';
    center.style.transition = 'fill 150ms cubic-bezier(0.4, 0, 0.2, 1)';
    g.appendChild(center);
    
    // Radial line pattern in center
    for (let i = 0; i < 16; i++) {
      const angle = (i * 360 / 16) * Math.PI / 180;
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', String(10 * Math.cos(angle)));
      line.setAttribute('y1', String(10 * Math.sin(angle)));
      line.setAttribute('x2', String(20 * Math.cos(angle)));
      line.setAttribute('y2', String(20 * Math.sin(angle)));
      line.setAttribute('stroke', lineColor);
      line.setAttribute('stroke-width', String(stroke * 0.5));
      line.setAttribute('stroke-linecap', 'round');
      g.appendChild(line);
    }
    
    // Concentric dot rings - dynamically generated based on rings slider
    const ringCount = rings; // Use rings slider value (5-15 for dot-mandala)
    const dotRings: number[] = [];
    const dotsPerRing: number[] = [];
    
    for (let i = 0; i < ringCount; i++) {
      dotRings.push(40 + (i * 15)); // Evenly spaced rings starting at 40px
      dotsPerRing.push(8 + (i * 4)); // Incrementally more dots per ring
    }
    
    dotRings.forEach((radius, ringIdx) => {
      const numDots = dotsPerRing[ringIdx];
      const dotSize = 6 - (ringIdx * (4 / ringCount)); // Scale dot size based on ring count
      
      for (let i = 0; i < numDots; i++) {
        const angle = (i * 360 / numDots) * Math.PI / 180;
        const jitter = (prng() - 0.5) * 2; // Slight organic variation
        const x = (radius + jitter) * Math.cos(angle);
        const y = (radius + jitter) * Math.sin(angle);
        
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', String(x));
        dot.setAttribute('cy', String(y));
        dot.setAttribute('r', String(dotSize));
        dot.setAttribute('fill', '#FCFCFC');
        dot.setAttribute('stroke', lineColor);
        dot.setAttribute('stroke-width', String(stroke * 0.5));
        dot.setAttribute('data-part', `dot-ring${ringIdx}-${i}`);
        dot.setAttribute('data-ring', String(ringIdx));
        dot.style.cursor = 'pointer';
        dot.style.transition = 'fill 150ms cubic-bezier(0.4, 0, 0.2, 1)';
        g.appendChild(dot);
      }
    });
    
    // Outer flame/teardrop petals
    const flamePetals = petals;
    for (let i = 0; i < flamePetals; i++) {
      const angle = (i * 360 / flamePetals);
      
      // Create flame shape in 3 segments for gradient coloring
      const segments = [
        { path: `M 0 -185 C 15 -195, 20 -210, 0 -225 C -20 -210, -15 -195, 0 -185 Z`, part: 'tip' },
        { path: `M 0 -185 C 20 -180, 25 -165, 0 -145 C -25 -165, -20 -180, 0 -185 Z`, part: 'middle' },
        { path: `M 0 -145 C 15 -140, 20 -125, 0 -110 C -20 -125, -15 -140, 0 -145 Z`, part: 'base' }
      ];
      
      segments.forEach((seg, segIdx) => {
        const segPath = document.createElementNS(NS, 'path');
        segPath.setAttribute('d', seg.path);
        segPath.setAttribute('transform', `rotate(${angle})`);
        segPath.setAttribute('fill', '#FCFCFC');
        segPath.setAttribute('stroke', lineColor);
        segPath.setAttribute('stroke-width', String(stroke));
        segPath.setAttribute('stroke-linecap', 'round');
        segPath.setAttribute('stroke-linejoin', 'round');
        segPath.setAttribute('data-part', `flame-${i}-${seg.part}`);
        segPath.style.cursor = 'pointer';
        segPath.style.transition = 'fill 150ms cubic-bezier(0.4, 0, 0.2, 1)';
        g.appendChild(segPath);
        
        // Internal dots in petals
        if (segIdx === 1) {
          for (let d = 0; d < 3; d++) {
            const dotAngle = angle * Math.PI / 180;
            const dotRadius = -155 + (d * 10);
            const dx = dotRadius * Math.sin(dotAngle);
            const dy = dotRadius * Math.cos(dotAngle);
            
            const petalDot = document.createElementNS(NS, 'circle');
            petalDot.setAttribute('cx', String(dx));
            petalDot.setAttribute('cy', String(dy));
            petalDot.setAttribute('r', '3');
            petalDot.setAttribute('fill', '#FCFCFC');
            petalDot.setAttribute('stroke', lineColor);
            petalDot.setAttribute('stroke-width', String(stroke * 0.3));
            petalDot.setAttribute('data-part', `flame-${i}-dot${d}`);
            petalDot.style.cursor = 'pointer';
            petalDot.style.transition = 'fill 150ms cubic-bezier(0.4, 0, 0.2, 1)';
            g.appendChild(petalDot);
          }
        }
      });
    }
    
    return svg;
  };

  // ── Build procedural mandala (paintable segments) ─────────────────────────────
  const buildProcedural = () => {
    const size = 600;
    const NS = 'http://www.w3.org/2000/svg';

    // Create SVG
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-300 -300 600 600');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('class', 'w-full h-full');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Root group - no transform needed with centered viewBox
    const g = document.createElementNS(NS, 'g');
    svg.appendChild(g);

    // Concentric rings as paintable donuts - optimized scale
    const ringCount = rings;
    for (let ri = 0; ri < ringCount; ri++) {
      const rInner = 25 + ri * 28; // Start at 25px from center
      const rOuter = rInner + 22;  // 22px wide rings
      for (let pi = 0; pi < petals; pi++) {
        const a0 = (pi * 2 * Math.PI) / petals;
        const a1 = ((pi + 1) * 2 * Math.PI) / petals;
        const path = document.createElementNS(NS, 'path');

        // donut slice (two arcs)
        const x0 = rInner * Math.cos(a0), y0 = rInner * Math.sin(a0);
        const x1 = rInner * Math.cos(a1), y1 = rInner * Math.sin(a1);
        const X0 = rOuter * Math.cos(a0), Y0 = rOuter * Math.sin(a0);
        const X1 = rOuter * Math.cos(a1), Y1 = rOuter * Math.sin(a1);

        const largeArc = a1 - a0 > Math.PI ? 1 : 0;
        const d = [
          `M ${x0} ${y0}`,
          `A ${rInner} ${rInner} 0 ${largeArc} 1 ${x1} ${y1}`,
          `L ${X1} ${Y1}`,
          `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${X0} ${Y0}`,
          'Z'
        ].join(' ');

        path.setAttribute('d', d);
        path.setAttribute('fill', '#FCFCFC');
        path.setAttribute('stroke', lineColor);
        path.setAttribute('stroke-width', String(stroke));
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('data-part', `ring-${ri}-petal-${pi}`);
        path.setAttribute('data-ring', String(ri));
        (path as SVGPathElement).style.cursor = 'pointer';
        (path as SVGPathElement).style.transition = 'fill 150ms cubic-bezier(0.4, 0, 0.2, 1)';
        g.appendChild(path);
      }
    }

    // Decorative leaf petals - proper scale
    const leafCount = petals;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * 360) / leafCount;
      const leaf = document.createElementNS(NS, 'path');
      const r1 = 45 + prng() * 5;   // Start radius
      const r2 = 140 + riRand();     // Mid radius
      const r3 = 230 + riRand();     // End radius
      function riRand() { return (prng() - 0.5) * 12; }
      const path = `
        M 0 ${-r1}
        C ${30} ${-r1 - 30}, ${60} ${-r2}, 0 ${-r3}
        C ${-60} ${-r2}, ${-30} ${-r1 - 30}, 0 ${-r1}
        Z
      `;
      leaf.setAttribute('d', path);
      leaf.setAttribute('transform', `rotate(${angle})`);
      leaf.setAttribute('fill', '#FCFCFC');
      leaf.setAttribute('stroke', lineColor);
      leaf.setAttribute('stroke-width', String(stroke));
      leaf.setAttribute('stroke-linecap', 'round');
      leaf.setAttribute('stroke-linejoin', 'round');
      leaf.setAttribute('data-part', `leaf-${i}`);
      (leaf as SVGPathElement).style.cursor = 'pointer';
      (leaf as SVGPathElement).style.transition = 'fill 150ms cubic-bezier(0.4, 0, 0.2, 1)';
      g.appendChild(leaf);
    }

    // Center
    const center = document.createElementNS(svg.namespaceURI, 'circle');
    center.setAttribute('r', '14');
    center.setAttribute('fill', '#FCFCFC');
    center.setAttribute('stroke', lineColor);
    center.setAttribute('stroke-width', String(stroke));
    center.setAttribute('stroke-linecap', 'round');
    center.setAttribute('data-part', 'center');
    (center as SVGCircleElement).style.cursor = 'pointer';
    (center as SVGCircleElement).style.transition = 'fill 150ms cubic-bezier(0.4, 0, 0.2, 1)';
    g.appendChild(center);

    return svg;
  };  // ── Render selected template into container ───────────────────────────────────
  const renderTemplate = React.useCallback(() => {
    const c = containerRef.current;
    if (!c) return;

    c.innerHTML = '';

    // Restoring a saved session: inject the previously painted SVG instead of
    // building a fresh blank template. loadSession() stores the artwork here and
    // bumps renderNonce to trigger this effect. (Without this, Restore showed a
    // blank template because the saved artwork was never injected.)
    const pending = pendingRestoreRef.current;
    if (pending) {
      pendingRestoreRef.current = null;
      const doc = new DOMParser().parseFromString(pending, 'image/svg+xml');
      const restoredSvg = doc.documentElement as unknown as SVGSVGElement;
      c.appendChild(restoredSvg);
      svgRef.current = restoredSvg;
      attachPaintHandlers();
      snapshot();
      return;
    }

    let svgEl: SVGSVGElement | null = null;

    switch (template) {
      case 'traditional-floral':
        svgEl = buildTraditionalFloral();
        break;
      case 'dot-mandala':
        svgEl = buildDotMandala();
        break;
      case 'geometric-sacred':
      case 'organic-lotus':
        // Fallback to procedural for now
        svgEl = buildProcedural();
        break;
      case 'procedural':
      default:
        svgEl = buildProcedural();
    }

    c.appendChild(svgEl!);
    svgRef.current = svgEl!;
    attachPaintHandlers();
    snapshot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, petals, rings, stroke, lineColor, seed, renderNonce]);

  // ── Attach click/touch handlers to paint segments ─────────────────────────────
  const handlePaint = React.useCallback((e: MouseEvent | TouchEvent) => {
    // Prevent default to avoid scroll conflicts on touch
    e.preventDefault();
    
    // Skip if this was a drag gesture or in JavaScript mode
    if (isDragging || mode === 'javascript') return;
    
    const target = e.target as Element;
    if (!svgRef.current) return;
    if (!(target instanceof SVGPathElement || target instanceof SVGPolygonElement || target instanceof SVGRectElement || target instanceof SVGCircleElement)) {
      return;
    }
    if (target.tagName.toLowerCase() === 'svg' || target.tagName.toLowerCase() === 'g') return;

    if (mode === 'eyedropper') {
      const current = target.getAttribute('fill') || '#FCFCFC';
      if (current !== '#FCFCFC') {
        setSelectedColor(current);
      }
      setMode('paint');
      return;
    }

    snapshot();
    setRedoStack([]); // Clear redo stack on new action

    if (mode === 'erase') {
      target.setAttribute('fill', '#FCFCFC');
    } else if (mode === 'fill') {
      // Ring fill mode - paint all segments in same ring
      const ringAttr = target.getAttribute('data-ring');
      if (ringAttr) {
        const elements = svgRef.current.querySelectorAll(`[data-ring="${ringAttr}"]`);
        elements.forEach(el => (el as PaintableEl).setAttribute('fill', selectedColor));
      } else {
        target.setAttribute('fill', selectedColor);
      }
    } else {
      // Regular paint with symmetry
      const paintTargets: Element[] = [target];
      
      if (symmetryMode > 1) {
        const part = target.getAttribute('data-part');
        if (part && part.includes('-')) {
          const basePart = part.substring(0, part.lastIndexOf('-'));
          const index = parseInt(part.substring(part.lastIndexOf('-') + 1));
          
          for (let i = 1; i < symmetryMode; i++) {
            const newIndex = (index + (petals / symmetryMode) * i) % petals;
            const symmetricPart = `${basePart}-${newIndex}`;
            const symmetricEl = svgRef.current.querySelector(`[data-part="${symmetricPart}"]`);
            if (symmetricEl) paintTargets.push(symmetricEl);
          }
        }
      }
      
      paintTargets.forEach(t => (t as PaintableEl).setAttribute('fill', selectedColor));
    }
    
    // Track color usage
    if (!colorsUsed.has(selectedColor)) {
      setColorsUsed(new Set([...colorsUsed, selectedColor]));
    }
    
    // Auto-save after paint action
    setTimeout(() => saveSessionToStorage(), 100);
  }, [selectedColor, mode, isDragging, petals, symmetryMode, colorsUsed, saveSessionToStorage]);

  const attachPaintHandlers = () => {
    if (!svgRef.current) return;
    
    // Mouse events for desktop
    svgRef.current.addEventListener('click', handlePaint);
    
    // Touch events for mobile
    svgRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });
    svgRef.current.addEventListener('touchmove', handleTouchMove, { passive: true });
    svgRef.current.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Prevent default touch behaviors that interfere with painting
    svgRef.current.style.touchAction = 'none';
  };

  React.useEffect(() => {
    renderTemplate();
    return () => {
      svgRef.current?.removeEventListener('click', handlePaint);
      svgRef.current?.removeEventListener('touchstart', handleTouchStart);
      svgRef.current?.removeEventListener('touchmove', handleTouchMove);
      svgRef.current?.removeEventListener('touchend', handleTouchEnd);
    };
  }, [renderTemplate]);

  // Re-attach paint handler when selectedColor or mode changes (fixes stale closure bug)
  React.useEffect(() => {
    if (!svgRef.current) return;
    
    // Remove old listener to avoid duplicates
    svgRef.current.removeEventListener('click', handlePaint);
    
    // Attach new listener with current selectedColor and mode in closure
    svgRef.current.addEventListener('click', handlePaint);
    
    return () => {
      svgRef.current?.removeEventListener('click', handlePaint);
    };
  }, [selectedColor, mode, handlePaint]);

  // If stroke color/width change, update current SVG strokes
  React.useEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.querySelectorAll<PaintableEl>('path, polygon, rect, circle').forEach(el => {
      el.setAttribute('stroke', lineColor);
      el.setAttribute('stroke-width', String(stroke));
    });
  }, [lineColor, stroke]);

  const randomize = () => {
    setSeed(s => s + 1);
    setPetals(Math.floor(Math.random() * 21) + 12); // 12-32
    setRings(Math.floor(Math.random() * 6) + 4);    // 4-9
  };

  // ── Export utilities ──────────────────────────────────────────────────────────
  const exportSVG = () => {
    if (!svgRef.current) return;
    const s = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([s], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mandala-${template}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = async () => {
    if (!svgRef.current) return;
    const s = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([s], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const box = svgRef.current!.viewBox.baseVal;
      canvas.width = box.width;
      canvas.height = box.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((b) => {
        if (!b) return;
        const url = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mandala-${template}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = svgUrl;
  };

  const clearColors = () => {
    if (!svgRef.current) return;
    snapshot();
    setRedoStack([]);
    svgRef.current.querySelectorAll<PaintableEl>('path, polygon, rect, circle').forEach(el => {
      el.setAttribute('fill', '#FCFCFC');
    });
    // Save session after clearing
    setTimeout(() => saveSessionToStorage(), 100);
  };

  const canComplete = true;

  // ── Zoom controls ────────────────────────────────────────────────────────────
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };
  
  const resetZoom = () => {
    setZoomLevel(1);
  };

  // ── Section toggle helpers ───────────────────────────────────────────────────
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isSectionExpanded = (sectionId: string) => expandedSections.has(sectionId);

  // ── UI ────────────────────────────────────────────────────────────────────────
  
  // ── Sub-components for responsive layout ─────────────────────────────────────
  const GeometryControls = () => (
    <>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
        {template === 'traditional-floral' ? 'Petal Design' : template === 'dot-mandala' ? 'Dot Pattern' : 'Customize Geometry'}
      </h3>
      
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {template === 'traditional-floral' ? 'Main Petals' : template === 'dot-mandala' ? 'Outer Petals' : 'Petals'}
            </label>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{petals}</span>
          </div>
          <input 
            type="range" 
            min={template === 'traditional-floral' ? 8 : template === 'dot-mandala' ? 8 : 8} 
            max={template === 'traditional-floral' ? 24 : template === 'dot-mandala' ? 16 : 40} 
            value={petals} 
            onChange={(e) => setPetals(Number(e.target.value))} 
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{template === 'traditional-floral' ? '8' : template === 'dot-mandala' ? '8' : '8'}</span>
            <span>{template === 'traditional-floral' ? '24' : template === 'dot-mandala' ? '16' : '40'}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {template === 'traditional-floral' ? 'Petal Layers' : template === 'dot-mandala' ? 'Dot Rings' : 'Rings'}
            </label>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{rings}</span>
          </div>
          <input 
            type="range" 
            min={template === 'traditional-floral' ? 4 : template === 'dot-mandala' ? 5 : 3} 
            max={template === 'traditional-floral' ? 12 : template === 'dot-mandala' ? 15 : 10} 
            value={rings} 
            onChange={(e) => setRings(Number(e.target.value))} 
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{template === 'traditional-floral' ? '4' : template === 'dot-mandala' ? '5' : '3'}</span>
            <span>{template === 'traditional-floral' ? '12' : template === 'dot-mandala' ? '15' : '10'}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Stroke Width</label>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{stroke}px</span>
          </div>
          <input 
            type="range" 
            min={1} 
            max={6} 
            value={stroke} 
            onChange={(e) => setStroke(Number(e.target.value))} 
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>6</span>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-500 mb-2">Quick Presets</p>
        <div className="grid grid-cols-2 gap-2">
          {template === 'traditional-floral' ? (
            <>
              <Button size="sm" variant="outline" onClick={() => { setPetals(8); setRings(4); }} className="text-xs">Simple Lotus</Button>
              <Button size="sm" variant="outline" onClick={() => { setPetals(12); setRings(6); }} className="text-xs">Classic</Button>
              <Button size="sm" variant="outline" onClick={() => { setPetals(16); setRings(8); }} className="text-xs">Intricate</Button>
              <Button size="sm" variant="outline" onClick={() => { setPetals(20); setRings(10); }} className="text-xs">Detailed</Button>
            </>
          ) : template === 'dot-mandala' ? (
            <>
              <Button size="sm" variant="outline" onClick={() => { setPetals(8); setRings(6); }} className="text-xs">Minimal</Button>
              <Button size="sm" variant="outline" onClick={() => { setPetals(12); setRings(9); }} className="text-xs">Balanced</Button>
              <Button size="sm" variant="outline" onClick={() => { setPetals(14); setRings(12); }} className="text-xs">Dense</Button>
              <Button size="sm" variant="outline" onClick={() => { setPetals(16); setRings(15); }} className="text-xs">Complex</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => { setPetals(12); setRings(4); }} className="text-xs">Beginner</Button>
              <Button size="sm" variant="outline" onClick={() => { setPetals(16); setRings(6); }} className="text-xs">Standard</Button>
              <Button size="sm" variant="outline" onClick={() => { setPetals(24); setRings(8); }} className="text-xs">Detailed</Button>
              <Button size="sm" variant="outline" onClick={() => { setPetals(32); setRings(10); }} className="text-xs">Expert</Button>
            </>
          )}
        </div>
      </div>

      <Button 
        size="sm" 
        variant="outline" 
        onClick={randomize}
        className="w-full"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Randomize Design
      </Button>
    </>
  );

  const StyleControls = () => (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Stroke Width</label>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{stroke}px</span>
        </div>
        <input 
          type="range" 
          min={1} 
          max={6} 
          value={stroke} 
          onChange={(e) => setStroke(Number(e.target.value))} 
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Line Color</label>
        <input 
          type="color" 
          value={lineColor} 
          onChange={(e) => setLineColor(e.target.value)} 
          className="h-8 w-12 rounded cursor-pointer"
        />
      </div>

      <p className="text-xs text-gray-500 italic pt-2 border-t border-gray-200 dark:border-gray-700">
        This is a pre-designed template. Geometry cannot be modified.
      </p>
    </>
  );

  return (
    <>
      {/* Session Restore Prompt */}
      {showSessionRestorePrompt && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-300">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Restore Previous Session?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              We found an unsaved mandala session from your last visit. Would you like to continue where you left off?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const sessionData = getSessionFromStorage();
                  if (sessionData) {
                    loadSession(sessionData);
                  }
                  setShowSessionRestorePrompt(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Restore
              </button>
              <button
                onClick={() => {
                  clearUnsavedSession();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}

    <div 
      ref={modalRef}
      className={`
        fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center
        ${isMobile ? 'p-0' : 'p-4 animate-in fade-in-0 duration-300'}
      `}
      style={{
        paddingTop: isMobile ? 'env(safe-area-inset-top, 0)' : undefined,
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0)' : undefined,
        paddingLeft: isMobile ? 'env(safe-area-inset-left, 0)' : undefined,
        paddingRight: isMobile ? 'env(safe-area-inset-right, 0)' : undefined,
      }}
    >
      <div 
        className={`
          bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 
          shadow-2xl flex flex-col overflow-hidden
          ${isMobile 
            ? 'w-full h-full rounded-none' 
            : isTablet 
              ? 'w-[95vw] max-w-4xl h-[95vh] rounded-xl' 
              : 'w-full max-w-6xl h-[90vh] rounded-2xl animate-in zoom-in-95 duration-300'
          }
        `}
        style={{
          maxHeight: isMobile ? '100vh' : isTablet ? '95vh' : '90vh',
        }}
      >
        {/* Sticky Header */}
        <div className={`
          sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700
          ${isMobile ? 'px-4 py-3' : 'px-8 py-4'}
        `}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`
                font-semibold text-gray-900 dark:text-white
                ${isMobile ? 'text-lg' : 'text-2xl'}
              `}>
                Healing Mandala Therapy
              </h2>
              <p className={`
                text-indigo-600 dark:text-indigo-400 font-medium mt-1
                ${isMobile ? 'text-xs' : 'text-sm'}
              `}>
                Current mood: {mood}
              </p>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleClose} 
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: '#888 #f1f1f1',
          }}
        >
          <div className={`
            ${isMobile ? 'p-4 space-y-4' : 'p-8 space-y-6'}
          `}>
            {/* Instructions */}
            <p className={`
              text-gray-600 dark:text-gray-300 leading-relaxed italic
              ${isMobile ? 'text-sm' : 'text-sm'}
            `}>
              Select a color from the palette below and tap segments to paint your mandala. Let creativity flow as you create your unique healing pattern.
            </p>

            {/* Main Content Layout */}
            <div className={`
              ${isDesktop 
                ? 'grid grid-cols-[320px_1fr] gap-6' 
                : 'space-y-6'
              }
            `}>
              
              {/* Controls Panel */}
              <div className={`
                space-y-4
                ${isMobile ? 'space-y-3' : 'space-y-6'}
              `}>
                
                {/* Template Selection - Collapsible on Mobile */}
                {isMobile ? (
                  <details className="group bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <summary className="cursor-pointer p-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Mandala Design</h3>
                      <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 space-y-3">
                      <div className="flex flex-col gap-2">
                        {(['traditional-floral', 'dot-mandala', 'procedural'] as const).map((t) => (
                          <Button 
                            key={t} 
                            size="sm" 
                            variant={template === t ? 'default' : 'outline'}
                            onClick={() => setTemplate(t)}
                            className="justify-start transition-all duration-200 text-xs"
                          >
                            {t === 'traditional-floral' ? '🌸 Traditional Floral' : t === 'dot-mandala' ? '⚪ Dot Mandala' : '⚙️ Procedural Custom'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </details>
                ) : (
                  <section className="space-y-3">
                    <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Mandala Design</h3>
                    <div className="flex flex-col gap-2">
                      {(['traditional-floral', 'dot-mandala', 'procedural'] as const).map((t) => (
                        <Button 
                          key={t} 
                          size="sm" 
                          variant={template === t ? 'default' : 'outline'}
                          onClick={() => setTemplate(t)}
                          className="justify-start transition-all duration-200"
                        >
                          {t === 'traditional-floral' ? '🌸 Traditional Floral' : t === 'dot-mandala' ? '⚪ Dot Mandala' : '⚙️ Procedural Custom'}
                        </Button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Geometry Controls - Always visible on desktop/tablet, collapsible on mobile */}
                {isMobile ? (
                  <details className="group bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <summary className="cursor-pointer p-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Geometry Controls</h3>
                      <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4">
                      <GeometryControls />
                    </div>
                  </details>
                ) : (
                  <section className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <GeometryControls />
                  </section>
                )}

                {/* Style Controls - Only for pre-designed templates */}
                {template !== 'procedural' && (
                  isMobile ? (
                    <details className="group bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <summary className="cursor-pointer p-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Style Settings</h3>
                        <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="px-4 pb-4 space-y-3">
                        <StyleControls />
                      </div>
                    </details>
                  ) : (
                    <section className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                      <StyleControls />
                    </section>
                  )
                )}
                
                {/* Paint Tools - Always expanded on mobile */}
                <section className="space-y-3">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Paint Tools</h3>
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm" 
                      variant={mode === 'paint' ? 'default' : 'outline'}
                      onClick={() => setMode('paint')}
                      className="justify-start transition-all duration-200"
                    >
                      <Paintbrush className="w-4 h-4 mr-2" />
                      Paint
                    </Button>
                    <Button 
                      size="sm" 
                      variant={mode === 'fill' ? 'default' : 'outline'}
                      onClick={() => setMode('fill')}
                      className="justify-start transition-all duration-200"
                      title="Fill all segments in the same ring"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Ring Fill
                    </Button>
                    <Button 
                      size="sm" 
                      variant={mode === 'erase' ? 'default' : 'outline'}
                      onClick={() => setMode('erase')}
                      className="justify-start transition-all duration-200"
                    >
                      <Eraser className="w-4 h-4 mr-2" />
                      Erase
                    </Button>
                    <Button 
                      size="sm" 
                      variant={mode === 'eyedropper' ? 'default' : 'outline'}
                      onClick={() => setMode('eyedropper')}
                      className="justify-start transition-all duration-200"
                      title="Pick color from mandala"
                    >
                      <Droplet className="w-4 h-4 mr-2" />
                      Pick Color
                    </Button>
                    <Button 
                      size="sm" 
                      variant={mode === 'javascript' ? 'default' : 'outline'}
                      onClick={() => {
                        setMode('javascript');
                        setShowJsEditor(!showJsEditor);
                      }}
                      className="justify-start transition-all duration-200"
                      title="Fill using JavaScript"
                    >
                      <code className="w-4 h-4 mr-2">{'</>'}</code>
                      Learn & Code
                    </Button>
                  </div>
                </section>

                {/* JavaScript Editor Section */}
                {mode === 'javascript' && showJsEditor && (
                  <section className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">JavaScript Code Editor</h3>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Write JavaScript to fill your mandala. Use the <code className="bg-white dark:bg-gray-900 px-1 rounded">mandala</code> object to interact.
                      </p>
                    </div>
                    
                    {/* Code Examples */}
                    <div className="bg-white dark:bg-gray-900 p-3 rounded text-xs font-mono text-gray-700 dark:text-gray-300 space-y-2 max-h-40 overflow-y-auto border border-blue-200 dark:border-blue-800">
                      <div className="text-blue-600 dark:text-blue-400 font-semibold">Examples:</div>
                      <div className="text-gray-500">// Fill all petals with the selected color</div>
                      <div>for(let i=0; i&lt;mandala.petals; i++) mandala.fillPetal(i, mandala.getColor());</div>
                      <div className="text-gray-500 pt-2">// Fill rings with palette colors</div>
                      <div>const p = mandala.getPalette();</div>
                      <div>for(let i=0; i&lt;mandala.rings; i++) mandala.fillRing(i, p[i % p.length]);</div>
                      <div className="text-gray-500 pt-2">// Rainbow effect</div>
                      <div>for(let i=0; i&lt;mandala.petals; i++) mandala.fillPetal(i, mandala.getPalette()[i % 10]);</div>
                    </div>

                    {/* Code Input */}
                    <textarea
                      value={jsCode}
                      onChange={(e) => setJsCode(e.target.value)}
                      placeholder="// Enter your JavaScript code here\n// Example: for(let i=0; i<mandala.petals; i++) mandala.fillPetal(i, mandala.getColor());"
                      className="w-full h-32 p-3 font-mono text-sm border border-blue-200 dark:border-blue-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />

                    {/* API Documentation */}
                    <div className="bg-white dark:bg-gray-900 p-3 rounded text-xs text-gray-700 dark:text-gray-300 space-y-1 max-h-32 overflow-y-auto border border-blue-200 dark:border-blue-800">
                      <div className="font-semibold text-blue-600 dark:text-blue-400">Available Methods:</div>
                      <div><span className="font-mono text-green-600 dark:text-green-400">fillPetal(index, color)</span> - Fill petal at index</div>
                      <div><span className="font-mono text-green-600 dark:text-green-400">fillRing(ringIndex, color)</span> - Fill entire ring</div>
                      <div><span className="font-mono text-green-600 dark:text-green-400">getColor()</span> - Get selected color</div>
                      <div><span className="font-mono text-green-600 dark:text-green-400">getPalette()</span> - Get color array</div>
                      <div><span className="font-mono text-green-600 dark:text-green-400">random()</span> - Get random number 0-1</div>
                    </div>

                    {/* Error Display */}
                    {jsError && (
                      <div className="p-3 bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded">
                        <p className="text-xs font-semibold text-red-800 dark:text-red-200">Error:</p>
                        <p className="text-xs text-red-700 dark:text-red-300 font-mono">{jsError}</p>
                      </div>
                    )}

                    {/* Execute Button */}
                    <Button
                      onClick={executeJavaScript}
                      className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
                    >
                      Run Code
                    </Button>
                  </section>
                )}

                {/* Actions */}
                <section className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">Actions</h3>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" onClick={undo} disabled={!undoStack.length} className="justify-start">
                      <Undo2 className="w-4 h-4 mr-2" />
                      Undo
                    </Button>
                    <Button size="sm" variant="outline" onClick={redo} disabled={!redoStack.length} className="justify-start">
                      <Redo2 className="w-4 h-4 mr-2" />
                      Redo
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearColors} className="justify-start">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                  
                  {/* Complete Session Button */}
                  <Button 
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white justify-start"
                    onClick={completeAndArchiveSession}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Complete & Save
                  </Button>
                  
                  {/* Auto-save Status */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      Auto-saving every 30 seconds
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Last saved: {new Date(lastSaveTime).toLocaleTimeString()}
                    </div>
                  </div>
                </section>
              </div>

              {/* Canvas & Color Palette Panel */}
              <div className="space-y-6">
                {/* Canvas Container */}
                <div className="relative w-full flex justify-center">
                  <div 
                    className="relative aspect-square rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)] overflow-hidden"
                    style={{ 
                      width: canvasSize,
                      maxWidth: '100%',
                      backgroundColor: '#FEFEFE',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.02\'/%3E%3C/svg%3E")',
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center',
                      transition: scrollY > 0 ? 'none' : 'transform 0.2s ease-out',
                    }}
                  >
                    <div 
                      ref={containerRef} 
                      className="w-full h-full"
                      style={{ display: 'block' }}
                    />
                    
                    {/* Zoom Controls - Only show when zoomed */}
                    {zoomLevel !== 1 && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button size="sm" variant="secondary" onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))} className="h-8 w-8 p-0">
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setZoomLevel(1)} className="h-8 px-2 text-xs">
                          {Math.round(zoomLevel * 100)}%
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2))} className="h-8 w-8 p-0">
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Color Palette - Desktop/Tablet Only */}
                {!isMobile && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Color Palette</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Active:</span>
                          <div 
                            className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                            style={{ backgroundColor: selectedColor }}
                          />
                          <input 
                            type="color" 
                            value={selectedColor} 
                            onChange={(e) => setSelectedColor(e.target.value)} 
                            className="w-8 h-8 rounded cursor-pointer"
                            title="Custom color picker"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-10 gap-2">
                        {palette.map((c) => (
                          <button
                            key={c}
                            onClick={() => setSelectedColor(c)}
                            className={`w-10 h-10 rounded-lg border-2 transition-all duration-150 hover:scale-110 ${
                              selectedColor === c ? 'border-indigo-500 scale-110 shadow-md' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Palette Selection */}
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(palettes) as Array<keyof typeof palettes>).map((key) => (
                        <Button 
                          key={key} 
                          size="sm" 
                          variant={activePalette === key ? 'default' : 'outline'}
                          onClick={() => setActivePalette(key)}
                          className="transition-all duration-200"
                        >
                          {palettes[key].name}
                        </Button>
                      ))}
                    </div>

                    {/* Advanced Settings */}
                    <details className="group pt-4 border-t border-gray-200 dark:border-gray-700">
                      <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-700 py-2 flex items-center gap-2">
                        <ChevronDown className="w-4 h-4 group-open:rotate-90 transition-transform" />
                        Advanced Settings
                      </summary>
                      <div className="pt-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">Symmetry:</span>
                          {[1, 4, 8].map((sym) => (
                            <Button
                              key={sym}
                              size="sm"
                              variant={symmetryMode === sym ? 'default' : 'outline'}
                              onClick={() => setSymmetryMode(sym)}
                            >
                              {sym}x
                            </Button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Line Color</label>
                          <input 
                            type="color" 
                            value={lineColor} 
                            onChange={(e) => setLineColor(e.target.value)} 
                            className="h-8 w-12 rounded cursor-pointer"
                          />
                          <span className="text-xs text-gray-500">{lineColor}</span>
                        </div>
                      </div>
                    </details>

                    {/* Export & Complete */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={exportSVG}>
                          <Download className="w-4 h-4 mr-2" />
                          SVG
                        </Button>
                        <Button size="sm" variant="outline" onClick={exportPNG}>
                          <Download className="w-4 h-4 mr-2" />
                          PNG
                        </Button>
                      </div>
                      {onComplete && (
                        <Button
                          size="default"
                          onClick={completeAndArchiveSession}
                          disabled={!canComplete}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Complete Session
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Sheet Color Palette */}
        {isMobile && (
          <div 
            className={`
              fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700
              transition-transform duration-300 ease-out z-30
              ${isBottomSheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-120px)]'}
            `}
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0)',
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center py-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full cursor-pointer" 
                   onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)} />
            </div>

            {/* Collapsed State - Active Color & Quick Palette */}
            {!isBottomSheetExpanded && (
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Colors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <input 
                      type="color" 
                      value={selectedColor} 
                      onChange={(e) => setSelectedColor(e.target.value)} 
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {palette.slice(0, 5).map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`aspect-square rounded-lg border-2 transition-all duration-150 ${
                        selectedColor === c ? 'border-indigo-500 scale-110 shadow-md' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Expanded State - Full Palette */}
            {isBottomSheetExpanded && (
              <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  {/* Active Color Display */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Color</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm"
                        style={{ backgroundColor: selectedColor }}
                      />
                      <input 
                        type="color" 
                        value={selectedColor} 
                        onChange={(e) => setSelectedColor(e.target.value)} 
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Full Color Grid */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">{palettes[activePalette].name}</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {palette.map((c) => (
                        <button
                          key={c}
                          onClick={() => setSelectedColor(c)}
                          className={`aspect-square rounded-lg border-2 transition-all duration-150 hover:scale-105 ${
                            selectedColor === c ? 'border-indigo-500 scale-110 shadow-md' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Palette Selection */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Color Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(palettes) as Array<keyof typeof palettes>).map((key) => (
                        <Button 
                          key={key} 
                          size="sm" 
                          variant={activePalette === key ? 'default' : 'outline'}
                          onClick={() => setActivePalette(key)}
                          className="text-xs"
                        >
                          {palettes[key].name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Symmetry:</span>
                      {[1, 4, 8].map((sym) => (
                        <Button
                          key={sym}
                          size="sm"
                          variant={symmetryMode === sym ? 'default' : 'outline'}
                          onClick={() => setSymmetryMode(sym)}
                        >
                          {sym}x
                        </Button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Line Color</label>
                      <input 
                        type="color" 
                        value={lineColor} 
                        onChange={(e) => setLineColor(e.target.value)} 
                        className="h-8 w-12 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button size="sm" variant="outline" onClick={exportSVG} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      SVG
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportPNG} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      PNG
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile FAB for Complete */}
        {isMobile && onComplete && (
          <Button 
            size="lg"
            onClick={() => {
              const canvas = document.createElement('canvas');
              canvas.width = 500;
              canvas.height = 500;
              const ctx = canvas.getContext('2d');
              if (ctx && svgRef.current) {
                const svgData = new XMLSerializer().serializeToString(svgRef.current);
                const img = new Image();
                img.onload = () => {
                  ctx.drawImage(img, 0, 0);
                  canvas.toBlob((blob) => {
                    if (blob) {
                      const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
                      const totalSegments = svgRef.current?.querySelectorAll('[data-part]').length || 0;
                      const paintedSegments = Array.from(svgRef.current?.querySelectorAll('[data-part]') || [])
                        .filter(el => el.getAttribute('fill') !== '#FCFCFC').length;
                      
                      onComplete({
                        imageBlob: blob,
                        sessionDuration,
                        colorsUsed: Array.from(colorsUsed),
                        percentComplete: totalSegments > 0 ? (paintedSegments / totalSegments) * 100 : 0
                      });
                    }
                  });
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
              }
            }} 
            disabled={!canComplete}
            className="fixed bottom-4 right-4 z-40 rounded-full w-14 h-14 shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white"
            style={{
              bottom: 'calc(1rem + env(safe-area-inset-bottom, 0))',
            }}
          >
            ✓
          </Button>
        )}
      </div>
    </div>
    </>
  );
};
