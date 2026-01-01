/**
 * Grandma Sue Type Definitions
 * 
 * Comprehensive type definitions for the Grandma Sue system.
 */

// ============================================
// Emotional Analysis Types
// ============================================

export type EmotionalState = 
  | 'anxious'
  | 'sad'
  | 'angry'
  | 'frustrated'
  | 'confused'
  | 'hopeless'
  | 'fearful'
  | 'overwhelmed'
  | 'lonely'
  | 'guilty'
  | 'numb'
  | 'mixed'
  | 'positive'
  | 'neutral';

export type ProblemType =
  | 'anxiety'
  | 'depression'
  | 'grief'
  | 'relationship'
  | 'work'
  | 'health'
  | 'family'
  | 'trauma'
  | 'stress'
  | 'loneliness'
  | 'self-esteem'
  | 'decision-making'
  | 'general'
  | 'crisis';

export type UrgencyLevel = 
  | 'casual-chat'
  | 'moderate-concern'
  | 'significant-distress'
  | 'crisis';

export type UserNeed =
  | 'validation'
  | 'advice'
  | 'information'
  | 'companionship'
  | 'venting'
  | 'problem-solving'
  | 'comfort'
  | 'professional-referral';

export type EmotionalIntensity = 'low' | 'medium' | 'high' | 'crisis';

export interface EmotionalAnalysis {
  emotionalState: EmotionalState;
  emotionalIntensity: EmotionalIntensity;
  problemType: ProblemType;
  urgencyLevel: UrgencyLevel;
  userNeeds: UserNeed[];
  sentimentScore: number;
  keywords: string[];
  crisisIndicators: CrisisIndicator[];
}

// ============================================
// Crisis Types
// ============================================

export type CrisisType = 
  | 'suicidal-ideation'
  | 'suicide-plan'
  | 'self-harm'
  | 'abuse-victim'
  | 'abuse-perpetrator'
  | 'psychotic-symptoms'
  | 'severe-depression'
  | 'panic-attack'
  | 'substance-crisis'
  | 'violence-threat'
  | 'domestic-violence';

export type RiskLevel = 'none' | 'low' | 'moderate' | 'high' | 'imminent';

export type RecommendedAction =
  | 'continue-conversation'
  | 'gentle-check-in'
  | 'express-concern'
  | 'encourage-professional'
  | 'provide-crisis-resources'
  | 'emergency-protocol';

export interface CrisisIndicator {
  type: CrisisType;
  phrase: string;
  severity: 'warning' | 'concern' | 'critical';
  confidence: number;
}

export interface CrisisResource {
  name: string;
  contact: string;
  type: 'phone' | 'text' | 'chat' | 'emergency';
  available: string;
  description: string;
}

export interface CrisisAssessment {
  isCrisis: boolean;
  riskLevel: RiskLevel;
  crisisTypes: CrisisType[];
  indicators: CrisisIndicator[];
  recommendedAction: RecommendedAction;
  resources: CrisisResource[];
  responseGuidance: string;
}

// ============================================
// Knowledge Base Types
// ============================================

export type TopicCategory = 
  | 'anxiety'
  | 'depression'
  | 'grief'
  | 'trauma'
  | 'relationships'
  | 'stress'
  | 'self-esteem'
  | 'anger'
  | 'loneliness'
  | 'crisis'
  | 'general-wellness';

export type TechniqueType =
  | 'active-listening'
  | 'cbt'
  | 'validation'
  | 'grounding'
  | 'reframing'
  | 'behavioral-activation'
  | 'mindfulness'
  | 'self-compassion'
  | 'boundary-setting'
  | 'crisis-intervention';

export type SourceType = 'textbook' | 'guide' | 'research' | 'technique' | 'crisis-protocol';
export type EvidenceLevel = 'research-backed' | 'clinical-consensus' | 'anecdotal';
export type Applicability = 'general' | 'crisis' | 'specific';

export interface ChunkMetadata {
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  pageNumber?: number;
  section?: string;
  chapter?: string;
  topicCategories: TopicCategory[];
  techniqueType?: TechniqueType[];
  applicability: Applicability;
  evidenceLevel: EvidenceLevel;
  lastUpdated: Date;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  embedding?: number[];
}

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'error';

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  processedAt?: Date;
  chunkCount: number;
  status: DocumentStatus;
  errorMessage?: string;
}

export interface RetrievalResult {
  chunks: DocumentChunk[];
  relevanceScores: number[];
  techniques: TechniqueType[];
  topicMatch: TopicCategory[];
  crisisIndicators: boolean;
}

// ============================================
// Conversation Types
// ============================================

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  analysis?: EmotionalAnalysis;
}

export interface ChatMessage extends ConversationMessage {
  id: string;
  feedback?: 'helpful' | 'not-helpful';
  isVoice?: boolean;
  isCrisis?: boolean;
  sources?: string[];
}

export interface RAGResponse {
  response: string;
  analysis: EmotionalAnalysis;
  retrievedKnowledge: RetrievalResult;
  techniquesApplied: TechniqueType[];
  isCrisis: boolean;
  sources: string[];
}

// ============================================
// Voice Types
// ============================================

export interface VoiceConfig {
  rate: number;
  pitch: number;
  volume: number;
  voiceName?: string;
  lang: string;
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
  | 'error';

export interface VoiceEvent {
  type: VoiceEventType;
  data?: any;
  timestamp: Date;
}

export type VoiceEmotion = 'comfort' | 'concern' | 'gentle' | 'serious' | 'warm' | 'normal';

// ============================================
// Context Types
// ============================================

export interface ConversationContext {
  topics: string[];
  sentiment: string;
  userPreferences: {
    responseStyle: 'brief' | 'detailed';
    previousTopics: string[];
  };
}

export interface GrandmaSueConfig {
  enableVoice: boolean;
  autoSpeak: boolean;
  showTranscript: boolean;
  autoSaveHistory: boolean;
  crisisNotifications: boolean;
}

// ============================================
// Personality Types
// ============================================

export interface GrandmaPersonality {
  openingPhrases: string[];
  listeningPhrases: string[];
  transitionPhrases: string[];
  wisdomPhrases: string[];
  endearments: string[];
  crisisTransitions: string[];
}

export type ClinicalTranslation = Record<string, string>;
