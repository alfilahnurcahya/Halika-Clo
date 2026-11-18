import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

let server;

async function startServer() {
  try {
    await connectDatabase();
    console.log('PostgreSQL connection established and SELECT 1 succeeded.');
  } catch (error) {
    // Keep health check available so operators can see the database is unavailable.
    console.error(`Database connection failed: ${error.message}`);
  }

  server = app.listen(env.port, () => {
    console.log(`Halika.Clo API listening on port ${env.port} (${env.nodeEnv}).`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received. Closing HTTP server...`);
  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

void startServer();
