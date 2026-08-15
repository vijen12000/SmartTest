-- SmartStudy Catalog Seed Script
-- Seeds 12 trimesters, syllabus-based subjects, and PT/NPT test navigation

USE SmartStudyDB;

GO

-- Trimesters (1 to 12)
;WITH TrimesterNumbers AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM TrimesterNumbers WHERE n < 12
)
INSERT INTO Trimesters (TrimesterCode, TrimesterName, TrimesterOrder)
SELECT
  CONCAT('trimester-', n),
  CONCAT('Trimester ', n),
  n
FROM TrimesterNumbers tn
WHERE NOT EXISTS (
  SELECT 1 FROM Trimesters tr WHERE tr.TrimesterCode = CONCAT('trimester-', tn.n)
)
OPTION (MAXRECURSION 12);

GO

-- IITG syllabus subjects (core + selected electives)
IF OBJECT_ID('tempdb..#SyllabusSubjects') IS NOT NULL
  DROP TABLE #SyllabusSubjects;

CREATE TABLE #SyllabusSubjects (
  SubjectCode NVARCHAR(50),
  SubjectName NVARCHAR(255),
  Seq INT
);

INSERT INTO #SyllabusSubjects (SubjectCode, SubjectName, Seq)
VALUES
  ('da101', 'DA101 Basic English', 1),
  ('da102', 'DA102 Data Analysis Basics', 2),
  ('da103', 'DA103 Statistics', 3),
  ('da104', 'DA104 C Programming', 4),
  ('da-105-linear-algebra', 'DA105 Linear Algebra', 5),
  ('da106', 'DA106 Data Science', 6),
  ('da107', 'DA107 Computer System Tools', 7),
  ('da108', 'DA108 Python Programming', 8),
  ('da109', 'DA109 AI Basics', 9),
  ('da110', 'DA110 Data Structures', 10),
  ('da111', 'DA111 Algorithm Design', 11),
  ('da112', 'DA112 Introduction to R', 12),
  ('da201', 'DA201 RDBMS', 13),
  ('da202', 'DA202 Java', 14),
  ('da203', 'DA203 Optimization', 15),
  ('da204', 'DA204 Basic Econometrics', 16),
  ('da205', 'DA205 Data Mining and Warehousing', 17),
  ('da206', 'DA206 Statistical Inferencing', 18),
  ('da207', 'DA207 Signals and Systems', 19),
  ('da208', 'DA208 Social Media Tools and Techniques', 20),
  ('da209', 'DA209 Data Modeling and Visualization', 21),
  ('da210', 'DA210 Time Series Analysis and Forecasting', 22),
  ('da261', 'DA261 Machine Learning Fundamentals', 23),
  ('da262', 'DA262 Recommender Systems', 24),
  ('da301', 'DA301 Cloud Computing', 25),
  ('da302', 'DA302 Deep Learning Essentials', 26),
  ('da326', 'DA326 Deep Learning for Computer Vision', 27),
  ('da354', 'DA354 AI based Wireless Communication Systems', 28),
  ('da361', 'DA361 Financial Valuation and Portfolio Analytics', 29),
  ('dao3021', 'DAO3021 Hardware-Aware Deep Learning', 30),
  ('dao3062', 'DAO3062 Data Driven Digital Manufacturing', 31),
  ('dao3063', 'DAO3063 Leadership Essentials', 32);

INSERT INTO Subjects (SubjectCode, SubjectName)
SELECT s.SubjectCode, s.SubjectName
FROM #SyllabusSubjects s
WHERE NOT EXISTS (
  SELECT 1 FROM Subjects dbs WHERE dbs.SubjectCode = s.SubjectCode
);

GO

-- Ensure each subject has PT-1..PT-6 and NPT-1..NPT-6
;WITH SubjectRows AS (
  SELECT SubjectID FROM Subjects
), TestNumbers AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM TestNumbers WHERE n < 6
)
INSERT INTO Tests (SubjectID, TestCode, TestTitle, TestType)
SELECT sr.SubjectID,
       CONCAT('pt-', tn.n),
       CONCAT('PT-', tn.n),
       'Proctored'
FROM SubjectRows sr
CROSS JOIN TestNumbers tn
WHERE NOT EXISTS (
  SELECT 1
  FROM Tests t
  WHERE t.SubjectID = sr.SubjectID
    AND t.TestCode = CONCAT('pt-', tn.n)
    AND t.TestType = 'Proctored'
)
OPTION (MAXRECURSION 6);

;WITH SubjectRows AS (
  SELECT SubjectID FROM Subjects
), TestNumbers AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM TestNumbers WHERE n < 6
)
INSERT INTO Tests (SubjectID, TestCode, TestTitle, TestType)
SELECT sr.SubjectID,
       CONCAT('npt-', tn.n),
       CONCAT('NPT-', tn.n),
       'NonProctored'
FROM SubjectRows sr
CROSS JOIN TestNumbers tn
WHERE NOT EXISTS (
  SELECT 1
  FROM Tests t
  WHERE t.SubjectID = sr.SubjectID
    AND t.TestCode = CONCAT('npt-', tn.n)
    AND t.TestType = 'NonProctored'
)
OPTION (MAXRECURSION 6);

GO

-- Map 4 subjects to each trimester using round-robin over syllabus list
;WITH SlotGrid AS (
  SELECT tr.TrimesterID,
         tr.TrimesterOrder,
         so.SubjectOrder,
         (((tr.TrimesterOrder - 1) * 4 + (so.SubjectOrder - 1)) % 32) + 1 AS SubjectSeq
  FROM Trimesters tr
  CROSS JOIN (VALUES (1), (2), (3), (4)) so(SubjectOrder)
), SyllabusSubjects AS (
  SELECT s.SubjectID, ss.Seq
  FROM Subjects s
  JOIN #SyllabusSubjects ss ON ss.SubjectCode = s.SubjectCode
)
INSERT INTO TrimesterSubjects (TrimesterID, SubjectID, SubjectOrder)
SELECT sg.TrimesterID, sy.SubjectID, sg.SubjectOrder
FROM SlotGrid sg
JOIN SyllabusSubjects sy ON sy.Seq = sg.SubjectSeq
WHERE NOT EXISTS (
  SELECT 1
  FROM TrimesterSubjects ts
  WHERE ts.TrimesterID = sg.TrimesterID
    AND ts.SubjectID = sy.SubjectID
);

GO

SELECT 'Catalog seed completed successfully!' AS [Status];
SELECT COUNT(*) AS TotalTrimesters FROM Trimesters;
SELECT COUNT(*) AS TotalSubjects FROM Subjects;
SELECT COUNT(*) AS TotalMappings FROM TrimesterSubjects;

IF OBJECT_ID('tempdb..#SyllabusSubjects') IS NOT NULL
  DROP TABLE #SyllabusSubjects;
