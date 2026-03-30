# SmartStudy Documentation Index

## 🎯 Quick Navigation

### 👀 Just Want to Understand the Setup?
Start here based on your OS:
- **Windows**: Read `DATABASE_SETUP.md` → Run `setup-db.ps1`
- **Mac**: Read `MAC_SETUP_GUIDE.md` → Follow instructions

### 📋 Need a Checklist?
→ Read `IMPLEMENTATION_CHECKLIST.md`

### 🧪 Want to Validate Your Setup?
One command:
```bash
npm run test:db
```

### 🔤 Concerned About Special Characters & LaTeX?
Perfect! We've got you covered:
→ Read `SPECIAL_CHARACTERS_CONFIRMATION.md` (quick)
→ Then `SPECIAL_CHARACTERS_GUIDE.md` (detailed)

---

## 📚 Complete Documentation Guide

### For Different Users

#### **I just want to get started (5 min)**
1. `SETUP_SUMMARY.md` - Overview
2. `DATABASE_SETUP.md` or `MAC_SETUP_GUIDE.md` - Setup steps
3. Run `npm run test:db` - Validation

#### **I want to understand the database (20 min)**
1. `DATABASE_ARCHITECTURE.md` - Schema diagrams
2. `DATABASE_SETUP.md` - How tables work
3. SQL code in `scripts/01-create-database.sql`

#### **I need to troubleshoot (As needed)**
1. `DATABASE_SETUP.md` - Troubleshooting section
2. `MAC_SETUP_GUIDE.md` - Mac-specific issues
3. `SQL_SERVER_QUICK_REFERENCE.md` - Quick queries
4. `SPECIAL_CHARACTERS_GUIDE.md` - Character issues

#### **I want to verify special characters work (10 min)**
1. `SPECIAL_CHARACTERS_CONFIRMATION.md` - Summary
2. Run `npm run test:db` - Automated validation
3. `SPECIAL_CHARACTERS_GUIDE.md` - Deep dive if needed

#### **I need to work with the data layer (Developer)**
1. `DATABASE_ARCHITECTURE.md` - Overview
2. `lib/question-repository.js` - Data access functions
3. `lib/db-connection.js` - Connection pooling
4. `src/app/api/questions/route.ts` - API endpoint

#### **I want complete details (Reference)**
1. `DATABASE_ARCHITECTURE.md` - Full architecture
2. `SPECIAL_CHARACTERS_GUIDE.md` - Complete feature guide
3. `SQL_SERVER_QUICK_REFERENCE.md` - All commands
4. Source code in `scripts/` and `lib/`

---

## 📄 Document Descriptions

### Setup & Configuration

| Document | Purpose | Read Time | Best For |
|----------|---------|-----------|----------|
| `DATABASE_SETUP.md` | Windows/SQL Server setup guide | 15 min | Windows users, first time |
| `MAC_SETUP_GUIDE.md` | Mac/Docker setup guide | 15 min | Mac users, Docker setup |
| `SETUP_SUMMARY.md` | Project overview | 5 min | Quick overview |
| `IMPLEMENTATION_CHECKLIST.md` | Step-by-step checklist | 10 min | Structured setup |

### Features & Specifications

| Document | Purpose | Read Time | Best For |
|----------|---------|-----------|----------|
| `SPECIAL_CHARACTERS_CONFIRMATION.md` | Special char/LaTeX support (summary) | 5 min | Quick assurance |
| `SPECIAL_CHARACTERS_GUIDE.md` | Detailed LaTeX & special char guide | 20 min | Understanding Unicode |
| `DATABASE_ARCHITECTURE.md` | Database schema & architecture | 15 min | Understanding design |

### Reference & Commands

| Document | Purpose | Read Time | Best For |
|----------|---------|-----------|----------|
| `SQL_SERVER_QUICK_REFERENCE.md` | SQL commands & queries | 10 min | Quick lookup |

### Code & Scripts

| File | Purpose | Type |
|------|---------|------|
| `scripts/01-create-database.sql` | Database schema | SQL |
| `scripts/02-seed-data.sql` | Test data (PT-6) | SQL |
| `lib/db-config.js` | Connection config | JavaScript |
| `lib/db-connection.js` | Connection pooling | JavaScript |
| `lib/question-repository.js` | Data access layer | JavaScript |
| `src/app/api/questions/route.ts` | API endpoint | TypeScript |
| `validate-db.js` | Database validation | JavaScript |
| `setup-db.ps1` | Automated setup (Windows) | PowerShell |

---

## 🗺️ Reading Paths

### Path 1: Day 1 - Get It Working (30 min)
```
1. SETUP_SUMMARY.md (5 min)
   ↓
2. DATABASE_SETUP.md or MAC_SETUP_GUIDE.md (15 min)
   ↓
3. Run setup script or SQL scripts (5 min)
   ↓
4. npm run test:db (5 min)
   ↓
✅ You're done! System is working
```

### Path 2: Day 2 - Understand Everything (1 hour)
```
1. DATABASE_ARCHITECTURE.md (15 min)
   ↓
2. SPECIAL_CHARACTERS_CONFIRMATION.md (5 min)
   ↓
3. SPECIAL_CHARACTERS_GUIDE.md (20 min)
   ↓
4. SQL_SERVER_QUICK_REFERENCE.md (10 min)
   ↓
5. Review code in lib/ and scripts/ (10 min)
   ↓
✅ You understand the whole system
```

### Path 3: Troubleshooting (As needed)
```
Any issues?
   ↓
Check relevant doc:
├─ Connection issues → DATABASE_SETUP.md troubleshooting
├─ Mac/Docker issues → MAC_SETUP_GUIDE.md
├─ Character/LaTeX issues → SPECIAL_CHARACTERS_GUIDE.md
├─ SQL queries → SQL_SERVER_QUICK_REFERENCE.md
└─ General setup → IMPLEMENTATION_CHECKLIST.md
   ↓
Still stuck? Run:
npm run test:db
```

---

## 🚀 Quick Start Commands

```bash
# 1. Update password in lib/db-config.js

# 2. Create database (choose one):
# Windows: 
.\setup-db.ps1

# Mac/Linux:
sqlcmd -S localhost -U sa -P YourPassword -i scripts/01-create-database.sql
sqlcmd -S localhost -U sa -P YourPassword -i scripts/02-seed-data.sql

# 3. Install dependencies
npm install

# 4. Validate (most important!)
npm run test:db
# Should show ✓ all checks passed

# 5. Run application
npm run dev
# Visit http://localhost:3000
```

---

## ✅ Validation Steps

### After Setup, Run This:
```bash
npm run test:db
```

**Expected output:**
```
✓ Connected to SQL Server
✓ Database connected
✓ Table 'Questions' exists
✓ Found 9 questions in database
✓ Contains LaTeX ($...$)
✓ Contains escape sequences (\\)
✓ Database is properly configured!
```

### Then Test API:
```bash
npm run dev
# In another terminal:
curl "http://localhost:3000/api/questions?testCode=pt-6&subjectCode=da-105-linear-algebra"
# Should see JSON with LaTeX formulas
```

---

## 📞 Finding Help

### For Setup Issues
- Windows → `DATABASE_SETUP.md` → Troubleshooting
- Mac → `MAC_SETUP_GUIDE.md` → Troubleshooting
- General → `IMPLEMENTATION_CHECKLIST.md` → Troubleshooting

### For Special Characters
- Quick answer → `SPECIAL_CHARACTERS_CONFIRMATION.md`
- Deep dive → `SPECIAL_CHARACTERS_GUIDE.md`

### For SQL Questions
- Commands → `SQL_SERVER_QUICK_REFERENCE.md`
- Schema → `DATABASE_ARCHITECTURE.md`

### For Code Questions
- API → `src/app/api/questions/route.ts`
- Data layer → `lib/question-repository.js`
- Connection → `lib/db-connection.js`

---

## 📋 Key Files Location

### Must Read
```
SmartStudy/
├── DATABASE_SETUP.md                    ← Read this first (Windows)
├── MAC_SETUP_GUIDE.md                   ← Read this first (Mac)
└── SETUP_SUMMARY.md                     ← Quick overview
```

### Must Update
```
SmartStudy/
└── lib/db-config.js                     ← Add your SQL password here
```

### Must Run
```
SmartStudy/
├── setup-db.ps1                         ← Windows setup
├── scripts/01-create-database.sql       ← Database creation
├── scripts/02-seed-data.sql             ← Add test data
└── validate-db.js                       ← Run: npm run test:db
```

### Reference
```
SmartStudy/
├── DATABASE_ARCHITECTURE.md              ← Schema & design
├── SPECIAL_CHARACTERS_GUIDE.md           ← LaTeX support
├── SQL_SERVER_QUICK_REFERENCE.md         ← SQL commands
└── IMPLEMENTATION_CHECKLIST.md           ← Full checklist
```

---

## 🎯 Success Indicators

### You know everything is working when:
- ✅ `npm run test:db` shows all green checks
- ✅ API returns questions with LaTeX formulas
- ✅ Website displays math formulas correctly
- ✅ All 9 PT-6 questions appear
- ✅ Special characters render properly
- ✅ No console errors

---

## ⚡ TL;DR (Too Long; Didn't Read)

```bash
# 1. Update password in lib/db-config.js

# 2. Setup database (Windows):
.\setup-db.ps1

# 3. Validate:
npm run test:db

# 4. Run:
npm run dev
```

✅ **Done!** Everything works, including special characters & LaTeX.

For details, see appropriate document above.

---

**Last Updated:** March 29, 2026
**Status:** ✅ Complete & Ready
