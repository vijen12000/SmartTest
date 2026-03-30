-- SmartStudy Database Seed Script
-- Run this script to populate the database with initial data

USE SmartStudyDB;

GO

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM QuestionOptions;
-- DELETE FROM Questions;
-- DELETE FROM Tests;
-- DELETE FROM Subjects;

GO

-- Insert Subject
IF NOT EXISTS (SELECT 1 FROM Subjects WHERE SubjectCode = 'da-105-linear-algebra')
BEGIN
    INSERT INTO Subjects (SubjectCode, SubjectName)
    VALUES ('da-105-linear-algebra', 'DA-105 Linear Algebra');
    PRINT 'Subject inserted successfully.';
END

GO

DECLARE @SubjectID INT;
SET @SubjectID = (SELECT SubjectID FROM Subjects WHERE SubjectCode = 'da-105-linear-algebra');

-- Insert Proctored Tests (PT-1 to PT-6)
DECLARE @TestID INT;

INSERT INTO Tests (SubjectID, TestCode, TestTitle, TestType)
SELECT @SubjectID, 'pt-' + CAST(number AS VARCHAR(2)), 'PT-' + CAST(number AS VARCHAR(2)), 'Proctored'
FROM (VALUES (1), (2), (3), (4), (5), (6)) AS Numbers(number)
WHERE NOT EXISTS (
    SELECT 1 FROM Tests WHERE SubjectID = @SubjectID AND TestCode = 'pt-' + CAST(number AS VARCHAR(2))
);

-- Insert Non-Proctored Tests (NPT-1 to NPT-6)
INSERT INTO Tests (SubjectID, TestCode, TestTitle, TestType)
SELECT @SubjectID, 'npt-' + CAST(number AS VARCHAR(2)), 'NPT-' + CAST(number AS VARCHAR(2)), 'NonProctored'
FROM (VALUES (1), (2), (3), (4), (5), (6)) AS Numbers(number)
WHERE NOT EXISTS (
    SELECT 1 FROM Tests WHERE SubjectID = @SubjectID AND TestCode = 'npt-' + CAST(number AS VARCHAR(2))
);

PRINT 'Tests inserted successfully.';

GO

-- Insert Questions and Options for PT-6
DECLARE @PT6_TestID INT;
SET @PT6_TestID = (SELECT TestID FROM Tests WHERE SubjectID = (SELECT SubjectID FROM Subjects WHERE SubjectCode = 'da-105-linear-algebra') AND TestCode = 'pt-6');

-- Question 1
INSERT INTO Questions (TestID, QuestionCode, QuestionPrompt, Points)
SELECT @PT6_TestID, 'q1', 
       'Let $A$ be a symmetric matrix. If $A$ has eigenvalues $1, 0, -2$, then the associated quadratic form is',
       1
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q1');

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q1'), 'Positive definite', 0
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q1') AND OptionIndex = 0);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q1'), 'Negative definite', 1
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q1') AND OptionIndex = 1);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q1'), 'Semi-definite', 2
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q1') AND OptionIndex = 2);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q1'), 'Indefinite', 3
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q1') AND OptionIndex = 3);

-- Question 2
INSERT INTO Questions (TestID, QuestionCode, QuestionPrompt, Points)
SELECT @PT6_TestID, 'q2',
       'If a quadratic form has rank $r$ in $n$ variables, then',
       1
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q2');

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q2'), 'It is positive definite', 0
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q2') AND OptionIndex = 0);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q2'), 'It has exactly $r$ variables', 1
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q2') AND OptionIndex = 1);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q2'), 'It can be reduced to $r$ squares by congruence', 2
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q2') AND OptionIndex = 2);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q2'), '$r = n$ always', 3
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q2') AND OptionIndex = 3);

-- Question 3
INSERT INTO Questions (TestID, QuestionCode, QuestionPrompt, Points)
SELECT @PT6_TestID, 'q3',
       'Let $Q(x,y) = 3x^2 + 4xy + 2y^2$. Then $Q$ is',
       2
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q3');

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q3'), 'Indefinite', 0
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q3') AND OptionIndex = 0);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q3'), 'Positive definite', 1
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q3') AND OptionIndex = 1);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q3'), 'Negative definite', 2
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q3') AND OptionIndex = 2);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q3'), 'Semi-definite', 3
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q3') AND OptionIndex = 3);

-- Question 4
INSERT INTO Questions (TestID, QuestionCode, QuestionPrompt, Points)
SELECT @PT6_TestID, 'q4',
       'The signature of the quadratic form $Q(x,y,z) = x^2 - y^2 - z^2$ is',
       2
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q4');

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q4'), '$(3,0)$', 0
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q4') AND OptionIndex = 0);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q4'), '$(0,3)$', 1
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q4') AND OptionIndex = 1);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q4'), '$(2,1)$', 2
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q4') AND OptionIndex = 2);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q4'), '$(1,2)$', 3
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q4') AND OptionIndex = 3);

-- Question 5
INSERT INTO Questions (TestID, QuestionCode, QuestionPrompt, Points)
SELECT @PT6_TestID, 'q5',
       'Which of the following quadratic forms is negative definite in two variables $x$ and $y$?',
       2
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q5');

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q5'), '$-x^2$', 0
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q5') AND OptionIndex = 0);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q5'), '$-x^2 + y^2$', 1
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q5') AND OptionIndex = 1);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q5'), '$x^2 - y^2$', 2
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q5') AND OptionIndex = 2);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q5'), '$-x^2 - y^2$', 3
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q5') AND OptionIndex = 3);

-- Question 6
INSERT INTO Questions (TestID, QuestionCode, QuestionPrompt, Points)
SELECT @PT6_TestID, 'q6',
       'Let $Q(x,y,z) = x^2 + y^2 + z^2 + 2axy + 2byz + 2czx$. Then $Q$ is positive definite if and only if',
       3
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q6');

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q6'), '$a^2 + b^2 + c^2 < 1$', 0
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q6') AND OptionIndex = 0);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q6'), '$a + b + c < 1$', 1
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q6') AND OptionIndex = 1);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q6'), '$abc < 0$', 2
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q6') AND OptionIndex = 2);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q6'), '$1 - a^2 > 0$, and $1 + 2abc - a^2 - b^2 - c^2 > 0$', 3
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q6') AND OptionIndex = 3);

-- Question 7
INSERT INTO Questions (TestID, QuestionCode, QuestionPrompt, Points)
SELECT @PT6_TestID, 'q7',
       'Let $A$ be an $n \\times n$ real symmetric non-singular matrix. Suppose there exists $x \\in \\mathbb{R}^n$ such that $x^T A x < 0$. Then we can conclude that',
       3
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q7');

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q7'), '$\\det(A) < 0$', 0
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q7') AND OptionIndex = 0);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q7'), '$A$ has only negative eigenvalues', 1
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q7') AND OptionIndex = 1);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q7'), '$A$ is not positive definite', 2
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q7') AND OptionIndex = 2);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q7'), '$-A$ is positive definite', 3
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q7') AND OptionIndex = 3);

-- Question 8
INSERT INTO Questions (TestID, QuestionCode, QuestionPrompt, Points)
SELECT @PT6_TestID, 'q8',
       'The matrix $\\begin{bmatrix}2 & -1\\\\-1 & 2\\end{bmatrix}$ defines a quadratic form which is',
       3
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q8');

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q8'), 'Negative definite', 0
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q8') AND OptionIndex = 0);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q8'), 'Indefinite', 1
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q8') AND OptionIndex = 1);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q8'), 'Positive definite', 2
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q8') AND OptionIndex = 2);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q8'), 'Semi-definite', 3
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q8') AND OptionIndex = 3);

-- Question 9
INSERT INTO Questions (TestID, QuestionCode, QuestionPrompt, Points)
SELECT @PT6_TestID, 'q9',
       'Which of the following matrices defines a semi-definite quadratic form?',
       3
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q9');

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q9'), '$\\begin{bmatrix}1 & 0\\\\0 & 1\\end{bmatrix}$', 0
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q9') AND OptionIndex = 0);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q9'), '$\\begin{bmatrix}1 & 0\\\\0 & 0\\end{bmatrix}$', 1
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q9') AND OptionIndex = 1);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q9'), '$\\begin{bmatrix}-1 & 0\\\\0 & -1\\end{bmatrix}$', 2
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q9') AND OptionIndex = 2);

INSERT INTO QuestionOptions (QuestionID, OptionText, OptionIndex)
SELECT (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q9'), '$\\begin{bmatrix}1 & 0\\\\0 & -1\\end{bmatrix}$', 3
WHERE NOT EXISTS (SELECT 1 FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE TestID = @PT6_TestID AND QuestionCode = 'q9') AND OptionIndex = 3);

PRINT 'All questions and options inserted successfully!';

GO

-- View the data
SELECT 'Subject Data:' AS DataType;
SELECT * FROM Subjects;

SELECT 'Tests Data:' AS DataType;
SELECT * FROM Tests;

SELECT 'Questions Data (PT-6):' AS DataType;
SELECT * FROM Questions WHERE TestID = (SELECT TestID FROM Tests WHERE TestCode = 'pt-6');

SELECT 'Question Options Data (Q1):'  AS DataType;
SELECT * FROM QuestionOptions WHERE QuestionID = (SELECT QuestionID FROM Questions WHERE QuestionCode = 'q1');
