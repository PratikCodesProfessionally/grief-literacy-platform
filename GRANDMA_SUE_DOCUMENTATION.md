# Grandma Sue - Knowledge-Enhanced Chatbot

## Overview

Grandma Sue is a voice-enabled, knowledge-enhanced chatbot that combines a warm, grandmother-like personality with professional psychological knowledge. The system uses a RAG (Retrieval-Augmented Generation) architecture similar to NotebookLM, where psychology textbooks and counseling resources inform responses while maintaining conversational warmth.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Interface Layer                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           GrandmaSueEnhanced Component                   │   │
│  │  • Chat interface with voice controls                    │   │
│  │  • Knowledge base panel                                  │   │
│  │  • Crisis alert system                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Service Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Voice        │  │ Emotional    │  │ Crisis               │  │
│  │ Service      │  │ Analysis     │  │ Detection            │  │
│  │              │  │ Service      │  │ Service              │  │
│  │ • STT/TTS    │  │              │  │                      │  │
│  │ • Warm voice │  │ • Sentiment  │  │ • Risk assessment    │  │
│  │ • Emotion    │  │ • Problem    │  │ • Crisis resources   │  │
│  │   tones      │  │   type       │  │ • Emergency protocol │  │
│  └──────────────┘  │ • Urgency    │  └──────────────────────┘  │
│                    │ • User needs │                             │
│                    └──────────────┘                             │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              RAG Pipeline Service                        │   │
│  │                                                          │   │
│  │  1. Analyze user message for emotional content           │   │
│  │  2. Retrieve relevant psychology knowledge               │   │
│  │  3. Construct enhanced prompt with personality           │   │
│  │  4. Generate contextually appropriate response           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│         ┌────────────────────┴────────────────────┐            │
│         ▼                                         ▼            │
│  ┌──────────────┐                     ┌─────────────────────┐  │
│  │ Knowledge    │                     │ AI Services         │  │
│  │ Base Service │                     │                     │  │
│  │              │                     │ • Claude API        │  │
│  │ • Document   │                     │ • HuggingFace API   │  │
│  │   upload     │                     │ • Fallback local    │  │
│  │ • Chunking   │                     │   responses         │  │
│  │ • Retrieval  │                     └─────────────────────┘  │
│  │ • Embedded   │                                              │
│  │   psychology │                                              │
│  │   knowledge  │                                              │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Knowledge Base System
- **Embedded Knowledge**: Built-in psychology and counseling knowledge covering:
  - Active listening techniques
  - Anxiety management
  - Depression support
  - Grief counseling
  - Trauma-informed care
  - Relationship guidance
  - Stress management
  - Crisis intervention
  - Mindfulness practices
  - Self-compassion frameworks

- **Document Upload**: Users can upload additional resources (.txt, .pdf, .docx)
- **Automatic Processing**: Documents are chunked and tagged with topic categories
- **Semantic Retrieval**: Most relevant knowledge is retrieved for each conversation

### 2. Emotional Analysis
- **Emotional State Detection**: Identifies anxiety, sadness, anger, etc.
- **Problem Type Classification**: Categorizes issues (grief, relationships, work, etc.)
- **Urgency Assessment**: Rates from casual chat to crisis level
- **User Needs Detection**: Identifies whether user needs validation, advice, etc.

### 3. Crisis Detection
- **Pattern Matching**: Detects suicidal ideation, self-harm, abuse, etc.
- **Confidence Scoring**: Adjusts for context (negations, hypotheticals)
- **Risk Level Assessment**: None, Low, Moderate, High, Imminent
- **Resource Provision**: Automatically provides appropriate crisis resources
- **Response Guidance**: Specialized crisis response templates

### 4. Voice Capabilities
- **Speech Recognition**: Continuous listening with interim results
- **Speech Synthesis**: Warm, grandmother-like voice characteristics
- **Emotion Adaptation**: Adjusts voice tone based on content:
  - Comfort mode for distressing topics
  - Gentle mode for sensitive subjects
  - Serious mode for crisis situations
  - Warm mode for general conversation

### 5. Personality System
- **Clinical Translation**: Converts psychological terms to conversational language
- **Validation First**: Always acknowledges feelings before advice
- **Storytelling Integration**: Frames concepts as life wisdom
- **Appropriate Endearments**: Uses "dear", "sweetheart", etc. naturally
- **Boundary Awareness**: Knows when to recommend professional help

## File Structure

```
client/src/
├── components/
│   ├── GrandmaSue.tsx              # Original component
│   └── GrandmaSueEnhanced.tsx      # Enhanced RAG-enabled component
├── services/
│   ├── ClaudeService.ts            # Anthropic Claude API integration
│   ├── HuggingFaceService.ts       # HuggingFace API integration
│   ├── KnowledgeBaseService.ts     # Document processing & retrieval
│   ├── EmotionalAnalysisService.ts # Message analysis
│   ├── RAGPipelineService.ts       # RAG orchestration
│   ├── VoiceService.ts             # Speech recognition & synthesis
│   └── CrisisDetectionService.ts   # Crisis assessment
├── hooks/
│   └── useGrandmaSue.ts            # React hook for integration
├── lib/
│   └── grandmaSue.ts               # Central exports
└── types/
    └── grandmaSue.ts               # Type definitions
```

## Usage

### Basic Component Usage

```tsx
import { GrandmaSueEnhanced } from '@/components/GrandmaSueEnhanced';

function App() {
  return (
    <div>
      <GrandmaSueEnhanced />
    </div>
  );
}
```

### Hook Usage

```tsx
import { useGrandmaSue } from '@/hooks/useGrandmaSue';

function CustomChat() {
  const {
    messages,
    isProcessing,
    sendMessage,
    speak,
    currentCrisis
  } = useGrandmaSue({
    enableVoice: true,
    onCrisisDetected: (assessment) => {
      console.log('Crisis detected:', assessment.riskLevel);
    }
  });

  const handleSubmit = async (text: string) => {
    const response = await sendMessage(text);
    if (response) {
      speak(response.response, 'warm');
    }
  };

  return (
    // Your custom UI
  );
}
```

### Service Direct Usage

```typescript
import { 
  ragPipelineService,
  emotionalAnalysisService,
  crisisDetectionService,
  knowledgeBaseService
} from '@/lib/grandmaSue';

// Analyze a message
const analysis = emotionalAnalysisService.analyze("I've been feeling really anxious lately");
console.log(analysis.emotionalState); // 'anxious'
console.log(analysis.urgencyLevel); // 'moderate-concern'

// Check for crisis
const crisisCheck = crisisDetectionService.assess("I don't want to live anymore");
console.log(crisisCheck.isCrisis); // true
console.log(crisisCheck.resources); // [{ name: '988 Suicide & Crisis Lifeline', ... }]

// Get RAG response
const response = await ragPipelineService.processMessage(
  "I'm struggling with grief after losing my mother",
  previousMessages
);
console.log(response.response); // Grandma Sue's response
console.log(response.sources); // ['Grief Counseling Handbook']
```

## Configuration

### Environment Variables

```env
# AI Service API Keys (optional - fallback to local responses if not set)
VITE_ANTHROPIC_API_KEY=your-claude-api-key
VITE_HUGGINGFACE_API_KEY=your-huggingface-api-key
```

### Voice Configuration

```typescript
import { voiceService } from '@/services/VoiceService';

// Customize voice settings
voiceService.setConfig({
  rate: 0.85,    // Speaking rate (0.1 - 10)
  pitch: 1.05,   // Voice pitch (0 - 2)
  volume: 1.0,   // Volume (0 - 1)
  lang: 'en-US'  // Language
});

// Select a specific voice
voiceService.setVoice('Google UK English Female');
```

## Crisis Resources

The system includes built-in crisis resources:

| Resource | Contact | Type |
|----------|---------|------|
| 988 Suicide & Crisis Lifeline | 988 | Phone/Text |
| Crisis Text Line | Text HOME to 741741 | Text |
| National Domestic Violence Hotline | 1-800-799-7233 | Phone |
| SAMHSA National Helpline | 1-800-662-4357 | Phone |
| RAINN Sexual Assault Hotline | 1-800-656-4673 | Phone |
| Trevor Project (LGBTQ+) | 1-866-488-7386 | Phone |
| Veterans Crisis Line | 988, press 1 | Phone |
| Emergency Services | 911 | Emergency |

## Personality Translation

| Clinical Term | Grandma Sue's Version |
|--------------|----------------------|
| Cognitive reframing | "Let's try looking at this from another angle" |
| Behavioral activation | "Sometimes doing something small can help us feel better" |
| Mindfulness | "Focusing on this moment, right now" |
| Setting boundaries | "It's okay to say no sometimes" |
| Self-compassion | "Being kind to yourself" |
| Validation | "Your feelings make perfect sense" |
| Coping strategies | "Things that might help you feel better" |

## Safety Considerations

1. **Not a Replacement**: Grandma Sue is NOT a replacement for professional mental health care
2. **Crisis Protocol**: System automatically provides crisis resources when needed
3. **Professional Referral**: Encourages seeking professional help for serious issues
4. **Privacy**: Voice recordings are processed in real-time, not stored
5. **Transparency**: Sources are attributed when knowledge is used

## Testing

```typescript
// Test emotional analysis
const analysis = emotionalAnalysisService.analyze("I feel hopeless and don't see the point anymore");
expect(analysis.emotionalState).toBe('hopeless');
expect(analysis.urgencyLevel).toBe('crisis');

// Test crisis detection
const crisis = crisisDetectionService.assess("I want to end it all");
expect(crisis.isCrisis).toBe(true);
expect(crisis.riskLevel).toBe('high');
expect(crisis.resources.length).toBeGreaterThan(0);
```

## Future Enhancements

- [ ] Vector database integration for better semantic search
- [ ] Multi-language support
- [ ] Long-term memory with user consent
- [ ] PDF/DOCX parsing for document upload
- [ ] Fine-tuned voice synthesis
- [ ] Analytics dashboard for conversation insights
- [ ] Professional counselor handoff integration
