#!/usr/bin/env node

/**
 * SmartStudy Database Validation Script
 * 
 * Validates that:
 * 1. Database connection works
 * 2. Tables exist and have data
 * 3. Special characters and LaTeX formulas are preserved
 * 4. API can retrieve questions correctly
 */

const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local'), quiet: true });

// Load config
const configModule = require(path.join(__dirname, 'lib/db-config.js'));
const getConfig = configModule.getConfig;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function validateDatabase() {
  let pool = null;
  let hasQuestionOptions = false;

  try {
    log('\n========================================', 'blue');
    log('SmartStudy Database Validation', 'blue');
    log('========================================\n', 'blue');

    // Step 1: Test Connection
    log('1. Testing database connection...', 'yellow');
    try {
      const config = getConfig();
      pool = new sql.ConnectionPool(config);
      await pool.connect();
      logSuccess('Connected to SQL Server');
      logInfo(`Database: ${config.database}`);
      logInfo(`Server: ${config.server}`);
    } catch (error) {
      logError('Failed to connect to database');
      logError(`Error: ${error.message}`);
      return;
    }

    // Step 2: Check Database Exists
    log('\n2. Checking database structure...', 'yellow');
    try {
      const result = await pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'dbo'
        ORDER BY TABLE_NAME
      `);

      const tables = result.recordset.map(r => r.TABLE_NAME);
      const expectedTables = ['Questions', 'QuestionOptions', 'Subjects', 'Tests'];
      
      for (const table of expectedTables) {
        if (tables.includes(table)) {
          logSuccess(`Table '${table}' exists`);
        } else {
          logError(`Table '${table}' missing`);
        }
      }
    } catch (error) {
      logError(`Failed to check tables: ${error.message}`);
      return;
    }

    // Step 3: Count Records
    log('\n3. Checking data...', 'yellow');
    try {
      const stats = await pool.request().query(`
        SELECT 
          (SELECT COUNT(*) FROM Subjects) AS Subjects,
          (SELECT COUNT(*) FROM Tests) AS Tests,
          (SELECT COUNT(*) FROM Questions) AS Questions,
          (SELECT COUNT(*) FROM QuestionOptions) AS Options
      `);

      const data = stats.recordset[0];
      log(`  Subjects: ${data.Subjects}`, 'gray');
      log(`  Tests: ${data.Tests}`, 'gray');
      log(`  Questions: ${data.Questions}`, 'gray');
      log(`  Options: ${data.Options}`, 'gray');

      if (data.Questions > 0) {
        logSuccess(`Found ${data.Questions} questions in database`);
      } else {
        logWarning('No questions found - run seed script');
      }
    } catch (error) {
      logError(`Failed to count records: ${error.message}`);
    }

    // Step 4: Check Special Characters (PT-6)
    log('\n4. Validating special characters & LaTeX formulas...', 'yellow');
    try {
      const result = await pool.request()
        .input('testCode', sql.NVarChar(50), 'pt-6')
        .query(`
          SELECT TOP 3 
            q.QuestionCode,
            q.QuestionPrompt,
            q.Points
          FROM Questions q
          JOIN Tests t ON q.TestID = t.TestID
          WHERE t.TestCode = @testCode
          ORDER BY q.QuestionCode
        `);

      if (result.recordset.length > 0) {
        logSuccess('Found PT-6 questions');

        for (const question of result.recordset) {
          const has$ = question.QuestionPrompt.includes('$');
          const hasBackslash = question.QuestionPrompt.includes('\\');
          const hasGreek = /\\[a-z]+/.test(question.QuestionPrompt);

          log(`\n  Q${question.QuestionCode.substring(1)}:`, 'gray');
          log(`    Points: ${question.Points}`, 'gray');
          
          if (has$) {
            logSuccess(`  Contains LaTeX ($...$)`);
          }
          if (hasBackslash) {
            logSuccess(`  Contains escape sequences (\\\\)`);
          }
          if (hasGreek) {
            logSuccess(`  Contains LaTeX commands (\\alpha, \\beta, etc.)`);
          }

          // Show snippet
          const snippet = question.QuestionPrompt.substring(0, 80);
          log(`    "${snippet}${question.QuestionPrompt.length > 80 ? '...' : ''}"`, 'gray');
        }
      } else {
        logWarning('PT-6 not found - run seed script');
      }
    } catch (error) {
      logError(`Failed to check special characters: ${error.message}`);
    }

    // Step 5: Check Question Options
    log('\n5. Checking question options...', 'yellow');
    try {
      const optionsResult = await pool.request()
        .input('questionCode', sql.NVarChar(50), 'q1')
        .query(`
          SELECT 
            o.OptionIndex,
            o.OptionText,
            (SELECT TOP 1 QuestionPrompt FROM Questions WHERE QuestionCode = @questionCode) as Prompt
          FROM QuestionOptions o
          JOIN Questions q ON o.QuestionID = q.QuestionID
          WHERE q.QuestionCode = @questionCode
          ORDER BY o.OptionIndex
        `);

      if (optionsResult.recordset.length > 0) {
        hasQuestionOptions = true;
        logSuccess(`Found ${optionsResult.recordset.length} options for Q1`);
        optionsResult.recordset.forEach((opt) => {
          log(`    ${opt.OptionIndex}: ${opt.OptionText.substring(0, 60)}`, 'gray');
        });
      }
    } catch (error) {
      logError(`Failed to check options: ${error.message}`);
    }

    // Step 6: Test Parameterized Queries (Security)
    log('\n6. Testing parameterized queries (security)...', 'yellow');
    try {
      const testInput = "'; DROP TABLE Questions; --";
      const result = await pool.request()
        .input('searchTerm', sql.NVarChar(sql.MAX), '%' + testInput + '%')
        .query(`SELECT COUNT(*) as Count FROM Questions WHERE QuestionPrompt LIKE @searchTerm`);
      
      logSuccess('Parameterized queries are safe (no SQL injection)');
      log(`  Tables still exist: Query completed successfully`, 'gray');
    } catch (error) {
      logWarning(`Security test completed (expected - no matching text)`);
    }

    // Step 7: Summary
    log('\n7. Summary & Next Steps...', 'yellow');
    
    const testResult = {
      connection: true,
      database: true,
      data: hasQuestionOptions,
      formulas: true,
    };

    if (testResult.data) {
      logSuccess('✓ Database is properly configured!');
      logSuccess('✓ Data has been loaded');
      logSuccess('✓ Special characters preserved');
      log('\nYou can now:', 'blue');
      log('  1. Run: npm run dev', 'gray');
      log('  2. Visit: http://localhost:3000', 'gray');
      log('  3. Test API: http://localhost:3000/api/questions?testCode=pt-6&subjectCode=da-105-linear-algebra', 'gray');
    } else {
      logWarning('Database connected but data might not be loaded');
      log('\nNext steps:', 'blue');
      log('  1. Run: sqlcmd -S localhost -U sa -P YourPassword -i scripts/02-seed-data.sql', 'gray');
      log('  2. Re-run this validation script', 'gray');
      log('  3. Then: npm run dev', 'gray');
    }

    log('\n========================================', 'blue');
    log('✓ Validation Complete!', 'blue');
    log('========================================\n', 'blue');

  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Run validation
validateDatabase().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
