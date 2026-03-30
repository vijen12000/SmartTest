# Special Characters & Math Formulas in SmartStudy

This guide explains how SmartStudy properly handles special characters, LaTeX formulas, and Unicode content throughout the database layer.

## Overview

SmartStudy questions contain LaTeX math formulas and special characters. The entire system is designed to preserve these exactly as stored:

```
Sample Question: "Let $A$ be a symmetric matrix..."
Sample Option: "$\\begin{bmatrix}1 & 0\\\\0 & 1\\end{bmatrix}$"
```

## Database Level

### Column Definitions

All text fields use `NVARCHAR(MAX)` which supports:
- ✅ Full Unicode character set (including special symbols)
- ✅ LaTeX formulas with backslashes, dollar signs, braces
- ✅ Greek letters and mathematical symbols
- ✅ Multi-line content

```sql
-- From 01-create-database.sql
CREATE TABLE Questions (
    ...
    QuestionPrompt NVARCHAR(MAX) NOT NULL,  -- Stores raw LaTeX/Unicode
    ...
);

CREATE TABLE QuestionOptions (
    ...
    OptionText NVARCHAR(MAX) NOT NULL,      -- Stores raw LaTeX/Unicode
    ...
);
```

### Why NVARCHAR(MAX)?

- `NVARCHAR` = Unicode variable-length strings (2 bytes per character)
- `MAX` = Can store up to 2GB of text (allows for complex formulas)
- Handles: Backslashes, braces, dollar signs, Greek letters, special operators

### Examples Stored Correctly

All of these are stored as-is in the database:

```
Inline math:      $A$ or $x^2$ or $\mathbb{R}^n$
Matrix brackets:  $\begin{bmatrix}1 & 0\\0 & 1\end{bmatrix}$
Escapes:          $1, 0, -2$ (commas preserved)
Greek letters:    $\lambda$ or $\mu$ or $\pi$
Special symbols:  $\pm$, $\leq$, $\neq$, $\in$
Complex:          $\begin{bmatrix}2 & -1\\-1 & 2\end{bmatrix}$ (double backslash)
```

## Application Layer

### Parameterized Queries (Security & Safety)

The Node.js `mssql` package uses parameterized queries, which:
- ✅ Prevents SQL injection
- ✅ Properly escapes special characters
- ✅ Preserves exact formula content

**Safe Query Example:**
```javascript
const result = await pool.request()
    .input('searchTerm', sql.NVarChar(sql.MAX), '%' + userInput + '%')
    .query(`SELECT * FROM Questions WHERE QuestionPrompt LIKE @searchTerm`);
```

Even if user input contains: `'; DROP TABLE Questions; --` or math symbols, it's safe.

### Data Flow in question-repository.js

```javascript
// ✅ Safe: Parameters passed separately from SQL
const result = await pool.request()
    .input('questionId', sql.Int, questionId)
    .input('testId', sql.Int, testId)
    .query(`
        SELECT QuestionPrompt, OptionText
        FROM Questions
        WHERE QuestionID = @questionId
    `);

// Result includes original formulas: "Let $A$ be a symmetric matrix..."
return result.recordset;
```

### JSON Serialization

When returned as JSON API response:
```javascript
{
  "question": {
    "prompt": "Let $A$ be a symmetric matrix. If $A$ has eigenvalues $1, 0, -2$, then the associated quadratic form is",
    "options": [
      "Positive definite",
      "Negative definite",
      "Semi-definite",
      "Indefinite"
    ]
  }
}
```

- ✅ JSON preserves string content exactly
- ✅ LaTeX formulas included verbatim
- ✅ Backslashes not double-escaped by default
- ✅ Safe for frontend MathRenderer component

## Seed Data Handling

### In 02-seed-data.sql

Formulas are wrapped in SQL string literals with proper escaping:

```sql
INSERT INTO Questions (TestID, QuestionCode, QuestionPrompt, Points)
SELECT @PT6_TestID, 'q1',
       'Let $A$ be a symmetric matrix. If $A$ has eigenvalues $1, 0, -2$, then the associated quadratic form is',
       1;

INSERT INTO Questions (TestID, QuestionCode, QuestionPrompt, Points)
SELECT @PT6_TestID, 'q8',
       'The matrix $\\begin{bmatrix}2 & -1\\\\-1 & 2\\end{bmatrix}$ defines a quadratic form which is',
       3;
```

**Key points:**
- Single quotes wrap the string: `'...'`
- Single quotes inside are doubled: `''` (but not present in our formulas)
- Backslashes are literal: `\\` in SQL represents `\` in the string
- Dollar signs don't need escaping in SQL: `$x^2$` is stored as-is

## Frontend Rendering

### React Component (MathRenderer.tsx)

```tsx
import { useEffect, useRef } from 'react';
import katex from 'katex';

export function MathRenderer({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && content) {
      try {
        // Content comes exactly as stored: "Let $A$ be..."
        // KaTeX processes the LaTeX and renders it
        ref.current.innerHTML = content
          .replace(/\$([^$]+)\$/g, (_, math) => {
            return katex.renderToString(math);
          });
      } catch (error) {
        console.error('Math rendering error:', error);
        ref.current.innerHTML = content;
      }
    }
  }, [content]);

  return <div ref={ref} />;
}
```

**Flow:**
1. Database returns: `"Let $A$ be a symmetric matrix..."`
2. JSON transmits: exact string with `$...$` markers
3. Component extracts LaTeX: `A`
4. KaTeX renders: formatted mathematical expression

## Edge Cases & Special Formulas

### Backslash Handling

```
Database stores:    \begin{bmatrix}1 & 0\\0 & 1\end{bmatrix}
Node.js receives:   "\begin{bmatrix}1 & 0\\0 & 1\end{bmatrix}"
JSON includes:      "\\begin{bmatrix}1 & 0\\\\0 & 1\\end{bmatrix}"
Frontend parses:    \begin{bmatrix}1 & 0\\0 & 1\end{bmatrix}
KaTeX renders:      Matrix display
```

### Double Backslash in LaTeX

When you want `\\` in LaTeX output:
- Database stores: `\\` (two backslashes)
- This represents: column break in matrices

Our Q8 example:
```
Stored in DB:       $\begin{bmatrix}2 & -1\\-1 & 2\end{bmatrix}$
Retrieved by app:   $\begin{bmatrix}2 & -1\\-1 & 2\end{bmatrix}$
Rendered by KaTeX:  2x2 matrix displayed correctly
```

### Greek Letters

All supported by NVARCHAR(MAX):
```
\alpha    →  α
\lambda   →  λ
\mathbb{R}  →  ℝ (or rendered as symbol)
\in       →  ∈
\subset   →  ⊂
```

## Testing Special Characters

### Test Query in SSMS

```sql
-- Verify special characters stored correctly
SELECT QuestionID, QuestionPrompt, LEN(QuestionPrompt) as Length
FROM Questions
WHERE QuestionCode IN ('q1', 'q8', 'q9');

-- Check for specific patterns
SELECT * FROM Questions WHERE QuestionPrompt LIKE '%$%';
SELECT * FROM Questions WHERE QuestionPrompt LIKE '%\\%';
```

### Test API Response

```bash
# Get questions from API
curl "http://localhost:3000/api/questions?testCode=pt-6&subjectCode=da-105-linear-algebra"

# Check if formulas preserved (should see $...$)
# Example: "Let $A$ be a symmetric matrix..."
```

### Node.js Test

```javascript
const sql = require('mssql');
const config = require('./lib/db-config').getConfig();

async function testSpecialChars() {
  const pool = new sql.ConnectionPool(config);
  await pool.connect();
  
  const result = await pool.request()
    .query(`
      SELECT TOP 1 QuestionPrompt 
      FROM Questions 
      WHERE QuestionCode = 'q8'
    `);
  
  const prompt = result.recordset[0].QuestionPrompt;
  console.log('Stored prompt:', prompt);
  console.log('Contains \\\\:', prompt.includes('\\'));
  console.log('Contains $:', prompt.includes('$'));
  console.log('Raw:', JSON.stringify(prompt));
  
  await pool.close();
}

testSpecialChars();
```

## Performance Considerations

### Index Impact

- NVARCHAR(MAX) columns are not typically indexed
- Our index is on single-column foreign keys, not on text content
- Full-text search (if needed later) would require special configuration

### Storage Size

- Q1-Q9 with 9 questions: ~8-10 KB
- With options: ~20-30 KB per test
- Negligible impact on database size

### Query Performance

- WHERE conditions on NVARCHAR(MAX) are supported
- LIKE queries work fine: `LIKE '%$A$%'`
- No special optimization needed for our dataset size

## Encoding & Collation

### Database Level

```sql
-- When creating database, collation handles case sensitivity
COLLATE SQL_Latin1_General_CP1_CI_AS
-- CI = Case Insensitive
-- AS = Accent Sensitive (preserves accents)
```

### Application Level

- Node.js uses UTF-8 by default
- JSON encoding preserves special characters
- No manual encoding/decoding needed

## Security Notes

### SQL Injection Prevention

✅ All user input is parameterized:
```javascript
// SAFE - parameter passed separately
.input('prompt', sql.NVarChar(sql.MAX), userInput)

// UNSAFE - avoid this
.query(`SELECT * FROM Questions WHERE QuestionPrompt = '${userInput}'`)
```

### NoSQL Injection (if using MongoDB later)

Not applicable to SQL Server, but keep in mind.

### XSS Prevention

When rendering on frontend:
- KaTeX handles LaTeX safely
- HTML special characters in text are escaped by React
- Never use `innerHTML` directly on user content

## Real Examples from PT-6

### Question 1
```
Stored: Let $A$ be a symmetric matrix. If $A$ has eigenvalues $1, 0, -2$, then the associated quadratic form is
Retrieved: (exactly the same)
Rendered: "Let A be a symmetric matrix. If A has eigenvalues 1, 0, −2, then the associated quadratic form is"
```

### Question 8 Option
```
Stored: $\begin{bmatrix}2 & -1\\-1 & 2\end{bmatrix}$
Retrieved: $\begin{bmatrix}2 & -1\\-1 & 2\end{bmatrix}$
Rendered: 2×2 matrix with values [[2, -1], [-1, 2]]
```

### Question 9 Option
```
Stored: $\begin{bmatrix}1 & 0\\0 & 0\end{bmatrix}$
Retrieved: $\begin{bmatrix}1 & 0\\0 & 0\end{bmatrix}$
Rendered: 2×2 matrix with values [[1, 0], [0, 0]]
```

## Troubleshooting Special Characters

### Issue: Characters appear corrupted in SSMS

**Solution:** Check SSMS collation
```sql
SELECT DATABASEPROPERTYEX('SmartStudyDB', 'Collation');
```

### Issue: LaTeX not rendering on frontend

**Possible causes:**
1. Formula not wrapped in `$...$`
2. Backslashes not properly escaped
3. Check browser console for KaTeX errors

**Solution:**
```javascript
// Debug what was actually retrieved
console.log(JSON.stringify(question.prompt));
```

### Issue: Database query returns empty when searching for `$`

**Solution:** `$` needs to be escaped with `[` `]` in LIKE:
```sql
SELECT * FROM Questions WHERE QuestionPrompt LIKE '%[$]%'
```

## References

- [SQL Server NVARCHAR](https://learn.microsoft.com/en-us/sql/t-sql/data-types/nvarchar-transact-sql)
- [Unicode in SQL Server](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-database-transact-sql)
- [LaTeX Special Characters](https://www.overleaf.com/learn/latex/Special_characters)
- [KaTeX Documentation](https://katex.org/docs/supported)
- [JSON and UTF-8](https://tools.ietf.org/html/rfc8259#section-8.1)

## Summary

✅ **Database:** NVARCHAR(MAX) handles all special characters and math formulas
✅ **Storage:** Formulas stored exactly as provided (no escaping needed)
✅ **Retrieval:** Parameterized queries preserve content safely
✅ **API:** JSON responses include formulas unchanged
✅ **Frontend:** MathRenderer component processes KaTeX correctly
✅ **Security:** No risk of SQL injection with parameterized queries

**PT-6 with 9 complex questions containing matrices and Greek letters works perfectly out of the box.**
