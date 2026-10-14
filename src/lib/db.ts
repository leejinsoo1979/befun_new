import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export class DatabaseConfigurationError extends Error {
  readonly code = 'DATABASE_NOT_CONFIGURED';

  constructor() {
    super('DATABASE_URL이 설정되지 않았습니다.');
    this.name = 'DatabaseConfigurationError';
  }
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

// Log identifiers only: driver messages can contain connection strings or SQL data.
export function databaseErrorDetails(error: unknown) {
  const name = error instanceof Error && /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(error.name)
    ? error.name : 'UnknownError';
  const code = error && typeof error === 'object' && 'code' in error
    && typeof error.code === 'string' && /^[A-Z0-9_]{1,64}$/.test(error.code)
    ? error.code : undefined;
  return { name, code };
}

type ClientCache = { connectionString: string; client: PrismaClient };
const globalForPrisma = globalThis as unknown as {
  // A new key avoids reusing the old client created with a string adapter argument after HMR.
  prismaWithPoolConfig?: ClientCache;
};
let localCache: ClientCache | undefined;

function getPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new DatabaseConfigurationError();

  let cache = localCache ?? globalForPrisma.prismaWithPoolConfig;
  if (!cache || cache.connectionString !== connectionString) {
    const adapter = new PrismaPg({ connectionString });
    cache = { connectionString, client: new PrismaClient({ adapter }) };
  }
  localCache = cache;
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prismaWithPoolConfig = cache;
  }
  return cache.client;
}

// Keep the PrismaClient export for existing consumers, without requiring a DB at import time.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
