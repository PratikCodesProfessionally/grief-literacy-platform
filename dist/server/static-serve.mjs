import path from 'path';
import express from 'express';
/**
 * Sets up static file serving for the Express app
 * @param app Express application instance
 */
export function setupStaticServing(app) {
    const staticDir = path.join(process.cwd(), 'dist');
    console.log('Registering static assets at:', staticDir);
    // Serve static files first
    app.use(express.static(staticDir));
}
/**
 * Sets up the SPA fallback route - should be called after all other routes are registered
 * @param app Express application instance
 */
export function setupSpaFallback(app) {
    const staticDir = path.join(process.cwd(), 'dist');
    // SPA fallback route - serve index.html for all non-API routes
    // This should be the last route registered to avoid intercepting API routes
    app.get('*', (req, res) => {
        // Skip API routes and other backend endpoints
        const backendPrefixes = ['/api', '/auth', '/health', '/webhook'];
        const isBackendRoute = backendPrefixes.some(prefix => req.path.startsWith(prefix));
        if (isBackendRoute) {
            res.status(404).json({ error: 'Endpoint not found' });
            return;
        }
        // Serve the SPA for all other routes
        res.sendFile(path.join(staticDir, 'index.html'));
    });
}
