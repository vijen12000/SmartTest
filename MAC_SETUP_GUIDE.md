# SQL Server Setup for Mac Users

Since you mentioned you have SQL Server installed on your machine, this guide covers Mac-specific setup.

## SQL Server on Mac Options

### 1. **SQL Server via Docker (Recommended for Mac)**

If SQL Server isn't installed yet, Docker is the easiest way:

```bash
# Install Docker Desktop first if not already installed
# From: https://www.docker.com/products/docker-desktop

# Pull and run SQL Server image
docker run -e "ACCEPT_EULA=Y" \
  -e "MSSQL_SA_PASSWORD=YourStrongPassword123!" \
  -p 1433:1433 \
  -d mcr.microsoft.com/mssql/server:2022-latest

# Verify it's running
docker ps
```

### 2. **SQL Server via Homebrew (if installed)**

```bash
brew install mssql-server
brew services start mssql-server
```

### 3. **Azure Data Studio (GUI for Mac)**

Download from: https://github.com/microsoft/azuredatastudio/releases

Or via Homebrew:
```bash
brew install --cask azure-data-studio
```

## Initial Setup

### Step 1: Verify SQL Server Connection

```bash
# Test connection from terminal
sqlcmd -S localhost -U sa -P YourPassword
# or
/usr/local/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourPassword

# If successful, you'll see:
# 1>
```

### Step 2: Create Database

```bash
# From project directory
sqlcmd -S localhost -U sa -P YourPassword -i scripts/01-create-database.sql
```

### Step 3: Seed Data

```bash
sqlcmd -S localhost -U sa -P YourPassword -i scripts/02-seed-data.sql
```

## Mac-Specific Configuration

### Update db-config.js for Mac

For Docker:
```javascript
development: {
  server: 'localhost',
  port: 1433,
  database: 'SmartStudyDB',
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'YourStrongPassword123!',
    },
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableKeepAlive: true,
  },
}
```

### Install Dependencies

```bash
# Navigate to project
cd /path/to/SmartStudy

# Install Node.js dependencies
npm install

# Specific mssql version
npm install mssql@11.0.0
```

## Using Azure Data Studio (Mac GUI)

1. **Open Azure Data Studio**
2. **Create Connection:**
   - Server: `localhost`
   - Authentication: SQL Login
   - Username: `sa`
   - Password: (your SQL Server password)
   - Database: leave blank
   - Port: 1433

3. **Create New Query:**
   - File → New Query
   - Copy content from `01-create-database.sql`
   - Click Execute

4. **Repeat for seed data:**
   - File → New Query
   - Copy content from `02-seed-data.sql`
   - Click Execute

## Docker Commands (if using Docker)

```bash
# Start SQL Server
docker run -e "ACCEPT_EULA=Y" \
  -e "MSSQL_SA_PASSWORD=YourPassword123!" \
  -p 1433:1433 \
  --name smartstudy-mssql \
  -d mcr.microsoft.com/mssql/server:2022-latest

# View logs
docker logs smartstudy-mssql

# Stop SQL Server
docker stop smartstudy-mssql

# Start existing container
docker start smartstudy-mssql

# Remove container
docker rm smartstudy-mssql

# Connect via sqlcmd
docker exec -it smartstudy-mssql /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P YourPassword123!
```

## Bash Script for Mac Setup

Save as `setup-db-mac.sh`:

```bash
#!/bin/bash

set -e

echo "=========================================="
echo "SmartStudy Database Setup (Mac)"
echo "=========================================="
echo ""

# Check if Docker is running (if using Docker)
if ! docker ps > /dev/null 2>&1; then
    echo "⚠️  Docker is required. Install from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Configuration
SERVER="localhost"
USER="sa"
DB_NAME="SmartStudyDB"
PORT="1433"

# Prompt for password
read -sp "Enter SQL Server password: " PASSWORD
echo ""

# Test connection
echo "Testing connection..."
if sqlcmd -S $SERVER -U $USER -P "$PASSWORD" -Q "SELECT @@VERSION;" > /dev/null 2>&1; then
    echo "✓ Connection successful"
else
    echo "✗ Connection failed. Check server and credentials."
    exit 1
fi

# Create database
echo ""
echo "Creating database and tables..."
sqlcmd -S $SERVER -U $USER -P "$PASSWORD" -i scripts/01-create-database.sql

# Seed data
echo ""
echo "Seeding sample data..."
sqlcmd -S $SERVER -U $USER -P "$PASSWORD" -i scripts/02-seed-data.sql

# Install npm dependencies
echo ""
echo "Installing npm dependencies..."
npm install

# Create .env.local
echo ""
echo "Creating .env.local..."
cat > .env.local << EOF
NODE_ENV=development
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=SmartStudyDB
DB_USER=sa
DB_PASSWORD=$PASSWORD
EOF

echo ""
echo "=========================================="
echo "✓ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update lib/db-config.js if needed"
echo "2. Run: npm run dev"
echo "3. Visit: http://localhost:3000"
```

Run with:
```bash
chmod +x setup-db-mac.sh
./setup-db-mac.sh
```

## Common Mac Issues

### Issue: `sqlcmd: command not found`

**Solution 1: Install SQL Server command-line tools**
```bash
brew install mssql-tools
```

**Solution 2: Use Docker SQL Server**
```bash
docker run -it mcr.microsoft.com/mssql/server:2022-latest \
  /opt/mssql-tools/bin/sqlcmd -S localhost -U sa
```

**Solution 3: Use Azure Data Studio GUI**
- Download from https://aka.ms/azuredatastudio-mac

### Issue: Port 1433 Already in Use

```bash
# Find process using port
lsof -i :1433

# Kill process
kill -9 <PID>

# Or use different port
docker run -p 1434:1433 ...
# Then update db-config.js: port: 1434
```

### Issue: Connection Refused

```bash
# Check if SQL Server is running
docker ps | grep mssql

# Check if it's listening
netstat -an | grep 1433
# or
ss -an | grep 1433

# Try from SQL Server container
docker exec smartstudy-mssql \
  /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourPassword
```

### Issue: Authentication Failed

```bash
# Verify password is correct
# Make sure there are no special characters issues
# escaping in shell

# Example correct usage:
sqlcmd -S localhost -U sa -P 'YourPassword123!'
```

## Using VS Code Remote Containers (Advanced)

Create `.devcontainer/devcontainer.json`:

```json
{
  "name": "SmartStudy",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:18",
  "services": {
    "mssql": {
      "image": "mcr.microsoft.com/mssql/server:2022-latest",
      "environment": {
        "ACCEPT_EULA": "Y",
        "MSSQL_SA_PASSWORD": "YourPassword123!"
      },
      "ports": ["1433:1433"]
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-mssql.mssql",
        "ms-vscode.azure-account"
      ]
    }
  },
  "postCreateCommand": "npm install",
  "forwardPorts": [1433, 3000]
}
```

Then use "Dev Containers: Reopen in Container" in VS Code.

## Performance Tips for Mac

1. **Allocate More Memory to Docker:**
   - Docker Desktop → Preferences → Resources
   - Set Memory to at least 4GB

2. **Enable Disk Caching:**
   ```bash
   # In docker-compose
   volumes:
     - mssql-data:/var/opt/mssql
   ```

3. **Connection Pooling:**
   - Already configured in `db-config.js`
   - Pool size: 10 connections by default

## Testing Your Setup

```bash
# Test database connection
npm run test:db

# Or manually in Node:
node -e "
const sql = require('mssql');
const config = require('./lib/db-config.js').getConfig();
const pool = new sql.ConnectionPool(config);
pool.connect().then(() => {
  console.log('✓ Connected!');
  pool.close();
}).catch(err => {
  console.error('✗ Error:', err.message);
});
"
```

## Next Steps

1. Verify your SQL Server is running
2. Update credentials in `lib/db-config.js`
3. Run `npm install`
4. Test: `npm run dev`
5. Visit `http://localhost:3000`

## Support Resources

- SQL Server on Mac: https://docs.microsoft.com/sql/linux/sql-server-linux-setup-docker
- Azure Data Studio: https://docs.microsoft.com/sql/azure-data-studio/
- Node MSSQL: https://github.com/tediousjs/node-mssql
- Docker: https://docs.docker.com/
