import * as React from 'react';
import {
  ColorPalettes,
  TemplateSelector,
  PaintTools,
  ActionPanel,
  StyleControls,
  SessionManager,
  CompletionDialog,
  JavaScriptEditor,
  MandalaCanvas,
} from './components';
import {
  useSessionPersistence,
  useDrawingState,
  useResponsiveDesign,
} from './hooks';
import {
  createMandalaAPI,
  calculateCompletionPercentage,
  exportSVGString,
} from './utils';
import {
  HealingMandalaProps,
  TemplateKey,
  PaletteKey,
  SessionData,
} from './types';
import {
  COLOR_PALETTES,
  DEFAULT_TEMPLATE,
  DEFAULT_PETALS,
  DEFAULT_RINGS,
  DEFAULT_STROKE,
  DEFAULT_LINE_COLOR,
  DEFAULT_SYMMETRY_MODE,
  NS,
} from './constants';
import { Button } from '../../../components/ui/button';
import { X } from 'lucide-react';

// Re-export barrel modules for convenience (excluding components to avoid naming conflicts)
export * from './types';
export * from './constants';
export * from './utils';
export * from './hooks';
export * as components from './components';
export * as hooks from './hooks';
export * as utils from './utils';

/**
 * HealingMandala - Main orchestrating component
 * Combines all modular sub-components into a cohesive therapeutic art tool
 */
export const HealingMandala: React.FC<HealingMandalaProps> = ({
  mood = 'reflective',
  onClose,
  onComplete,
  initialTemplate = DEFAULT_TEMPLATE,
  autosaveKey,
}) => {
  // Use mood-based key for persistence if not provided
  const finalAutosaveKey = autosaveKey || `mandala-session-${mood}`;
  // Key refs
  const containerRef = React.useRef<HTMLDivElement>(null);
  const svgContainerRef = React.useRef<HTMLDivElement>(null);

  // Drawing state management
  const drawingState = useDrawingState(initialTemplate, DEFAULT_PETALS, DEFAULT_RINGS);
  const {
    state,
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    updateDrawingState,
    pushToUndoStack,
    undo,
    redo,
    reset,
  } = drawingState;

  // Responsive design
  const viewport = useResponsiveDesign();

  // Session persistence
  const sessionPersistence = useSessionPersistence(
    finalAutosaveKey,
    mood,
    state.template,
    state.petals,
    state.rings,
    state.stroke,
    state.lineColor,
    state.selectedColor,
    state.activePalette,
    state.colorsUsed,
    React.useRef(Date.now()).current,
    state.svgContent
  );

  const {
    lastSaveTime,
    showSessionRestorePrompt,
    saveSession,
    getSession,
    completeAndArchive,
    clearSession,
    setShowSessionRestorePrompt,
  } = sessionPersistence;

  // JavaScript editor state
  const [jsCode, setJsCode] = React.useState('');
  const [jsError, setJsError] = React.useState<string | null>(null);
  const [showJsEditor, setShowJsEditor] = React.useState(false);
  const [isExecutingJs, setIsExecutingJs] = React.useState(false);

  // Completion tracking
  const [showCompletionDialog, setShowCompletionDialog] = React.useState(false);
  const [sessionStartTime] = React.useState(Date.now());

  // Paint state
  const [isDragging, setIsDragging] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  
  // Signature of the template geometry currently shown in the DOM. The render
  // effect rebuilds a fresh (blank) template only when the signature changes.
  // Restoration sets this ref to the restored params' signature so the effect
  // sees "already showing this" and does NOT clobber the restored painted SVG.
  const shownSignatureRef = React.useRef<string | null>(null);

  // Build a signature from the params that determine a fresh template's geometry.
  const makeTemplateSignature = (
    template: TemplateKey,
    petals: number,
    rings: number,
    lineColor: string,
    stroke: number
  ) =>
    `${template}|${petals}|${rings}|${lineColor}|${stroke}|${viewport.canvasSize.width}x${viewport.canvasSize.height}`;

  const templateSignature = makeTemplateSignature(
    state.template,
    state.petals,
    state.rings,
    state.lineColor,
    state.stroke
  );

  // Template builders
  const buildTraditionalFloral = React.useCallback((): SVGSVGElement => {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${viewport.canvasSize.width} ${viewport.canvasSize.height}`);
    svg.setAttribute('width', String(viewport.canvasSize.width));
    svg.setAttribute('height', String(viewport.canvasSize.height));

    const center = viewport.canvasSize.width / 2;
    const petals = state.petals || DEFAULT_PETALS;
    const rings = state.rings || DEFAULT_RINGS;

    for (let r = 0; r < rings; r++) {
      const radius = ((r + 1) / rings) * (center - 40);

      for (let p = 0; p < petals; p++) {
        const angle = (p / petals) * Math.PI * 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        const petalSize = 15 + r * 5;

        const ellipse = document.createElementNS(NS, 'ellipse');
        ellipse.setAttribute('cx', String(x));
        ellipse.setAttribute('cy', String(y));
        ellipse.setAttribute('rx', String(petalSize));
        ellipse.setAttribute('ry', String(petalSize * 1.5));
        ellipse.setAttribute('fill', 'none');
        ellipse.setAttribute('stroke', state.lineColor);
        ellipse.setAttribute('stroke-width', String(state.stroke));
        ellipse.setAttribute('data-part', `petal-${p}`);
        ellipse.setAttribute('data-ring', String(r));
        ellipse.setAttribute('data-id', `petal-${p}-ring-${r}`);

        svg.appendChild(ellipse);
      }
    }

    // Center circle
    const centerCircle = document.createElementNS(NS, 'circle');
    centerCircle.setAttribute('cx', String(center));
    centerCircle.setAttribute('cy', String(center));
    centerCircle.setAttribute('r', '15');
    centerCircle.setAttribute('fill', 'none');
    centerCircle.setAttribute('stroke', state.lineColor);
    centerCircle.setAttribute('stroke-width', String(state.stroke));
    centerCircle.setAttribute('data-id', 'center');

    svg.appendChild(centerCircle);
    return svg;
  }, [viewport.canvasSize.width, viewport.canvasSize.height, state.petals, state.rings, state.lineColor, state.stroke]);

  const buildDotMandala = React.useCallback((): SVGSVGElement => {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${viewport.canvasSize.width} ${viewport.canvasSize.height}`);
    svg.setAttribute('width', String(viewport.canvasSize.width));
    svg.setAttribute('height', String(viewport.canvasSize.height));

    const center = viewport.canvasSize.width / 2;
    const petals = state.petals || DEFAULT_PETALS;
    const rings = state.rings || DEFAULT_RINGS;
    const dotRadius = 5;

    for (let r = 0; r < rings; r++) {
      const radius = ((r + 1) / rings) * (center - 40);

      for (let p = 0; p < petals; p++) {
        const angle = (p / petals) * Math.PI * 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);

        const circle = document.createElementNS(NS, 'circle');
        circle.setAttribute('cx', String(x));
        circle.setAttribute('cy', String(y));
        circle.setAttribute('r', String(dotRadius));
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', state.lineColor);
        circle.setAttribute('stroke-width', String(state.stroke));
        circle.setAttribute('data-part', `dot-${p}`);
        circle.setAttribute('data-ring', String(r));
        circle.setAttribute('data-id', `dot-${p}-ring-${r}`);

        svg.appendChild(circle);
      }
    }

    return svg;
  }, [viewport.canvasSize.width, viewport.canvasSize.height, state.petals, state.rings, state.lineColor, state.stroke]);

  const buildProcedural = React.useCallback((): SVGSVGElement => {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${viewport.canvasSize.width} ${viewport.canvasSize.height}`);
    svg.setAttribute('width', String(viewport.canvasSize.width));
    svg.setAttribute('height', String(viewport.canvasSize.height));

    const center = viewport.canvasSize.width / 2;
    const petals = state.petals || DEFAULT_PETALS;

    for (let i = 0; i < petals; i++) {
      const angle1 = (i / petals) * Math.PI * 2;
      const angle2 = ((i + 1) / petals) * Math.PI * 2;
      const radius = center - 50;

      const x1 = center + radius * Math.cos(angle1);
      const y1 = center + radius * Math.sin(angle1);
      const x2 = center + radius * Math.cos(angle2);
      const y2 = center + radius * Math.sin(angle2);

      const path = document.createElementNS(NS, 'path');
      path.setAttribute(
        'd',
        `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`
      );
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', state.lineColor);
      path.setAttribute('stroke-width', String(state.stroke));
      path.setAttribute('data-part', `segment-${i}`);
      path.setAttribute('data-id', `segment-${i}`);

      svg.appendChild(path);
    }

    return svg;
  }, [viewport.canvasSize.width, viewport.canvasSize.height, state.petals, state.lineColor, state.stroke]);

  // Handle painting
  const handlePaint = React.useCallback(
    (e: Event | React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
      if (state.mode === 'javascript') return;

      const target = e.target as SVGElement;
      if (!target.hasAttribute('data-id')) return;

      const mouseEvent = e as MouseEvent | TouchEvent;
      const isMouseDown =
        mouseEvent instanceof MouseEvent ? mouseEvent.buttons === 1 : e.type === 'touchmove';
      if (!isMouseDown && e.type !== 'click') return;

      switch (state.mode) {
        case 'paint':
          target.setAttribute('fill', state.selectedColor);
          state.colorsUsed.add(state.selectedColor);
          break;
        case 'erase':
          target.setAttribute('fill', 'none');
          break;
        case 'eyedropper':
          const fill = target.getAttribute('fill');
          if (fill && fill !== 'none') {
            updateDrawingState({ selectedColor: fill });
          }
          break;
        case 'fill':
          const dataId = target.getAttribute('data-id');
          if (dataId) {
            const elements = svgContainerRef.current?.querySelectorAll(`[data-id="${dataId}"]`);
            elements?.forEach((el) => {
              el.setAttribute('fill', state.selectedColor);
              state.colorsUsed.add(state.selectedColor);
            });
          }
          break;
      }

      pushToUndoStack(svgContainerRef.current?.innerHTML || '');
      updateDrawingState({ svgContent: svgContainerRef.current?.innerHTML || '' });
    },
    [state.mode, state.selectedColor, state.colorsUsed, updateDrawingState, pushToUndoStack]
  );

  // Keep a live ref to the latest handlePaint. DOM listeners are attached once
  // per element, so they must call through this ref to always use the current
  // color/mode — this is what lets you keep painting after a restore.
  const handlePaintRef = React.useRef(handlePaint);
  React.useEffect(() => {
    handlePaintRef.current = handlePaint;
  }, [handlePaint]);

  // Attach paint listeners to every paintable element in a container.
  const attachPaintHandlers = React.useCallback((container: Element) => {
    const handler = (e: Event) => handlePaintRef.current(e);
    container.querySelectorAll('[data-id]').forEach((el) => {
      el.addEventListener('click', handler);
      el.addEventListener('mouseover', handler);
      el.addEventListener('touchmove', handler);
    });
  }, []);

  // Build a fresh, blank template from the current params and show it.
  const renderTemplate = React.useCallback(() => {
    if (!svgContainerRef.current) return;

    let svg: SVGSVGElement;
    switch (state.template) {
      case 'dot-mandala':
        svg = buildDotMandala();
        break;
      case 'procedural':
        svg = buildProcedural();
        break;
      case 'traditional-floral':
      default:
        svg = buildTraditionalFloral();
    }

    svgContainerRef.current.innerHTML = '';
    svgContainerRef.current.appendChild(svg);
    attachPaintHandlers(svgContainerRef.current);
    shownSignatureRef.current = templateSignature;
    updateDrawingState({ svgContent: svg.outerHTML });
  }, [
    state.template,
    templateSignature,
    buildTraditionalFloral,
    buildDotMandala,
    buildProcedural,
    attachPaintHandlers,
    updateDrawingState,
  ]);

  // Execute JavaScript
  const executeJavaScript = React.useCallback((code: string) => {
    setIsExecutingJs(true);
    setJsError(null);

    try {
      const svgRef = React.createRef<SVGSVGElement>();
      const svgElement = svgContainerRef.current?.querySelector('svg') as SVGSVGElement;
      if (svgElement) svgRef.current = svgElement;

      const palette = COLOR_PALETTES[state.activePalette].colors;
      const mandalaAPI = createMandalaAPI(
        svgRef,
        state.selectedColor,
        palette,
        state.petals,
        state.rings
      );
      const fn = new Function('mandala', code);
      fn(mandalaAPI);

      updateDrawingState({
        svgContent: svgContainerRef.current?.innerHTML || '',
      });
    } catch (err) {
      setJsError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsExecutingJs(false);
    }
  }, [state.activePalette, state.selectedColor, state.petals, state.rings, updateDrawingState]);

  // Complete and archive session
  const handleComplete = React.useCallback(() => {
    const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
    const svgElement = svgContainerRef.current?.querySelector('svg') as SVGSVGElement;
    const percentComplete = svgElement ? calculateCompletionPercentage(svgElement) : 0;

    completeAndArchive(duration, percentComplete);
    setShowCompletionDialog(true);

    if (onComplete) {
      onComplete({
        imageBlob: new Blob([state.svgContent], { type: 'image/svg+xml' }),
        sessionDuration: duration,
        colorsUsed: Array.from(state.colorsUsed),
        percentComplete,
      });
    }
  }, [sessionStartTime, completeAndArchive, state.svgContent, state.colorsUsed, onComplete]);

  // Show a saved SVG string in the canvas and (re)attach paint listeners.
  const showSvgInCanvas = React.useCallback(
    (svgContent: string) => {
      if (!svgContainerRef.current) return;
      svgContainerRef.current.innerHTML = svgContent;
      attachPaintHandlers(svgContainerRef.current);
    },
    [attachPaintHandlers]
  );

  // Undo/Redo
  const handleUndo = React.useCallback(() => {
    const previousSvg = undo();
    if (previousSvg) {
      showSvgInCanvas(previousSvg);
      updateDrawingState({ svgContent: previousSvg });
    }
  }, [undo, showSvgInCanvas, updateDrawingState]);

  const handleRedo = React.useCallback(() => {
    const nextSvg = redo();
    if (nextSvg) {
      showSvgInCanvas(nextSvg);
      updateDrawingState({ svgContent: nextSvg });
    }
  }, [redo, showSvgInCanvas, updateDrawingState]);

  // Clear mandala
  const handleClear = React.useCallback(() => {
    if (window.confirm('Clear all drawing? This cannot be undone.')) {
      reset();
      // Force a fresh rebuild even if geometry params are unchanged.
      shownSignatureRef.current = null;
      renderTemplate();
      setJsCode('');
      setJsError(null);
    }
  }, [reset, renderTemplate]);

  // Restore session
  const handleRestoreSession = React.useCallback(() => {
    const session = getSession();
    if (!session) return;

    // Mark the restored params' signature as already shown so the render effect
    // (which runs after the state update below) does NOT rebuild a blank template
    // over the painted SVG we're about to display.
    shownSignatureRef.current = makeTemplateSignature(
      session.template,
      session.petals,
      session.rings,
      session.lineColor,
      session.stroke
    );

    // Display the saved painting immediately.
    showSvgInCanvas(session.svgContent);

    updateDrawingState({
      template: session.template,
      petals: session.petals,
      rings: session.rings,
      stroke: session.stroke,
      lineColor: session.lineColor,
      selectedColor: session.selectedColor,
      activePalette: session.activePalette,
      svgContent: session.svgContent,
      colorsUsed: new Set(session.colorsUsed),
    });

    setShowSessionRestorePrompt(false);
  }, [getSession, showSvgInCanvas, updateDrawingState]);

  // Rebuild a fresh template only when the geometry signature changes and we
  // aren't already showing it (restoration sets the ref to suppress a clobber).
  React.useEffect(() => {
    if (shownSignatureRef.current === templateSignature) return;
    renderTemplate();
  }, [templateSignature, renderTemplate]);

  // Auto-save
  React.useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveSession();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [saveSession]);

  // Change template
  const handleTemplateChange = (template: TemplateKey) => {
    updateDrawingState({ template });
  };

  // Change palette
  const handlePaletteChange = (palette: PaletteKey) => {
    updateDrawingState({
      activePalette: palette,
      selectedColor: COLOR_PALETTES[palette].colors[0],
    });
  };

  // Change color
  const handleColorChange = (color: string) => {
    updateDrawingState({ selectedColor: color });
  };

  // Change stroke (render effect rebuilds the template when the signature changes)
  const handleStrokeChange = (stroke: number) => {
    updateDrawingState({ stroke });
  };

  // Change line color (render effect rebuilds the template when the signature changes)
  const handleLineColorChange = (color: string) => {
    updateDrawingState({ lineColor: color });
  };

  // Change paint mode
  const handleModeChange = (mode: string) => {
    updateDrawingState({ mode: mode as any });
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Healing Mandala
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
              Mood: {mood} • Last saved: {new Date(lastSaveTime).toLocaleTimeString()}
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Close
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Canvas */}
            <div className="lg:col-span-2">
              <div ref={containerRef} className="mb-6">
                <div ref={svgContainerRef} className="w-full" />
              </div>
            </div>

            {/* Controls Sidebar */}
            <div className="lg:col-span-2 space-y-4 max-h-[80vh] overflow-y-auto">
              <TemplateSelector
                activeTemplate={state.template}
                onTemplateChange={handleTemplateChange}
              />

              <ColorPalettes
                activePalette={state.activePalette}
                selectedColor={state.selectedColor}
                onPaletteChange={handlePaletteChange}
                onColorChange={handleColorChange}
              />

              <PaintTools
                mode={state.mode as any}
                onModeChange={handleModeChange}
                onShowJsEditor={() => setShowJsEditor(true)}
                hasJsEditor
              />

              <StyleControls
                stroke={state.stroke}
                lineColor={state.lineColor}
                onStrokeChange={handleStrokeChange}
                onLineColorChange={handleLineColorChange}
              />

              <ActionPanel
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClear={handleClear}
                onComplete={handleComplete}
                completionPercentage={(() => {
                  const svg = svgContainerRef.current?.querySelector('svg') as SVGSVGElement;
                  return svg ? calculateCompletionPercentage(svg) : 0;
                })()}
                isSaving={false}
                onManualSave={saveSession}
                autosaveKey={finalAutosaveKey}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SessionManager
        showRestorePrompt={showSessionRestorePrompt}
        sessionData={getSession()}
        onRestore={handleRestoreSession}
        onDiscard={() => {
          setShowSessionRestorePrompt(false);
          clearSession();
        }}
      />

      <CompletionDialog
        isOpen={showCompletionDialog}
        percentComplete={(() => {
          const svg = svgContainerRef.current?.querySelector('svg') as SVGSVGElement;
          return svg ? calculateCompletionPercentage(svg) : 0;
        })()}
        duration={Math.floor((Date.now() - sessionStartTime) / 1000)}
        colorsUsed={state.colorsUsed.size}
        onClose={() => setShowCompletionDialog(false)}
        onArchive={() => {
          setShowCompletionDialog(false);
          onClose?.();
        }}
      />

      <JavaScriptEditor
        isOpen={showJsEditor}
        onClose={() => setShowJsEditor(false)}
        code={jsCode}
        onCodeChange={setJsCode}
        onExecute={executeJavaScript}
        error={jsError}
        isExecuting={isExecutingJs}
      />
    </div>
  );
};

export default HealingMandala;
