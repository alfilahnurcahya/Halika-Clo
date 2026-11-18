import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';

// Lazily create one shared client so a missing URL is reported as DB unavailability,
// while the HTTP health endpoint can still report the server's status.
let prismaClient;

export function getPrismaClient() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is not configured. Copy .env.example to .env and set it.');
  }

  if (!prismaClient) {
    const adapter = new PrismaPg({ connectionString: env.databaseUrl });
    prismaClient = new PrismaClient({ adapter });
  }

  return prismaClient;
}

export async function connectDatabase() {
  const client = getPrismaClient();
  await client.$connect();
  await client.$queryRaw`SELECT 1`;
}

export async function getDatabaseStatus() {
  try {
    await getPrismaClient().$queryRaw`SELECT 1`;
    return { status: 'connected' };
  } catch {
    // Do not expose connection details or driver errors through the public endpoint.
    return { status: 'disconnected' };
  }
}

export async function disconnectDatabase() {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = undefined;
  }
}
