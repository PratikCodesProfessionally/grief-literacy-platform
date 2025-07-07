import path from 'path';
import express from 'express';
/**
 * Sets up static file serving for the Express app
 * @param app Express application instance
 */
export function setupStaticServing(app) {
    const staticDir = path.join(process.cwd(), 'dist', 'public');
    console.log('Registering static assets at:', staticDir);
    app.use(express.static(staticDir));
    console.log('Registering fallback route for /*');
    // Fallback to index.html for client-side routing (e.g., React Router)
    app.get('/client/*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
            return next();
        }
        res.sendFile(path.join(staticDir, 'index.html'));
    });
}
