// API route to fetch questions from SQL Server database
// File: src/app/api/questions/route.ts
// 
// Special Characters & Math Support:
// - Supports LaTeX formulas: $x^2$, $\begin{bmatrix}...\end{bmatrix}$
// - Supports special characters: Greek letters, mathematical symbols, etc.
// - Parameterized queries prevent SQL injection
// - JSON responses preserve original formatting

import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getDbPool, withDbRetry } from '@/lib/db';

type AnswerMap = Record<string, number>;

type QuestionRow = {
  QuestionID: number;
  QuestionCode: string;
  QuestionPrompt: string;
  Points: number;
  TestTitle: string;
  OptionText: string | null;
  OptionIndex: number | null;
};

type TestLookupRow = {
  TestID: number;
  SubjectID: number;
  TestTitle: string;
};

type TestQuestionRow = {
  QuestionID: number;
  QuestionCode: string;
};

// GET /api/questions?testCode=pt-6&subjectCode=da-105-linear-algebra
// Returns questions with preserved LaTeX and special characters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testCode = searchParams.get('testCode');
    const subjectCode = searchParams.get('subjectCode');

    if (!testCode || !subjectCode) {
      return NextResponse.json(
        { error: 'testCode and subjectCode are required' },
        { status: 400 }
      );
    }

    const result = await withDbRetry(async () => {
      const dbPool = await getDbPool();

      // Get test and questions (special characters preserved in NVARCHAR(MAX))
      return dbPool.request()
        .input('testCode', sql.NVarChar(50), testCode)
        .input('subjectCode', sql.NVarChar(50), subjectCode)
        .query(`
        SELECT 
          q.QuestionID,
          q.QuestionCode,
          q.QuestionPrompt,
          q.Points,
          t.TestTitle,
          o.OptionText,
          o.OptionIndex
        FROM Questions q
        JOIN Tests t ON q.TestID = t.TestID
        JOIN Subjects s ON t.SubjectID = s.SubjectID
        LEFT JOIN QuestionOptions o ON q.QuestionID = o.QuestionID
        WHERE t.TestCode = @testCode AND s.SubjectCode = @subjectCode
        ORDER BY CAST(SUBSTRING(q.QuestionCode, 2, 10) AS INT), o.OptionIndex
      `);
    });

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    const rows = result.recordset as QuestionRow[];
    const questionMap = new Map<string, { id: string; prompt: string; points: number; options: string[] }>();

    for (const row of rows) {
      if (!questionMap.has(row.QuestionCode)) {
        questionMap.set(row.QuestionCode, {
          id: row.QuestionCode,
          prompt: row.QuestionPrompt,
          points: row.Points,
          options: [],
        });
      }

      if (row.OptionText !== null) {
        questionMap.get(row.QuestionCode)?.options.push(row.OptionText);
      }
    }

    // JSON serialization preserves all special characters and math formulas
    return NextResponse.json({
      test: rows[0]?.TestTitle,
      questions: Array.from(questionMap.values()),
    });
  } catch (error) {
    console.error('API Error:', error);

    const isDbUnavailable =
      error instanceof Error &&
      (
        error.message.includes('Failed to connect') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ESOCKET') ||
        error.message.includes('Connection is closed')
      );

    return NextResponse.json(
      {
        error: isDbUnavailable
          ? 'Database is unavailable. Start SQL Server on localhost:1433 (or update DB_PORT) and ensure the database is seeded.'
          : 'Internal server error',
      },
      { status: isDbUnavailable ? 503 : 500 }
    );
  }
}

// Optional: POST route to save test submissions
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { testCode, subjectCode, answers } = data as {
      testCode?: string;
      subjectCode?: string;
      answers?: AnswerMap;
    };

    if (!testCode || !subjectCode || !answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const testLookup = await withDbRetry(async () => {
      const dbPool = await getDbPool();
      return dbPool.request()
        .input('testCode', sql.NVarChar(50), testCode)
        .input('subjectCode', sql.NVarChar(50), subjectCode)
        .query(`
        SELECT TOP 1
          t.TestID,
          s.SubjectID,
          t.TestTitle
        FROM Tests t
        JOIN Subjects s ON t.SubjectID = s.SubjectID
        WHERE t.TestCode = @testCode AND s.SubjectCode = @subjectCode
      `);
    });

    if (testLookup.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    const test = testLookup.recordset[0] as TestLookupRow;

    const questionResult = await withDbRetry(async () => {
      const dbPool = await getDbPool();
      return dbPool.request()
        .input('testId', sql.Int, test.TestID)
        .query(`
        SELECT QuestionID, QuestionCode
        FROM Questions
        WHERE TestID = @testId
      `);
    });

    const questionRows = questionResult.recordset as TestQuestionRow[];
    const questionMap = new Map<string, number>();
    for (const row of questionRows) {
      questionMap.set(row.QuestionCode, row.QuestionID);
    }

    const validOptionResult = await withDbRetry(async () => {
      const dbPool = await getDbPool();
      return dbPool.request()
        .input('testId', sql.Int, test.TestID)
        .query(`
        SELECT q.QuestionCode, o.OptionIndex
        FROM Questions q
        JOIN QuestionOptions o ON q.QuestionID = o.QuestionID
        WHERE q.TestID = @testId
      `);
    });

    const validOptionMap = new Map<string, Set<number>>();
    for (const row of validOptionResult.recordset as Array<{ QuestionCode: string; OptionIndex: number }>) {
      if (!validOptionMap.has(row.QuestionCode)) {
        validOptionMap.set(row.QuestionCode, new Set<number>());
      }
      validOptionMap.get(row.QuestionCode)?.add(row.OptionIndex);
    }

    const transaction = new sql.Transaction(await getDbPool());
    await transaction.begin();

    try {
      const answerEntries = Object.entries(answers);
      const answeredQuestions = answerEntries.filter(([questionCode, optionIndex]) => (
        questionMap.has(questionCode) && Number.isInteger(optionIndex)
      ));

      const insertSubmission = await new sql.Request(transaction)
        .input('testId', sql.Int, test.TestID)
        .input('subjectId', sql.Int, test.SubjectID)
        .input('totalQuestions', sql.Int, questionRows.length)
        .input('answeredQuestions', sql.Int, answeredQuestions.length)
        .query(`
          INSERT INTO Submissions (TestID, SubjectID, TotalQuestions, AnsweredQuestions)
          OUTPUT INSERTED.SubmissionID
          VALUES (@testId, @subjectId, @totalQuestions, @answeredQuestions)
        `);

      const submissionId = insertSubmission.recordset[0]?.SubmissionID as number | undefined;

      if (!submissionId) {
        throw new Error('Failed to create submission');
      }

      for (const [questionCode, optionIndex] of answeredQuestions) {
        const questionId = questionMap.get(questionCode);
        const selectedOptionIndex = Number(optionIndex);
        const isValidOption = Boolean(validOptionMap.get(questionCode)?.has(selectedOptionIndex));

        if (!questionId) {
          continue;
        }

        await new sql.Request(transaction)
          .input('submissionId', sql.Int, submissionId)
          .input('questionId', sql.Int, questionId)
          .input('selectedOptionIndex', sql.Int, selectedOptionIndex)
          .input('isValidOption', sql.Bit, isValidOption)
          .query(`
            INSERT INTO SubmissionAnswers (SubmissionID, QuestionID, SelectedOptionIndex, IsValidOption)
            VALUES (@submissionId, @questionId, @selectedOptionIndex, @isValidOption)
          `);
      }

      await transaction.commit();

      return NextResponse.json({
        success: true,
        message: 'Submission saved successfully.',
        submissionId,
        answeredQuestions: answeredQuestions.length,
        totalQuestions: questionRows.length,
      });
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('API Error:', error);

    if (error instanceof Error && error.message.includes("Invalid object name 'Submissions'")) {
      return NextResponse.json(
        { error: 'Submission tables are missing. Run scripts/01-create-database.sql again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
