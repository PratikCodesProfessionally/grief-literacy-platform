// @ts-nocheck
import express from 'express';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Lightweight protection against key abuse when used from the browser.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(aiLimiter);

function normalizeMessages(messages: any) {
  if (!Array.isArray(messages)) return null;
  const normalized = messages
    .filter((m) => m && typeof m === 'object')
    .map((m) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : '',
    }))
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content.trim().length > 0);
  return normalized.length ? normalized : null;
}

router.get('/status', (req, res) => {
  res.json({
    claude: Boolean(process.env.ANTHROPIC_API_KEY),
    huggingface: Boolean(process.env.HUGGINGFACE_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
  });
});

// POST /api/ai/claude
router.post('/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Claude not configured on server' });
  }

  const messages = normalizeMessages(req.body?.messages);
  const system = typeof req.body?.systemPrompt === 'string' ? req.body.systemPrompt : '';
  const model = typeof req.body?.model === 'string' ? req.body.model : 'claude-3-5-sonnet-20241022';
  const max_tokens = typeof req.body?.max_tokens === 'number' ? req.body.max_tokens : 1024;

  if (!messages) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = JSON.stringify(await response.json());
      } catch {
        errorText = await response.text();
      }
      console.error('Claude upstream error:', response.status, errorText);
      return res.status(502).json({ error: 'Claude upstream error', status: response.status });
    }

    const data: any = await response.json();
    const text = data?.content?.[0]?.text;
    return res.json({ text: typeof text === 'string' ? text : '' });
  } catch (err) {
    console.error('Claude proxy failed:', err);
    return res.status(500).json({ error: 'Claude proxy failed' });
  }
});

// POST /api/ai/huggingface
router.post('/huggingface', async (req, res) => {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Hugging Face not configured on server' });
  }

  const messages = normalizeMessages(req.body?.messages);
  const systemPrompt = typeof req.body?.systemPrompt === 'string' ? req.body.systemPrompt : '';
  const model = typeof req.body?.model === 'string' ? req.body.model : 'meta-llama/Llama-3.1-8B-Instruct';

  if (!messages) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  const apiMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = JSON.stringify(await response.json());
      } catch {
        errorText = await response.text();
      }
      console.error('HF upstream error:', response.status, errorText);
      return res.status(502).json({ error: 'Hugging Face upstream error', status: response.status });
    }

    const data: any = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    return res.json({ text: typeof text === 'string' ? text : '' });
  } catch (err) {
    console.error('HF proxy failed:', err);
    return res.status(500).json({ error: 'Hugging Face proxy failed' });
  }
});

// POST /api/ai/gemini
router.post('/gemini', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Gemini not configured on server' });
  }

  const messages = normalizeMessages(req.body?.messages);
  const systemPrompt = typeof req.body?.systemPrompt === 'string' ? req.body.systemPrompt : '';
  const model = typeof req.body?.model === 'string' ? req.body.model : 'gemini-1.5-flash';

  if (!messages) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        contents,
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.7,
          topP: 0.9,
        },
      }),
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = JSON.stringify(await response.json());
      } catch {
        errorText = await response.text();
      }
      console.error('Gemini upstream error:', response.status, errorText);
      return res.status(502).json({ error: 'Gemini upstream error', status: response.status });
    }

    const data: any = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text)
      .filter(Boolean)
      .join('')
      ?.trim();

    return res.json({ text: typeof text === 'string' ? text : '' });
  } catch (err) {
    console.error('Gemini proxy failed:', err);
    return res.status(500).json({ error: 'Gemini proxy failed' });
  }
});

export default router;
