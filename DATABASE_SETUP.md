# SQL Server Setup Guide for SmartStudy

This guide will help you set up a SQL Server database for the SmartStudy application.

## Prerequisites

- SQL Server installed on your machine (Developer Edition recommended for local development)
- SQL Server Management Studio (SSMS) or SQL Server command-line tools
- Node.js installed (for the application)

## Note on Special Characters & Math Formulas

✅ **Full Support:** All questions support LaTeX math formulas and special characters:
- Examples: `$x^2$`, `$\begin{bmatrix}1 & 0\\0 & 1\end{bmatrix}$`, `$\mathbb{R}^n$`
- Database uses `NVARCHAR(MAX)` for Unicode support
- Parameterized queries safely preserve all formatting
- See [SPECIAL_CHARACTERS_GUIDE.md](SPECIAL_CHARACTERS_GUIDE.md) for details

## Installation & Setup Steps

### 1. **Install Required npm Package**

First, install the `mssql` package in your Node.js project:

```bash
cd c:\-- Projects --\SmartStudy
npm install mssql
```

### 2. **Create the Database**

Open **SQL Server Management Studio (SSMS)** and execute the database creation script:

**File:** `scripts/01-create-database.sql`

Steps in SSMS:
1. Open SSMS
2. Connect to your local SQL Server instance
3. Click **File** → **Open** → **File**
4. Select `scripts/01-create-database.sql`
5. Click **Execute** (F5)

**OR** from command line:
```powershell
sqlcmd -S localhost -U sa -P <your-password> -i scripts\01-create-database.sql
```

### 3. **Seed the Database with Sample Data**

Execute the seed script in SSMS using the same method:

**File:** `scripts/02-seed-data.sql`

Or from command line:
```powershell
sqlcmd -S localhost -U sa -P <your-password> -i scripts\02-seed-data.sql
```

### 4. **Configure Database Connection**

Update the database configuration file with your SQL Server credentials:

**File:** `lib/db-config.js`

Update the development configuration section:
```javascript
development: {
  server: 'localhost',
  database: 'SmartStudyDB',
  authentication: {
    options: {
      userName: 'sa',
      password: 'YourActualPassword', // Replace with your SQL Server password
    },
  },
  // ... rest of config
}
```

### 5. **Install mssql Package**

```bash
npm install mssql
```

### 6. **Update package.json**

Make sure your `package.json` includes the mssql dependency:

```json
{
  "dependencies": {
    "mssql": "^11.0.0",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  }
}
```

## Project Structure

```
SmartStudy/
├── scripts/
│   ├── 01-create-database.sql    # Database & table creation
│   └── 02-seed-data.sql          # Sample data insertion
├── lib/
│   ├── db-config.js              # Database configuration
│   ├── db-connection.js           # Connection pool management
│   └── question-repository.js     # Data access layer
├── src/
│   ├── app/
│   └── data/
│       └── question-bank.json
└── package.json
```

## Usage in Your Application

### Initialize Database Connection

In your main application file (e.g., `src/app/layout.tsx` or an API route):

```javascript
import { initializePool, closePool } from '@/lib/db-connection';

// Initialize on app startup
export async function registerRootLayout() {
  await initializePool();
}

// Close on shutdown
process.on('SIGTERM', async () => {
  await closePool();
});
```

### Using the Repository

```javascript
import {
  getSubjectWithAllData,
  getTestWithQuestions,
  getQuestionWithOptions,
} from '@/lib/question-repository';

// Get all data for a subject
const subjectData = await getSubjectWithAllData(1);

// Get test with all questions
const testData = await getTestWithQuestions(testId);

// Get specific question with options
const questionData = await getQuestionWithOptions(questionId);
```

## Database Schema

### Tables

1. **Subjects**
   - SubjectID (PK)
   - SubjectCode (Unique)
   - SubjectName
   - CreatedAt, UpdatedAt

2. **Tests**
   - TestID (PK)
   - SubjectID (FK)
   - TestCode
   - TestTitle
   - TestType (Proctored/NonProctored)
   - CreatedAt, UpdatedAt

3. **Questions**
   - QuestionID (PK)
   - TestID (FK)
   - QuestionCode
   - QuestionPrompt
   - Points
   - CreatedAt, UpdatedAt

4. **QuestionOptions**
   - OptionID (PK)
   - QuestionID (FK)
   - OptionText
   - OptionIndex
   - CreatedAt

## Troubleshooting

### Cannot Connect to SQL Server

**Error:** `Login failed for user 'sa'`

- Verify SQL Server is running
- Check username and password in `db-config.js`
- Make sure the server name is correct (usually `localhost` or `.\SQLEXPRESS`)

### Database Already Exists

The scripts include checks to prevent errors if tables already exist. To reset:

```sql
DROP DATABASE IF EXISTS SmartStudyDB;
```

Then re-run the creation script.

### Port 1433 Already in Use

If SQL Server is on a different port:

1. Find the port in SQL Server Configuration Manager
2. Update `db-config.js` with the correct port:
   ```javascript
   port: 1434, // or your port number
   ```

### Can't Find SQLCMD

If using command-line:
- Install SQL Server Command-Line Tools
- Or use the full path: `C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\sqlcmd.exe`

## Environment Configuration

For production, use environment variables:

```bash
# .env.local or .env.production
DB_SERVER=your-server.database.windows.net
DB_USER=youruser
DB_PASSWORD=yourpassword
DB_NAME=SmartStudyDB
NODE_ENV=production
```

The `db-config.js` will automatically read these for the production environment.

## Useful SQL Queries

### View all tables
```sql
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo';
```

### Get PT-6 Questions
```sql
SELECT q.*
FROM Questions q
JOIN Tests t ON q.TestID = t.TestID
WHERE t.TestCode = 'pt-6';
```

### Get database statistics
```sql
SELECT 
  (SELECT COUNT(*) FROM Subjects) AS Subjects,
  (SELECT COUNT(*) FROM Tests) AS Tests,
  (SELECT COUNT(*) FROM Questions) AS Questions,
  (SELECT COUNT(*) FROM QuestionOptions) AS Options;
```

## Support

For more information:
- [MSSQL Node.js Documentation](https://github.com/tediousjs/node-mssql)
- [SQL Server Documentation](https://docs.microsoft.com/sql/)
- [SQL Server Express](https://www.microsoft.com/sql-server/sql-server-express)
