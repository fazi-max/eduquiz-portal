import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes.ts';

// Load environment variables
dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Parse JSON and urlencoded request bodies
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes MUST come first before Vite middleware
  app.use('/api', apiRouter);

  // Health check endpoint (both /api/health and /health for container readiness probes)
  app.get(['/api/health', '/health'], (req, res) => {
    res.json({
      status: 'online',
      service: 'EduQuiz Portal API',
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application bundle index.html not found. Please run npm run build.');
      }
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 EduQuiz Portal Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error during EduQuiz Portal startup:', err);
});
