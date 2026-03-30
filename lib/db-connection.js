// Database Connection Module
// Handles connection pooling and query execution

import sql from 'mssql';
import { getConfig } from './db-config';

let pool = null;

/**
 * Initialize database connection pool
 */
export const initializePool = async () => {
  try {
    const config = getConfig();
    pool = new sql.ConnectionPool(config);
    
    pool.on('error', (err) => {
      console.error('Database connection error:', err);
    });

    await pool.connect();
    console.log('Database pool connected successfully');
    return pool;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
};

/**
 * Get connection pool
 */
export const getPool = () => {
  if (!pool) {
    throw new Error('Database pool is not initialized. Call initializePool first.');
  }
  return pool;
};

/**
 * Execute a query
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
export const executeQuery = async (query, params = []) => {
  try {
    const poolInstance = getPool();
    const request = poolInstance.request();
    
    // Add parameters
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });

    const result = await request.query(query);
    return result.recordset || result.rowsAffected;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

/**
 * Close database pool
 */
export const closePool = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Database pool closed');
    }
  } catch (error) {
    console.error('Error closing database pool:', error);
    throw error;
  }
};

/**
 * Health check
 */
export const checkConnection = async () => {
  try {
    const result = await executeQuery('SELECT 1 AS status');
    return result && result.length > 0;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};
