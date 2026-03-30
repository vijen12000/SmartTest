# SQL Server Quick Reference for SmartStudy

## Quick Start Commands

### 1. Run Setup Script (Automated)
```powershell
# In PowerShell
.\setup-db.ps1

# You'll be prompted to enter your SQL Server password
```

### 2. Manual Database Setup

**Create database and tables:**
```powershell
sqlcmd -S localhost -U sa -P YourPassword -i scripts\01-create-database.sql
```

**Seed sample data:**
```powershell
sqlcmd -S localhost -U sa -P YourPassword -i scripts\02-seed-data.sql
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Validate Setup (Test Special Characters)
```bash
npm run test:db
```
This script verifies:
- ✓ Database connection
- ✓ Tables exist and have data
- ✓ Special characters preserved
- ✓ Math formulas intact (LaTeX $...$)
- ✓ Security (parameterized queries)

### 5. Connect to Database
Open SQL Server Management Studio (SSMS):
- Server: `localhost` (or `.\SQLEXPRESS` for Express Edition)
- Username: `sa`
- Password: Your SQL Server password

### 6. Run the Application
```bash
npm run dev
```

## Common SQL Queries

### View Database Structure
```sql
-- List all tables
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo';

-- Show table structure
EXEC sp_help Questions;
```

### Query Questions
```sql
-- Get all PT-6 questions
SELECT q.QuestionID, q.QuestionCode, q.QuestionPrompt, q.Points
FROM Questions q
JOIN Tests t ON q.TestID = t.TestID
WHERE t.TestCode = 'pt-6'
ORDER BY q.QuestionCode;

-- Get a specific question with options
SELECT q.QuestionID, q.QuestionPrompt, o.OptionText, o.OptionIndex
FROM Questions q
LEFT JOIN QuestionOptions o ON q.QuestionID = o.QuestionID
WHERE q.QuestionCode = 'q1'
ORDER BY o.OptionIndex;

-- Get all questions for a test
SELECT q.*, COUNT(o.OptionID) AS OptionCount
FROM Questions q
LEFT JOIN QuestionOptions o ON q.QuestionID = o.QuestionID
JOIN Tests t ON q.TestID = t.TestID
WHERE t.TestCode = 'pt-6'
GROUP BY q.QuestionID, q.TestID, q.QuestionCode, q.QuestionPrompt, q.Points, q.CreatedAt, q.UpdatedAt
ORDER BY q.QuestionCode;
```

### Database Statistics
```sql
-- Count all records
SELECT 
  (SELECT COUNT(*) FROM Subjects) AS SubjectCount,
  (SELECT COUNT(*) FROM Tests) AS TestCount,
  (SELECT COUNT(*) FROM Questions) AS QuestionCount,
  (SELECT COUNT(*) FROM QuestionOptions) AS OptionCount;

-- Total points by test
SELECT t.TestCode, t.TestTitle, SUM(q.Points) AS TotalPoints
FROM Tests t
JOIN Questions q ON t.TestID = q.TestID
GROUP BY t.TestCode, t.TestTitle
ORDER BY t.TestCode;
```

## Configuration

### Update Connection String
Edit `lib/db-config.js`:

```javascript
development: {
  server: 'localhost',
  port: 1433,
  database: 'SmartStudyDB',
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'YourActualPassword', // ← Update this
    },
  },
}
```

### Environment Variables (Production)
Create `.env.local` or `.env.production`:

```env
NODE_ENV=production
DB_SERVER=your-server.database.windows.net
DB_PORT=1433
DB_NAME=SmartStudyDB
DB_USER=youruser
DB_PASSWORD=yourpassword
```

## API Endpoints

### Get Questions
```bash
GET /api/questions?testCode=pt-6&subjectCode=da-105-linear-algebra
```

Response:
```json
{
  "test": "PT-6",
  "questions": [
    {
      "id": "q1",
      "prompt": "Let $A$ be a symmetric matrix...",
      "points": 1,
      "options": ["Option 1", "Option 2", ...]
    }
  ]
}
```

### Submit Answers
```bash
POST /api/questions
Content-Type: application/json

{
  "testCode": "pt-6",
  "subjectCode": "da-105-linear-algebra",
  "answers": {
    "q1": 0,
    "q2": 2,
    ...
  }
}
```

## Troubleshooting

### Error: "Login failed for user 'sa'"
- Verify SQL Server is running
- Check password in db-config.js
- Try with SSMS first to verify credentials

### Error: "Cannot open database 'SmartStudyDB'"
- Run the 01-create-database.sql script
- Check script execution in SSMS

### Error: "Cannot connect to localhost:1433"
- Check if SQL Server is running
- Verify server name (might be `.\SQLEXPRESS` for Express)
- Update port in db-config.js if using custom port

### Database Connection Timeout
- Check network connectivity
- Verify firewall allows port 1433
- Increase timeout in db-config.js:
  ```javascript
  connectionTimeout: 30000, // 30 seconds
  ```

## Useful Commands

### Check SQL Server Status (Windows)
```powershell
Get-Service "MSSQLSERVER" | Select-Object Status
# or for Express
Get-Service "MSSQL$SQLEXPRESS" | Select-Object Status
```

### Start SQL Server
```powershell
Start-Service "MSSQLSERVER"
# or for Express
Start-Service "MSSQL$SQLEXPRESS"
```

### Stop SQL Server
```powershell
Stop-Service "MSSQLSERVER"
# or for Express
Stop-Service "MSSQL$SQLEXPRESS"
```

### Reset Database (Delete all data)
```sql
-- Drop database
DROP DATABASE IF EXISTS SmartStudyDB;

-- Then run 01-create-database.sql again
```

## File Structure

```
scripts/
├── 01-create-database.sql    # Database schema
└── 02-seed-data.sql          # Sample data

lib/
├── db-config.js              # Connection configuration
├── db-connection.js           # Connection pooling
└── question-repository.js     # Data access

src/app/api/
└── questions/
    └── route.ts              # API endpoints
```

## References

- [MSSQL Node.js GitHub](https://github.com/tediousjs/node-mssql)
- [SQL Server Documentation](https://learn.microsoft.com/sql/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
