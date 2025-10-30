'use client';

import * as React from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { Card } from './card';
import { Button } from './button';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'grandma';
  timestamp: Date;
}

interface GrandmaSueResponses {
  [key: string]: string[];
}

// Empathetic, psychology-based responses for Grandma Sue
const grandmaSueResponses: GrandmaSueResponses = {
  greeting: [
    "Hello dear. I'm Grandma Sue, and I'm here to listen with an open heart. How are you feeling today?",
    "Welcome, sweet soul. Take a deep breath. I'm here for you. What's on your mind?",
    "Hello, dear one. This is a safe space. I'm listening. How can I support you today?",
  ],
  grief: [
    "Grief is love with nowhere to go, and it's okay to feel it deeply. Your feelings are valid, and I'm here with you through this.",
    "What you're experiencing is a natural response to loss. There's no timeline for healing, and every emotion you feel is part of your journey.",
    "The pain you feel is a testament to the love you shared. Allow yourself to feel without judgment. I'm here to hold space for you.",
    "Grief comes in waves, and it's okay if some days feel harder than others. You're not alone in this journey.",
  ],
  sadness: [
    "It's okay to feel sad, dear. Sadness is not weakness—it's your heart acknowledging something meaningful. I'm here with you.",
    "Your sadness deserves to be acknowledged and honored. Let yourself feel it. There's strength in vulnerability.",
    "Sometimes we need to sit with our sadness before we can move through it. I'm here to sit with you for as long as you need.",
  ],
  anxiety: [
    "When anxiety feels overwhelming, remember: this feeling is temporary. Let's breathe together. You are safe in this moment.",
    "Anxiety often comes from our mind trying to protect us. Acknowledge it gently, then remind yourself: right now, in this moment, you are okay.",
    "Your worries are real, and so is your strength. One breath at a time, one moment at a time. You've survived every difficult day so far.",
  ],
  anger: [
    "Anger is a natural part of grief. It's okay to feel angry—it shows you care deeply. Let's explore these feelings together.",
    "Your anger is valid. It's part of processing loss. The key is to express it in healthy ways. I'm here to help you through it.",
    "Feeling angry doesn't make you a bad person. It makes you human. Let's talk about what's underneath that anger.",
  ],
  hope: [
    "Even in the darkest moments, hope can be a tiny spark. And sometimes, that's enough to light our way forward.",
    "Healing isn't linear, but every small step forward matters. Your hope is a sign of your resilience.",
    "Hope doesn't mean forgetting or moving on—it means learning to carry your love with you as you continue living.",
  ],
  struggle: [
    "You're doing better than you think. The fact that you're here, reaching out, shows incredible courage and strength.",
    "Struggling doesn't mean failing. It means you're human, and you're facing something difficult. I see your strength.",
    "Some days, just getting through is enough. Be gentle with yourself. You're doing the best you can, and that's more than enough.",
  ],
  support: [
    "Remember, asking for help is a sign of wisdom, not weakness. You don't have to carry this alone.",
    "Everyone needs support sometimes. Reaching out is one of the bravest things you can do. I'm proud of you for being here.",
    "You deserve support, compassion, and understanding. Allow others to walk alongside you on this journey.",
  ],
  self_care: [
    "Taking care of yourself isn't selfish—it's necessary. What small act of kindness can you offer yourself today?",
    "Self-compassion is not self-indulgence. It's treating yourself with the same kindness you'd offer a dear friend.",
    "Remember to be gentle with yourself. You're healing, and that takes time and care. What does your heart need right now?",
  ],
  coping: [
    "There's no right way to grieve. Whatever helps you feel even a little bit better is valid. Trust your instincts.",
    "Sometimes coping means just surviving the day. Sometimes it means finding moments of peace. Both are okay.",
    "Everyone's healing journey is unique. What works for others might not work for you, and that's perfectly fine.",
  ],
  meaning: [
    "Loss changes us, but it doesn't have to define us. You're still you, even as you grow through this experience.",
    "Finding meaning after loss isn't about making sense of it—it's about honoring what was while creating what will be.",
    "Your story isn't over. This chapter is painful, but you're writing the next pages with courage every single day.",
  ],
  memory: [
    "Memories are precious gifts. They remind us that love transcends physical presence. Your memories honor the bond you shared.",
    "Remembering is a beautiful way to keep love alive. Share your memories when you're ready—they're part of your healing.",
    "The love and memories you carry are forever yours. They're proof that the connection was real and meaningful.",
  ],
  healing: [
    "Healing doesn't mean forgetting. It means learning to live with the loss while still embracing life's possibilities.",
    "There's no expiration date on grief, and healing isn't about getting over it—it's about moving forward while holding love in your heart.",
    "You're allowed to laugh, find joy, and live fully even while grieving. Healing and remembering can coexist.",
  ],
  default: [
    "I hear you, dear. Your feelings matter, and I'm here to listen. Tell me more about what you're experiencing.",
    "Thank you for sharing with me. That takes courage. How are you feeling about what you just shared?",
    "I'm listening with my full attention. Your story is important. What else would you like to talk about?",
    "That sounds really difficult. I'm here with you. Take your time—there's no rush.",
  ],
};

// Keywords to match user messages with appropriate responses
const responseKeywords = {
  greeting: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
  grief: ['grief', 'loss', 'death', 'died', 'passed away', 'miss', 'lost someone', 'bereaved', 'mourning'],
  sadness: ['sad', 'depressed', 'down', 'unhappy', 'miserable', 'heartbroken', 'cry', 'tears'],
  anxiety: ['anxious', 'worried', 'nervous', 'scared', 'afraid', 'panic', 'stress', 'overwhelmed'],
  anger: ['angry', 'mad', 'frustrated', 'rage', 'furious', 'upset', 'irritated'],
  hope: ['hope', 'hopeful', 'better', 'improving', 'forward', 'future', 'optimistic'],
  struggle: ['struggling', 'hard', 'difficult', 'can\'t cope', 'too much', 'hard time'],
  support: ['need help', 'support', 'alone', 'lonely', 'isolated', 'nobody understands'],
  self_care: ['self care', 'take care', 'exhausted', 'tired', 'rest', 'care for myself'],
  coping: ['cope', 'coping', 'deal with', 'handle', 'manage', 'get through'],
  meaning: ['meaning', 'purpose', 'why', 'make sense', 'understand', 'reason'],
  memory: ['remember', 'memory', 'memories', 'remind', 'think about', 'recall'],
  healing: ['heal', 'healing', 'better', 'recover', 'move on', 'move forward'],
};

function getGrandmaSueResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for keywords in user message
  for (const [category, keywords] of Object.entries(responseKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      const responses = grandmaSueResponses[category];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  
  // Default empathetic response
  const defaultResponses = grandmaSueResponses.default;
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

export function GrandmaSueChatbot() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  React.useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Send initial greeting
      const greetingResponses = grandmaSueResponses.greeting;
      const greeting = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
      
      setTimeout(() => {
        setMessages([{
          id: '1',
          text: greeting,
          sender: 'grandma',
          timestamp: new Date(),
        }]);
      }, 500);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate thinking time (500-1500ms)
    const thinkingTime = 500 + Math.random() * 1000;

    setTimeout(() => {
      const responseText = getGrandmaSueResponse(inputValue);
      const grandmaMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'grandma',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, grandmaMessage]);
      setIsTyping(false);
    }, thinkingTime);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-purple-600 hover:bg-purple-700"
          size="icon"
          title="Chat with Grandma Sue"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-purple-600 text-white rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-700 flex items-center justify-center text-xl">
                👵
              </div>
              <div>
                <h3 className="font-semibold">Grandma Sue</h3>
                <p className="text-xs opacity-90">Your Empathetic Listener</p>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-purple-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-gray-900 dark:to-gray-800">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg p-3 shadow',
                    message.sender === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                  )}
                >
                  {message.sender === 'grandma' && (
                    <div className="text-xs font-semibold mb-1 text-purple-600 dark:text-purple-400">
                      Grandma Sue
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 shadow bg-white dark:bg-gray-800">
                  <div className="text-xs font-semibold mb-1 text-purple-600 dark:text-purple-400">
                    Grandma Sue
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-white dark:bg-gray-800">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="icon"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Remember: Grandma Sue is an AI companion. For professional help, please consult a licensed therapist.
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
