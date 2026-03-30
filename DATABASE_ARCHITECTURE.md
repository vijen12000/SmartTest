# SmartStudy SQL Server Architecture

## Database Schema Diagram

```
┌─────────────────────────┐
│     SUBJECTS            │
├─────────────────────────┤
│ PK: SubjectID           │
│ SubjectCode (UNIQUE)    │
│ SubjectName             │
│ CreatedAt, UpdatedAt    │
└────────────┬────────────┘
             │ (1:N)
             │
┌────────────▼────────────┐
│       TESTS             │
├─────────────────────────┤
│ PK: TestID              │
│ FK: SubjectID           │
│ TestCode                │
│ TestTitle               │
│ TestType                │
│ (Proctored/NonProctored)│
│ CreatedAt, UpdatedAt    │
└────────────┬────────────┘
             │ (1:N)
             │
┌────────────▼────────────┐
│      QUESTIONS          │
├─────────────────────────┤
│ PK: QuestionID          │
│ FK: TestID              │
│ QuestionCode            │
│ QuestionPrompt (NVARCHAR MAX)
│ Points                  │
│ CreatedAt, UpdatedAt    │
└────────────┬────────────┘
             │ (1:N)
             │
┌────────────▼────────────┐
│  QUESTIONOPTIONS        │
├─────────────────────────┤
│ PK: OptionID            │
│ FK: QuestionID          │
│ OptionText              │
│ OptionIndex             │
│ CreatedAt               │
└─────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────┐
│          React Frontend (Next.js)               │
├─────────────────────────────────────────────────┤
│ QuestionBank → SubjectSelector → TestSelector  │
│               → TestTypeSelector → QuestionCard │
└────────────────────┬────────────────────────────┘
                     │ HTTP Request
                     ▼
┌─────────────────────────────────────────────────┐
│      Next.js API Routes (/api/questions)        │
├─────────────────────────────────────────────────┤
│ - Parse query parameters (testCode, subjectCode)
│ - Call repository functions
│ - Return JSON response
└──────────────┬──────────────────────────────────┘
               │ SQL Queries
               ▼
┌─────────────────────────────────────────────────┐
│   Question Repository (question-repository.js)  │
├─────────────────────────────────────────────────┤
│ - getTestByCode()
│ - getQuestionWithOptions()
│ - getTestWithQuestions()
│ - getStatistics()
└──────────────┬──────────────────────────────────┘
               │ Connection Pooling
               ▼
┌─────────────────────────────────────────────────┐
│     Database Connection (db-connection.js)      │
├─────────────────────────────────────────────────┤
│ - Connection Pool Management
│ - Query Execution
│ - Error Handling
└──────────────┬──────────────────────────────────┘
               │ SQL Protocol
               ▼
┌─────────────────────────────────────────────────┐
│    SQL Server Database (SmartStudyDB)            │
├─────────────────────────────────────────────────┤
│ Subjects → Tests → Questions → QuestionOptions  │
└─────────────────────────────────────────────────┘
```

## Data Model - PT-6 Example

```
Subject: DA-105 Linear Algebra
│
└─ Test: PT-6 (Proctored)
   │
   ├─ Question 1 (1 point)
   │  └─ Options: [Positive definite, Negative definite, Semi-definite, Indefinite]
   │
   ├─ Question 2 (1 point)
   │  └─ Options: [...4 options]
   │
   ├─ Question 3 (2 points)
   │  └─ Options: [...4 options]
   │
   ├─ Question 4 (2 points)
   │  └─ Options: [...4 options]
   │
   ├─ Question 5 (2 points)
   │  └─ Options: [...4 options]
   │
   ├─ Question 6 (3 points)
   │  └─ Options: [...4 options]
   │
   ├─ Question 7 (3 points)
   │  └─ Options: [...4 options]
   │
   ├─ Question 8 (3 points)
   │  └─ Options: [...4 options]
   │
   └─ Question 9 (3 points)
      └─ Options: [...4 options]

Total: 20 points
```

## Connection Architecture

```
┌─────────────────────────────────────────────────┐
│         Node.js Application Pool                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────┐  ┌─────────────┐              │
│  │ Connection 1│  │ Connection 2│  ... (10)    │
│  └─────────────┘  └─────────────┘              │
│                                                 │
│  (Connection pooling - reuses after use)       │
└────────────────────┬────────────────────────────┘
                     │ TCP Port 1433
                     ▼
        ┌──────────────────────────┐
        │   SQL Server Instance    │
        │  (localhost:1433)        │
        └──────────────────────────┘
```

## File Structure

```
SmartStudy/
│
├── 📁 scripts/
│   ├── 01-create-database.sql      ← Database schema
│   └── 02-seed-data.sql            ← Sample data
│
├── 📁 lib/
│   ├── db-config.js                ← Configuration
│   ├── db-connection.js             ← Connection pooling
│   └── question-repository.js        ← Data access layer
│
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 api/
│   │   │   └── 📁 questions/
│   │   │       └── route.ts        ← API endpoints
│   │   └── ...other components
│   └── 📁 data/
│       └── question-bank.json      ← Backup JSON data
│
├── 📄 DATABASE_SETUP.md             ← Detailed setup guide
├── 📄 SQL_SERVER_QUICK_REFERENCE.md ← Quick commands
├── 📄 .env.example                  ← Environment template
├── 📄 setup-db.ps1                  ← Automated setup script
└── 📄 package.json                  ← Dependencies (+mssql)
```

## Key Relationships

### Subject → Tests
- One subject has many tests (Proctored & NonProctored)
- Example: DA-105 Linear Algebra has PT-1 through PT-6

### Test → Questions
- One test has many questions
- Example: PT-6 has 9 questions totaling 20 points

### Question → Options
- One question has multiple options (typically 4)
- Each option has an index (0, 1, 2, 3)
- OptionIndex determines display order

### Uniqueness Constraints
- SubjectCode must be unique
- TestCode + SubjectID + TestType must be unique
- QuestionCode + TestID must be unique
- OptionIndex + QuestionID must be unique

## Performance Optimizations

### Indexes Created
```
IDX_Tests_SubjectID
IDX_Questions_TestID
IDX_QuestionOptions_QuestionID
```

### Connection Pool Benefits
- Reuses connections instead of creating new ones
- Reduces database connection overhead
- Handles concurrent requests efficiently
- Automatic connection recycling

## Scalability Considerations

### Current Setup
- Local SQL Server
- Single subject (DA-105)
- 6 Proctored Tests (PT-1 to PT-6)
- 6 Non-Proctored Tests (NPT-1 to NPT-6)
- ~100+ questions (PT-6 has 9)

### For Production Scaling
- Use Azure SQL Database or AWS RDS
- Implement caching layer (Redis)
- Add submission tracking table
- Consider read replicas for reporting
- Implement database backup strategy
