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

// Models are chosen server-side (overridable via env) so a browser can't spend
// our keys on arbitrary/expensive models, and so retired defaults are easy to swap.
const MODELS = {
  claude: process.env.ANTHROPIC_MODEL || 'claude-opus-5-5',
  huggingface: process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.1-8B-Instruct',
  // The "-latest" alias tracks Google's current Flash model so it doesn't silently retire.
  gemini: (process.env.GEMINI_MODEL || 'gemini-flash-latest,gemini-2.5-flash')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean),
};

const MAX_HISTORY = 20;
const MAX_SYSTEM_PROMPT = 12000;

/**
 * Clean chat history for upstream APIs:
 * - only user/assistant turns with text
 * - drop leading assistant turns (the canned greeting): Claude/Gemini expect a user turn first
 * - merge consecutive same-role turns (Gemini rejects non-alternating history)
 * - keep only the most recent turns
 */
function normalizeMessages(messages: any) {
  if (!Array.isArray(messages)) return null;
  const cleaned = messages
    .filter((m) => m && typeof m === 'object')
    .map((m) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content.slice(0, 4000) : '',
    }))
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content.trim().length > 0);

  const merged = [];
  for (const m of cleaned) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += `\n\n${m.content}`;
    else merged.push({ ...m });
  }

  let recent = merged.slice(-MAX_HISTORY);
  while (recent.length && recent[0].role !== 'user') recent = recent.slice(1);
  return recent.length && recent[recent.length - 1].role === 'user' ? recent : null;
}

function readSystemPrompt(body: any) {
  return typeof body?.systemPrompt === 'string' ? body.systemPrompt.slice(0, MAX_SYSTEM_PROMPT) : '';
}

/** Pull a short human-readable reason out of an upstream error body. */
async function upstreamDetail(response: Response) {
  let raw = '';
  try {
    raw = await response.text();
  } catch {
    return '';
  }
  try {
    const json = JSON.parse(raw);
    const msg = json?.error?.message || json?.error || json?.message || raw;
    return String(typeof msg === 'string' ? msg : JSON.stringify(msg)).slice(0, 300);
  } catch {
    return raw.slice(0, 300);
  }
}

function upstreamFailure(res, provider: string, status: number, detail: string) {
  console.error(`${provider} upstream error:`, status, detail);
  return res.status(502).json({ error: `${provider} upstream error`, status, detail });
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
  const system = readSystemPrompt(req.body);
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
        model: MODELS.claude,
        max_tokens: 1024,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      return upstreamFailure(res, 'Claude', response.status, await upstreamDetail(response));
    }

    const data: any = await response.json();
    const text = (data?.content || [])
      .filter((b: any) => b?.type === 'text')
      .map((b: any) => b.text)
      .join('')
      .trim();
    if (!text) return upstreamFailure(res, 'Claude', 200, `Empty response (stop_reason: ${data?.stop_reason})`);
    return res.json({ text });
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
  const systemPrompt = readSystemPrompt(req.body);
  if (!messages) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  try {
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELS.huggingface,
        messages: [...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []), ...messages],
        max_tokens: 600,
        temperature: 0.85,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      let detail = await upstreamDetail(response);
      if (response.status === 402) {
        detail = `Monthly Hugging Face inference credits are used up (402). ${detail}`.trim();
      }
      return upstreamFailure(res, 'Hugging Face', response.status, detail);
    }

    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const text = typeof content === 'string' ? content.trim() : '';
    if (!text) return upstreamFailure(res, 'Hugging Face', 200, 'Empty response');
    return res.json({ text });
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
  const systemPrompt = readSystemPrompt(req.body);
  if (!messages) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  let lastStatus = 0;
  let lastDetail = '';

  // Try each configured model; move on only when the model itself is unavailable.
  for (const model of MODELS.gemini) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
          contents,
          generationConfig: {
            // Newer Flash models "think", and that counts against this limit,
            // so leave headroom or replies come back empty.
            maxOutputTokens: 2048,
            temperature: 0.85,
            topP: 0.9,
          },
        }),
      });

      if (!response.ok) {
        lastStatus = response.status;
        lastDetail = `[${model}] ${await upstreamDetail(response)}`;
        if (response.status === 404) continue; // model retired/unknown: try the next one
        return upstreamFailure(res, 'Gemini', lastStatus, lastDetail);
      }

      const data: any = await response.json();
      const text = (data?.candidates?.[0]?.content?.parts || [])
        .filter((p: any) => !p?.thought && typeof p?.text === 'string')
        .map((p: any) => p.text)
        .join('')
        .trim();

      if (!text) {
        return upstreamFailure(
          res,
          'Gemini',
          200,
          `[${model}] Empty response (finishReason: ${data?.candidates?.[0]?.finishReason})`
        );
      }
      return res.json({ text });
    } catch (err) {
      console.error('Gemini proxy failed:', err);
      return res.status(500).json({ error: 'Gemini proxy failed' });
    }
  }

  return upstreamFailure(res, 'Gemini', lastStatus || 404, lastDetail || 'No Gemini model available');
});

export default router;
