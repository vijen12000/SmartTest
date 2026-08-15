USE SmartStudyDB;
GO

BEGIN TRANSACTION;

UPDATE Subjects
SET SubjectName = 'DA103 Statistics'
WHERE SubjectCode = 'da103';

UPDATE Subjects
SET SubjectName = 'DA106 Data Science'
WHERE SubjectCode = 'da106';

UPDATE Subjects
SET SubjectName = 'DA111 Algorithm Design'
WHERE SubjectCode = 'da111';

UPDATE Subjects
SET SubjectName = 'DA201 RDBMS'
WHERE SubjectCode = 'da201';

UPDATE Subjects
SET SubjectName = 'DA202 Java'
WHERE SubjectCode = 'da202';

COMMIT TRANSACTION;
GO

SELECT SubjectCode, SubjectName
FROM Subjects
WHERE SubjectCode IN ('da103', 'da106', 'da111', 'da201', 'da202')
ORDER BY SubjectCode;
GO
