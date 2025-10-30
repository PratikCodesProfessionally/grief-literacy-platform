import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function GrandmaSue() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello, dear one. I am Grandma Sue. I am here to listen with an open heart and offer gentle guidance. This is a safe, confidential space for you. What is on your mind today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const therapeuticKnowledge = {
    examAnxiety: {
      keywords: ['exam', 'test', 'fear', 'anxiety', 'nervous', 'prepared', 'preparation', 'study', 'studying'],
      responses: [
        'I hear your worry about not being prepared enough, and that fear is completely valid. Many students feel this way before exams—it is actually a sign that you care about doing well. Let me ask you gently: what have you already accomplished in your preparation? Sometimes our anxiety makes us overlook what we have already done.',
        'Exam anxiety can feel overwhelming, dear. Let us take a breath together. What I have learned over the years is that our minds often catastrophize—imagining the worst possible outcome. In reality, even if we feel unprepared, we usually know more than we think. Would it help to talk about a practical study plan for the time you have left?',
        'You know, perfectionism is often at the root of exam fear. You are carrying a heavy burden if you believe you must be perfectly prepared. But here is a truth I have seen time and again: "good enough" really is good enough. What would you tell a dear friend who came to you with this same fear?',
      ],
    },
    grief: {
      keywords: ['loss', 'died', 'death', 'grief', 'mourning', 'miss', 'gone', 'funeral', 'passed away'],
      responses: [
        'I am so deeply sorry for your loss. Grief is one of the most profound human experiences, and there is no "right" way to feel it. Whatever you are feeling right now—sadness, anger, numbness, or even guilt—all of it is valid. Would you like to tell me about the person you lost?',
        'What you are experiencing is the natural ebb and flow of grief. Some days the pain feels unbearable, and other days you might feel surprisingly okay—and then feel guilty for feeling okay. All of this is normal. Grief is not linear, dear one. It comes in waves, and that is exactly as it should be.',
      ],
    },
    depression: {
      keywords: ['depressed', 'sad', 'hopeless', 'empty', 'numb', 'worthless'],
      responses: [
        'I am hearing such deep pain in your words, and I want you to know I am here with you. These feelings, while incredibly difficult, are something many people experience. You are not alone. Have you been able to talk to a mental health professional about how you are feeling?',
        'Depression can make everything feel heavy and hopeless. It clouds our thinking and makes us believe things that are not true—like that we are worthless or that things will never get better. But I promise you, these are symptoms of depression, not facts about you or your life. What small thing brought you even a tiny bit of comfort recently?',
      ],
    },
    anxiety: {
      keywords: ['anxious', 'worry', 'panic', 'scared', 'afraid', 'nervous', 'stress', 'overwhelm'],
      responses: [
        'Anxiety can make your whole body feel on edge, can it not? Let us try something together. Take a slow breath in through your nose for 4 counts... hold for 4... and out through your mouth for 6. This activates your parasympathetic nervous system—your body is natural calming response. What are you most worried about right now?',
        'When we are anxious, our minds often jump to worst-case scenarios. It is like having an overprotective security system that sees danger everywhere. Let us gently examine these worries together. What evidence do you have that supports this fear? And what evidence might challenge it?',
      ],
    },
    relationships: {
      keywords: ['relationship', 'partner', 'husband', 'wife', 'boyfriend', 'girlfriend', 'friend', 'family', 'conflict', 'fight', 'argument'],
      responses: [
        'Relationships can be such a source of both joy and pain. It sounds like you are navigating something difficult right now. Tell me more about what is happening—and also, how does this situation make you feel? Sometimes understanding our own emotions is the first step to understanding the relationship itself.',
      ],
    },
  };

  const detectTopicAndRespond = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [topic, data] of Object.entries(therapeuticKnowledge)) {
      const hasKeyword = data.keywords.some(keyword => lowerMessage.includes(keyword));
      if (hasKeyword) {
        const response = data.responses[Math.floor(Math.random() * data.responses.length)];
        return response;
      }
    }

    const generalResponses = [
      'Thank you for trusting me with this. I can hear that this is weighing on you. Tell me more—what feels most difficult about this situation for you right now?',
      'I am listening carefully to what you are sharing. It takes courage to open up about what we are struggling with. How long have you been carrying this?',
      'What you are describing sounds really challenging. I want to understand better—can you help me see this through your eyes? What does a typical day look like when you are dealing with this?',
      'I hear you, and I want you to know that your feelings make sense given what you are going through. Sometimes just naming what we are experiencing can bring a little relief. How are you coping with this day by day?',
      'That sounds incredibly difficult, dear one. When you think about this situation, what emotions come up most strongly for you? Sadness? Anger? Fear? Something else?',
    ];

    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  };

  const generateContextualResponse = (conversationHistory: Message[], newUserMessage: string): string => {
    const previousMessages = conversationHistory.filter(m => m.role === 'user').slice(-3);
    const newMessageLower = newUserMessage.toLowerCase();

    if (previousMessages.length > 0) {
      const lastUserMessage = previousMessages[previousMessages.length - 1].content.toLowerCase();
      
      if (newUserMessage.length > lastUserMessage.length * 1.5) {
        return 'Thank you for opening up more. I can feel the depth of what you are sharing. ' + detectTopicAndRespond(newUserMessage);
      }

      if (newUserMessage.split(' ').length < 5) {
        const encouragements = [
          'I am here with you. Would you like to tell me more about that?',
          'Take your time. What else comes to mind when you think about this?',
          'I sense there might be more beneath the surface. What else are you feeling?',
          'That is important. Can you help me understand what that means to you?',
        ];
        return encouragements[Math.floor(Math.random() * encouragements.length)];
      }
    }

    return detectTopicAndRespond(newUserMessage);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateContextualResponse(messages, userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-110 flex items-center justify-center text-3xl z-50 animate-bounce"
          aria-label="Open Grandma Sue chat"
        >
          ��
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 z-50 shadow-2xl">
          <Card className="border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl shadow-md">
                    👵
                  </div>
                  <div>
                    <CardTitle className="text-lg">Grandma Sue</CardTitle>
                    <CardDescription className="text-xs">
                      Empathetic Listener • Here for You
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[400px] pr-2 mb-3" ref={scrollRef}>
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="space-y-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Share what is on your mind..."
                  className="min-h-[80px] resize-none text-sm"
                  disabled={isTyping}
                />
                <div className="flex justify-between items-center gap-2">
                  <p className="text-xs text-gray-500 flex-1">
                    💙 AI support companion
                  </p>
                  <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="sm">
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
