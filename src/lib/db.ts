import sql from 'mssql';
import { getConfig } from '@/lib/db-config';

let pool: sql.ConnectionPool | null = null;
let poolConnectPromise: Promise<sql.ConnectionPool> | null = null;

const resetPool = async () => {
  if (pool) {
    try {
      await pool.close();
    } catch {
      // Ignore close errors while recovering from broken sockets.
    }
  }

  pool = null;
  poolConnectPromise = null;
};

const createPool = async (): Promise<sql.ConnectionPool> => {
  const config = getConfig() as sql.config;
  const nextPool = new sql.ConnectionPool(config);

  nextPool.on('error', async () => {
    await resetPool();
  });

  await nextPool.connect();
  pool = nextPool;
  return nextPool;
};

export const getDbPool = async (): Promise<sql.ConnectionPool> => {
  if (pool?.connected) {
    return pool;
  }

  if (!poolConnectPromise) {
    poolConnectPromise = createPool().catch(async (error) => {
      await resetPool();
      throw error;
    });
  }

  return poolConnectPromise;
};

const isRetryableConnectionError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeCode = 'code' in error ? String((error as { code?: unknown }).code || '') : '';
  const maybeMessage = 'message' in error ? String((error as { message?: unknown }).message || '') : '';

  return (
    ['ESOCKET', 'ECONNCLOSED', 'ETIMEOUT', 'ECONNRESET'].includes(maybeCode) ||
    maybeMessage.includes('Connection is closed') ||
    maybeMessage.includes('Connection lost') ||
    maybeMessage.includes('read ECONNRESET')
  );
};

export const withDbRetry = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (!isRetryableConnectionError(error)) {
      throw error;
    }

    await resetPool();
    return operation();
  }
};

process.on('SIGTERM', async () => {
  await resetPool();
});

process.on('SIGINT', async () => {
  await resetPool();
});
