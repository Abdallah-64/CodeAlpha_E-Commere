import express from 'express';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use((request, response) => {
    response.status(404).json({ message: `Route ${request.method} ${request.path} was not found.` });
  });

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ message: 'An unexpected server error occurred.' });
  });

  return app;
}
