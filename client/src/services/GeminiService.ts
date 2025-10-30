// Google Gemini API Service - FREE Tier Alternative
// Uses Gemini 1.5 Flash (free tier with 15 requests/minute)

interface GeminiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiContent {
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  // Using Gemini 1.5 Flash - Free tier model
  private model = 'gemini-1.5-flash-latest';
  
  constructor() {
    // API key should be set in environment variables
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
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
      throw new Error('Google Gemini API key not configured');
    }

    const systemPrompt = this.buildSystemPrompt(context);
    const formattedContents = this.formatMessages(systemPrompt, messages);

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: formattedContents,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE',
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Gemini API error:', error);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        const text = data.candidates[0].content.parts[0].text;
        return text;
      }
      
      return this.getFallbackResponse();
    } catch (error) {
      console.error('Failed to get Gemini response:', error);
      throw error;
    }
  }

  private formatMessages(systemPrompt: string, messages: GeminiMessage[]): GeminiContent[] {
    // Gemini uses a contents array with role and parts
    const contents: GeminiContent[] = [];
    
    // Add system prompt as first user message
    contents.push({
      parts: [{ text: systemPrompt }],
    });

    // Add a dummy model response acknowledging the system prompt
    contents.push({
      parts: [{ text: 'I understand. I am Grandma Sue, here to provide warm, empathetic support.' }],
    });

    // Add conversation history, alternating between user and model
    messages.forEach((msg, index) => {
      contents.push({
        parts: [{ text: msg.content }],
      });
    });

    return contents;
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

  // Fallback responses if Gemini API is unavailable
  getFallbackResponse(): string {
    const fallbacks = [
      "I'm here with you, dear one. Sometimes technology has hiccups, but my care for you doesn't change. Please, tell me more about what's on your heart.",
      "I'm listening, even when the connection isn't perfect. Your feelings matter to me. What would be most helpful to talk about right now?",
      "Technology can be unpredictable, but this space remains safe for you. I'm here. What's weighing on you today?",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

export const geminiService = new GeminiService();
