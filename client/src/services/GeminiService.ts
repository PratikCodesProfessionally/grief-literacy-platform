// Google Gemini API Service for Grandma Sue
// Uses Google AI Studio / Generative Language API

interface GeminiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  // Free-tier friendly default (fast/cheap). Can be overridden later.
  private model = 'gemini-1.5-flash';
  private useBackendProxy: boolean;

  constructor() {
    // Default to backend proxy for security (no key in the browser)
    this.useBackendProxy = (import.meta.env.VITE_USE_BACKEND_AI_PROXY ?? 'true') === 'true';
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

    if (!this.useBackendProxy && !this.apiKey) {
      console.warn('⚠️ Gemini not configured: set VITE_GEMINI_API_KEY (or enable backend proxy)');
    }
  }

  isConfigured(): boolean {
    return this.useBackendProxy || this.apiKey.length > 0;
  }

  async generateResponse(
    messages: GeminiMessage[],
    context: {
      topics: string[];
      sentiment: string;
      previousTopics: string[];
    }
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured');
    }

    const systemPrompt = this.buildSystemPrompt(context);

    // Gemini expects roles: 'user' and 'model'
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      this.useBackendProxy
        ? '/api/ai/gemini'
        : `${this.baseUrl}/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          this.useBackendProxy
            ? { messages, systemPrompt, model: this.model }
            : {
                systemInstruction: {
                  parts: [{ text: systemPrompt }],
                },
                contents,
                generationConfig: {
                  maxOutputTokens: 512,
                  temperature: 0.7,
                  topP: 0.9,
                },
              }
        ),
      }
    );

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = JSON.stringify(await response.json());
      } catch {
        errorText = await response.text();
      }
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    // Backend proxy shape: { text }
    if (this.useBackendProxy) {
      const text = typeof data?.text === 'string' ? data.text.trim() : '';
      if (text) return text;
      return this.getFallbackResponse();
    }

    // Typical shape: { candidates: [ { content: { parts: [ { text } ] } } ] }
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('')?.trim();
    if (text) return text;

    return this.getFallbackResponse();
  }

  private buildSystemPrompt(context: {
    topics: string[];
    sentiment: string;
    previousTopics: string[];
  }): string {
    const topicsContext = context.topics.length > 0 ? `Current topics: ${context.topics.join(', ')}.` : '';
    const previousContext = context.previousTopics.length > 0 ? `Previously discussed: ${context.previousTopics.join(', ')}.` : '';
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

export const geminiService = new GeminiService();
