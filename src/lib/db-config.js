// SQL Server Database Configuration
// Configure your SQL Server connection details here

const config = {
  // Local SQL Server Configuration
  development: {
    server: process.env.DB_SERVER || 'localhost',
    ...(process.env.DB_PORT ? { port: parseInt(process.env.DB_PORT, 10) } : {}),
    database: process.env.DB_NAME || 'SmartStudyDB',
    authentication: {
      type: 'default',
      options: {
        userName: process.env.DB_USER || 'sa',
        password: process.env.DB_PASSWORD || 'YourStrongPassword123!',
      },
    },
    options: {
      encrypt: false, // Set to true if using SSL
      trustServerCertificate: true,
      enableKeepAlive: true,
      connectionTimeout: 15000,
      requestTimeout: 30000,
    },
  },

  // Production Configuration
  production: {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_NAME || 'SmartStudyDB',
    authentication: {
      type: 'default',
      options: {
        userName: process.env.DB_USER || 'sa',
        password: process.env.DB_PASSWORD,
      },
    },
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableKeepAlive: true,
      connectionTimeout: 15000,
      requestTimeout: 30000,
    },
  },

  // Azure SQL Database Configuration (Optional)
  azure: {
    server: process.env.AZURE_DB_SERVER,
    port: 1433,
    database: process.env.AZURE_DB_NAME || 'SmartStudyDB',
    authentication: {
      type: 'default',
      options: {
        userName: process.env.AZURE_DB_USER,
        password: process.env.AZURE_DB_PASSWORD,
      },
    },
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableKeepAlive: true,
      connectionTimeout: 15000,
      requestTimeout: 30000,
    },
  },
};

// Get configuration based on environment
const getConfig = () => {
  // Local-only mode: always use development settings.
  return config.development;
};

export {
  config,
  getConfig,
};

// Usage Example:
// import { getConfig } from './db-config';
// import sql from 'mssql';
// const dbConfig = getConfig();
// const pool = new sql.ConnectionPool(dbConfig);
