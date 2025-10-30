// Hugging Face API Service - FREE Alternative to Claude
// Uses free inference API with various LLMs

interface HuggingFaceMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class HuggingFaceService {
  private apiKey: string;
  private baseUrl = 'https://api-inference.huggingface.co/models';
  // Using Meta's Llama 3.1 - Free and powerful
  private model = 'meta-llama/Meta-Llama-3.1-8B-Instruct';
  
  constructor() {
    // Free API key from huggingface.co
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || '';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async generateResponse(
    messages: HuggingFaceMessage[],
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
    const formattedPrompt = this.formatMessages(systemPrompt, messages);

    try {
      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: formattedPrompt,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            top_p: 0.9,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Hugging Face API error:', error);
        throw new Error(`Hugging Face API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data[0]?.generated_text || this.getFallbackResponse();
      } else if (data.generated_text) {
        return data.generated_text;
      } else if (data[0]?.generated_text) {
        return data[0].generated_text;
      }
      
      return this.getFallbackResponse();
    } catch (error) {
      console.error('Failed to get Hugging Face response:', error);
      throw error;
    }
  }

  private formatMessages(systemPrompt: string, messages: HuggingFaceMessage[]): string {
    // Format for Llama 3.1 instruction format
    let prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|>`;
    
    messages.forEach(msg => {
      prompt += `<|start_header_id|>${msg.role}<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
    });
    
    prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n`;
    
    return prompt;
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
