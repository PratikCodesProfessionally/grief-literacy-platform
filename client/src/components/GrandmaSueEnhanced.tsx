/**
 * Enhanced Grandma Sue Component
 * 
 * A knowledge-enhanced, voice-enabled chatbot that combines warm,
 * grandmother-like personality with professional psychological knowledge.
 * Uses RAG architecture for informed, contextual responses.
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, MicOff, Volume2, VolumeX, Loader2, AlertTriangle, 
  BookOpen, Settings, X, Upload, Trash2, Heart, Info
} from 'lucide-react';

// Import services
import { ragPipelineService, type ConversationMessage, type RAGResponse, type AIProvider } from '@/services/RAGPipelineService';
import { voiceService, type VoiceState } from '@/services/VoiceService';
import { crisisDetectionService, type CrisisAssessment } from '@/services/CrisisDetectionService';
import { knowledgeBaseService, type UploadedDocument } from '@/services/KnowledgeBaseService';
import { emotionalAnalysisService } from '@/services/EmotionalAnalysisService';

// Types
interface Message extends ConversationMessage {
  id: string;
  feedback?: 'helpful' | 'not-helpful';
  isVoice?: boolean;
  isCrisis?: boolean;
  sources?: string[];
  provider?: AIProvider;
}

interface GrandmaSueState {
  isOpen: boolean;
  messages: Message[];
  input: string;
  isTyping: boolean;
  showSettings: boolean;
  showKnowledge: boolean;
}

interface VoiceSettings {
  enabled: boolean;
  autoSpeak: boolean;
  showTranscript: boolean;
}

// Initial greeting
const INITIAL_GREETING: Message = {
  id: 'greeting',
  role: 'assistant',
  content: `Well hello there, dear! I'm Grandma Sue. Come in, sit down, the kettle's just boiled. ☕

This is a safe little corner for whatever you're carrying: grief, worry, a rotten day, or just wanting some company. You can type, or switch on voice and talk to me.

One honest thing before we start: I'm an AI companion, not a counselor. If things ever feel really serious, I'll help you find a real person who can help.

So, what's on your heart today? Or tell me your name first, if you like.`,
  timestamp: new Date()
};

// Conversation starters shown while only the greeting is on screen.
const QUICK_STARTS = [
  "I'm missing someone",
  "I feel anxious",
  "I've had a rough day",
  "Tell me a story",
  "Just want to chat",
];

/** Render **bold** and *italic* (used by both the local engine and the AI) without raw HTML. */
function renderRichText(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/** Text for speech synthesis: no asterisks read aloud. */
function stripMarkdown(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
}

/**
 * Enhanced Grandma Sue Component
 */
export function GrandmaSueEnhanced() {
  // Core state
  const [state, setState] = React.useState<GrandmaSueState>({
    isOpen: false,
    messages: [],
    input: '',
    isTyping: false,
    showSettings: false,
    showKnowledge: false
  });

  // Voice state
  const [voiceState, setVoiceState] = React.useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    confidence: 0,
    error: null,
    voiceAvailable: false,
    recognitionAvailable: false
  });

  // Voice settings
  const [voiceSettings, setVoiceSettings] = React.useState<VoiceSettings>({
    enabled: false,
    autoSpeak: true,
    showTranscript: true
  });

  // Knowledge base state
  const [documents, setDocuments] = React.useState<UploadedDocument[]>([]);
  const [knowledgeCount, setKnowledgeCount] = React.useState(0);

  // AI provider indicator (last assistant response)
  const [aiProvider, setAiProvider] = React.useState<AIProvider | null>(null);
  const [fallbackReason, setFallbackReason] = React.useState<string | null>(null);

  // Crisis state
  const [currentCrisis, setCurrentCrisis] = React.useState<CrisisAssessment | null>(null);

  // Permission state
  const [micPermissionDenied, setMicPermissionDenied] = React.useState(false);
  const [micError, setMicError] = React.useState<string | null>(null);

  // Refs
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Latest values for callbacks registered once (voice listeners), avoiding stale closures.
  const messagesRef = React.useRef<Message[]>([]);
  const voiceSettingsRef = React.useRef(voiceSettings);
  const isTypingRef = React.useRef(false);
  messagesRef.current = state.messages;
  voiceSettingsRef.current = voiceSettings;

  // Load saved state on mount
  React.useEffect(() => {
    loadSavedState();
    setupVoiceListeners();
    updateKnowledgeStats();

    return () => {
      voiceService.destroy();
    };
  }, []);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  // Save messages when they change
  React.useEffect(() => {
    if (state.messages.length > 0) {
      localStorage.setItem('grandmaSue_enhanced_messages', JSON.stringify(state.messages));
    }
  }, [state.messages]);

  /**
   * Load saved conversation state
   */
  const loadSavedState = () => {
    try {
      const savedMessages = localStorage.getItem('grandmaSue_enhanced_messages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        setState(prev => ({
          ...prev,
          messages: parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
      } else {
        setState(prev => ({
          ...prev,
          messages: [INITIAL_GREETING]
        }));
      }
    } catch (error) {
      console.error('Failed to load saved state:', error);
      setState(prev => ({
        ...prev,
        messages: [INITIAL_GREETING]
      }));
    }
  };

  /**
   * Setup voice service listeners
   */
  const setupVoiceListeners = () => {
    const availability = voiceService.isAvailable();
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

    voiceService.on('final-transcript', (event) => {
      const transcript = event.data?.transcript || '';
      if (transcript.trim()) {
        setState(prev => ({
          ...prev,
          input: prev.input + transcript
        }));
      }
      setVoiceState(prev => ({ ...prev, transcript: '' }));
    });

    // Auto-send when final transcript is received
    voiceService.on('auto-send', (event) => {
      const transcript = event.data?.transcript;
      if (transcript) {
        // Set the input and trigger send
        setState(prev => ({ ...prev, input: transcript }));
        // Use a small delay to ensure state is updated
        setTimeout(() => {
          handleSendVoiceMessage(transcript);
        }, 50);
      }
    });

    voiceService.on('error', (event) => {
      setVoiceState(prev => ({ ...prev, error: event.data?.error || 'Unknown error' }));
    });
  };

  /**
   * Update knowledge base statistics
   */
  const updateKnowledgeStats = () => {
    setDocuments(knowledgeBaseService.getDocuments());
    setKnowledgeCount(knowledgeBaseService.getChunkCount());
  };

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  /**
   * Send a message (typed, voice, or a quick-reply chip) through the RAG pipeline.
   * Reads history from a ref so voice auto-send (registered once on mount) never
   * works from a stale, empty conversation.
   */
  const sendMessage = async (rawText: string, isVoice = false) => {
    const input = rawText.trim();
    if (!input || isTypingRef.current) return;
    isTypingRef.current = true;

    if (voiceService.getState().isListening) {
      voiceService.stopListening();
    }

    const userAnalysis = emotionalAnalysisService.analyze(input);
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
      isVoice,
      analysis: userAnalysis
    };

    const conversationHistory: ConversationMessage[] = messagesRef.current.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      analysis: m.analysis
    }));

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      input: '',
      isTyping: true
    }));

    if (crisisDetectionService.quickCheck(input)) {
      setCurrentCrisis(crisisDetectionService.assess(input));
    }

    const startedAt = Date.now();
    let assistantMessage: Message;
    let ragResponse: RAGResponse | null = null;

    try {
      ragResponse = await ragPipelineService.processMessage(input, conversationHistory);
      setAiProvider(ragResponse.provider);
      setFallbackReason(ragResponse.fallbackReason ?? null);
      assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: ragResponse.response,
        timestamp: new Date(),
        analysis: ragResponse.analysis,
        isCrisis: ragResponse.isCrisis,
        sources: ragResponse.sources,
        provider: ragResponse.provider
      };
    } catch (error) {
      console.error('Failed to process message:', error);
      setAiProvider('local');
      assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: "I'm here with you, dear one. Sometimes technology has hiccups, but my care for you doesn't change. Please, tell me more about what's on your heart.",
        timestamp: new Date(),
        provider: 'local'
      };
    }

    // Instant replies feel robotic; give Grandma Sue a moment to "think" (crisis replies skip this).
    if (!ragResponse?.isCrisis) {
      const natural = Math.min(1800, 500 + assistantMessage.content.length * 4);
      const remaining = natural - (Date.now() - startedAt);
      if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
    }

    isTypingRef.current = false;
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, assistantMessage],
      isTyping: false
    }));

    if (ragResponse) {
      if (voiceSettingsRef.current.enabled && voiceSettingsRef.current.autoSpeak) {
        const emotion = ragResponse.isCrisis ? 'serious' :
                       ragResponse.analysis.emotionalIntensity === 'high' ? 'comfort' : 'warm';
        voiceService.speakWithEmotion(stripMarkdown(ragResponse.response), emotion);
      }
      setCurrentCrisis(ragResponse.isCrisis ? crisisDetectionService.assess(input) : null);
    }
  };

  const handleSendVoiceMessage = (transcript: string) => sendMessage(transcript, true);

  const handleSend = () => sendMessage(state.input, voiceSettings.enabled && voiceState.isListening);

  /**
   * Handle keyboard input
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Toggle voice mode
   */
  const toggleVoice = () => {
    const newEnabled = !voiceSettings.enabled;
    setVoiceSettings(prev => ({ ...prev, enabled: newEnabled }));
    
    if (!newEnabled) {
      voiceService.stopListening();
      voiceService.stopSpeaking();
    }
  };

  /**
   * Toggle listening with permission handling
   */
  const toggleListening = async () => {
    if (voiceState.isListening) {
      voiceService.stopListening();
      return;
    }
    
    // Reset errors
    setMicError(null);
    setMicPermissionDenied(false);
    
    // Check for browser support
    if (!voiceState.recognitionAvailable) {
      setMicError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    
    // Request microphone permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      // Small delay to ensure browser is ready after getUserMedia
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now start the speech recognition
      try {
        const started = voiceService.startListening();
        if (!started) {
          // Check the actual error from the voice service
          const voiceError = voiceService.getState().error;
          setMicError(voiceError || 'Failed to start speech recognition. Please try again.');
        }
      } catch (recognitionError: any) {
        console.error('Speech recognition start error:', recognitionError);
        setMicError(`Speech recognition error: ${recognitionError.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Microphone permission error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicPermissionDenied(true);
        setMicError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setMicError('No microphone found. Please connect a microphone and try again.');
      } else {
        setMicError(`Microphone error: ${error.message || 'Unknown error'}`);
      }
    }
  };

  /**
   * Stop speaking
   */
  const stopSpeaking = () => {
    voiceService.stopSpeaking();
  };

  /**
   * Handle message feedback
   */
  const handleFeedback = (messageId: string, feedback: 'helpful' | 'not-helpful') => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    }));
    console.log(`Feedback for ${messageId}:`, feedback);
  };

  /**
   * Handle document upload
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        await knowledgeBaseService.uploadDocument(file);
      } catch (error) {
        console.error('Failed to upload document:', error);
      }
    }

    updateKnowledgeStats();
    event.target.value = ''; // Reset input
  };

  /**
   * Delete a document
   */
  const handleDeleteDocument = (docId: string) => {
    knowledgeBaseService.deleteDocument(docId);
    updateKnowledgeStats();
  };

  /**
   * Clear conversation
   */
  const clearConversation = () => {
    if (confirm('Are you sure you want to clear your conversation history? This cannot be undone.')) {
      localStorage.removeItem('grandmaSue_enhanced_messages');
      ragPipelineService.clearHistory();
      setState(prev => ({
        ...prev,
        messages: [INITIAL_GREETING]
      }));
      setCurrentCrisis(null);
    }
  };

  /**
   * Replay a message
   */
  const replayMessage = (content: string) => {
    voiceService.speakWithEmotion(stripMarkdown(content), 'warm');
  };

  // Render floating button when closed
  if (!state.isOpen) {
    return (
      <button
        onClick={() => setState(prev => ({ ...prev, isOpen: true }))}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-110 flex items-center justify-center text-2xl sm:text-3xl z-50 animate-bounce"
        aria-label="Open Grandma Sue chat"
      >
        👵
      </button>
    );
  }

  return (
    <div
      className="fixed inset-x-3 top-3 bottom-3 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:max-w-[calc(100vw-3rem)] z-50 shadow-2xl"
      style={{
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
      }}
    >
      <Card className="border-0 sm:border-2 border-purple-200 h-full sm:max-h-[85vh] flex flex-col rounded-2xl sm:rounded-xl">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl shadow-md">
                👵
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Grandma Sue
                  {voiceSettings.enabled && (
                    <Badge variant="secondary" className="text-xs">
                      🎤 Voice
                    </Badge>
                  )}
                  {aiProvider && (
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      title={aiProvider === 'local' && fallbackReason
                        ? `Cloud AI unavailable, using Grandma Sue's built-in brain.\n${fallbackReason}`
                        : undefined}
                    >
                      AI: {aiProvider === 'huggingface' ? 'Hugging Face' : aiProvider === 'claude' ? 'Claude' : aiProvider === 'gemini' ? 'Gemini' : 'Lokal'}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs flex items-center gap-2">
                  <span>AI Companion</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {knowledgeCount} insights
                  </span>
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState(prev => ({ ...prev, showKnowledge: !prev.showKnowledge }))}
                className="h-8 w-8 p-0"
                title="Knowledge Base"
              >
                <BookOpen className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="h-8 w-8 p-0"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState(prev => ({ ...prev, isOpen: false }))}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Knowledge Panel */}
        {state.showKnowledge && (
          <div className="border-b p-3 bg-gray-50 dark:bg-gray-800 max-h-[200px] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Knowledge Base</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-xs"
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.pdf,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {documents.length === 0 ? (
              <p className="text-xs text-gray-500">
                Upload psychology resources to enhance responses. Built-in knowledge is always available.
              </p>
            ) : (
              <div className="space-y-1">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between text-xs bg-white dark:bg-gray-700 p-2 rounded">
                    <span className="truncate flex-1">{doc.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.status === 'ready' ? 'default' : 'secondary'} className="text-[10px]">
                        {doc.status}
                      </Badge>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Crisis Alert */}
        {currentCrisis && currentCrisis.isCrisis && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800 dark:text-red-200">
                  Crisis Support Available
                </p>
                <p className="text-red-600 dark:text-red-300 text-xs mt-1">
                  If you're in crisis, please reach out: <strong>988</strong> (Suicide & Crisis Lifeline)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <CardContent className="px-4 py-3 sm:p-4 flex-1 overflow-hidden flex flex-col min-h-0">
          <ScrollArea className="flex-1 mb-3 px-2" ref={scrollRef}>
            <div className="space-y-3 pr-1">
              {state.messages.map((message) => (
                <div key={message.id}>
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[88%] sm:max-w-[85%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-purple-500 text-white'
                          : message.isCrisis
                            ? 'bg-red-50 dark:bg-red-900/20 text-gray-900 dark:text-gray-100 border border-red-200 dark:border-red-800'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {message.isVoice && (
                        <div className="flex items-center gap-1 mb-1 text-xs opacity-70">
                          <Mic className="w-3 h-3" />
                          <span>Voice message</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">{renderRichText(message.content)}</p>
                      
                      {/* Sources attribution */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            <span>Informed by: {message.sources.join(', ')}</span>
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Feedback and replay buttons */}
                  {message.role === 'assistant' && !message.feedback && (
                    <div className="flex gap-2 mt-1 ml-2">
                      <button
                        onClick={() => handleFeedback(message.id, 'helpful')}
                        className="text-xs text-gray-500 hover:text-green-600 transition-colors"
                        title="This was helpful"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, 'not-helpful')}
                        className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                        title="This was not helpful"
                      >
                        👎
                      </button>
                      {voiceSettings.enabled && (
                        <button
                          onClick={() => replayMessage(message.content)}
                          className="text-xs text-gray-500 hover:text-purple-600 transition-colors flex items-center gap-1"
                          title="Play again"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                  {message.feedback && (
                    <div className="ml-2 mt-1 text-xs text-gray-500 flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>Thank you for your feedback</span>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing indicator */}
              {state.isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Voice indicators */}
          <div className="space-y-2 flex-shrink-0">
            {voiceState.isListening && voiceSettings.showTranscript && voiceState.transcript && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 text-sm">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Listening...</p>
                <p className="text-blue-900 dark:text-blue-100 italic">{voiceState.transcript}</p>
              </div>
            )}
            
            {voiceState.isSpeaking && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2 text-xs text-purple-800 dark:text-purple-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  <span>Grandma Sue is speaking...</span>
                </div>
                <Button variant="ghost" size="sm" onClick={stopSpeaking} className="h-6 px-2 text-xs">
                  Stop
                </Button>
              </div>
            )}

            {/* Microphone error message */}
            {micError && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MicOff className="w-4 h-4" />
                  <span>{micError}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setMicError(null)} className="h-6 px-2 text-xs">
                  ✕
                </Button>
              </div>
            )}

            {/* Conversation starters (outside the scroll area so they're always fully visible) */}
            {!state.isTyping && state.messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5">
                {QUICK_STARTS.map(starter => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => sendMessage(starter)}
                    className="text-xs px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            <div className="flex gap-2">
              <Textarea
                value={state.input}
                onChange={(e) => setState(prev => ({ ...prev, input: e.target.value }))}
                onKeyDown={handleKeyPress}
                placeholder={voiceSettings.enabled ? "Speak or type what's on your mind..." : "Share what's on your mind..."}
                className="min-h-[80px] resize-none text-sm flex-1"
                disabled={state.isTyping || voiceState.isListening}
              />
              
              {/* Voice Controls */}
              <div className="flex flex-col gap-2">
                <Button
                  variant={voiceSettings.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleVoice}
                  className="w-10 h-10 p-0"
                  title={voiceSettings.enabled ? "Disable voice mode" : "Enable voice mode"}
                  disabled={!voiceState.voiceAvailable && !voiceState.recognitionAvailable}
                >
                  {voiceSettings.enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                
                {voiceSettings.enabled && voiceState.recognitionAvailable && (
                  <Button
                    variant={voiceState.isListening ? "destructive" : "secondary"}
                    size="sm"
                    onClick={toggleListening}
                    className="w-10 h-10 p-0"
                    disabled={state.isTyping}
                    title={voiceState.isListening ? "Stop listening" : "Start listening"}
                  >
                    {voiceState.isListening ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-between items-center gap-2">
              <p className="text-xs text-gray-500 flex-1 flex items-center gap-2">
                💜 {state.messages.length} {state.messages.length === 1 ? 'message' : 'messages'}
                {voiceSettings.enabled && <span className="text-purple-500">🎤 Voice enabled</span>}
              </p>
              <Button 
                onClick={handleSend} 
                disabled={!state.input.trim() || state.isTyping || voiceState.isListening} 
                size="sm"
              >
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GrandmaSueEnhanced;
