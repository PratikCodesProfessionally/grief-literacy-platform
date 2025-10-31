import express from 'express';
import dotenv from 'dotenv';
import { setupStaticServing, setupSpaFallback } from './static-serve.mjs';
dotenv.config();
const app = express();
// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Setup static file serving
setupStaticServing(app);
// TODO: Add your API routes here
// app.use('/api', apiRouter);
// Setup SPA fallback route AFTER all other routes
// This must be the last route registered to avoid intercepting API routes
setupSpaFallback(app);
// Export a function to start the server
export async function startServer(port) {
    try {
        app.listen(port, () => {
            console.log(`API Server running on port ${port}`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}
// Start the server directly if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('Starting server...');
    startServer(process.env.PORT || 3001);
}
