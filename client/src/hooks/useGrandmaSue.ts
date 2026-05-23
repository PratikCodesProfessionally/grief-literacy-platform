/**
 * useGrandmaSue Hook
 * 
 * React hook for integrating Grandma Sue's services into any component.
 * Provides access to RAG pipeline, voice, crisis detection, and knowledge base.
 */

import { useState, useCallback, useEffect } from 'react';
import { ragPipelineService, type ConversationMessage, type RAGResponse } from '@/services/RAGPipelineService';
import { voiceService, type VoiceState, type VoiceConfig } from '@/services/VoiceService';
import { crisisDetectionService, type CrisisAssessment } from '@/services/CrisisDetectionService';
import { knowledgeBaseService, type UploadedDocument } from '@/services/KnowledgeBaseService';
import { emotionalAnalysisService, type EmotionalAnalysis } from '@/services/EmotionalAnalysisService';

export interface UseGrandmaSueOptions {
  autoSaveHistory?: boolean;
  enableVoice?: boolean;
  onCrisisDetected?: (assessment: CrisisAssessment) => void;
  onError?: (error: Error) => void;
}

export interface UseGrandmaSueReturn {
  // Conversation
  messages: ConversationMessage[];
  isProcessing: boolean;
  sendMessage: (message: string) => Promise<RAGResponse | null>;
  clearHistory: () => void;
  
  // Analysis
  analyzeMessage: (message: string) => EmotionalAnalysis;
  assessCrisis: (message: string) => CrisisAssessment;
  
  // Voice
  voiceState: VoiceState;
  startListening: () => boolean;
  stopListening: () => void;
  speak: (text: string, emotion?: 'comfort' | 'concern' | 'gentle' | 'serious' | 'warm' | 'normal') => void;
  stopSpeaking: () => void;
  isVoiceAvailable: boolean;
  
  // Knowledge Base
  documents: UploadedDocument[];
  knowledgeCount: number;
  uploadDocument: (file: File) => Promise<UploadedDocument>;
  deleteDocument: (docId: string) => void;
  
  // Crisis
  currentCrisis: CrisisAssessment | null;
  getCrisisResources: () => ReturnType<typeof crisisDetectionService.getAllResources>;
}

const STORAGE_KEY = 'grandmaSue_hook_history';

/**
 * Hook for Grandma Sue integration
 */
export function useGrandmaSue(options: UseGrandmaSueOptions = {}): UseGrandmaSueReturn {
  const {
    autoSaveHistory = true,
    enableVoice = false,
    onCrisisDetected,
    onError
  } = options;

  // State
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    confidence: 0,
    error: null,
    voiceAvailable: false,
    recognitionAvailable: false
  });
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [knowledgeCount, setKnowledgeCount] = useState(0);
  const [currentCrisis, setCurrentCrisis] = useState<CrisisAssessment | null>(null);
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);

  // Initialize
  useEffect(() => {
    // Load saved history
    if (autoSaveHistory) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setMessages(parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })));
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    }

    // Update knowledge stats
    updateKnowledgeStats();

    // Setup voice if enabled
    if (enableVoice) {
      setupVoice();
    }

    return () => {
      if (enableVoice) {
        voiceService.destroy();
      }
    };
  }, [autoSaveHistory, enableVoice]);

  // Save messages when they change
  useEffect(() => {
    if (autoSaveHistory && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, autoSaveHistory]);

  /**
   * Setup voice service
   */
  const setupVoice = useCallback(() => {
    const availability = voiceService.isAvailable();
    setIsVoiceAvailable(availability.recognition || availability.synthesis);
    setVoiceState(prev => ({
      ...prev,
      voiceAvailable: availability.synthesis,
      recognitionAvailable: availability.recognition
    }));

    voiceService.on('listening-start', () => {
      setVoiceState(prev => ({ ...prev, isListening: true }));
    });

    voiceService.on('listening-end', () => {
      setVoiceState(prev => ({ ...prev, isListening: false, transcript: '' }));
    });

    voiceService.on('speaking-start', () => {
      setVoiceState(prev => ({ ...prev, isSpeaking: true }));
    });

    voiceService.on('speaking-end', () => {
      setVoiceState(prev => ({ ...prev, isSpeaking: false }));
    });

    voiceService.on('transcript', (event) => {
      setVoiceState(prev => ({ ...prev, transcript: event.data?.transcript || '' }));
    });

    voiceService.on('error', (event) => {
      setVoiceState(prev => ({ ...prev, error: event.data?.error }));
    });
  }, []);

  /**
   * Update knowledge stats
   */
  const updateKnowledgeStats = useCallback(() => {
    setDocuments(knowledgeBaseService.getDocuments());
    setKnowledgeCount(knowledgeBaseService.getChunkCount());
  }, []);

  /**
   * Send a message and get response
   */
  const sendMessage = useCallback(async (message: string): Promise<RAGResponse | null> => {
    if (!message.trim() || isProcessing) return null;

    setIsProcessing(true);

    // Add user message
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Check for crisis
    if (crisisDetectionService.quickCheck(message)) {
      const assessment = crisisDetectionService.assess(message);
      setCurrentCrisis(assessment);
      if (onCrisisDetected) {
        onCrisisDetected(assessment);
      }
    }

    try {
      const response = await ragPipelineService.processMessage(message, messages);

      // Add assistant message
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        analysis: response.analysis
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);

      if (response.isCrisis) {
        setCurrentCrisis(crisisDetectionService.assess(message));
      } else {
        setCurrentCrisis(null);
      }

      return response;
    } catch (error) {
      setIsProcessing(false);
      if (onError && error instanceof Error) {
        onError(error);
      }
      console.error('Failed to process message:', error);
      return null;
    }
  }, [messages, isProcessing, onCrisisDetected, onError]);

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
    ragPipelineService.clearHistory();
    setCurrentCrisis(null);
    if (autoSaveHistory) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [autoSaveHistory]);

  /**
   * Analyze a message
   */
  const analyzeMessage = useCallback((message: string): EmotionalAnalysis => {
    return emotionalAnalysisService.analyze(message);
  }, []);

  /**
   * Assess crisis level
   */
  const assessCrisis = useCallback((message: string): CrisisAssessment => {
    return crisisDetectionService.assess(message);
  }, []);

  /**
   * Start voice listening
   */
  const startListening = useCallback((): boolean => {
    return voiceService.startListening();
  }, []);

  /**
   * Stop voice listening
   */
  const stopListening = useCallback(() => {
    voiceService.stopListening();
  }, []);

  /**
   * Speak text
   */
  const speak = useCallback((
    text: string, 
    emotion: 'comfort' | 'concern' | 'gentle' | 'serious' | 'warm' | 'normal' = 'warm'
  ) => {
    voiceService.speakWithEmotion(text, emotion);
  }, []);

  /**
   * Stop speaking
   */
  const stopSpeaking = useCallback(() => {
    voiceService.stopSpeaking();
  }, []);

  /**
   * Upload a document
   */
  const uploadDocument = useCallback(async (file: File): Promise<UploadedDocument> => {
    const doc = await knowledgeBaseService.uploadDocument(file);
    updateKnowledgeStats();
    return doc;
  }, [updateKnowledgeStats]);

  /**
   * Delete a document
   */
  const deleteDocument = useCallback((docId: string) => {
    knowledgeBaseService.deleteDocument(docId);
    updateKnowledgeStats();
  }, [updateKnowledgeStats]);

  /**
   * Get all crisis resources
   */
  const getCrisisResources = useCallback(() => {
    return crisisDetectionService.getAllResources();
  }, []);

  return {
    // Conversation
    messages,
    isProcessing,
    sendMessage,
    clearHistory,
    
    // Analysis
    analyzeMessage,
    assessCrisis,
    
    // Voice
    voiceState,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isVoiceAvailable,
    
    // Knowledge Base
    documents,
    knowledgeCount,
    uploadDocument,
    deleteDocument,
    
    // Crisis
    currentCrisis,
    getCrisisResources
  };
}

export default useGrandmaSue;
