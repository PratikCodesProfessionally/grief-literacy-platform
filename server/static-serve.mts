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


  // Fallback-Route NUR in Produktion
  if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }
}
