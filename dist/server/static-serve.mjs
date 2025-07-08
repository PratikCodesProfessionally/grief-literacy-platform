import path from 'path';
import express from 'express';
/**
 * Sets up static file serving for the Express app
 * @param app Express application instance
 */
export function setupStaticServing(app) {
    const staticDir = path.join(process.cwd(), 'dist');
    console.log('Registering static assets at:', staticDir);
    app.use(express.static(staticDir));
    // Fallback-Route für SPA-Routing, aber keine API-Routen überschreiben
    /*app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(staticDir, 'index.html'), err => {
        if (err) next();
      });
    });
  }*/
    // Fallback-Route NUR in Produktion
    if (process.env.NODE_ENV === 'production') {
        app.get('*', (req, res) => {
            res.sendFile(path.join(staticDir, 'index.html'));
        });
    }
}
