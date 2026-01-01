/**
 * Voice Service for Grandma Sue
 * 
 * Provides enhanced speech recognition and synthesis with
 * characteristics appropriate for a warm, elderly grandmother voice.
 */

// Web Speech API type declarations for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

export interface VoiceConfig {
  rate: number;        // Speech rate (0.1 to 10, default 1)
  pitch: number;       // Pitch (0 to 2, default 1)
  volume: number;      // Volume (0 to 1, default 1)
  voiceName?: string;  // Preferred voice name
  lang: string;        // Language code
}

export interface SpeechRecognitionConfig {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
}

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  voiceAvailable: boolean;
  recognitionAvailable: boolean;
}

export type VoiceEventType = 
  | 'listening-start'
  | 'listening-end'
  | 'speaking-start'
  | 'speaking-end'
  | 'transcript'
  | 'final-transcript'
  | 'auto-send'  // New event for auto-sending message
  | 'error';

export interface VoiceEvent {
  type: VoiceEventType;
  data?: any;
  timestamp: Date;
}

type VoiceEventCallback = (event: VoiceEvent) => void;

// Default Grandma Sue voice configuration
const GRANDMA_VOICE_CONFIG: VoiceConfig = {
  rate: 0.85,      // Slightly slower for warmth and clarity
  pitch: 1.05,     // Slightly higher for warm, feminine voice
  volume: 1.0,
  lang: 'en-US'
};

// Preferred voices in order of priority
const PREFERRED_VOICES = [
  'Google UK English Female',
  'Google US English Female', 
  'Microsoft Zira',
  'Microsoft Hazel',
  'Samantha',           // macOS
  'Victoria',           // macOS
  'Karen',              // macOS Australian
  'Moira',              // macOS Irish
  'Fiona',              // macOS Scottish
];

/**
 * Voice Service class for speech recognition and synthesis
 */
export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private voiceConfig: VoiceConfig;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private eventListeners: Map<VoiceEventType, Set<VoiceEventCallback>> = new Map();
  private voicesLoaded: boolean = false;
  private pendingSpeech: string[] = [];
  
  private state: VoiceState = {
    isListening: false,
    isSpeaking: false,
    transcript: '',
    confidence: 0,
    error: null,
    voiceAvailable: false,
    recognitionAvailable: false
  };

  constructor(config: Partial<VoiceConfig> = {}) {
    this.voiceConfig = { ...GRANDMA_VOICE_CONFIG, ...config };
    this.synthesis = window.speechSynthesis;
    
    this.initializeRecognition();
    this.initializeSynthesis();
  }

  /**
   * Initialize speech recognition
   */
  private initializeRecognition(): void {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      this.state.recognitionAvailable = false;
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.state.recognitionAvailable = true;
    
    // Configure recognition
    this.recognition.continuous = false;  // Stop after one phrase
    this.recognition.interimResults = true;
    this.recognition.lang = this.voiceConfig.lang;
    this.recognition.maxAlternatives = 1;
    
    // Set up event handlers
    this.recognition.onstart = () => {
      this.state.isListening = true;
      this.emit('listening-start');
    };
    
    this.recognition.onend = () => {
      this.state.isListening = false;
      this.state.transcript = '';
      this.emit('listening-end');
    };
    
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        
        if (result.isFinal) {
          finalTranscript += transcript;
          this.state.confidence = confidence;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update state with current transcript
      this.state.transcript = finalTranscript || interimTranscript;
      
      // Emit appropriate event
      if (finalTranscript) {
        this.emit('final-transcript', { 
          transcript: finalTranscript,
          confidence: this.state.confidence 
        });
        // Also emit auto-send to trigger message submission
        this.emit('auto-send', { transcript: finalTranscript });
      } else {
        this.emit('transcript', { transcript: interimTranscript });
      }
    };
    
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      this.state.error = event.error;
      this.state.isListening = false;
      
      // Map error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        'not-allowed': 'Microphone access was denied. Please allow microphone access.',
        'no-speech': 'No speech detected. Please try speaking again.',
        'audio-capture': 'No microphone found. Please connect a microphone.',
        'network': 'Network error occurred. Please check your connection.',
        'service-not-allowed': 'Speech recognition service is not allowed.',
        'bad-grammar': 'Speech grammar error.',
        'language-not-supported': 'Language is not supported.'
      };
      
      const userMessage = errorMessages[event.error] || event.message || event.error;
      
      // Don't emit error for 'aborted' (normal stop) or 'no-speech'
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        this.emit('error', { error: event.error, message: userMessage });
      }
    };
  }

  /**
   * Initialize speech synthesis
   */
  private initializeSynthesis(): void {
    if (typeof window === 'undefined') return;
    
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      this.state.voiceAvailable = false;
      return;
    }
    
    // Load voices
    const loadVoices = () => {
      const voices = this.synthesis.getVoices();
      
      if (voices.length > 0) {
        this.voicesLoaded = true;
        this.selectBestVoice(voices);
        this.state.voiceAvailable = true;
        
        // Process any pending speech
        this.processPendingSpeech();
      }
    };
    
    // Try to load immediately
    loadVoices();
    
    // Also listen for voices changed event (Chrome requires this)
    this.synthesis.onvoiceschanged = loadVoices;
  }

  /**
   * Select the best available voice for Grandma Sue
   */
  private selectBestVoice(voices: SpeechSynthesisVoice[]): void {
    // If a specific voice is configured, try to find it
    if (this.voiceConfig.voiceName) {
      const configured = voices.find(v => 
        v.name.toLowerCase().includes(this.voiceConfig.voiceName!.toLowerCase())
      );
      if (configured) {
        this.selectedVoice = configured;
        return;
      }
    }
    
    // Try to find a preferred voice
    for (const preferred of PREFERRED_VOICES) {
      const voice = voices.find(v => 
        v.name.toLowerCase().includes(preferred.toLowerCase())
      );
      if (voice) {
        this.selectedVoice = voice;
        console.log('Selected voice:', voice.name);
        return;
      }
    }
    
    // Look for any English female voice
    const femaleVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('female') || 
       v.name.toLowerCase().includes('woman') ||
       // Common female voice names
       ['samantha', 'victoria', 'karen', 'moira', 'fiona', 'zira', 'hazel', 'susan', 'linda']
         .some(name => v.name.toLowerCase().includes(name)))
    );
    
    if (femaleVoice) {
      this.selectedVoice = femaleVoice;
      console.log('Selected female voice:', femaleVoice.name);
      return;
    }
    
    // Fall back to first English voice
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      this.selectedVoice = englishVoice;
      console.log('Fallback to English voice:', englishVoice.name);
    } else if (voices.length > 0) {
      this.selectedVoice = voices[0];
      console.log('Fallback to first available voice:', voices[0].name);
    }
  }

  /**
   * Process any speech that was queued before voices loaded
   */
  private processPendingSpeech(): void {
    while (this.pendingSpeech.length > 0) {
      const text = this.pendingSpeech.shift();
      if (text) {
        this.speak(text);
      }
    }
  }

  /**
   * Start listening for voice input
   */
  startListening(): boolean {
    // Re-initialize recognition if needed (browser might have reset it)
    if (!this.recognition) {
      this.initializeRecognition();
    }
    
    if (!this.recognition) {
      this.state.error = 'Speech recognition not available';
      this.emit('error', { error: 'not-available', message: 'Speech recognition not available' });
      return false;
    }
    
    if (this.state.isListening) {
      return true; // Already listening
    }
    
    // Stop any ongoing speech to avoid feedback
    this.stopSpeaking();
    
    try {
      // Reset state before starting
      this.state.error = null;
      this.state.transcript = '';
      
      // Abort any previous session first
      try {
        this.recognition.abort();
      } catch {
        // Ignore abort errors
      }
      
      // Small delay after abort
      this.recognition.start();
      console.log('Speech recognition started successfully');
      return true;
    } catch (error: any) {
      // Handle "already started" error gracefully
      if (error.name === 'InvalidStateError') {
        console.log('Recognition in invalid state, reinitializing...');
        // Reinitialize the recognition object
        this.initializeRecognition();
        try {
          this.recognition?.start();
          return true;
        } catch (retryError: any) {
          console.error('Retry also failed:', retryError);
          this.state.error = retryError.message || 'Failed to start listening';
          return false;
        }
      }
      
      console.error('Failed to start listening:', error);
      this.state.error = error.message || 'Failed to start listening';
      this.emit('error', { error: error.name, message: error.message });
      return false;
    }
  }

  /**
   * Stop listening for voice input
   */
  stopListening(): void {
    if (this.recognition && this.state.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
    }
  }

  /**
   * Speak text using Grandma Sue's voice
   */
  speak(text: string, config?: Partial<VoiceConfig>): void {
    if (!this.synthesis) {
      console.warn('Speech synthesis not available');
      return;
    }
    
    // If voices haven't loaded yet, queue the speech
    if (!this.voicesLoaded) {
      this.pendingSpeech.push(text);
      return;
    }
    
    // Cancel any ongoing speech
    this.synthesis.cancel();
    
    // Create utterance
    this.utterance = new SpeechSynthesisUtterance(text);
    
    // Apply configuration
    const finalConfig = { ...this.voiceConfig, ...config };
    this.utterance.rate = finalConfig.rate;
    this.utterance.pitch = finalConfig.pitch;
    this.utterance.volume = finalConfig.volume;
    this.utterance.lang = finalConfig.lang;
    
    // Apply selected voice
    if (this.selectedVoice) {
      this.utterance.voice = this.selectedVoice;
    }
    
    // Set up event handlers
    this.utterance.onstart = () => {
      this.state.isSpeaking = true;
      this.emit('speaking-start');
    };
    
    this.utterance.onend = () => {
      this.state.isSpeaking = false;
      this.emit('speaking-end');
    };
    
    this.utterance.onerror = (event) => {
      this.state.isSpeaking = false;
      if (event.error !== 'interrupted') {
        this.state.error = event.error;
        this.emit('error', { error: event.error });
      }
    };
    
    // Speak
    this.synthesis.speak(this.utterance);
  }

  /**
   * Speak with adjusted emotional tone
   */
  speakWithEmotion(
    text: string, 
    emotion: 'comfort' | 'concern' | 'gentle' | 'serious' | 'warm' | 'normal'
  ): void {
    const emotionConfigs: Record<string, Partial<VoiceConfig>> = {
      comfort: { rate: 0.8, pitch: 1.0, volume: 0.9 },      // Slower, softer
      concern: { rate: 0.85, pitch: 1.0, volume: 1.0 },     // Slightly slower
      gentle: { rate: 0.8, pitch: 1.05, volume: 0.85 },     // Very soft
      serious: { rate: 0.9, pitch: 0.95, volume: 1.0 },     // Steadier
      warm: { rate: 0.85, pitch: 1.1, volume: 1.0 },        // Friendly
      normal: {}                                              // Default
    };
    
    this.speak(text, emotionConfigs[emotion]);
  }

  /**
   * Stop speaking
   */
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.state.isSpeaking = false;
    }
  }

  /**
   * Pause speaking
   */
  pauseSpeaking(): void {
    if (this.synthesis && this.state.isSpeaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume speaking
   */
  resumeSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  /**
   * Get current state
   */
  getState(): VoiceState {
    return { ...this.state };
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis?.getVoices() || [];
  }

  /**
   * Set preferred voice by name
   */
  setVoice(voiceName: string): boolean {
    const voices = this.getAvailableVoices();
    const voice = voices.find(v => 
      v.name.toLowerCase().includes(voiceName.toLowerCase())
    );
    
    if (voice) {
      this.selectedVoice = voice;
      this.voiceConfig.voiceName = voice.name;
      return true;
    }
    
    return false;
  }

  /**
   * Update voice configuration
   */
  setConfig(config: Partial<VoiceConfig>): void {
    this.voiceConfig = { ...this.voiceConfig, ...config };
  }

  /**
   * Add event listener
   */
  on(event: VoiceEventType, callback: VoiceEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: VoiceEventType, callback: VoiceEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit event to listeners
   */
  private emit(type: VoiceEventType, data?: any): void {
    const event: VoiceEvent = {
      type,
      data,
      timestamp: new Date()
    };
    
    this.eventListeners.get(type)?.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in voice event listener:', error);
      }
    });
  }

  /**
   * Check if voice features are available
   */
  isAvailable(): { recognition: boolean; synthesis: boolean } {
    return {
      recognition: this.state.recognitionAvailable,
      synthesis: this.state.voiceAvailable
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopListening();
    this.stopSpeaking();
    this.eventListeners.clear();
    this.recognition = null;
    this.utterance = null;
  }
}

// Singleton instance
export const voiceService = new VoiceService();
