import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Heart } from 'lucide-react';

// Response templates for better maintainability
const RESPONSES = {
  EXAM_FEAR_AND_PREP: `Oh sweetheart, I can hear the anxiety in your words - exam fears combined with feeling unprepared is such a difficult place to be. Let me tell you something important: you're being brave by acknowledging these feelings instead of ignoring them.

First, take a deep breath with me. The fact that you're worried shows you care, and that's actually a good sign.

Now, let's be practical: Even if you feel unprepared, you likely know more than you think you do. Our minds often exaggerate how bad things are when we're anxious. Here's what I suggest:

1. Focus on the basics - what are the core concepts you absolutely must know?
2. Take short, focused study breaks rather than cramming everything at once
3. Practice self-compassion - you're doing your best in this moment
4. Remember: one exam doesn't define your worth or your future

How much time do you have before the exam? And can you tell me what subject or topic feels most challenging? Let's work through this together.`,
  
  EXAM_FEAR: "Oh sweetheart, exam fears are so common, and I can hear the worry in your words. It's completely normal to feel anxious about tests. Let me share something: feeling unprepared often feels bigger in our minds than it really is. Tell me, what specifically worries you the most about this exam? Is it the material itself, the time pressure, or perhaps fear of disappointing yourself or others?",
  
  EXAM_PREP: "I hear you saying you don't feel well-prepared. First, let me acknowledge that recognizing this is actually a strength - it shows self-awareness. Now, let's think practically: How much time do you have before the exam? Even a little focused preparation can make a difference. Sometimes breaking it down into small, manageable chunks helps. What areas feel most uncertain to you? Let's talk about what you CAN still do, rather than dwelling on what's already passed.",
  
  EXAM_GENERAL: "Exams can feel so overwhelming, can't they? I want you to know that your worth isn't measured by a test score. That said, I also know you care about doing well, which is why you're feeling this way. Let's take a breath together. What support do you need right now? Would it help to talk about study strategies, managing test anxiety, or perhaps exploring what's really at the heart of this stress?",
  
  GRIEF: "Oh my dear, losing someone is one of life's deepest pains. I'm so sorry you're carrying this weight. Grief has no timeline, and what you're feeling - all of it - is valid. Would you like to tell me about them? Sometimes sharing memories can be healing, but only if you're ready. Or if you'd prefer, we can talk about what you're experiencing right now in this moment.",
  
  ANXIETY: "I can sense the anxiety in your words, dear. Let's pause for just a moment. Take a slow, deep breath with me - in through your nose, out through your mouth. Anxiety often makes everything feel urgent and overwhelming. You're not alone in this feeling. What would help you feel even just a little bit calmer right now? Sometimes talking through our worries out loud helps us see them more clearly.",
  
  SADNESS: "I hear the sadness in what you're sharing, and I want you to know it's okay to feel this way. Sadness needs space and acknowledgment. You don't have to rush through it or fix it immediately. I'm here with you. Would it help to talk more about what's bringing these feelings up? Or would you prefer some gentle suggestions for ways to care for yourself when sadness feels heavy?",
};

const EXAM_ADVICE_FOLLOWUPS = [
  "You know, I've seen many people worry about exams over the years. Here's what I've learned: the fact that you're concerned shows you care, and that matters. Even if you don't feel fully prepared, remember that you've been learning all along - trust that some of it has stayed with you. Focus on taking care of yourself too - good sleep and staying calm can help you perform better than cramming through the night.",
  "Let me share something with you: exams test your knowledge at one moment in time, but they don't measure your intelligence, your worth, or your potential. Whatever happens, you'll learn from it and move forward. Right now, if you have time, focus on the key concepts. If the exam is very soon, practice staying calm and doing your best with what you know. That's all anyone can ask of you - including yourself.",
  "I want you to remember something important: feeling unprepared and actually being unprepared are two different things. Anxiety has a way of making us feel like we know nothing, when in reality, we know more than we think. Before the exam, take a moment to acknowledge what you DO know. Sometimes that shift in perspective can make all the difference.",
];

const SUPPORTIVE_RESPONSES = [
  "I want you to know that what you're sharing with me matters. These feelings and concerns are real, and they deserve attention. Sometimes when we're struggling, it helps to break things down into smaller pieces. What feels most manageable to address first? We don't have to solve everything at once.",
  "Thank you for trusting me with what's in your heart. Remember, you don't have to have all the answers right now. It's okay to feel uncertain or worried - those feelings are part of being human. What I want you to know is that you're stronger than you realize, even when you don't feel strong. How can I best support you in this moment?",
  "I hear the concern in your words, and I want to remind you of something: you're doing better than you think you are. Just by reaching out and talking about what's bothering you, you're taking a positive step. Many people keep everything bottled up inside. You're being brave by opening up. Is there a specific aspect of what you're dealing with where you'd like some guidance?",
];

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
  responseCount: number; // Track which response variant to use
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
  const messageIdCounter = React.useRef(2); // Start at 2 since initial message is id 1
  
  const [context, setContext] = React.useState<ConversationContext>({
    userConcerns: [],
    emotionalState: 'unknown',
    hasGreeted: true,
    lastTopic: '',
    responseCount: 0,
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
    
    // Calculate new values locally for immediate use in response selection
    const newResponseCount = context.responseCount + 1;
    const allConcerns = [...new Set([...context.userConcerns, ...analysis.concerns])];
    const hasExamConcern = allConcerns.includes('academic_stress') || 
                           analysis.topic === 'exam' || 
                           context.lastTopic === 'exam';
    const hasAnxietyConcern = analysis.emotion === 'anxious' || 
                              context.emotionalState === 'anxious';
    
    // Update context for next render (async)
    setContext(prev => ({
      ...prev,
      userConcerns: allConcerns,
      emotionalState: analysis.emotion,
      lastTopic: analysis.topic,
      responseCount: newResponseCount,
    }));

    // Handle exam-related concerns with empathy and practical advice
    if (analysis.topic === 'exam') {
      // If they mention both fear and preparation issues
      if (analysis.concerns.includes('fear') && analysis.concerns.includes('preparation')) {
        return RESPONSES.EXAM_FEAR_AND_PREP;
      }
      if (analysis.concerns.includes('fear')) {
        return RESPONSES.EXAM_FEAR;
      }
      if (analysis.concerns.includes('preparation')) {
        return RESPONSES.EXAM_PREP;
      }
      return RESPONSES.EXAM_GENERAL;
    }

    // Handle grief-related concerns
    if (analysis.topic === 'loss') {
      return RESPONSES.GRIEF;
    }

    // Respond based on current emotional state from analysis
    if (analysis.emotion === 'anxious') {
      return RESPONSES.ANXIETY;
    }

    if (analysis.emotion === 'sad') {
      return RESPONSES.SADNESS;
    }

    // Default empathetic responses for continued conversation
    // Use locally calculated values for consistent data sourcing
    const provideSupportiveAdvice = (): string => {
      // Start response index from 0
      const responseIndex = newResponseCount - 1;
      
      // Check for exam-related concerns from any source (current or historical)
      if (hasExamConcern) {
        const index = responseIndex % EXAM_ADVICE_FOLLOWUPS.length;
        return EXAM_ADVICE_FOLLOWUPS[index];
      }

      // Check for anxiety from current or previous messages
      if (hasAnxietyConcern) {
        return "Anxiety can make everything feel more difficult, can't it? When you're feeling overwhelmed, it helps to ground yourself in the present moment. What's one small thing you can do right now that would make you feel even a tiny bit better? Sometimes just naming our feelings out loud helps them feel less scary. I'm here with you, and whatever you're facing, we can talk through it together.";
      }

      // Use context-based selection for general supportive responses
      const index = responseIndex % SUPPORTIVE_RESPONSES.length;
      return SUPPORTIVE_RESPONSES[index];
    };

    return provideSupportiveAdvice();
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userInputText = inputValue; // Capture input before clearing
    
    // Add user message using ref-based ID counter
    const userMessage: Message = {
      id: messageIdCounter.current++,
      text: userInputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay for more natural conversation
    setTimeout(() => {
      const response = generateGrandmaSueResponse(userInputText);
      const grandmaMessage: Message = {
        id: messageIdCounter.current++,
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
