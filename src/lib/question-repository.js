// Question Bank Repository
// Handles all database queries for questions, tests, and subjects

import sql from 'mssql';
import { getPool } from './db-connection';

/**
 * Get all subjects
 */
export const getAllSubjects = async () => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT 
        SubjectID,
        SubjectCode,
        SubjectName,
        CreatedAt,
        UpdatedAt
      FROM Subjects
      ORDER BY SubjectName
    `);
    return result.recordset;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    throw error;
  }
};

/**
 * Get subject by ID
 */
export const getSubjectById = async (subjectId) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('subjectId', sql.Int, subjectId)
      .query(`
        SELECT 
          SubjectID,
          SubjectCode,
          SubjectName,
          CreatedAt,
          UpdatedAt
        FROM Subjects
        WHERE SubjectID = @subjectId
      `);
    return result.recordset[0];
  } catch (error) {
    console.error('Error fetching subject:', error);
    throw error;
  }
};

/**
 * Get all tests for a subject
 */
export const getTestsBySubject = async (subjectId, testType = null) => {
  try {
    const pool = getPool();
    const request = pool.request()
      .input('subjectId', sql.Int, subjectId);

    let query = `
      SELECT 
        TestID,
        SubjectID,
        TestCode,
        TestTitle,
        TestType,
        CreatedAt,
        UpdatedAt
      FROM Tests
      WHERE SubjectID = @subjectId
    `;

    if (testType) {
      request.input('testType', sql.NVarChar(50), testType);
      query += ` AND TestType = @testType`;
    }

    query += ` ORDER BY TestCode`;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error fetching tests:', error);
    throw error;
  }
};

/**
 * Get test by code
 */
export const getTestByCode = async (subjectId, testCode) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('subjectId', sql.Int, subjectId)
      .input('testCode', sql.NVarChar(50), testCode)
      .query(`
        SELECT 
          TestID,
          SubjectID,
          TestCode,
          TestTitle,
          TestType,
          CreatedAt,
          UpdatedAt
        FROM Tests
        WHERE SubjectID = @subjectId AND TestCode = @testCode
      `);
    return result.recordset[0];
  } catch (error) {
    console.error('Error fetching test:', error);
    throw error;
  }
};

/**
 * Get all questions for a test
 * 
 * Note: QuestionPrompt preserves all special characters and LaTeX formulas
 * Examples: $A$, $x^2$, $\begin{bmatrix}...\end{bmatrix}$
 */
export const getQuestionsByTest = async (testId) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('testId', sql.Int, testId)
      .query(`
        SELECT 
          q.QuestionID,
          q.TestID,
          q.QuestionCode,
          q.QuestionPrompt,
          q.Points,
          q.CreatedAt,
          q.UpdatedAt
        FROM Questions q
        WHERE q.TestID = @testId
        ORDER BY CAST(SUBSTRING(q.QuestionCode, 2, 10) AS INT)
      `);
    return result.recordset;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

/**
 * Get question with all options
 */
export const getQuestionWithOptions = async (questionId) => {
  try {
    const pool = getPool();
    
    // Get question
    const questionResult = await pool.request()
      .input('questionId', sql.Int, questionId)
      .query(`
        SELECT 
          QuestionID,
          TestID,
          QuestionCode,
          QuestionPrompt,
          Points,
          CreatedAt,
          UpdatedAt
        FROM Questions
        WHERE QuestionID = @questionId
      `);

    if (!questionResult.recordset[0]) {
      return null;
    }

    const question = questionResult.recordset[0];

    // Get options
    const optionsResult = await pool.request()
      .input('questionId', sql.Int, questionId)
      .query(`
        SELECT 
          OptionID,
          QuestionID,
          OptionText,
          OptionIndex
        FROM QuestionOptions
        WHERE QuestionID = @questionId
        ORDER BY OptionIndex
      `);

    question.options = optionsResult.recordset;
    return question;
  } catch (error) {
    console.error('Error fetching question with options:', error);
    throw error;
  }
};

/**
 * Get all questions for a test with options
 */
export const getTestWithQuestions = async (testId) => {
  try {
    const pool = getPool();

    // Get test info
    const testResult = await pool.request()
      .input('testId', sql.Int, testId)
      .query(`
        SELECT 
          TestID,
          SubjectID,
          TestCode,
          TestTitle,
          TestType,
          CreatedAt,
          UpdatedAt
        FROM Tests
        WHERE TestID = @testId
      `);

    if (!testResult.recordset[0]) {
      return null;
    }

    const test = testResult.recordset[0];

    // Get questions with options
    const questionsResult = await pool.request()
      .input('testId', sql.Int, testId)
      .query(`
        SELECT 
          q.QuestionID,
          q.TestID,
          q.QuestionCode,
          q.QuestionPrompt,
          q.Points,
          q.CreatedAt,
          q.UpdatedAt
        FROM Questions q
        WHERE q.TestID = @testId
        ORDER BY CAST(SUBSTRING(q.QuestionCode, 2, 10) AS INT)
      `);

    // Get options for each question
    const questions = [];
    for (const question of questionsResult.recordset) {
      const optionsResult = await pool.request()
        .input('questionId', sql.Int, question.QuestionID)
        .query(`
          SELECT 
            OptionID,
            QuestionID,
            OptionText,
            OptionIndex
          FROM QuestionOptions
          WHERE QuestionID = @questionId
          ORDER BY OptionIndex
        `);

      question.options = optionsResult.recordset;
      questions.push(question);
    }

    test.questions = questions;
    return test;
  } catch (error) {
    console.error('Error fetching test with questions:', error);
    throw error;
  }
};

/**
 * Get options for a question
 */
export const getQuestionOptions = async (questionId) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('questionId', sql.Int, questionId)
      .query(`
        SELECT 
          OptionID,
          QuestionID,
          OptionText,
          OptionIndex
        FROM QuestionOptions
        WHERE QuestionID = @questionId
        ORDER BY OptionIndex
      `);
    return result.recordset;
  } catch (error) {
    console.error('Error fetching question options:', error);
    throw error;
  }
};

/**
 * Get complete subject with all tests and questions
 */
export const getSubjectWithAllData = async (subjectId) => {
  try {
    const pool = getPool();

    // Get subject
    const subject = await getSubjectById(subjectId);
    if (!subject) return null;

    // Get all tests
    const tests = await getTestsBySubject(subjectId);

    // Get questions for each test
    const testsWithQuestions = [];
    for (const test of tests) {
      const testData = await getTestWithQuestions(test.TestID);
      testsWithQuestions.push(testData);
    }

    subject.tests = testsWithQuestions;
    return subject;
  } catch (error) {
    console.error('Error fetching subject with all data:', error);
    throw error;
  }
};

/**
 * Search questions by prompt text
 */
export const searchQuestions = async (searchTerm) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('searchTerm', sql.NVarChar(sql.MAX), `%${searchTerm}%`)
      .query(`
        SELECT 
          q.QuestionID,
          q.TestID,
          q.QuestionCode,
          q.QuestionPrompt,
          q.Points,
          t.TestCode,
          t.TestTitle,
          s.SubjectCode,
          s.SubjectName
        FROM Questions q
        JOIN Tests t ON q.TestID = t.TestID
        JOIN Subjects s ON t.SubjectID = s.SubjectID
        WHERE q.QuestionPrompt LIKE @searchTerm
        ORDER BY s.SubjectName, t.TestCode, q.QuestionCode
      `);
    return result.recordset;
  } catch (error) {
    console.error('Error searching questions:', error);
    throw error;
  }
};

/**
 * Get statistics
 */
export const getStatistics = async () => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM Subjects) AS TotalSubjects,
          (SELECT COUNT(*) FROM Tests) AS TotalTests,
          (SELECT COUNT(*) FROM Questions) AS TotalQuestions,
          (SELECT COUNT(*) FROM QuestionOptions) AS TotalOptions,
          (SELECT SUM(Points) FROM Questions) AS TotalPoints
      `);
    return result.recordset[0];
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
};
