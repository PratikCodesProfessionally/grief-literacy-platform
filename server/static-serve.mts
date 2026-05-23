import path from 'path';
import express from 'express';

/**
 * Sets up static file serving for the Express app
 * @param app Express application instance
 */
export function setupStaticServing(app: import('express').Application): void {
  const staticDir = path.join(process.cwd(), 'dist');

  // Security Headers für Supabase Realtime und Jitsi
  app.use((req, res, next) => {
    // Content Security Policy für WebSockets und externe Dienste
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://meet.jit.si",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https://*.supabase.co https://meet.jit.si",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.huggingface.co https://meet.jit.si",
        "frame-src 'self' https://meet.jit.si",
        "media-src 'self' blob: data:",
        "worker-src 'self' blob:",
      ].join('; ')
    );

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, apikey, x-client-info');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  });

  console.log('Registering static assets at:', staticDir);
  app.use(express.static(staticDir));


  // Fallback-Route NUR in Produktion
  if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }
}
