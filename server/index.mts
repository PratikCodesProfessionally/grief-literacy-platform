import express from 'express';
import dotenv from 'dotenv';
import { setupStaticServing } from './static-serve.mjs';

dotenv.config();

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Export a function to start the server
export async function startServer(port: number | string) {
  try {
    setupStaticServing(app); // Immer aufrufen!
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
  startServer(process.env.PORT || 3001);
}
