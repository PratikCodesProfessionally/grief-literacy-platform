# Google Gemini Integration for Grandma Sue

## Overview
Grandma Sue now supports Google Gemini AI (free tier) for intelligent, empathetic conversations. The system automatically detects available AI services and uses Gemini when configured.

## Features
- 🧠 **Gemini 1.5 Flash** - Fast, free, and powerful
- 🔄 **Automatic Fallback** - Seamlessly switches to local responses if API fails
- 💾 **Context Preservation** - Maintains conversation history across API calls
- 🎯 **Therapeutic Expertise** - Custom system prompt trained for grief support
- 🔀 **Easy Toggle** - Users can switch between Gemini, Claude, HuggingFace, and local modes

## Setup Instructions

### 1. Get Your Google Gemini API Key (100% Free)

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Choose **"Create API key in new project"** or select an existing project
5. Copy your API key (it will look like: `AIzaSy...`)

**Note:** No credit card required! The free tier includes:
- 15 requests per minute (rate limit)
- 1,500 requests per day (daily limit)
- 1 million tokens per month (token limit)

Both request and token limits apply - whichever is reached first.

### 2. Configure Your Project

```bash
# Navigate to your project directory
cd /path/to/grief-literacy-platform

# Copy the example env file (if you haven't already)
cp .env.example .env

# Edit .env file
nano .env
```

Add your Gemini API key to `.env`:
```env
VITE_GEMINI_API_KEY=AIzaSy...your-actual-key-here
```

### 3. Build and Start

```bash
# Install dependencies (if needed)
npm install

# Build the project
npm run build

# Start the development server
npm run dev
```

### 4. Use Grandma Sue with Gemini

1. Open the application in your browser
2. Click on the Grandma Sue floating chat button (👵)
3. Look for **"🧠 Google Gemini AI"** in the chat header
4. Click the brain icon (🧠) to toggle between AI modes:
   - 🧠 = Google Gemini
   - 🤖 = Claude AI (if configured)
   - 🤗 = Hugging Face AI (if configured)
   - 💭 = Local ML responses
5. Start chatting!

## Technical Details

### API Configuration

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent`

**Model:** `gemini-1.5-flash-latest`
- Fast responses (~1-2 seconds)
- High quality output
- Cost-effective for free tier

**Parameters:**
- `temperature`: 0.7 (balanced creativity)
- `topK`: 40
- `topP`: 0.95
- `maxOutputTokens`: 1024

**Safety Settings:** Configured to allow therapeutic discussions while maintaining safety

### System Prompt

The Gemini AI is configured with a comprehensive therapeutic system prompt that includes:
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
- **Conversation History** - Last 10 messages sent to Gemini for context

### Automatic Fallback

If Gemini API fails for any reason:
1. Error is logged to console
2. System automatically uses local ML-enhanced responses
3. User experience is not interrupted
4. No error messages shown to user

## Free Tier Limits

### Google Gemini Free Tier:
- **Rate Limit:** 15 requests per minute
- **Daily Limit:** 1,500 requests per day
- **Monthly Token Limit:** 1 million tokens per month
- **Cost:** $0 (completely free)

Note: Both request and token limits apply.

### Usage Estimates:
- Average conversation: 10-20 requests
- Average user: 50-100 requests/day
- Free tier easily supports multiple daily users

## Comparison with Other Services

| Feature | Gemini | Claude | HuggingFace | Local |
|---------|--------|--------|-------------|-------|
| **Cost** | Free ✅ | Paid 💰 | Free ✅ | Free ✅ |
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Speed** | Fast | Fast | Medium | Instant |
| **Setup** | Easy | Easy | Easy | None |
| **Rate Limit** | 15/min | Varies | ~1000/day | None |
| **Credit Card** | No ❌ | Yes ✅ | No ❌ | N/A |

**Recommendation:** Google Gemini is the best choice for this project!

## Security Best Practices

### ✅ DO:
- Store API keys in `.env` file (never commit)
- Add `.env` to `.gitignore`
- Use environment variables in production
- Monitor API usage in Google AI Studio
- Set up quota alerts

### ❌ DON'T:
- Commit `.env` to version control
- Share API keys publicly
- Hard-code keys in source code
- Expose keys in client-side code (use backend proxy in production)

## Production Deployment

### Environment Variables

For deployment on platforms like Vercel, Render, or Fly.io:

```bash
VITE_GEMINI_API_KEY=AIzaSy...your-key
```

Set this in your hosting platform's environment variable settings.

### Backend Proxy (Recommended for Production)

For production, consider proxying Gemini requests through your backend:

```typescript
// Backend endpoint
app.post('/api/gemini', async (req, res) => {
  const { messages, context } = req.body;
  
  const response = await geminiService.generateResponse(messages, context);
  res.json({ response });
});
```

This keeps your API key secure server-side.

## Troubleshooting

### "Google Gemini API key not configured"
- Check `.env` file exists in project root
- Verify API key is correct (starts with `AIzaSy`)
- Restart dev server after adding key: `npm run dev`

### API Errors (403 Forbidden)
- Verify API key is valid
- Check if API key has correct permissions
- Ensure Gemini API is enabled in Google Cloud Console

### API Errors (429 Rate Limited)
- You've exceeded 15 requests/minute
- Wait 60 seconds and try again
- Consider implementing request queuing

### Slow Responses
- Normal response time is 1-3 seconds
- Check your internet connection
- Verify no VPN/proxy issues

### Fallback Behavior
- System automatically falls back to local responses
- Check browser console for error details
- No user interruption - chat continues working

## Monitoring Usage

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Go to your API key settings
3. View usage statistics:
   - Requests per day
   - Tokens used
   - Rate limit status

## Advanced Configuration

### Adjusting Response Length

In `GeminiService.ts`, modify:
```typescript
maxOutputTokens: 1024  // Increase for longer responses
```

### Adjusting Creativity

In `GeminiService.ts`, modify:
```typescript
temperature: 0.7  // 0.0 = focused, 1.0 = creative
```

### Custom Safety Settings

In `GeminiService.ts`, adjust `safetySettings` array to customize content filtering.

## Support Resources

- **Gemini Documentation:** [ai.google.dev/docs](https://ai.google.dev/docs)
- **API Reference:** [ai.google.dev/api](https://ai.google.dev/api)
- **Google AI Studio:** [aistudio.google.com](https://aistudio.google.com/)
- **Community:** [Google AI Discord](https://discord.gg/google-ai)

## What's Next?

The integration is complete and ready to use! Just add your API key and start chatting with Grandma Sue powered by Google Gemini.

### Future Enhancements:
- Fine-tuning for grief support
- Multi-turn conversation optimization
- Integration with Google's safety features
- Response caching for common questions

## License

Same as parent project

---

**Ready to try it? Get your free API key now:** https://aistudio.google.com/app/apikey 🎉
