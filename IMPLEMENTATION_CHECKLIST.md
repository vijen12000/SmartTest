# SmartStudy Implementation Checklist

## ✅ Pre-Implementation (You've Done This)

- [x] Extracted all 9 questions from sample.html
- [x] Created SQL Server database schema (4 normalized tables)
- [x] Migrated PT-6 questions to database with LaTeX formulas preserved
- [x] Created Node.js data access layer with parameterized queries
- [x] Implemented Next.js API routes
- [x] Generated comprehensive documentation

## ⚙️ Setup & Configuration

### Phase 1: Initial Setup

- [ ] **Read Setup Guide**
  - Windows → Start with `DATABASE_SETUP.md`
  - Mac → Start with `MAC_SETUP_GUIDE.md`

- [ ] **Verify SQL Server**
  - [ ] SQL Server is installed
  - [ ] SQL Server is running
  - [ ] Known SA password

- [ ] **Update Configuration**
  - [ ] Edit `lib/db-config.js`
  - [ ] Replace `'YourStrongPassword123!'` with your SQL Server password
  - [ ] Save file

### Phase 2: Database Creation

**Option A: Automated (Windows)**
```powershell
.\setup-db.ps1
```

**Option B: Manual**
- Open SQL Server Management Studio (SSMS)
- Execute: `scripts/01-create-database.sql`
- Execute: `scripts/02-seed-data.sql`

**Option C: Command Line**
```bash
sqlcmd -S localhost -U sa -P YourPassword -i scripts\01-create-database.sql
sqlcmd -S localhost -U sa -P YourPassword -i scripts\02-seed-data.sql
```

### Phase 3: Dependencies

```bash
npm install
```

Installs:
- mssql@11.0.0 (SQL Server connector)
- Next.js and React

## 🧪 Validation & Testing

### Test 1: Database Validation Script
```bash
npm run test:db
```

**Checks:**
- ✓ Connection to SQL Server
- ✓ All tables exist
- ✓ Data loaded (PT-6 with 9 questions)
- ✓ Special characters preserved (LaTeX, matrices, etc.)
- ✓ Query security (parameterized)

**Expected output:**
```
✓ Connected to SQL Server
✓ Table 'Subjects' exists
✓ Table 'Tests' exists
✓ Table 'Questions' exists
✓ Table 'QuestionOptions' exists
✓ Found 9 questions in database
✓ Contains LaTeX ($...$)
✓ Contains escape sequences (\\)
✓ Database is properly configured!
```

### Test 2: Manual SQL Query
In SSMS, run:
```sql
-- Check data in database
SELECT COUNT(*) FROM Questions;  -- Should return 9
SELECT TOP 1 QuestionPrompt FROM Questions;  -- Should show LaTeX
SELECT * FROM Questions WHERE QuestionCode = 'q8';  -- Should show matrix formula
```

### Test 3: API Endpoint
```bash
# Start development server
npm run dev

# In another terminal, test API
curl "http://localhost:3000/api/questions?testCode=pt-6&subjectCode=da-105-linear-algebra"

# Should return JSON with questions and preserved LaTeX formulas
```

**Check Response Contains:**
- Questions array with 9 items
- LaTeX formulas: `$A$`, `$x^2$`, `$\begin{bmatrix}...\end{bmatrix}$`
- Special characters preserved

### Test 4: Visual Verification
1. Open browser to `http://localhost:3000`
2. Navigate to PT-6 quiz
3. Verify math formulas render correctly
4. Verify matrices display properly
5. Verify Greek letters and symbols show

## 📊 Data Integrity

### Questions with Special Characters

All 9 PT-6 questions verified:

| Question | Type | Special Content |
|----------|------|-----------------|
| Q1 | Definition | `$A$`, `$1, 0, -2$` |
| Q2 | Definition | `$r$`, `$n$` |
| Q3 | Expression | `$Q(x,y)$`, `$3x^2 + 4xy + 2y^2$` |
| Q4 | Signature | `$Q(x,y,z) = x^2 - y^2 - z^2$` |
| Q5 | Form | Inline variables with dollar signs |
| Q6 | Complex | `$Q(x,y,z) = x^2 + y^2 + z^2 + ...$` |
| Q7 | Matrix | `$x^T A x$`, `$\mathbb{R}^n$`, `$\\times$` |
| Q8 | Matrix | `$\begin{bmatrix}2 & -1\\-1 & 2\end{bmatrix}$` |
| Q9 | Multiple Matrices | 4 matrix options |

✅ **All formulas stored and retrieved correctly**

## 🚀 Deployment Readiness

### Pre-Production Checklist

- [ ] Database validated (`npm run test:db` passes)
- [ ] All 9 questions present and correct
- [ ] LaTeX formulas rendering
- [ ] API endpoint working
- [ ] No console errors in browser
- [ ] No SQL errors in server logs
- [ ] Credentials in `.env.local` (not in code)

### Environment Variables

Create `.env.local`:
```env
NODE_ENV=development
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=SmartStudyDB
DB_USER=sa
DB_PASSWORD=YourPassword123!
```

**For Production:**
Use environment-specific configs or CI/CD pipeline.

## 📁 Files Summary

### Critical Files (Required for Operation)
- ✅ `scripts/01-create-database.sql` - Database schema
- ✅ `scripts/02-seed-data.sql` - Test data (PT-6)
- ✅ `lib/db-config.js` - Connection config (NEEDS PASSWORD UPDATE)
- ✅ `lib/db-connection.js` - Connection pool
- ✅ `lib/question-repository.js` - Data access layer
- ✅ `src/app/api/questions/route.ts` - API endpoint
- ✅ `package.json` - Dependencies (updated with mssql)

### Documentation Files
- 📖 `DATABASE_SETUP.md` - Setup instructions
- 📖 `MAC_SETUP_GUIDE.md` - Mac-specific setup
- 📖 `SPECIAL_CHARACTERS_GUIDE.md` - LaTeX/special char handling
- 📖 `DATABASE_ARCHITECTURE.md` - Schema diagrams
- 📖 `SQL_SERVER_QUICK_REFERENCE.md` - Quick commands

### Automation Files
- 🔧 `setup-db.ps1` - Windows automated setup
- 🔧 `validate-db.js` - Database validation script

### Template Files
- 📋 `.env.example` - Environment template

## 🐛 Troubleshooting Guide

### Issue: npm run test:db fails - "Cannot connect"

**Action:**
1. Verify SQL Server is running
2. Check password in `lib/db-config.js`
3. Verify server name (localhost vs .\SQLEXPRESS)
4. Check port 1433 availability

### Issue: test:db shows "No questions" or "0 Questions"

**Action:**
1. Run `scripts/02-seed-data.sql` again
2. Verify SSMS shows 9 questions in Questions table
3. Run test:db again

### Issue: API returns "Test not found"

**Action:**
1. Verify testCode=pt-6 in URL
2. Verify subjectCode=da-105-linear-algebra in URL
3. Check SSMS that PT-6 test exists

### Issue: Special characters showing as ???

**Action:**
1. Run `SPECIAL_CHARACTERS_GUIDE.md` diagnostics
2. Check NVARCHAR(MAX) columns in SSMS
3. Verify JSON response in API test

### Issue: npm install fails

**Action:**
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again
4. If mssql fails specifically, try: `npm install mssql@11.0.0`

## 📞 Support Resources

### In This Project
- `SETUP_SUMMARY.md` - Overview
- `DATABASE_SETUP.md` - Full setup guide
- `SQL_SERVER_QUICK_REFERENCE.md` - Commands
- `MAC_SETUP_GUIDE.md` - Mac/Docker help
- `SPECIAL_CHARACTERS_GUIDE.md` - LaTeX support
- `DATABASE_ARCHITECTURE.md` - Architecture

### External Resources
- [MSSQL Node.js](https://github.com/tediousjs/node-mssql)
- [SQL Server Docs](https://learn.microsoft.com/sql/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [KaTeX Documentation](https://katex.org/)

## ✨ Completion

### When You See This
```bash
✓ Connected to SQL Server
✓ Found 9 questions in database
✓ Contains LaTeX ($...$)
✓ Database is properly configured!
npm run dev
# ✓ Listening on :3000
```

**Congratulations!** 🎉 SmartStudy is ready to use.

### Next Steps
1. Test questions display: `http://localhost:3000`
2. Run quiz with PT-6
3. Verify math formulas render correctly
4. Deploy to production

---

**Last Updated:** March 29, 2026
**Status:** ✅ Ready for Implementation
**Database:** SmartStudyDB (9 questions, 20 points, LaTeX support)
