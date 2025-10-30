# Grandma Sue - Claude AI Integration

## Overview
Grandma Sue can now be powered by Anthropic's Claude AI for more intelligent, empathetic conversations. The system automatically falls back to local ML responses if Claude is unavailable.

## Features
- 🤖 **Claude 3.5 Sonnet** - Latest and most capable Claude model
- 🔄 **Automatic Fallback** - Seamlessly switches to local responses if API fails
- 💾 **Context Preservation** - Maintains conversation history across API calls
- 🎯 **Therapeutic Expertise** - Custom system prompt trained for grief support
- 🧠 **Smart Toggle** - Users can switch between Claude and local responses

## Setup Instructions

### 1. Get Your Anthropic API Key
1. Visit [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy your key (it starts with `sk-ant-`)

### 2. Configure Your Project
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your API key
nano .env
```

Add your key to `.env`:
```
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

### 3. Restart Development Server
```bash
npm run dev
```

## Usage

### User Interface
- **🤖 Button** - Toggle between Claude AI and local responses
- **Status Indicator** - Shows "Claude AI" when active, "Learning & Growing" when using local
- **Automatic Fallback** - If Claude fails, system automatically uses local responses

### Testing
1. Open the application
2. Click on Grandma Sue (floating chat button)
3. Look for "🤖 Claude AI" in the header
4. Start chatting!

## Technical Details

### System Prompt
The Claude AI is configured with a comprehensive therapeutic system prompt that includes:
- Person-centered therapy principles (Carl Rogers)
- Active listening and validation techniques
- Open-ended questioning strategies
- Crisis intervention guidelines
- Boundary recognition
- Conversational tone (2-4 paragraphs max)

### Context Management
- **Topics Tracking** - Remembers discussed subjects
- **Sentiment Analysis** - Adjusts responses based on emotional tone
- **Previous Topics** - Recognizes returning themes
- **Conversation History** - Last 10 messages sent to Claude for context

### API Specifications
- **Model**: `claude-3-5-sonnet-20241022`
- **Max Tokens**: 1024
- **API Version**: `2023-06-01`
- **Endpoint**: `https://api.anthropic.com/v1/messages`

## Cost Considerations

### Pricing (as of 2024)
- **Claude 3.5 Sonnet**: ~$3 per million input tokens, ~$15 per million output tokens
- **Average Conversation**: ~200-500 tokens per exchange
- **Estimated Cost**: $0.001-0.01 per user conversation

### Cost Optimization
- Limit conversation history to 10 messages
- Use local fallback when appropriate
- Cache frequently used responses
- Implement rate limiting

## Security Best Practices

### ✅ DO:
- Store API keys in `.env` file (never commit)
- Use environment variables in production
- Implement rate limiting
- Monitor API usage
- Set spending limits in Anthropic console

### ❌ DON'T:
- Commit `.env` to version control
- Share API keys publicly
- Hard-code keys in source code
- Expose keys in client-side code (use backend proxy in production)

## Production Deployment

### Recommended Architecture
```
User → Frontend → Backend API → Anthropic Claude
                     ↓
                 Rate Limiting
                 Usage Tracking
                 Cost Monitoring
```

### Environment Variables (Render/Vercel/etc)
```bash
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-key
```

## Troubleshooting

### "Claude API not configured"
- Check `.env` file exists
- Verify API key is correct
- Restart dev server after adding key

### API Errors
- Check API key is valid
- Verify you have credits in Anthropic account
- Check network connectivity
- Review browser console for detailed errors

### Fallback Behavior
- System automatically falls back to local responses
- No user interruption
- Check console for error details

## Alternative: Using Backend Proxy

For production, consider proxying Claude requests through your backend:

```typescript
// Backend endpoint
app.post('/api/claude', async (req, res) => {
  const { messages, context } = req.body;
  
  const response = await claudeService.generateResponse(messages, context);
  res.json({ response });
});
```

This keeps your API key secure server-side.

## Support
- Anthropic Documentation: [docs.anthropic.com](https://docs.anthropic.com/)
- Claude API Reference: [docs.anthropic.com/claude/reference](https://docs.anthropic.com/claude/reference)
- Issue Tracker: [Your repo issues]

## License
Same as parent project
