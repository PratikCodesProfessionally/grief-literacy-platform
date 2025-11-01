import path from 'path';
import express from 'express';
// Configuration: Backend route prefixes that should not be handled by SPA fallback
const BACKEND_ROUTE_PREFIXES = ['/api', '/auth', '/health', '/webhook'];
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
 * @param backendPrefixes Optional custom backend route prefixes (defaults to common patterns)
 */
export function setupSpaFallback(app, backendPrefixes = BACKEND_ROUTE_PREFIXES) {
    const staticDir = path.join(process.cwd(), 'dist');
    // SPA fallback route - serve index.html for all non-API routes
    // This should be the last route registered to avoid intercepting API routes
    app.get('*', (req, res) => {
        // Skip backend routes
        const isBackendRoute = backendPrefixes.some(prefix => req.path.startsWith(prefix));
        if (isBackendRoute) {
            res.status(404).json({ error: 'API endpoint not found', path: req.path });
            return;
        }
        // Serve the SPA for all other routes
        res.sendFile(path.join(staticDir, 'index.html'));
    });
}
