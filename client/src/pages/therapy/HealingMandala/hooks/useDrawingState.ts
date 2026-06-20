import * as React from 'react';
import { PaintMode, PaletteKey, TemplateKey } from '../types';
import { COLOR_PALETTES } from '../constants';

interface DrawingState {
  template: TemplateKey;
  petals: number;
  rings: number;
  stroke: number;
  lineColor: string;
  selectedColor: string;
  activePalette: PaletteKey;
  mode: PaintMode;
  symmetryMode: string;
  seed: number;
  colorsUsed: Set<string>;
  svgContent: string;
}

export const useDrawingState = (
  initialTemplate: TemplateKey,
  initialPetals: number,
  initialRings: number
) => {
  const [state, setState] = React.useState<DrawingState>({
    template: initialTemplate,
    petals: initialPetals,
    rings: initialRings,
    stroke: 2,
    lineColor: '#2D3436',
    selectedColor: '#FF8E53',
    activePalette: 'sunset',
    mode: 'paint',
    symmetryMode: 'radial',
    seed: Math.random(),
    colorsUsed: new Set(),
    svgContent: '',
  });

  const [undoStack, setUndoStack] = React.useState<string[]>([]);
  const [redoStack, setRedoStack] = React.useState<string[]>([]);

  const updateDrawingState = React.useCallback(
    (updates: Partial<DrawingState>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const pushToUndoStack = React.useCallback((svgContent: string) => {
    setUndoStack((prev) => [...prev, svgContent]);
    setRedoStack([]);
  }, []);

  const undo = React.useCallback(() => {
    if (undoStack.length === 0) return null;

    const previousState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, state.svgContent]);

    return previousState;
  }, [undoStack, state.svgContent]);

  const redo = React.useCallback(() => {
    if (redoStack.length === 0) return null;

    const nextState = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, state.svgContent]);

    return nextState;
  }, [redoStack, state.svgContent]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const reset = React.useCallback(() => {
    setState({
      template: initialTemplate,
      petals: initialPetals,
      rings: initialRings,
      stroke: 2,
      lineColor: '#2D3436',
      selectedColor: '#FF8E53',
      activePalette: 'sunset',
      mode: 'paint',
      symmetryMode: 'radial',
      seed: Math.random(),
      colorsUsed: new Set(),
      svgContent: '',
    });
    setUndoStack([]);
    setRedoStack([]);
  }, [initialTemplate, initialPetals, initialRings]);

  return {
    // State
    state,
    undoStack,
    redoStack,
    canUndo,
    canRedo,

    // State setters
    updateDrawingState,

    // Undo/Redo
    pushToUndoStack,
    undo,
    redo,

    // Actions
    reset,
  };
};
