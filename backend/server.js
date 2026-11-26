import 'dotenv/config';

import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { ensureAdminUser } from './services/seedCatalog.js';

const port = Number(process.env.PORT || 5000);

async function startServer() {
  await connectDatabase();
  await ensureAdminUser();
  const server = createApp().listen(port, () => {
    console.log(`Lumen Marketplace API listening on port ${port}`);
  });

  server.on('error', async (error) => {
    if (error.code === 'EADDRINUSE') {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/health`);
        if (res.ok) {
          console.log(`Lumen Marketplace API is already running on port ${port}.`);
          process.exit(0);
        }
      } catch {}
      console.error(`Port ${port} is already in use by another process. Stop that process or set a different PORT in .env.`);
      process.exit(1);
    }
    console.error('Unable to start Lumen Marketplace API.', error);
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error('Unable to start Lumen Marketplace API.', error);
  process.exitCode = 1;
});
