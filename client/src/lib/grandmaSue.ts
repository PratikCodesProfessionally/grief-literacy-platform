/**
 * Grandma Sue - Exports
 * 
 * Central export file for all Grandma Sue related components and services.
 */

// Components
export { GrandmaSueEnhanced } from '@/components/GrandmaSueEnhanced';
export { GrandmaSue } from '@/components/GrandmaSue';

// Hooks
export { useGrandmaSue, type UseGrandmaSueOptions, type UseGrandmaSueReturn } from '@/hooks/useGrandmaSue';

// Services
export { ragPipelineService, type ConversationMessage, type RAGResponse } from '@/services/RAGPipelineService';
export { voiceService, type VoiceConfig, type VoiceState, type VoiceEvent } from '@/services/VoiceService';
export { crisisDetectionService, type CrisisAssessment, type CrisisResource, type CrisisType } from '@/services/CrisisDetectionService';
export { knowledgeBaseService, type DocumentChunk, type UploadedDocument, type TopicCategory, type TechniqueType } from '@/services/KnowledgeBaseService';
export { emotionalAnalysisService, type EmotionalAnalysis, type EmotionalState, type ProblemType, type UrgencyLevel } from '@/services/EmotionalAnalysisService';

// Existing services
export { claudeService } from '@/services/ClaudeService';
export { huggingFaceService } from '@/services/HuggingFaceService';
export { geminiService } from '@/services/GeminiService';
