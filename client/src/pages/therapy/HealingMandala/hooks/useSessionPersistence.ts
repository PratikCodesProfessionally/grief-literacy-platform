import * as React from 'react';
import { SessionData, CompletedSessionData, TemplateKey, PaletteKey } from '../types';
import {
  saveSessionToStorage,
  getSessionFromStorage,
  clearSessionFromStorage,
  archiveCompletedSession,
} from '../utils';

export const useSessionPersistence = (
  autosaveKey: string,
  mood: string,
  template: TemplateKey,
  petals: number,
  rings: number,
  stroke: number,
  lineColor: string,
  selectedColor: string,
  activePalette: PaletteKey,
  colorsUsed: Set<string>,
  sessionStartTime: number,
  svgContent: string
) => {
  const [lastSaveTime, setLastSaveTime] = React.useState(Date.now());
  const [hasActiveSession, setHasActiveSession] = React.useState(false);
  const [showSessionRestorePrompt, setShowSessionRestorePrompt] = React.useState(false);

  // Use ref to store current state without recreating the function on every change
  const currentStateRef = React.useRef({
    autosaveKey,
    mood,
    template,
    petals,
    rings,
    stroke,
    lineColor,
    selectedColor,
    activePalette,
    colorsUsed,
    sessionStartTime,
    svgContent,
  });

  // Update ref whenever any of these dependencies change
  React.useEffect(() => {
    currentStateRef.current = {
      autosaveKey,
      mood,
      template,
      petals,
      rings,
      stroke,
      lineColor,
      selectedColor,
      activePalette,
      colorsUsed,
      sessionStartTime,
      svgContent,
    };
  }, [autosaveKey, mood, template, petals, rings, stroke, lineColor, selectedColor, activePalette, colorsUsed, sessionStartTime, svgContent]);

  const saveSession = React.useCallback(() => {
    const state = currentStateRef.current;
    if (!state.svgContent) {
      console.log('❌ Cannot save: no SVG content');
      return;
    }

    const sessionData = {
      id: state.autosaveKey,
      mood: state.mood,
      template: state.template,
      petals: state.petals,
      rings: state.rings,
      stroke: state.stroke,
      lineColor: state.lineColor,
      selectedColor: state.selectedColor,
      activePalette: state.activePalette,
      svgContent: state.svgContent,
      colorsUsed: Array.from(state.colorsUsed),
      sessionStartTime: state.sessionStartTime,
    };

    console.log('✅ Saving session:', {
      key: state.autosaveKey,
      mood: state.mood,
      svgLength: state.svgContent.length,
      colorsUsed: sessionData.colorsUsed,
    });
    saveSessionToStorage(state.autosaveKey, sessionData);
    setLastSaveTime(Date.now());
  }, []);

  const getSession = React.useCallback((): SessionData | null => {
    const session = getSessionFromStorage(autosaveKey);
    if (session) {
      console.log('✅ Found session in storage:', {
        key: autosaveKey,
        mood: session.mood,
        svgLength: session.svgContent.length,
      });
    } else {
      console.log('❌ No session found for key:', autosaveKey);
    }
    return session;
  }, [autosaveKey]);

  const completeAndArchive = React.useCallback(
    (duration: number, percentComplete: number): void => {
      const completionData: CompletedSessionData = {
        id: autosaveKey,
        mood,
        template,
        colorsUsed: Array.from(colorsUsed),
        percentComplete,
        duration,
        completedAt: new Date().toISOString(),
        svgContent,
      };

      archiveCompletedSession(completionData);
      clearSessionFromStorage(autosaveKey);
      setHasActiveSession(false);
      setShowSessionRestorePrompt(false);
    },
    [autosaveKey, mood, template, colorsUsed, svgContent]
  );

  const clearSession = React.useCallback(() => {
    clearSessionFromStorage(autosaveKey);
    setHasActiveSession(false);
    setShowSessionRestorePrompt(false);
  }, [autosaveKey]);

  // Auto-save every 30 seconds - use stable saveSession callback
  React.useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveSession();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [saveSession]);

  // Check for existing session on mount
  React.useEffect(() => {
    const existingSession = getSession();
    if (existingSession) {
      console.log('📋 Existing session found. Current mood:', mood, 'Session mood:', existingSession.mood);
      if (existingSession.mood === mood) {
        console.log('✅ Moods match! Showing restore prompt');
        setHasActiveSession(true);
        setShowSessionRestorePrompt(true);
      } else {
        console.log('❌ Moods do not match');
      }
    } else {
      console.log('📋 No existing session found');
    }
  }, [mood, getSession]);

  return {
    lastSaveTime,
    hasActiveSession,
    showSessionRestorePrompt,
    saveSession,
    getSession,
    completeAndArchive,
    clearSession,
    setShowSessionRestorePrompt,
  };
};
