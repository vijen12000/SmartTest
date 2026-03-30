-- SmartStudy Database Creation Script for SQL Server
-- Run this script to create the database and tables

-- Drop existing database if it exists (uncomment if needed)
-- DROP DATABASE IF EXISTS SmartStudyDB;

-- Create Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'SmartStudyDB')
BEGIN
    CREATE DATABASE SmartStudyDB;
    PRINT 'Database SmartStudyDB created successfully.';
END
ELSE
BEGIN
    PRINT 'Database SmartStudyDB already exists.';
END

GO

USE SmartStudyDB;

GO

-- Create Trimesters Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Trimesters')
BEGIN
    CREATE TABLE Trimesters (
        TrimesterID INT PRIMARY KEY IDENTITY(1,1),
        TrimesterCode NVARCHAR(50) NOT NULL UNIQUE,
        TrimesterName NVARCHAR(100) NOT NULL,
        TrimesterOrder INT NOT NULL UNIQUE,
        CreatedAt DATETIME DEFAULT GETUTCDATE()
    );
    PRINT 'Table Trimesters created successfully.';
END

GO

-- Create Subjects Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Subjects')
BEGIN
    CREATE TABLE Subjects (
        SubjectID INT PRIMARY KEY IDENTITY(1,1),
        SubjectCode NVARCHAR(50) NOT NULL UNIQUE,
        SubjectName NVARCHAR(255) NOT NULL,
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME DEFAULT GETUTCDATE()
    );
    PRINT 'Table Subjects created successfully.';
END

GO

-- Create Tests Table (for both Proctored and NonProctored)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tests')
BEGIN
    CREATE TABLE Tests (
        TestID INT PRIMARY KEY IDENTITY(1,1),
        SubjectID INT NOT NULL,
        TestCode NVARCHAR(50) NOT NULL,
        TestTitle NVARCHAR(255) NOT NULL,
        TestType NVARCHAR(50) NOT NULL CHECK (TestType IN ('Proctored', 'NonProctored')),
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID) ON DELETE CASCADE,
        CONSTRAINT UC_Test_Code_Type UNIQUE(SubjectID, TestCode, TestType)
    );
    PRINT 'Table Tests created successfully.';
END

GO

-- Create TrimesterSubjects mapping table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TrimesterSubjects')
BEGIN
    CREATE TABLE TrimesterSubjects (
        TrimesterSubjectID INT PRIMARY KEY IDENTITY(1,1),
        TrimesterID INT NOT NULL,
        SubjectID INT NOT NULL,
        SubjectOrder INT NOT NULL,
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (TrimesterID) REFERENCES Trimesters(TrimesterID) ON DELETE CASCADE,
        FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID) ON DELETE CASCADE,
        CONSTRAINT UC_Trimester_Subject UNIQUE(TrimesterID, SubjectID),
        CONSTRAINT UC_Trimester_SubjectOrder UNIQUE(TrimesterID, SubjectOrder)
    );
    PRINT 'Table TrimesterSubjects created successfully.';
END

GO

-- Create CourseContents Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CourseContents')
BEGIN
    CREATE TABLE CourseContents (
        CourseContentID INT PRIMARY KEY IDENTITY(1,1),
        SubjectID INT NOT NULL UNIQUE,
        ContentSummary NVARCHAR(MAX) NOT NULL,
        UpdatedAt DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID) ON DELETE CASCADE
    );
    PRINT 'Table CourseContents created successfully.';
END

GO

-- Create StudyMaterials Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StudyMaterials')
BEGIN
    CREATE TABLE StudyMaterials (
        StudyMaterialID INT PRIMARY KEY IDENTITY(1,1),
        SubjectID INT NOT NULL,
        Provider NVARCHAR(50) NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Url NVARCHAR(1000) NOT NULL,
        ResourceType NVARCHAR(100) NOT NULL DEFAULT 'Video Course',
        DifficultyLevel NVARCHAR(50) NOT NULL DEFAULT 'Beginner',
        DisplayOrder INT NOT NULL DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID) ON DELETE CASCADE
    );
    PRINT 'Table StudyMaterials created successfully.';
END

GO

-- Create Questions Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Questions')
BEGIN
    CREATE TABLE Questions (
        QuestionID INT PRIMARY KEY IDENTITY(1,1),
        TestID INT NOT NULL,
        QuestionCode NVARCHAR(50) NOT NULL,
        QuestionPrompt NVARCHAR(MAX) NOT NULL,
        Points INT NOT NULL DEFAULT 1 CHECK (Points > 0),
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (TestID) REFERENCES Tests(TestID) ON DELETE CASCADE,
        CONSTRAINT UC_Question_Code UNIQUE(TestID, QuestionCode)
    );
    PRINT 'Table Questions created successfully.';
END

GO

-- Create QuestionOptions Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'QuestionOptions')
BEGIN
    CREATE TABLE QuestionOptions (
        OptionID INT PRIMARY KEY IDENTITY(1,1),
        QuestionID INT NOT NULL,
        OptionText NVARCHAR(MAX) NOT NULL,
        OptionIndex INT NOT NULL,
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (QuestionID) REFERENCES Questions(QuestionID) ON DELETE CASCADE,
        CONSTRAINT UC_Option_Index UNIQUE(QuestionID, OptionIndex)
    );
    PRINT 'Table QuestionOptions created successfully.';
END

GO

-- Create Submissions Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Submissions')
BEGIN
    CREATE TABLE Submissions (
        SubmissionID INT PRIMARY KEY IDENTITY(1,1),
        TestID INT NOT NULL,
        SubjectID INT NOT NULL,
        StudentIdentifier NVARCHAR(100) NULL,
        TotalQuestions INT NOT NULL CHECK (TotalQuestions >= 0),
        AnsweredQuestions INT NOT NULL CHECK (AnsweredQuestions >= 0),
        SubmittedAt DATETIME DEFAULT GETUTCDATE(),
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (TestID) REFERENCES Tests(TestID) ON DELETE CASCADE,
        FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID) ON DELETE NO ACTION
    );
    PRINT 'Table Submissions created successfully.';
END

GO

-- Create SubmissionAnswers Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SubmissionAnswers')
BEGIN
    CREATE TABLE SubmissionAnswers (
        SubmissionAnswerID INT PRIMARY KEY IDENTITY(1,1),
        SubmissionID INT NOT NULL,
        QuestionID INT NOT NULL,
        SelectedOptionIndex INT NOT NULL,
        IsValidOption BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (SubmissionID) REFERENCES Submissions(SubmissionID) ON DELETE CASCADE,
        FOREIGN KEY (QuestionID) REFERENCES Questions(QuestionID) ON DELETE NO ACTION,
        CONSTRAINT UC_Submission_Question UNIQUE(SubmissionID, QuestionID)
    );
    PRINT 'Table SubmissionAnswers created successfully.';
END

GO

-- Create Indexes for better query performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Tests_SubjectID')
    CREATE INDEX IDX_Tests_SubjectID ON Tests(SubjectID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_TrimesterSubjects_TrimesterID')
    CREATE INDEX IDX_TrimesterSubjects_TrimesterID ON TrimesterSubjects(TrimesterID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_TrimesterSubjects_SubjectID')
    CREATE INDEX IDX_TrimesterSubjects_SubjectID ON TrimesterSubjects(SubjectID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Questions_TestID')
    CREATE INDEX IDX_Questions_TestID ON Questions(TestID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_CourseContents_SubjectID')
    CREATE INDEX IDX_CourseContents_SubjectID ON CourseContents(SubjectID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_StudyMaterials_SubjectID')
    CREATE INDEX IDX_StudyMaterials_SubjectID ON StudyMaterials(SubjectID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_QuestionOptions_QuestionID')
    CREATE INDEX IDX_QuestionOptions_QuestionID ON QuestionOptions(QuestionID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Submissions_TestID')
    CREATE INDEX IDX_Submissions_TestID ON Submissions(TestID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_SubmissionAnswers_SubmissionID')
    CREATE INDEX IDX_SubmissionAnswers_SubmissionID ON SubmissionAnswers(SubmissionID);

PRINT 'Indexes created successfully.';

GO

-- Verify Tables
SELECT 'Database setup completed successfully!' AS [Status];
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' ORDER BY TABLE_NAME;
