import express from 'express';
import dotenv from 'dotenv';
import { setupStaticServing } from './static-serve.mjs';
import fs from 'fs';
import path from 'path';

import usersRouter from './routes/users.js';
import poemsRouter from './routes/poems.js';
import syncRouter from './routes/sync.js';
import aiRouter from './routes/ai.js';

// Prefer .env.local for secrets (untracked), fall back to .env
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const app = express();

// Required for correct client IP detection behind reverse proxies (e.g. Vite dev proxy,
// Fly/Render). Also prevents express-rate-limit from throwing when X-Forwarded-For exists.
app.set('trust proxy', 1);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/users', usersRouter);
app.use('/api/poems', poemsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/ai', aiRouter);


// Export a function to start the server
export async function startServer(port: number | string) {
  try {
    // In dev we run the UI via Vite (port 5173). Serving the built `dist/` app here
    // causes confusing behavior in Codespaces (CSP/manifest/auth redirects). Keep
    // port 3001 API-only in development.
    if (process.env.NODE_ENV === 'production') {
      setupStaticServing(app);
    }
    app.listen(port, () => {
      console.log(`API Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server directly if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting server...');
  // In Produktion: PORT=8080 (fly.toml), in Dev: 3001
  const port = process.env.PORT || (process.env.NODE_ENV === 'production' ? 8080 : 3001);
  startServer(port);
}
