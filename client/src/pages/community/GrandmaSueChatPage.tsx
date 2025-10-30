import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Heart } from 'lucide-react';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'grandma';
  timestamp: Date;
};

type ConversationContext = {
  userConcerns: string[];
  emotionalState: string;
  hasGreeted: boolean;
  lastTopic: string;
};

export function GrandmaSueChatPage() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 1,
      text: "Hello, dear one. I'm Grandma Sue, and I'm here to listen with an open heart. This is a safe space where you can share anything that's weighing on you. How are you feeling today?",
      sender: 'grandma',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  
  const [context, setContext] = React.useState<ConversationContext>({
    userConcerns: [],
    emotionalState: 'unknown',
    hasGreeted: true,
    lastTopic: '',
  });

  // Scroll to bottom when messages update
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const analyzeUserMessage = (message: string): { concerns: string[], emotion: string, topic: string } => {
    const lowerMessage = message.toLowerCase();
    const concerns: string[] = [];
    let emotion = 'neutral';
    let topic = 'general';

    // Detect concerns
    if (lowerMessage.includes('exam') || lowerMessage.includes('test') || lowerMessage.includes('study')) {
      concerns.push('academic_stress');
      topic = 'exam';
    }
    if (lowerMessage.includes('fear') || lowerMessage.includes('afraid') || lowerMessage.includes('scared') || lowerMessage.includes('worry')) {
      concerns.push('fear');
      emotion = 'anxious';
    }
    if (lowerMessage.includes('prepared') || lowerMessage.includes('ready') || lowerMessage.includes('preparation')) {
      concerns.push('preparation');
    }
    if (lowerMessage.includes('loss') || lowerMessage.includes('lost') || lowerMessage.includes('grief') || lowerMessage.includes('died')) {
      concerns.push('grief');
      topic = 'loss';
      emotion = 'grieving';
    }
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
      emotion = 'sad';
    }
    if (lowerMessage.includes('anxious') || lowerMessage.includes('stressed') || lowerMessage.includes('overwhelmed')) {
      emotion = 'anxious';
    }
    if (lowerMessage.includes('angry') || lowerMessage.includes('frustrated') || lowerMessage.includes('mad')) {
      emotion = 'angry';
    }

    return { concerns, emotion, topic };
  };

  const generateGrandmaSueResponse = (userMessage: string): string => {
    const analysis = analyzeUserMessage(userMessage);
    
    // Update context
    setContext(prev => ({
      ...prev,
      userConcerns: [...new Set([...prev.userConcerns, ...analysis.concerns])],
      emotionalState: analysis.emotion,
      lastTopic: analysis.topic,
    }));

    // Handle exam-related concerns with empathy and practical advice
    if (analysis.topic === 'exam') {
      if (analysis.concerns.includes('fear')) {
        return "Oh sweetheart, exam fears are so common, and I can hear the worry in your words. It's completely normal to feel anxious about tests. Let me share something: feeling unprepared often feels bigger in our minds than it really is. Tell me, what specifically worries you the most about this exam? Is it the material itself, the time pressure, or perhaps fear of disappointing yourself or others?";
      }
      if (analysis.concerns.includes('preparation')) {
        return "I hear you saying you don't feel well-prepared. First, let me acknowledge that recognizing this is actually a strength - it shows self-awareness. Now, let's think practically: How much time do you have before the exam? Even a little focused preparation can make a difference. Sometimes breaking it down into small, manageable chunks helps. What areas feel most uncertain to you? Let's talk about what you CAN still do, rather than dwelling on what's already passed.";
      }
      return "Exams can feel so overwhelming, can't they? I want you to know that your worth isn't measured by a test score. That said, I also know you care about doing well, which is why you're feeling this way. Let's take a breath together. What support do you need right now? Would it help to talk about study strategies, managing test anxiety, or perhaps exploring what's really at the heart of this stress?";
    }

    // Handle grief-related concerns
    if (analysis.topic === 'loss') {
      return "Oh my dear, losing someone is one of life's deepest pains. I'm so sorry you're carrying this weight. Grief has no timeline, and what you're feeling - all of it - is valid. Would you like to tell me about them? Sometimes sharing memories can be healing, but only if you're ready. Or if you'd prefer, we can talk about what you're experiencing right now in this moment.";
    }

    // Respond based on emotional state
    if (analysis.emotion === 'anxious' && context.emotionalState !== 'unknown') {
      return "I can sense the anxiety in your words, dear. Let's pause for just a moment. Take a slow, deep breath with me - in through your nose, out through your mouth. Anxiety often makes everything feel urgent and overwhelming. You're not alone in this feeling. What would help you feel even just a little bit calmer right now? Sometimes talking through our worries out loud helps us see them more clearly.";
    }

    if (analysis.emotion === 'sad') {
      return "I hear the sadness in what you're sharing, and I want you to know it's okay to feel this way. Sadness needs space and acknowledgment. You don't have to rush through it or fix it immediately. I'm here with you. Would it help to talk more about what's bringing these feelings up? Or would you prefer some gentle suggestions for ways to care for yourself when sadness feels heavy?";
    }

    // Default empathetic responses for continued conversation
    const continuationResponses = [
      "Thank you for sharing that with me. I'm listening carefully to what you're telling me. Tell me more about this - what else is on your heart?",
      "I can tell this matters deeply to you. Your feelings are important and valid. What would feel most supportive for you right now?",
      "I'm glad you're opening up about this. Sometimes just putting our thoughts and feelings into words can help us understand them better. What else would you like to explore together?",
      "I hear you, dear one. These are real concerns you're carrying. Let's take them one at a time. What feels most pressing to you right now?",
    ];

    // If we have context about their concerns, provide more specific guidance
    if (context.userConcerns.length > 0) {
      if (context.userConcerns.includes('academic_stress')) {
        return "You've mentioned stress about your studies. I want you to know that academic challenges are temporary, but the skills you're building - resilience, persistence, self-awareness - those last a lifetime. Let's focus on what you can control. What's one small step you could take today that might help you feel a bit more prepared or at ease?";
      }
    }

    // Return a varied continuation response
    return continuationResponses[messages.length % continuationResponses.length];
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay for more natural conversation
    setTimeout(() => {
      const response = generateGrandmaSueResponse(inputValue);
      const grandmaMessage: Message = {
        id: messages.length + 2,
        text: response,
        sender: 'grandma',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, grandmaMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6 h-screen flex flex-col">
      <div className="flex items-center space-x-4 flex-shrink-0">
        <Link to="/community">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            💝 Chat with Grandma Sue
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            A compassionate listener who's here to support you
          </p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-2xl">
              👵
            </div>
            <div>
              <CardTitle>Grandma Sue</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <Heart className="h-3 w-3 text-pink-500" />
                <span>Here to listen with love and care</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-w-[80%]">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4 bg-white dark:bg-gray-900 flex-shrink-0">
            <div className="flex space-x-2">
              <Input
                placeholder="Type your message here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isTyping}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send • Grandma Sue is here to listen and support you
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 flex-shrink-0">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>💡 Remember:</strong> Grandma Sue is a supportive chatbot designed to provide comfort and guidance. 
            For professional help or crisis support, please visit our{' '}
            <Link to="/resources/professional-help" className="underline font-medium">
              Professional Help page
            </Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
