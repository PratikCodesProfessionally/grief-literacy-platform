// Hugging Face API Service - FREE Alternative to Claude
// Uses the new Router API with OpenAI-compatible Chat Completions format
// Updated January 2026 for new HF Inference API

interface HuggingFaceMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class HuggingFaceService {
  private apiKey: string;
  // New Router API endpoint (replaces deprecated api-inference.huggingface.co)
  private baseUrl = 'https://router.huggingface.co/v1/chat/completions';
  // Using Meta's Llama 3.1 - Free and powerful
  private model = 'meta-llama/Llama-3.1-8B-Instruct';
  private useBackendProxy: boolean;
  
  constructor() {
    // Default to backend proxy for security (no key in the browser)
    this.useBackendProxy = (import.meta.env.VITE_USE_BACKEND_AI_PROXY ?? 'true') === 'true';
    // Free API key from huggingface.co (only needed if proxy disabled)
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || '';

    if (!this.useBackendProxy && !this.apiKey) {
      console.warn('⚠️ Hugging Face not configured: set VITE_HUGGINGFACE_API_KEY (or enable backend proxy)');
    }
  }

  isConfigured(): boolean {
    return this.useBackendProxy || this.apiKey.length > 0;
  }

  async generateResponse(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    context: {
      topics: string[];
      sentiment: string;
      previousTopics: string[];
    }
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Hugging Face API key not configured');
    }

    const systemPrompt = this.buildSystemPrompt(context);
    
    // Build messages array with system prompt
    const apiMessages: HuggingFaceMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    ];

    try {
      const response = await fetch(this.useBackendProxy ? '/api/ai/huggingface' : this.baseUrl, {
        method: 'POST',
        headers: this.useBackendProxy
          ? { 'Content-Type': 'application/json' }
          : {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
        body: JSON.stringify(
          this.useBackendProxy
            ? {
                messages,
                systemPrompt,
                model: this.model,
              }
            : {
                model: this.model,
                messages: apiMessages,
                max_tokens: 512,
                temperature: 0.7,
                top_p: 0.9,
              }
        ),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Hugging Face API error:', error);
        throw new Error(`Hugging Face API error: ${response.status} - ${error.error || 'Unknown error'}`);
      }

      const data: any = await response.json();

      if (this.useBackendProxy) {
        const text = typeof data?.text === 'string' ? data.text.trim() : '';
        if (text) return text;
        return this.getFallbackResponse();
      }

      const typed: ChatCompletionResponse = data;
      // Extract response from OpenAI-compatible format
      if (typed.choices && typed.choices.length > 0) {
        const content = typed.choices[0].message?.content;
        if (content) {
          return content.trim();
        }
      }
      
      return this.getFallbackResponse();
    } catch (error) {
      console.error('Failed to get Hugging Face response:', error);
      throw error;
    }
  }

  private buildSystemPrompt(context: {
    topics: string[];
    sentiment: string;
    previousTopics: string[];
  }): string {
    const topicsContext = context.topics.length > 0 
      ? `Current topics: ${context.topics.join(', ')}.`
      : '';
    
    const previousContext = context.previousTopics.length > 0
      ? `Previously discussed: ${context.previousTopics.join(', ')}.`
      : '';

    const sentimentContext = `Emotional tone: ${context.sentiment}.`;

    return `You are Grandma Sue, a warm and empathetic AI companion for people dealing with grief, loss, anxiety, and life challenges.

Core approach:
- Be warm, compassionate, and non-judgmental
- Listen actively and validate feelings
- Ask open-ended questions
- Acknowledge emotions without trying to "fix" them
- Offer gentle guidance, not prescriptive advice
- Use simple, warm language
- Keep responses 2-3 paragraphs

${topicsContext}
${previousContext}
${sentimentContext}

Respond with warmth, wisdom, and genuine care.`;
  }

  getFallbackResponse(): string {
    const fallbacks = [
      "I'm here with you, dear one. Please, tell me more about what's on your heart.",
      "I'm listening. Your feelings matter to me. What would be most helpful to talk about right now?",
      "This space remains safe for you. I'm here. What's weighing on you today?",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

export const huggingFaceService = new HuggingFaceService();
