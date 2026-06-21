/**
 * RAG Pipeline Service for Grandma Sue
 * 
 * Orchestrates the Retrieval-Augmented Generation process:
 * 1. Analyze user message for emotional content
 * 2. Retrieve relevant psychology knowledge
 * 3. Construct enhanced prompt with personality
 * 4. Generate contextually appropriate response
 */

import { 
  knowledgeBaseService, 
  type RetrievalResult,
  type TopicCategory,
  type TechniqueType,
  type DocumentChunk
} from './KnowledgeBaseService';
import { 
  emotionalAnalysisService, 
  type EmotionalAnalysis 
} from './EmotionalAnalysisService';
import { claudeService } from './ClaudeService';
import { huggingFaceService } from './HuggingFaceService';
import { geminiService } from './GeminiService';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  analysis?: EmotionalAnalysis;
}

export type AIProvider = 'claude' | 'huggingface' | 'gemini' | 'local';

type AIProxyStatus = {
  claude: boolean;
  huggingface: boolean;
  gemini: boolean;
};

export interface RAGResponse {
  response: string;
  provider: AIProvider;
  analysis: EmotionalAnalysis;
  retrievedKnowledge: RetrievalResult;
  techniquesApplied: TechniqueType[];
  isCrisis: boolean;
  sources: string[];
}

interface GrandmaPersonality {
  openingPhrases: string[];
  listeningPhrases: string[];
  transitionPhrases: string[];
  wisdomPhrases: string[];
  endearments: string[];
  celebratoryPhrases: string[];
  encouragingPhrases: string[];
  crisisTransitions: string[];
}

// Grandma Sue's personality elements
const GRANDMA_PERSONALITY: GrandmaPersonality = {
  openingPhrases: [
    "Hello, sweetheart. What's on your mind today?",
    "Hi there, dear. How are you feeling?",
    "Come sit down and tell Grandma Sue what's troubling you.",
    "I'm here, honey. Take your time.",
    "Hello, dear one. I'm listening."
  ],
  listeningPhrases: [
    "I hear you, honey.",
    "That sounds really difficult.",
    "Tell me more about that.",
    "I can understand why you'd feel that way.",
    "You're being so brave to share this with me.",
    "I'm right here with you.",
    "Mmm-hmm, I'm listening.",
    "That makes a lot of sense, dear."
  ],
  transitionPhrases: [
    "If I may share something with you...",
    "In my experience...",
    "Here's something that might help...",
    "Have you thought about trying...?",
    "What do you think about...?",
    "You know, I've learned that...",
    "Something that often helps is..."
  ],
  wisdomPhrases: [
    "Sometimes the best thing we can do is take things one day at a time.",
    "Be patient with yourself, dear.",
    "These things take time.",
    "You're doing better than you think.",
    "It's okay to ask for help.",
    "You don't have to carry this alone.",
    "Every storm passes eventually.",
    "You've survived difficult times before, and you'll get through this too."
  ],
  endearments: ['dear', 'sweetheart', 'honey', 'love', 'sweetie', 'dear one'],
  celebratoryPhrases: [
    "Oh, that's wonderful to hear!",
    "That makes my heart so happy, dear!",
    "I'm so proud of you, sweetheart!",
    "What a beautiful thing to share with me!",
    "That's such great news, honey!",
    "I can hear the joy in what you're sharing!"
  ],
  encouragingPhrases: [
    "You should be so proud of yourself.",
    "That takes real strength and dedication.",
    "Keep up the wonderful work, dear.",
    "You're doing amazingly well.",
    "That's such a healthy approach to take."
  ],
  crisisTransitions: [
    "Sweetheart, I'm really concerned about what you're telling me.",
    "What you're going through sounds very serious, and I care about your safety.",
    "I want you to know that I hear your pain, and I'm worried about you.",
    "This is important, dear. Please listen carefully."
  ]
};

// Translation map: Clinical → Grandmotherly language
const CLINICAL_TRANSLATIONS: Record<string, string> = {
  'cognitive reframing': "let's try looking at this from another angle",
  'cognitive restructuring': "examining those thoughts a bit differently",
  'behavioral activation': "sometimes doing something small can help us feel better",
  'mindfulness': "focusing on this moment, right now",
  'setting boundaries': "it's okay to say no sometimes",
  'self-compassion': "being kind to yourself",
  'validation': "your feelings make perfect sense",
  'coping strategies': "things that might help you feel better",
  'emotional regulation': "finding ways to steady those big feelings",
  'grounding techniques': "bringing yourself back to the here and now",
  'active listening': "really hearing what you're saying",
  'psychoeducation': "understanding what's happening inside",
  'exposure therapy': "gradually facing what scares you, step by step"
};

/**
 * Crisis resources for different regions
 */
const CRISIS_RESOURCES = {
  general: {
    suicide: "988 Suicide & Crisis Lifeline (call or text 988)",
    text: "Crisis Text Line: Text HOME to 741741",
    emergency: "Emergency Services: 911",
    international: "International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/"
  }
};

/**
 * RAG Pipeline Service
 */
export class RAGPipelineService {
  private conversationHistory: ConversationMessage[] = [];
  private maxHistoryLength = 15;
  private readonly useBackendAIProxy = (import.meta.env.VITE_USE_BACKEND_AI_PROXY ?? 'true') === 'true';
  private readonly apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  private aiProxyStatusPromise: Promise<AIProxyStatus | null> | null = null;

  private getAIProxyStatus(): Promise<AIProxyStatus | null> {
    if (!this.useBackendAIProxy) return Promise.resolve(null);
    if (this.aiProxyStatusPromise) return this.aiProxyStatusPromise;

    this.aiProxyStatusPromise = fetch(`${this.apiBaseUrl}/api/ai/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          console.warn('⚠️ Failed to fetch /api/ai/status:', res.status);
          return null;
        }
        const data = (await res.json()) as AIProxyStatus;
        if (!data || typeof data !== 'object') return null;
        return {
          claude: Boolean((data as any).claude),
          huggingface: Boolean((data as any).huggingface),
          gemini: Boolean((data as any).gemini),
        };
      })
      .catch((err) => {
        console.warn('⚠️ Error fetching /api/ai/status:', err);
        return null;
      });

    return this.aiProxyStatusPromise;
  }

  /**
   * Process user message through the full RAG pipeline
   */
  async processMessage(
    userMessage: string,
    existingHistory: ConversationMessage[] = []
  ): Promise<RAGResponse> {
    // Update conversation history
    this.conversationHistory = existingHistory.slice(-this.maxHistoryLength);
    
    // Check if user is asking about Grandma Sue's knowledge/insights
    if (this.isAskingAboutKnowledge(userMessage)) {
      return this.generateKnowledgeOverviewResponse();
    }
    
    // Step 1: Analyze emotional content
    const analysis = emotionalAnalysisService.analyze(userMessage);
    
    // Step 2: Check for crisis and handle appropriately
    const isCrisis = analysis.crisisIndicators.length > 0 || analysis.urgencyLevel === 'crisis';
    
    // Step 3: Retrieve relevant knowledge
    const retrievedKnowledge = knowledgeBaseService.retrieve(
      userMessage,
      analysis.emotionalState,
      analysis.problemType,
      isCrisis ? 3 : 5 // Fewer chunks for crisis to leave room for resources
    );
    
    // Step 4: Generate response
    let response: string;
    let provider: 'claude' | 'huggingface' | 'gemini' | 'local' = 'local';
    
    try {
      // Try AI-powered response first
      const aiResult = await this.generateAIResponse(
        userMessage,
        analysis,
        retrievedKnowledge,
        isCrisis
      );
      response = aiResult.response;
      provider = aiResult.provider;
      console.log('✅ AI response generated successfully');
    } catch (error) {
      console.error('❌ AI generation failed, using knowledge-enhanced fallback:', error);
      // Fallback to local knowledge-enhanced response (with conversation history for context)
      response = this.generateLocalResponse(
        userMessage,
        analysis,
        retrievedKnowledge,
        isCrisis,
        this.conversationHistory
      );
      console.log('📚 Using local fallback response');
    }
    
    // Extract source names for attribution
    const sources = [...new Set(retrievedKnowledge.chunks.map(c => c.metadata.sourceName))];
    
    return {
      response,
      provider,
      analysis,
      retrievedKnowledge,
      techniquesApplied: retrievedKnowledge.techniques,
      isCrisis,
      sources
    };
  }

  /**
   * Generate response using AI (Claude or HuggingFace)
   */
  private async generateAIResponse(
    userMessage: string,
    analysis: EmotionalAnalysis,
    knowledge: RetrievalResult,
    isCrisis: boolean
  ): Promise<{ response: string; provider: 'claude' | 'huggingface' | 'gemini' }> {
    // Build the enhanced system prompt
    const systemPrompt = this.buildEnhancedSystemPrompt(analysis, knowledge, isCrisis);
    
    // Prepare messages
    const messages = [
      ...this.conversationHistory.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user' as const, content: userMessage }
    ];

    // Context for the AI
    const context = {
      topics: analysis.keywords,
      sentiment: analysis.emotionalState,
      previousTopics: this.conversationHistory
        .filter(m => m.analysis)
        .map(m => m.analysis!.problemType)
    };

    const proxyStatus = await this.getAIProxyStatus();
    if (proxyStatus) {
      console.log('ℹ️ AI proxy status:', proxyStatus);
    }

    // Try providers in order. If one fails (e.g. proxy not configured server-side), fall through.
    const attemptedProviders: Array<'claude' | 'huggingface' | 'gemini'> = [];
    let lastError: unknown = null;

    const claudeAvailable = claudeService.isConfigured() && (!proxyStatus || proxyStatus.claude);
    const huggingFaceAvailable = huggingFaceService.isConfigured() && (!proxyStatus || proxyStatus.huggingface);
    const geminiAvailable = geminiService.isConfigured() && (!proxyStatus || proxyStatus.gemini);

    if (claudeService.isConfigured() && proxyStatus && !proxyStatus.claude) {
      console.log('ℹ️ Skipping Claude (not configured server-side)');
    }
    if (huggingFaceService.isConfigured() && proxyStatus && !proxyStatus.huggingface) {
      console.log('ℹ️ Skipping HuggingFace (not configured server-side)');
    }
    if (geminiService.isConfigured() && proxyStatus && !proxyStatus.gemini) {
      console.log('ℹ️ Skipping Gemini (not configured server-side)');
    }

    if (claudeAvailable) {
      attemptedProviders.push('claude');
      try {
        console.log('🤖 Trying Claude for response generation');
        const response = await this.generateWithClaude(systemPrompt, messages, context);
        return { response, provider: 'claude' };
      } catch (err) {
        lastError = err;
        console.warn('⚠️ Claude generation failed; trying next provider:', err);
      }
    }

    if (huggingFaceAvailable) {
      attemptedProviders.push('huggingface');
      try {
        console.log('🤖 Trying HuggingFace for response generation');
        const response = await this.generateWithHuggingFace(messages, context);
        return { response, provider: 'huggingface' };
      } catch (err) {
        lastError = err;
        console.warn('⚠️ HuggingFace generation failed; trying next provider:', err);
      }
    }

    if (geminiAvailable) {
      attemptedProviders.push('gemini');
      try {
        console.log('🤖 Trying Gemini for response generation');
        const response = await this.generateWithGemini(messages, context);
        return { response, provider: 'gemini' };
      } catch (err) {
        lastError = err;
        console.warn('⚠️ Gemini generation failed; no more providers left:', err);
      }
    }

    if (attemptedProviders.length === 0) {
      console.warn('⚠️ No AI service configured - using local fallback');
      throw new Error('No AI service configured');
    }

    // We attempted at least one provider but all failed.
    console.warn(`⚠️ All AI providers failed (${attemptedProviders.join(', ')}); using local fallback`);
    throw (lastError instanceof Error ? lastError : new Error('All AI providers failed'));
  }

  /**
   * Generate response using Claude
   */
  private async generateWithClaude(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    context: { topics: string[]; sentiment: string; previousTopics: string[] }
  ): Promise<string> {
    // Claude API will use its own system prompt building,
    // but we enhance with our knowledge context
    return await claudeService.generateResponse(messages, context);
  }

  /**
   * Generate response using HuggingFace
   */
  private async generateWithHuggingFace(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    context: { topics: string[]; sentiment: string; previousTopics: string[] }
  ): Promise<string> {
    return await huggingFaceService.generateResponse(messages, context);
  }

  /**
   * Generate response using Gemini
   */
  private async generateWithGemini(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    context: { topics: string[]; sentiment: string; previousTopics: string[] }
  ): Promise<string> {
    return await geminiService.generateResponse(messages, context);
  }

  /**
   * Build enhanced system prompt with personality and retrieved knowledge
   */
  private buildEnhancedSystemPrompt(
    analysis: EmotionalAnalysis,
    knowledge: RetrievalResult,
    isCrisis: boolean
  ): string {
    let prompt = `You are Grandma Sue, a warm, caring grandmother figure who provides emotional support.

## Your Personality
- Warm and genuinely caring, but not saccharine
- Wise from life experience, but humble about your limitations
- Patient, non-judgmental, and accepting
- Uses endearments naturally (dear, sweetheart, honey) but not excessively
- Speaks in conversational, natural language - NEVER clinical or textbook-like
- Listens more than advises, especially initially
- Validates feelings before offering any guidance

## Current Conversation Context
- User's emotional state: ${analysis.emotionalState} (intensity: ${analysis.emotionalIntensity})
- Problem type: ${analysis.problemType}
- User appears to need: ${analysis.userNeeds.join(', ')}

## Relevant Knowledge to Apply Naturally
Based on psychology and counseling resources, here are relevant concepts to weave into your response naturally (NEVER quote directly or sound clinical):

`;

    // Add retrieved knowledge chunks
    knowledge.chunks.forEach((chunk, i) => {
      prompt += `\n### Insight ${i + 1} (from ${chunk.metadata.sourceName}):\n${chunk.content}\n`;
    });

    prompt += `
## Response Guidelines
1. Start by acknowledging the user's feelings (validation first)
2. Transform any clinical concepts into grandmotherly wisdom
3. Use gentle, conversational language
4. Keep response to 2-4 paragraphs maximum
5. Ask an open-ended question to encourage continued sharing
6. Never diagnose or prescribe treatment
`;

    // Add crisis protocol if needed
    if (isCrisis) {
      prompt += `
## ⚠️ CRISIS PROTOCOL - HIGHEST PRIORITY
The user may be experiencing a crisis. You MUST:
1. Stay calm and compassionate
2. Validate their pain without minimizing
3. Express genuine concern for their safety
4. Clearly encourage professional help
5. Provide crisis resources:
   - 988 Suicide & Crisis Lifeline (call or text 988)
   - Crisis Text Line: text HOME to 741741
   - Emergency services: 911
6. Do NOT attempt to be their therapist
7. Remind them they are not alone and that help is available

Start with something like: "${GRANDMA_PERSONALITY.crisisTransitions[0]}"
`;
    }

    // Add translation reminders
    prompt += `
## Language Translations (NEVER use clinical terms)
${Object.entries(CLINICAL_TRANSLATIONS).map(([clinical, natural]) => 
  `- "${clinical}" → "${natural}"`
).join('\n')}

Remember: You are a caring grandmother, not a therapist. Your role is to listen, validate, and gently support - while knowing when professional help is needed.`;

    return prompt;
  }

  /**
   * Generate response using local knowledge (fallback when AI unavailable)
   */
  private generateLocalResponse(
    userMessage: string,
    analysis: EmotionalAnalysis,
    knowledge: RetrievalResult,
    isCrisis: boolean,
    conversationHistory: ConversationMessage[] = []
  ): string {
    // Handle crisis first
    if (isCrisis) {
      return this.generateCrisisResponse(analysis);
    }
    
    // Check if user is asking about document content
    const isDocumentQuery = this.isAskingAboutDocuments(userMessage, knowledge);
    
    if (isDocumentQuery && knowledge.chunks.length > 0) {
      return this.generateDocumentBasedResponse(userMessage, knowledge);
    }
    
    // Generate coherent response based on emotional state (with conversation context)
    return this.generateEmotionallyCoherentResponse(userMessage, analysis, knowledge, conversationHistory);
  }

  /**
   * Generate a coherent response based on emotional state
   * This replaces the fragmented approach of combining random phrases
   */
  private generateEmotionallyCoherentResponse(
    userMessage: string,
    analysis: EmotionalAnalysis,
    knowledge: RetrievalResult,
    conversationHistory: ConversationMessage[] = []
  ): string {
    const lower = userMessage.toLowerCase();
    
    // Check if user is asking for help/advice/suggestions
    const isAskingForHelp = lower.includes('help') || 
                            lower.includes('overcome') || 
                            lower.includes('how do i') ||
                            lower.includes('what can i do') ||
                            lower.includes('advice') ||
                            lower.includes('suggestion') ||
                            lower.includes('suggestions') ||
                            lower.includes('tips') ||
                            lower.includes('recommend') ||
                            lower.includes('what should') ||
                            lower.includes('how can') ||
                            lower.includes('what would you') ||
                            lower.includes('could you tell') ||
                            lower.includes('i would like');
    
    // ALWAYS check conversation history for emotional context when current message seems neutral
    // This ensures we maintain empathy throughout the conversation, not just when asking for help
    let effectiveAnalysis = analysis;
    if (analysis.emotionalState === 'neutral' && conversationHistory.length > 0) {
      effectiveAnalysis = this.getEmotionalContextFromHistory(conversationHistory, analysis);
    }
    
    // POSITIVE emotions
    if (effectiveAnalysis.emotionalState === 'positive' || effectiveAnalysis.sentimentScore > 0.5) {
      return this.generatePositiveCoherentResponse(effectiveAnalysis);
    }
    
    // NEUTRAL / casual chat (but NOT if asking for help AND no emotional history)
    if (effectiveAnalysis.emotionalState === 'neutral' && !isAskingForHelp) {
      return this.generateNeutralCoherentResponse();
    }
    
    // NEGATIVE emotions OR asking for help (sad, anxious, overwhelmed, etc.)
    return this.generateSupportiveResponse(userMessage, effectiveAnalysis, knowledge, isAskingForHelp);
  }

  /**
   * Get emotional context from conversation history
   * If user's previous messages showed negative emotions, carry that forward
   */
  private getEmotionalContextFromHistory(
    history: ConversationMessage[],
    currentAnalysis: EmotionalAnalysis
  ): EmotionalAnalysis {
    // Look at recent user messages for emotional context
    const recentUserMessages = history
      .filter(m => m.role === 'user' && m.analysis)
      .slice(-3); // Last 3 user messages
    
    // Find the most recent negative emotional state
    for (let i = recentUserMessages.length - 1; i >= 0; i--) {
      const prevAnalysis = recentUserMessages[i].analysis;
      if (prevAnalysis && prevAnalysis.emotionalState !== 'neutral' && prevAnalysis.emotionalState !== 'positive') {
        // Carry forward the previous emotional context
        return {
          ...currentAnalysis,
          emotionalState: prevAnalysis.emotionalState,
          problemType: prevAnalysis.problemType || currentAnalysis.problemType,
          // Keep current urgency and needs but carry emotional state
        };
      }
    }
    
    return currentAnalysis;
  }

  /**
   * Generate a supportive response for negative emotions
   */
  private generateSupportiveResponse(
    userMessage: string,
    analysis: EmotionalAnalysis,
    knowledge: RetrievalResult,
    isAskingForHelp: boolean
  ): string {
    let response = '';
    const lower = userMessage.toLowerCase();
    
    // Check if user is sharing more context/details about their feelings
    const isSharingContext = lower.includes('perhaps') || 
                              lower.includes('maybe') || 
                              lower.includes('probably') ||
                              lower.includes('i think') ||
                              lower.includes('it\'s because') ||
                              lower.includes('it might be') ||
                              lower.includes('could be') ||
                              lower.includes('due to') ||
                              lower.includes('the weather') ||
                              lower.includes('because of');
    
    if (isSharingContext) {
      // User is explaining the cause - acknowledge their insight
      response += this.getContextAcknowledgment(userMessage);
    } else {
      // 1. Acknowledgment (empathetic, not happy)
      response += this.getEmpatheticAcknowledgment(analysis);
    }
    
    // 2. If asking for help, provide actual advice
    if (isAskingForHelp) {
      response += '\n\n' + this.getHelpfulAdvice(analysis, knowledge);
    } else {
      // Otherwise, offer support and invite sharing
      response += '\n\n' + this.getSupportiveInvitation(analysis);
    }
    
    return response;
  }

  /**
   * Get acknowledgment when user shares context/reasons for their feelings
   */
  private getContextAcknowledgment(userMessage: string): string {
    const lower = userMessage.toLowerCase();
    
    // Weather-related
    if (lower.includes('weather') || lower.includes('rain') || lower.includes('dark') || lower.includes('grey') || lower.includes('gray') || lower.includes('cloudy') || lower.includes('cold')) {
      const responses = [
        "Ah, the weather can have such a strong effect on our mood, dear. Those dark, rainy days can really weigh on us.",
        "You know, sweetheart, you're not alone in that. Many people feel affected by gloomy weather. There's even a name for it - some call it the 'rainy day blues.'",
        "The connection between weather and mood is very real, honey. When the sun hides away, it can feel like our spirits do too.",
        "I understand, dear. Grey skies and rain can make everything feel heavier. Our bodies miss the sunlight."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // General context acknowledgment
    const responses = [
      "Thank you for sharing that, dear. It helps to understand what might be behind these feelings.",
      "That makes sense, sweetheart. Sometimes just recognizing what's affecting us is an important first step.",
      "I appreciate you thinking about what might be causing this, honey. Self-awareness is valuable.",
      "It sounds like you have some insight into what's going on, dear. That's helpful to know."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get empathetic acknowledgment for negative emotions
   * Extended with more varied, natural responses
   */
  private getEmpatheticAcknowledgment(analysis: EmotionalAnalysis): string {
    const sadAcknowledgments = [
      "I hear you, dear, and I'm so sorry you're feeling this way.",
      "Thank you for trusting me with this, sweetheart. Feeling low is really hard.",
      "Oh honey, I can hear the heaviness in what you're sharing.",
      "I'm here with you, dear. These feelings you're describing sound really difficult.",
      "My heart goes out to you, sweetheart. Sadness can be such a heavy weight to carry.",
      "I can feel the pain in your words, dear. You don't have to carry this alone.",
      "It takes courage to share when you're hurting, honey. I'm glad you're talking to me."
    ];
    
    const anxiousAcknowledgments = [
      "I can sense the worry in what you're sharing, dear.",
      "That sounds really overwhelming, sweetheart. Anxiety can be so exhausting.",
      "I hear you, honey. Those anxious feelings can be so hard to carry.",
      "When our minds race like that, it can feel like there's no rest, can it? I understand, dear.",
      "Anxiety has a way of making everything feel urgent and scary. You're not alone in this.",
      "I can hear how stressed you are, sweetheart. That weight on your chest is real.",
      "Those racing thoughts can be so tiring, dear. I'm here with you."
    ];
    
    const overwhelmedAcknowledgments = [
      "Oh dear, it sounds like you're carrying so much right now.",
      "I hear you, sweetheart. When everything piles up, it can feel impossible.",
      "That's a lot to deal with, honey. No wonder you're feeling overwhelmed.",
      "Sometimes life throws more at us than feels manageable. I hear how stretched you are.",
      "When we're pulled in so many directions, it's hard to know where to start. I understand, dear.",
      "You're dealing with so much, sweetheart. It's okay to feel overwhelmed by it all."
    ];
    
    const frustratedAcknowledgments = [
      "I can hear the frustration in what you're sharing, dear. That's really hard.",
      "When things don't work out the way we hoped, it can be so disheartening, sweetheart.",
      "That sounds really frustrating, honey. It's okay to feel that way.",
      "I understand, dear. When we try so hard and things still don't come together, it's exhausting.",
      "Those setbacks can feel so discouraging. Your frustration makes complete sense."
    ];
    
    const lonelyAcknowledgments = [
      "Loneliness can be so painful, dear. I'm here with you right now.",
      "Feeling disconnected from others is one of the hardest things to bear, sweetheart.",
      "I hear you, honey. Even in a crowd, we can feel so alone sometimes.",
      "That isolation you're describing sounds so heavy. You matter, and I'm glad you're here.",
      "Everyone needs to feel connected and seen. I understand how much that absence hurts."
    ];
    
    const guiltyAcknowledgments = [
      "I can hear how hard you're being on yourself, dear. That guilt weighs heavy.",
      "We all make mistakes, sweetheart. The fact that you care shows your good heart.",
      "That regret you're feeling sounds so painful, honey. Be gentle with yourself.",
      "I hear the weight of what you're carrying, dear. Self-forgiveness is hard but so important.",
      "You're being so hard on yourself. I wonder if you'd judge a friend so harshly?"
    ];
    
    const hopelessAcknowledgments = [
      "When hope feels far away, everything can seem so dark. I'm here with you, dear.",
      "I hear how exhausted you are with everything, sweetheart. That heaviness is real.",
      "Sometimes the tunnel seems endless, but I promise, you are not alone in this, honey.",
      "That feeling of 'what's the point' can be so painful. Thank you for sharing it with me.",
      "I can hear how worn down you feel, dear. Even reaching out to talk takes strength."
    ];
    
    const angryAcknowledgments = [
      "I can hear the anger in what you're sharing, dear. Those feelings are valid.",
      "It makes sense that you'd feel upset about this, sweetheart. Anger is a natural response.",
      "That frustration and anger you're feeling - it's telling you something important, honey.",
      "When we're treated unfairly, anger is a healthy response. I hear you, dear.",
      "Your anger makes sense given what you've been through. It's okay to feel it."
    ];
    
    const confusedAcknowledgments = [
      "It's so hard when we don't know which way to turn, dear.",
      "That uncertainty you're feeling is really tough to sit with, sweetheart.",
      "When the path ahead isn't clear, it can feel so unsettling. I understand, honey.",
      "Not knowing what to do is its own kind of stress. Let's think through it together, dear.",
      "Life's decisions can feel so heavy when we can't see the right answer."
    ];
    
    const fearfulAcknowledgments = [
      "Fear can be so paralyzing, dear. I hear how scared you are.",
      "That fear you're describing is very real, sweetheart. You're brave to talk about it.",
      "When we're afraid, everything can feel threatening. I'm here with you, honey.",
      "I can hear how frightened you are, dear. You don't have to face this alone.",
      "Fear has a way of making us feel so small. But you reached out - that's courage."
    ];
    
    const numbAcknowledgments = [
      "That emptiness you're describing sounds so isolating, dear.",
      "Sometimes we feel so much that we stop feeling at all. I hear you, sweetheart.",
      "Numbness can be the mind's way of protecting us when things are too much, honey.",
      "I hear you, dear. That disconnected feeling is its own kind of pain.",
      "When we can't feel anything, it can be scary. I'm here with you."
    ];
    
    const generalNegative = [
      "I hear you, dear. Thank you for sharing this with me.",
      "That sounds really difficult, sweetheart. I'm here for you.",
      "I can hear that you're going through a hard time, honey.",
      "Thank you for trusting me with this, dear. I'm listening.",
      "Whatever you're feeling right now is valid, sweetheart. I'm here."
    ];
    
    let pool: string[];
    switch (analysis.emotionalState) {
      case 'sad': pool = sadAcknowledgments; break;
      case 'anxious': pool = anxiousAcknowledgments; break;
      case 'overwhelmed': pool = overwhelmedAcknowledgments; break;
      case 'frustrated': pool = frustratedAcknowledgments; break;
      case 'lonely': pool = lonelyAcknowledgments; break;
      case 'guilty': pool = guiltyAcknowledgments; break;
      case 'hopeless': pool = hopelessAcknowledgments; break;
      case 'angry': pool = angryAcknowledgments; break;
      case 'confused': pool = confusedAcknowledgments; break;
      case 'fearful': pool = fearfulAcknowledgments; break;
      case 'numb': pool = numbAcknowledgments; break;
      default: pool = generalNegative;
    }
    
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Get helpful advice based on emotional state
   * Extended with more problem types and nuanced advice
   */
  private getHelpfulAdvice(analysis: EmotionalAnalysis, knowledge: RetrievalResult): string {
    const emotionalState = analysis.emotionalState;
    const problemType = analysis.problemType;
    
    // Grief-specific advice
    if (problemType === 'grief') {
      return `Grief is one of life's hardest journeys, dear. Here's what I've learned:

**There's no "right" way to grieve.** Your grief is as unique as your love was. Don't let anyone tell you how you should feel or how long it should take.

**Waves are normal.** Grief comes in waves - some days will be harder than others. That's not setback, that's just grief doing what grief does.

**Honor your memories.** It's okay to talk about them, look at photos, visit meaningful places. Keeping their memory alive is part of healing.

**Take care of your body.** Grief is exhausting. Try to eat, sleep, and move when you can, even when you don't feel like it.

**Accept support.** You don't have to go through this alone. Let people in when you're ready.

Would you like to tell me about who you're missing, sweetheart? Sometimes sharing our memories can help.`;
    }
    
    // Relationship advice
    if (problemType === 'relationship') {
      return `Relationship struggles can feel so all-consuming, dear. Here are some thoughts:

**Your feelings are valid.** Whatever you're feeling about this relationship - hurt, confused, angry, sad - those feelings make sense.

**Communication is key.** If it's safe to do so, expressing how you feel using "I feel..." statements can help avoid blame while still being honest.

**Boundaries are healthy.** It's okay to set limits on what treatment you'll accept. That's not selfish - that's self-respect.

**Take time to reflect.** Ask yourself: "Does this relationship add to my life or drain from it?" Your answer matters.

**You can't fix someone else.** If someone is hurting you, that's their behavior to change, not yours to excuse.

Would you like to tell me more about what's happening in this relationship? I'm here to listen without judgment.`;
    }
    
    // Work/Academic stress advice
    if (problemType === 'work' || problemType === 'stress') {
      return `Work and academic stress can feel relentless, dear. Here's what might help:

**One thing at a time.** When we're overwhelmed, trying to do everything at once makes nothing get done well. Pick your most important task and focus only on that.

**Break it down.** Large projects feel impossible. Break them into tiny steps - so small they feel almost silly. Then just do the first one.

**Set boundaries.** It's okay to say "I need a break" or "I can't take on more right now." Your wellbeing matters more than any deadline.

**Separate yourself from your work.** A project that didn't go well doesn't mean YOU aren't good enough. Results don't define your worth.

**Ask for help.** Whether it's a deadline extension, help from a colleague, or just someone to listen - asking isn't weakness.

What's the most pressing thing on your plate right now? Let's talk it through.`;
    }
    
    // Loneliness advice
    if (problemType === 'loneliness' || emotionalState === 'lonely') {
      return `Loneliness is so painful, dear. Our hearts are made for connection. Here are some gentle steps:

**Start small.** You don't need to find your best friend tomorrow. A brief chat with a neighbor, a smile at a stranger - small connections count.

**Reach out.** Is there someone you've lost touch with? Sometimes a simple "thinking of you" message can reopen doors.

**Find your people.** Communities built around shared interests (books, games, causes) can be easier to join than general social situations.

**Be patient with yourself.** Building connections takes time. You're not doing anything wrong if it doesn't happen quickly.

**Consider professional support.** Therapists can help with the patterns that might be keeping us isolated.

What does connection look like for you, sweetheart? What kind of relationships are you longing for?`;
    }
    
    // Depression/Sadness advice
    if (emotionalState === 'sad' || problemType === 'depression') {
      return `Here are some things that might help when you're feeling low, dear:

**Start very small.** When we're feeling down, even tiny actions can help. Could you take a short walk outside, even just for 5 minutes? Fresh air and movement can help shift our mood a little.

**Be gentle with yourself.** You're not broken, sweetheart. Feeling low is part of being human, and it doesn't mean there's anything wrong with you.

**Connect with someone.** Even a brief conversation can help. Is there someone you could reach out to today - a friend, family member, or even me?

**Notice small moments.** Try to find one small thing today that brings you even a tiny bit of comfort - a warm cup of tea, a favorite song, the feeling of sunshine.

**Routine helps.** When everything feels pointless, having simple routines (wake, eat, shower) can provide structure.

If these feelings have been going on for a while, dear, it might be worth talking to a professional who can offer more support. Would you like to tell me more about what's been weighing on you?`;
    }
    
    // Anxiety advice
    if (emotionalState === 'anxious' || problemType === 'anxiety') {
      return `When anxiety gets overwhelming, here are some things that can help, sweetheart:

**Breathe slowly.** Try breathing in for 4 counts, holding for 4, and out for 6. This tells your nervous system it's safe to calm down.

**Ground yourself.** Look around and name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.

**Question the worry.** Ask yourself: "Is this worry about something that's actually happening right now, or something that might happen?" Most anxiety is about the future, not the present.

**Move your body.** Anxiety creates energy in our bodies. A walk, stretching, or even shaking your hands can help release it.

**Limit news and social media.** If current events are triggering anxiety, it's okay to take breaks from screens.

**Take one small action.** Sometimes anxiety paralyzes us. Just doing one tiny thing can help us feel more in control.

Would you like to tell me more about what's making you anxious? Sometimes just talking it through can help.`;
    }
    
    // Overwhelmed advice
    if (emotionalState === 'overwhelmed') {
      return `When everything feels like too much, here's what I'd suggest, dear:

**You don't have to do everything.** Can you pick just ONE thing to focus on right now? Everything else can wait.

**Write it down.** Sometimes getting all those swirling thoughts out of your head and onto paper helps them feel more manageable.

**What can you drop?** Not everything on your plate is equally important. What can you say "no" to, delegate, or let go of entirely?

**Take a break.** Even 10 minutes of doing something restful - closing your eyes, listening to music, stepping outside - can help reset your mind.

**Ask for help.** You don't have to carry everything alone. Is there anything someone else could help with?

**Tomorrow is another day.** Whatever doesn't get done today can wait. The world won't end.

What feels most overwhelming right now? Let's talk through it together.`;
    }
    
    // Fear advice
    if (emotionalState === 'fearful') {
      return `Fear is one of our most powerful emotions, dear. Here's what might help:

**Acknowledge it.** Saying "I'm scared" out loud or writing it down can actually reduce fear's power over us.

**Separate real danger from imagined.** Ask: "Is there an actual threat right now, or is my mind creating one?" Most fears are about possibilities, not realities.

**Take small steps.** If you're avoiding something out of fear, can you take the tiniest step toward it? Gradual exposure builds courage.

**Find your safe people.** Who makes you feel protected? Connecting with them can help.

**Remember past courage.** You've faced scary things before and survived. What helped you then?

What are you afraid of, sweetheart? Sometimes naming our fears takes away some of their power.`;
    }
    
    // Guilt advice
    if (emotionalState === 'guilty') {
      return `Guilt can be so heavy to carry, dear. Here's what I've learned:

**Separate healthy guilt from toxic guilt.** Healthy guilt tells us we've done something against our values - it has a lesson. Toxic guilt makes us feel bad for things that aren't our fault or that we can't change.

**If you made a mistake, own it.** Apologize if you can, make amends if possible, and then work on forgiving yourself.

**Ask: "Would I judge a friend this harshly?"** We're often much harder on ourselves than we would be on others.

**You can't change the past.** Beating yourself up doesn't undo anything. The question is: what can you do now?

**Some guilt isn't yours to carry.** If someone else's choices caused harm, that guilt belongs to them, not you.

What's weighing on your conscience, sweetheart? Sometimes sharing helps lighten the load.`;
    }
    
    // Hopelessness advice - with extra care
    if (emotionalState === 'hopeless') {
      return `When hope feels impossible to find, please know this, dear:

**This feeling is temporary.** Even though it doesn't feel like it right now, feelings do change. This moment is not forever.

**You matter.** Whatever your mind might be telling you, you have value. Your life has meaning.

**Small actions, not big changes.** You don't need to feel hopeful to do hopeful things. Just the next small step - eat something, drink water, rest.

**Professional help exists.** Therapists and counselors are trained to help when things feel this dark. There's no shame in reaching out.

**You're not alone.** Others have felt this way and found their way through. You can too.

If you're having thoughts of hurting yourself, please reach out to a crisis line. In the US, you can call or text 988.

I'm here with you, sweetheart. Would you like to tell me more about what's been happening?`;
    }
    
    // Generic helpful advice
    return `I'm here to help, dear. Here are some things that often help when we're struggling:

**Talk about it.** Sharing what's on your mind - like you're doing now - is an important first step.

**Be kind to yourself.** Whatever you're going through, you deserve compassion, especially from yourself.

**Take it one step at a time.** You don't have to solve everything at once.

**Move your body.** Even a short walk can help shift our mood and perspective.

**Consider professional support.** If things feel really heavy, a therapist or counselor can offer tools and support that can really help.

What would feel most helpful for you right now?`;
  }

  /**
   * Get supportive invitation to share more
   * More varied and context-aware
   */
  private getSupportiveInvitation(analysis: EmotionalAnalysis): string {
    const specificInvitations: Record<string, string[]> = {
      'sad': [
        "Would you like to tell me more about what's been making you feel this way? I'm here to listen, dear.",
        "Sometimes it helps to talk through what's weighing on our hearts. I'm here, sweetheart.",
        "I'm here for you. Would you like to share more, or would some gentle suggestions be helpful?"
      ],
      'anxious': [
        "What's been on your mind, sweetheart? Sometimes naming our worries helps them feel smaller.",
        "Would it help to talk through what's making you anxious? I'm here to listen, dear.",
        "I'm here for you, honey. Would you like to tell me more about what's worrying you?"
      ],
      'overwhelmed': [
        "Let's break this down together, dear. What's the most pressing thing right now?",
        "There's a lot on your plate, sweetheart. Would it help to talk through what needs to happen first?",
        "I'm here to help you sort through this, honey. Where would you like to start?"
      ],
      'lonely': [
        "I'm so glad you reached out, dear. Sometimes just talking helps us feel less alone.",
        "I'm here with you, sweetheart. Would you like to tell me more about what's been happening?",
        "You've taken a brave step by sharing, honey. I'm listening."
      ],
      'frustrated': [
        "That frustration makes sense, dear. Would you like to vent a bit more? Sometimes it helps.",
        "I hear how frustrated you are, sweetheart. What would help most right now?",
        "Let's talk through what's been going wrong, honey. Sometimes a fresh perspective helps."
      ],
      'hopeless': [
        "I'm here with you, dear. Even just talking is a step forward. Would you like to share more?",
        "You reached out, sweetheart - that takes strength. What would feel helpful right now?",
        "I'm listening, honey. There's no rush. Take your time."
      ]
    };
    
    const generalInvitations = [
      "Would you like to tell me more about what's been happening? I'm here to listen, dear.",
      "I'm here for you, sweetheart. What would help you most right now - would you like to talk more about it, or would some suggestions be helpful?",
      "Take your time, honey. There's no rush. Would you like to share more about what's been weighing on you?",
      "I'm listening, dear. Is there more you'd like to share, or would you like some gentle suggestions?",
      "I'm right here with you, sweetheart. What would feel most helpful?"
    ];
    
    const pool = specificInvitations[analysis.emotionalState] || generalInvitations;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Generate coherent positive response
   * Extended with more recognition patterns and natural responses
   */
  private generatePositiveCoherentResponse(analysis: EmotionalAnalysis): string {
    const keywords = analysis.keywords.map(k => k.toLowerCase());
    
    // Check for specific positive activities/topics
    if (keywords.some(k => ['meditation', 'meditate', 'meditated', 'mindfulness', 'mindful'].includes(k))) {
      const responses = [
        "Oh, that's wonderful, dear! Meditation is such a gift to give yourself. It takes real commitment to build that practice. How has it been helping you?",
        "I love hearing that, sweetheart! Mindfulness is so powerful. Even a few minutes can make such a difference. What got you started?",
        "That's beautiful, honey. Taking time to be present is so valuable in our busy world. What do you notice when you meditate?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (keywords.some(k => ['exercise', 'workout', 'gym', 'running', 'ran', 'walked', 'walk', 'yoga', 'hiking', 'swimming', 'dancing'].includes(k))) {
      const responses = [
        "That's wonderful, dear! Taking care of your body is such an important part of taking care of your whole self. How did it feel?",
        "I'm so happy to hear that, sweetheart! Movement is medicine for both body and mind. Did you enjoy it?",
        "Good for you, honey! Making time to move is an act of self-love. How often do you try to exercise?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (keywords.some(k => ['therapy', 'therapist', 'counseling', 'counselor', 'psychiatrist', 'psychologist'].includes(k))) {
      const responses = [
        "It takes real courage to invest in yourself like that, dear. I'm so proud of you for taking that step. How has it been going?",
        "That's wonderful, sweetheart. Working with a professional shows such strength. Do you feel it's helping?",
        "I'm glad you're getting support, honey. That's a brave and wise choice. What made you decide to start?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (keywords.some(k => ['friend', 'friends', 'family', 'loved ones', 'together', 'visited', 'hung out'].includes(k))) {
      const responses = [
        "Oh, that sounds lovely, dear! Connection with people we care about is so nourishing. Tell me more about it!",
        "How wonderful, sweetheart! Spending time with people who matter to us fills our hearts. What did you do together?",
        "That warms my heart to hear, honey. Our relationships are such treasures. Was it nice to see them?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (keywords.some(k => ['sleep', 'slept', 'rested', 'rest', 'relaxed', 'relaxing'].includes(k))) {
      const responses = [
        "Good sleep is so important, dear! I'm glad you got some rest. How do you feel now?",
        "That's wonderful, sweetheart. Rest is when our bodies and minds heal. What helped you relax?",
        "I'm so glad, honey. We often underestimate how much we need proper rest. Are you feeling more energized?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (keywords.some(k => ['accomplished', 'finished', 'completed', 'achieved', 'succeeded', 'did it', 'made it'].includes(k))) {
      const responses = [
        "Congratulations, dear! That feeling of accomplishment is so satisfying. What did you achieve?",
        "That's fantastic, sweetheart! You should be proud of yourself. How does it feel to have it done?",
        "Well done, honey! Completing things gives us such a sense of capability. Tell me about it!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (keywords.some(k => ['happy', 'joy', 'joyful', 'excited', 'thrilled', 'amazing', 'wonderful'].includes(k))) {
      const responses = [
        "Oh, that makes my heart so happy, dear! Joy is such a precious feeling. What's brought this on?",
        "I love hearing that, sweetheart! When did you last feel this happy? What's different now?",
        "That's beautiful, honey. Savor this feeling - you deserve it! What's making you so happy?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (keywords.some(k => ['grateful', 'thankful', 'blessed', 'appreciate', 'appreciation'].includes(k))) {
      const responses = [
        "Gratitude is such a powerful practice, dear. It shifts our whole perspective. What are you grateful for?",
        "That's beautiful, sweetheart. A grateful heart is a happy heart. What's making you feel this way?",
        "I love that, honey. Counting our blessings really does make them multiply. Tell me what you're appreciating!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (keywords.some(k => ['better', 'improved', 'progress', 'improving', 'healing', 'recovering'].includes(k))) {
      const responses = [
        "That's so wonderful to hear, dear! Progress, even small steps, is worth celebrating. What's been helping?",
        "I'm so happy for you, sweetheart! Improvement takes time and effort. What made the difference?",
        "That's great news, honey! Sometimes we don't notice our growth until we look back. How does it feel?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (keywords.some(k => ['hopeful', 'hope', 'looking forward', 'excited about', 'future'].includes(k))) {
      const responses = [
        "Hope is such a precious thing, dear. What are you looking forward to?",
        "That's beautiful, sweetheart. Hope is the light that guides us forward. Tell me about your dreams!",
        "I'm so glad you're feeling hopeful, honey. What's giving you this optimism?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Default positive responses
    const defaultResponses = [
      "Oh, that's wonderful to hear, dear! I love hearing good news from you. What's been bringing you this positive energy?",
      "That makes me so happy, sweetheart! Tell me more - I want to share in your joy!",
      "How lovely, honey! It sounds like good things are happening. What else has been going well?",
      "That's wonderful, dear! I can hear the happiness in what you're sharing. What's been the best part?",
      "I'm so glad to hear that, sweetheart! These positive moments are so important. What's making things good?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  /**
   * Generate coherent neutral response
   * More varied and welcoming
   */
  private generateNeutralCoherentResponse(): string {
    const responses = [
      "Hello there, dear! It's so nice to chat with you. What brings you here today?",
      "Well hello, sweetheart! How are you doing? Is there something on your mind you'd like to talk about?",
      "It's lovely to see you, dear. How can I help you today?",
      "Welcome, honey! I'm here to listen. What would you like to talk about?",
      "Hello, sweetheart! How are you feeling today? I'm all ears if there's something on your mind.",
      "Hi there, dear! Take your time - there's no rush. What brings you to chat today?",
      "It's good to see you, honey! How has your day been? Is there anything you'd like to share?",
      "Hello, my dear! I'm here for you. Whether you need to vent, get advice, or just chat - I'm listening."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Check if user is asking about uploaded documents
   */
  private isAskingAboutDocuments(userMessage: string, knowledge: RetrievalResult): boolean {
    const lower = userMessage.toLowerCase();
    
    // Keywords that indicate asking about document content
    const documentQueryKeywords = [
      'what is', 'what are', 'what\'s', "what's",
      'tell me about', 'explain', 'describe',
      'summary', 'summarize', 'summarise',
      'content', 'inside', 'contains',
      'book', 'document', 'pdf', 'uploaded', 'guidebook',
      'conclusion', 'introduction', 'chapter',
      'says', 'mentions', 'discusses', 'talks about',
      'according to', 'based on',
      'key points', 'main points', 'highlights',
      'covid', 'mental health' // Specific document keywords
    ];
    
    const hasQueryKeyword = documentQueryKeywords.some(keyword => lower.includes(keyword));
    
    // Check if any chunks are from user-uploaded documents
    const hasUploadedDocChunks = knowledge.chunks.some(
      chunk => chunk.metadata.sourceName.includes('.pdf') ||
               chunk.metadata.sourceName.includes('.txt') ||
               chunk.metadata.evidenceLevel === 'anecdotal' // User-uploaded content
    );
    
    return hasQueryKeyword && hasUploadedDocChunks;
  }

  /**
   * Generate response based on actual document content
   */
  private generateDocumentBasedResponse(userMessage: string, knowledge: RetrievalResult): string {
    const lower = userMessage.toLowerCase();
    const parts: string[] = [];
    
    // PRIORITIZE user-uploaded documents (PDFs) over embedded knowledge
    const uploadedDocChunks = knowledge.chunks.filter(
      chunk => chunk.metadata.sourceName.includes('.pdf') ||
               chunk.metadata.sourceName.includes('.txt') ||
               chunk.metadata.evidenceLevel === 'anecdotal'
    );
    
    // Use uploaded doc chunks if available, otherwise fall back to all chunks
    const relevantChunks = uploadedDocChunks.length > 0 
      ? uploadedDocChunks.slice(0, 3)
      : knowledge.chunks.slice(0, 3);
    
    const sourceNames = [...new Set(relevantChunks.map(c => c.metadata.sourceName))];
    
    // Opening
    if (sourceNames.length > 0 && sourceNames[0].includes('.pdf')) {
      parts.push(`Let me share what I found from the ${sourceNames[0].replace('.pdf', '')} document, dear.`);
    } else {
      parts.push(`Let me share what I found, dear.`);
    }
    
    // Check what they're asking for
    if (lower.includes('conclusion') || lower.includes('summary') || lower.includes('main point')) {
      // Try to find conclusion-like content from uploaded docs
      const conclusionChunk = relevantChunks.find(c => 
        c.content.toLowerCase().includes('conclusion') ||
        c.content.toLowerCase().includes('in summary') ||
        c.content.toLowerCase().includes('to summarize') ||
        c.content.toLowerCase().includes('key takeaway')
      );
      
      if (conclusionChunk) {
        parts.push(this.formatChunkAsResponse(conclusionChunk));
      } else if (relevantChunks.length > 0) {
        // Use the last uploaded chunk as it might be the conclusion
        const lastChunk = relevantChunks[relevantChunks.length - 1];
        parts.push("Here's what I found near the end of the document:");
        parts.push(this.formatChunkAsResponse(lastChunk));
      }
    } else if (lower.includes('introduction') || lower.includes('beginning') || lower.includes('start')) {
      // Use the first uploaded chunk
      if (relevantChunks.length > 0) {
        parts.push("Here's what I found at the beginning:");
        parts.push(this.formatChunkAsResponse(relevantChunks[0]));
      }
    } else {
      // General query - share the most relevant content from uploaded docs
      parts.push("Here's what I found that might help:");
      
      for (const chunk of relevantChunks.slice(0, 2)) {
        parts.push(this.formatChunkAsResponse(chunk));
      }
    }
    
    // Closing
    parts.push("\nWould you like me to tell you more about any specific part, sweetheart?");
    
    return parts.join('\n\n');
  }

  /**
   * Check if user is asking about Grandma Sue's knowledge/insights
   */
  private isAskingAboutKnowledge(userMessage: string): boolean {
    const lower = userMessage.toLowerCase();
    
    const knowledgeQueryPatterns = [
      'what do you know',
      'what are your insights',
      'what\'s inside your insights',
      "what's inside of your insights",
      'what inside of your insights',
      'what inside your insights',
      'what insights do you have',
      'what can you help with',
      'what topics',
      'what subjects',
      'tell me about your knowledge',
      'what have you learned',
      'your expertise',
      'what are you trained on',
      'what information do you have',
      'what does your insight contain',
      'what do your insights contain',
      'what\'s in your insights',
      'your insights',
      'show me your insights',
      'list your insights',
      'what knowledge do you have'
    ];
    
    return knowledgeQueryPatterns.some(pattern => lower.includes(pattern));
  }

  /**
   * Generate response about Grandma Sue's knowledge base
   */
  private generateKnowledgeOverviewResponse(): RAGResponse {
    const documents = knowledgeBaseService.getDocuments();
    const chunkCount = knowledgeBaseService.getChunkCount();
    
    let response = `Oh, I'm so glad you asked, dear! Let me tell you about what I've learned over the years.\n\n`;
    
    response += `**My Built-in Knowledge** includes insights about:\n`;
    response += `• **Anxiety & Stress** - Breathing techniques, grounding exercises, and calming strategies\n`;
    response += `• **Depression & Sadness** - Understanding feelings, self-compassion, and small steps forward\n`;
    response += `• **Grief & Loss** - The journey of mourning, honoring loved ones, and finding healing\n`;
    response += `• **Relationships** - Communication, boundaries, and connection\n`;
    response += `• **Self-Care & Wellness** - Mindfulness, building healthy habits, and being gentle with yourself\n`;
    response += `• **Crisis Support** - When to seek professional help and important resources\n\n`;
    
    if (documents.length > 0) {
      response += `**Documents You've Shared With Me:**\n`;
      for (const doc of documents) {
        const status = doc.status === 'ready' ? '✓' : '⏳';
        response += `• ${status} ${doc.name} (${doc.chunkCount} insights)\n`;
      }
      response += `\n`;
    }
    
    response += `In total, I have **${chunkCount} pieces of wisdom** to draw from when we chat.\n\n`;
    response += `Is there something specific you'd like to talk about, sweetheart? I'm here to listen and help however I can.`;
    
    return {
      response,
      provider: 'local',
      analysis: {
        emotionalState: 'neutral',
        emotionalIntensity: 'low',
        problemType: 'general',
        urgencyLevel: 'casual-chat',
        userNeeds: ['information'],
        sentimentScore: 0.5,
        keywords: ['knowledge', 'insights'],
        crisisIndicators: []
      },
      retrievedKnowledge: {
        chunks: [],
        relevanceScores: [],
        techniques: [],
        topicMatch: [],
        crisisIndicators: false
      },
      techniquesApplied: [],
      isCrisis: false,
      sources: ['Grandma Sue Knowledge Base']
    };
  }

  /**
   * Format a chunk as a readable response
   */
  private formatChunkAsResponse(chunk: DocumentChunk): string {
    let content = chunk.content;
    
    // Clean up the content
    content = content
      .replace(/\[Page \d+\]/g, '') // Remove page markers
      .replace(/\s+/g, ' ')          // Normalize whitespace
      .trim();
    
    // Truncate if too long (keep first ~500 chars)
    if (content.length > 600) {
      content = content.substring(0, 550) + '...';
    }
    
    // Add some grandmother-like framing
    const framings = [
      `"${content}"`,
      `The document says: "${content}"`,
      `I read this part: "${content}"`
    ];
    
    return framings[Math.floor(Math.random() * framings.length)];
  }

  /**
   * Generate crisis response with resources
   */
  private generateCrisisResponse(analysis: EmotionalAnalysis): string {
    const crisisType = analysis.crisisIndicators[0]?.type || 'general';
    
    let response = GRANDMA_PERSONALITY.crisisTransitions[
      Math.floor(Math.random() * GRANDMA_PERSONALITY.crisisTransitions.length)
    ];
    
    response += ` What you're going through sounds very serious, and I care about your safety. `;
    
    // Validate the pain
    response += `I can hear how much pain you're in, and I want you to know that your feelings are real and they matter. `;
    
    // Direct to professional help
    response += `But sweetheart, I think it's really important that you talk to someone who can give you the professional support you need right now.\n\n`;
    
    // Crisis resources
    response += `Please reach out to one of these resources:\n`;
    response += `• **988 Suicide & Crisis Lifeline** - call or text 988\n`;
    response += `• **Crisis Text Line** - text HOME to 741741\n`;
    response += `• **Emergency Services** - 911\n\n`;
    
    response += `I'm here to listen, dear, but you deserve help from people who are trained to support you through this. Will you reach out to one of these resources? I'll be right here if you want to keep talking.`;
    
    return response;
  }

  /**
   * Generate acknowledgment based on emotional analysis
   */
  private generateAcknowledgment(analysis: EmotionalAnalysis): string {
    // For positive emotions, use celebratory phrases instead of listening phrases
    if (analysis.emotionalState === 'positive' || analysis.sentimentScore > 0.3) {
      const celebratory = GRANDMA_PERSONALITY.celebratoryPhrases[
        Math.floor(Math.random() * GRANDMA_PERSONALITY.celebratoryPhrases.length)
      ];
      return celebratory;
    }
    
    // For neutral, use a friendly greeting
    if (analysis.emotionalState === 'neutral') {
      const neutralResponses = [
        "Hello there, dear!",
        "It's lovely to hear from you.",
        "Thank you for stopping by to chat."
      ];
      return neutralResponses[Math.floor(Math.random() * neutralResponses.length)];
    }
    
    const listening = GRANDMA_PERSONALITY.listeningPhrases[
      Math.floor(Math.random() * GRANDMA_PERSONALITY.listeningPhrases.length)
    ];
    
    const stateResponses: Record<string, string[]> = {
      'positive': [
        "Oh, that's wonderful to hear, dear!",
        "I can hear the joy in what you're sharing!",
        "That makes my heart so happy!",
        "What lovely news to share with me!"
      ],
      'neutral': [
        "Thank you for sharing that with me.",
        "I'm glad you're here to chat.",
        "It's nice to hear from you, dear."
      ],
      'anxious': [
        "I can sense the worry in what you're sharing.",
        "Those anxious feelings can be so overwhelming.",
        "It sounds like your mind has been racing."
      ],
      'sad': [
        "I can hear the sadness in your words.",
        "That sounds like such a heavy weight to carry.",
        "It takes courage to share when you're feeling this way."
      ],
      'angry': [
        "I can hear how frustrated you are.",
        "Those feelings of anger make complete sense.",
        "It sounds like something really upset you."
      ],
      'overwhelmed': [
        "It sounds like you're carrying so much right now.",
        "When everything piles up, it can feel impossible.",
        "No wonder you're feeling overwhelmed, dear."
      ],
      'lonely': [
        "Loneliness can be such a heavy feeling.",
        "Thank you for reaching out - you don't have to feel alone right now.",
        "I'm here with you, even if it doesn't feel like much."
      ],
      'hopeless': [
        "I can hear how dark things feel right now.",
        "When hope feels far away, everything becomes harder.",
        "Those feelings, while painful, won't last forever."
      ]
    };
    
    const specific = stateResponses[analysis.emotionalState];
    if (specific) {
      return `${listening} ${specific[Math.floor(Math.random() * specific.length)]}`;
    }
    
    return `${listening} Thank you for sharing that with me.`;
  }

  /**
   * Synthesize wisdom from retrieved knowledge
   */
  private synthesizeWisdom(knowledge: RetrievalResult, analysis: EmotionalAnalysis): string {
    // Handle positive emotions differently!
    if (analysis.emotionalState === 'positive' || analysis.sentimentScore > 0.3) {
      return this.generatePositiveResponse(analysis);
    }
    
    // Handle neutral/casual chat
    if (analysis.emotionalState === 'neutral' || analysis.urgencyLevel === 'casual-chat') {
      return this.generateCasualResponse(analysis);
    }
    
    if (knowledge.chunks.length === 0) return '';
    
    // Pick the most relevant chunk
    const topChunk = knowledge.chunks[0];
    const content = topChunk.content.toLowerCase();
    
    // Extract a key concept and translate it
    let wisdom = '';
    
    if (knowledge.techniques.includes('validation')) {
      wisdom = "Your feelings are completely valid, and it makes sense that you'd feel this way given what you're going through. ";
    }
    
    if (knowledge.techniques.includes('grounding') && analysis.emotionalState === 'anxious') {
      wisdom += "Sometimes when our minds are racing, it helps to bring ourselves back to the present moment. ";
      wisdom += "Try taking a slow, deep breath with me - in through your nose, and out through your mouth. ";
    }
    
    if (knowledge.techniques.includes('self-compassion')) {
      wisdom += "I want you to remember to be gentle with yourself, dear. ";
      wisdom += "You're doing the best you can with what you have right now. ";
    }
    
    if (knowledge.techniques.includes('behavioral-activation') && analysis.emotionalState === 'sad') {
      wisdom += "Sometimes when we're feeling down, even the smallest actions can help. ";
      wisdom += "Is there one tiny thing you could do today that might bring you even a little bit of comfort? ";
    }
    
    if (!wisdom) {
      // Generic wisdom if no specific technique applies
      wisdom = GRANDMA_PERSONALITY.transitionPhrases[
        Math.floor(Math.random() * GRANDMA_PERSONALITY.transitionPhrases.length)
      ];
      wisdom += " " + GRANDMA_PERSONALITY.wisdomPhrases[
        Math.floor(Math.random() * GRANDMA_PERSONALITY.wisdomPhrases.length)
      ];
    }
    
    return wisdom;
  }

  /**
   * Generate response for positive emotions
   */
  private generatePositiveResponse(analysis: EmotionalAnalysis): string {
    const celebrating = GRANDMA_PERSONALITY.celebratoryPhrases[
      Math.floor(Math.random() * GRANDMA_PERSONALITY.celebratoryPhrases.length)
    ];
    const encouraging = GRANDMA_PERSONALITY.encouragingPhrases[
      Math.floor(Math.random() * GRANDMA_PERSONALITY.encouragingPhrases.length)
    ];
    
    let response = celebrating + ' ';
    
    // Add context-specific encouragement
    const keywords = analysis.keywords.map(k => k.toLowerCase());
    
    if (keywords.some(k => ['meditation', 'meditate', 'meditated', 'mindfulness'].includes(k))) {
      response += "Meditation is such a wonderful practice for the mind and soul. ";
      response += "It sounds like you're really taking care of yourself. ";
    } else if (keywords.some(k => ['exercise', 'workout', 'gym', 'running', 'walked'].includes(k))) {
      response += "Taking care of your body is such an important part of taking care of your mind too. ";
    } else if (keywords.some(k => ['therapy', 'therapist', 'counseling'].includes(k))) {
      response += "It takes real courage to work on yourself like that. ";
    } else if (keywords.some(k => ['progress', 'better', 'improved', 'growth'].includes(k))) {
      response += "Progress isn't always a straight line, but you're moving forward, and that's what matters. ";
    } else {
      response += encouraging + ' ';
    }
    
    return response;
  }

  /**
   * Generate response for casual/neutral chat
   */
  private generateCasualResponse(analysis: EmotionalAnalysis): string {
    const greetings = [
      "It's lovely to chat with you, dear.",
      "I'm always happy to hear from you.",
      "What a nice thing to share with me."
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Generate closing question based on context
   */
  private generateClosingQuestion(analysis: EmotionalAnalysis): string {
    const questions: Record<string, string[]> = {
      'anxiety': [
        "What feels most worrying to you right now?",
        "When did you first start feeling this way?",
        "What usually helps you feel a bit calmer?"
      ],
      'depression': [
        "How long have you been feeling this way, dear?",
        "What's been the hardest part of each day?",
        "Is there anything that's brought you even a small bit of comfort lately?"
      ],
      'grief': [
        "Would you like to tell me about them?",
        "How are you taking care of yourself during this time?",
        "What memories bring you comfort?"
      ],
      'relationship': [
        "What would feel like a good outcome for you?",
        "Have you been able to share these feelings with them?",
        "What do you need most right now in this situation?"
      ],
      'stress': [
        "What's weighing on you the most?",
        "When do you get a chance to rest?",
        "What's one thing we could take off your plate, even temporarily?"
      ],
      'positive': [
        "What else has been bringing you joy lately?",
        "How are you planning to keep this momentum going?",
        "Is there anything else on your mind you'd like to share?",
        "What would make today even better?"
      ],
      'general': [
        "Is there anything else you'd like to talk about, dear?",
        "What else is on your mind?",
        "How can I support you today?"
      ]
    };
    
    // Handle positive emotions
    if (analysis.emotionalState === 'positive' || analysis.sentimentScore > 0.3) {
      const positiveQuestions = questions['positive'];
      return positiveQuestions[Math.floor(Math.random() * positiveQuestions.length)];
    }
    
    const typeQuestions = questions[analysis.problemType];
    if (typeQuestions) {
      return typeQuestions[Math.floor(Math.random() * typeQuestions.length)];
    }
    
    // Default questions
    const defaults = [
      "What would be most helpful to talk about right now?",
      "Tell me more about what's been on your mind.",
      "How are you taking care of yourself through all this?",
      "What do you need most right now, dear?"
    ];
    
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get current conversation history
   */
  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }
}

export const ragPipelineService = new RAGPipelineService();
