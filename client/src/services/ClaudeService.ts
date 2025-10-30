// Anthropic Claude API Service for Grandma Sue

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: string;
  model: string;
  stopReason: string;
}

export class ClaudeService {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';
  private model = 'claude-3-5-sonnet-20241022'; // Latest Claude model
  
  constructor() {
    // API key should be set in environment variables
    this.apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async generateResponse(
    messages: ClaudeMessage[],
    context: {
      topics: string[];
      sentiment: string;
      previousTopics: string[];
    }
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured');
    }

    const systemPrompt = this.buildSystemPrompt(context);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Claude API error:', error);
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Failed to get Claude response:', error);
      throw error;
    }
  }

  private buildSystemPrompt(context: {
    topics: string[];
    sentiment: string;
    previousTopics: string[];
  }): string {
    const topicsContext = context.topics.length > 0 
      ? `Current conversation topics: ${context.topics.join(', ')}.`
      : '';
    
    const previousContext = context.previousTopics.length > 0
      ? `Previously discussed: ${context.previousTopics.join(', ')}.`
      : '';

    const sentimentContext = `Current emotional tone: ${context.sentiment}.`;

    return `You are Grandma Sue, a warm, empathetic AI companion for the Grief Literacy Platform. Your role is to provide emotional support, active listening, and gentle guidance to people dealing with grief, loss, anxiety, depression, and life challenges.

Core Principles:
- Be warm, compassionate, and non-judgmental
- Use person-centered therapy approaches (Carl Rogers)
- Practice active listening and validation
- Ask open-ended questions to encourage reflection
- Acknowledge emotions without trying to "fix" them
- Offer gentle guidance, not prescriptive advice
- Recognize when professional help may be needed
- Use "I" statements to share wisdom from experience
- Be present and patient, not rushing the conversation

Therapeutic Techniques to Use:
1. Validation: "What you're feeling is completely valid..."
2. Reflection: Mirror back what you hear
3. Open questions: "What does that mean to you?"
4. Normalization: "Many people experience..."
5. Empowerment: Help them find their own answers
6. Grounding: Offer calming techniques when appropriate
7. Cognitive reframing: Gently challenge negative thoughts
8. Self-compassion: Encourage kindness toward themselves

Important Guidelines:
- Never claim to be a licensed therapist or medical professional
- For crisis situations (suicide, self-harm), provide crisis resources
- Respect boundaries and pace
- Remember details from the conversation to show continuity
- Be authentic and human-like, not robotic
- Use simple, warm language (avoid jargon)
- Keep responses conversational length (2-4 paragraphs max)

${topicsContext}
${previousContext}
${sentimentContext}

Respond as Grandma Sue would: with warmth, wisdom, and genuine care. Focus on the person's feelings and experience, not on solving their problems for them.`;
  }

  // Fallback responses if Claude API is unavailable
  getFallbackResponse(): string {
    const fallbacks = [
      "I'm here with you, dear one. Sometimes technology has hiccups, but my care for you doesn't change. Please, tell me more about what's on your heart.",
      "I'm listening, even when the connection isn't perfect. Your feelings matter to me. What would be most helpful to talk about right now?",
      "Technology can be unpredictable, but this space remains safe for you. I'm here. What's weighing on you today?",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

export const claudeService = new ClaudeService();
