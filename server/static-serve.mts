import path from 'path';
import express from 'express';

/**
 * Sets up static file serving for the Express app
 * @param app Express application instance
 */
export function setupStaticServing(app: import('express').Application): void {
  const staticDir = path.join(process.cwd(), 'dist');

  console.log('Registering static assets at:', staticDir);
  app.use(express.static(staticDir));

  // SPA fallback route - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'API endpoint not found' });
      return;
    }
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}
