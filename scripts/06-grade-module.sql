USE SmartStudyDB;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GradePolicies')
BEGIN
    CREATE TABLE GradePolicies (
        GradePolicyID INT PRIMARY KEY IDENTITY(1,1),
        TrimesterID INT NOT NULL,
        SubjectID INT NOT NULL,
        PTWeight DECIMAL(5,2) NOT NULL DEFAULT 90.00,
        NPTWeight DECIMAL(5,2) NOT NULL DEFAULT 10.00,
        PTCount INT NOT NULL DEFAULT 6,
        NPTCount INT NOT NULL DEFAULT 6,
        BestPTCount INT NOT NULL DEFAULT 5,
        BestNPTCount INT NOT NULL DEFAULT 5,
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (TrimesterID) REFERENCES Trimesters(TrimesterID) ON DELETE CASCADE,
        FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID) ON DELETE CASCADE,
        CONSTRAINT UC_GradePolicy UNIQUE (TrimesterID, SubjectID)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GradeEntries')
BEGIN
    CREATE TABLE GradeEntries (
        GradeEntryID INT PRIMARY KEY IDENTITY(1,1),
        TrimesterID INT NOT NULL,
        SubjectID INT NOT NULL,
        StudentIdentifier NVARCHAR(100) NOT NULL,
        TestType NVARCHAR(20) NOT NULL CHECK (TestType IN ('PT', 'NPT')),
        TestNumber INT NOT NULL CHECK (TestNumber BETWEEN 1 AND 6),
        MaxMarks DECIMAL(10,2) NOT NULL CHECK (MaxMarks > 0),
        ObtainedMarks DECIMAL(10,2) NOT NULL CHECK (ObtainedMarks >= 0),
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (TrimesterID) REFERENCES Trimesters(TrimesterID) ON DELETE CASCADE,
        FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID) ON DELETE CASCADE,
        CONSTRAINT UC_GradeEntry UNIQUE (TrimesterID, SubjectID, StudentIdentifier, TestType, TestNumber)
    );
END
GO

CREATE OR ALTER VIEW vw_GradeSummary AS
WITH Normalized AS (
    SELECT
        ge.TrimesterID,
        ge.SubjectID,
        ge.StudentIdentifier,
        ge.TestType,
        ge.TestNumber,
        CASE
            WHEN ge.MaxMarks = 0 THEN 0
            ELSE (ge.ObtainedMarks / ge.MaxMarks) * 100
        END AS PercentScore
    FROM GradeEntries ge
),
PTScores AS (
    SELECT
        n.TrimesterID,
        n.SubjectID,
        n.StudentIdentifier,
        n.PercentScore,
        ROW_NUMBER() OVER (
            PARTITION BY n.TrimesterID, n.SubjectID, n.StudentIdentifier
            ORDER BY n.PercentScore DESC, n.TestNumber
        ) AS RankNumber
    FROM Normalized n
    WHERE n.TestType = 'PT'
),
NPTScores AS (
    SELECT
        n.TrimesterID,
        n.SubjectID,
        n.StudentIdentifier,
        n.PercentScore,
        ROW_NUMBER() OVER (
            PARTITION BY n.TrimesterID, n.SubjectID, n.StudentIdentifier
            ORDER BY n.PercentScore DESC, n.TestNumber
        ) AS RankNumber
    FROM Normalized n
    WHERE n.TestType = 'NPT'
),
PTBest AS (
    SELECT
        TrimesterID,
        SubjectID,
        StudentIdentifier,
        AVG(PercentScore) AS PTAverage
    FROM PTScores
    WHERE RankNumber <= 5
    GROUP BY TrimesterID, SubjectID, StudentIdentifier
),
NPTBest AS (
    SELECT
        TrimesterID,
        SubjectID,
        StudentIdentifier,
        AVG(PercentScore) AS NPTAverage
    FROM NPTScores
    WHERE RankNumber <= 5
    GROUP BY TrimesterID, SubjectID, StudentIdentifier
)
SELECT
    tp.TrimesterID,
    tp.SubjectID,
    tp.StudentIdentifier,
    tp.PTAverage,
    np.NPTAverage,
    (tp.PTAverage * 0.90) + (np.NPTAverage * 0.10) AS FinalWeightedScore
FROM PTBest tp
LEFT JOIN NPTBest np
    ON tp.TrimesterID = np.TrimesterID
   AND tp.SubjectID = np.SubjectID
   AND tp.StudentIdentifier = np.StudentIdentifier;
GO

PRINT 'Grade module tables and summary view created successfully.';
GO
