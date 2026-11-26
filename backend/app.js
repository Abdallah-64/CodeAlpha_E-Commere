import express from 'express';

import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

export function createApp() {
  const app = express();

  app.use((request, response, next) => {
    const allowedOrigins = new Set(['http://localhost:3000', process.env.CLIENT_URL].filter(Boolean));
    const requestOrigin = request.headers.origin;
    if (!requestOrigin || allowedOrigins.has(requestOrigin)) {
      response.setHeader('Access-Control-Allow-Origin', requestOrigin || 'http://localhost:3000');
    }
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (request.method === 'OPTIONS') return response.sendStatus(204);
    return next();
  });

  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/categories', categoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/orders', orderRoutes);

  app.use((request, response) => {
    response.status(404).json({ message: `Route ${request.method} ${request.path} was not found.` });
  });

  app.use((error, _request, response, _next) => {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return response.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return response.status(409).json({ message: 'A record with that value already exists.' });
    }
    console.error(error);
    return response.status(500).json({ message: 'An unexpected server error occurred.' });
  });

  return app;
}
