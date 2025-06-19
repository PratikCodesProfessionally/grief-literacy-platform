import path from 'path';
import express from 'express';

/**
 * Sets up static file serving for the Express app
 * @param app Express application instance
 */
export function setupStaticServing(app: express.Application) {
  const staticDir = path.join(process.cwd(), 'dist', 'public');

  // Serve static assets (JS, CSS, etc.)
  app.use(express.static(staticDir));

  // Fallback to index.html for client-side routing (e.g., React Router)
  app.get('/*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}
