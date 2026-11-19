import 'dotenv/config';

import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';

const port = Number(process.env.PORT || 5000);

async function startServer() {
  await connectDatabase();
  createApp().listen(port, () => {
    console.log(`Lumen Marketplace API listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start Lumen Marketplace API.', error);
  process.exitCode = 1;
});
