import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getDbPool, withDbRetry } from '@/lib/db';
import { StudyMaterial, SubjectDetails } from '@/lib/types';

type SubjectRow = {
  SubjectCode: string;
  SubjectName: string;
  ContentSummary: string | null;
};

type MaterialRow = {
  StudyMaterialID: number;
  Provider: 'YouTube' | 'Coursera' | 'Other';
  Title: string;
  Url: string;
  ResourceType: string;
  DifficultyLevel: string;
};

export async function GET(request: NextRequest) {
  try {
    const subjectCode = request.nextUrl.searchParams.get('subjectCode');
    if (!subjectCode) {
      return NextResponse.json({ error: 'subjectCode is required' }, { status: 400 });
    }

    const subjectResult = await withDbRetry(async () => {
      const dbPool = await getDbPool();
      return dbPool.request()
        .input('subjectCode', sql.NVarChar(50), subjectCode)
        .query(`
        SELECT TOP 1
          s.SubjectCode,
          s.SubjectName,
          cc.ContentSummary
        FROM Subjects s
        LEFT JOIN CourseContents cc ON cc.SubjectID = s.SubjectID
        WHERE s.SubjectCode = @subjectCode
      `);
    });

    if (subjectResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const subject = subjectResult.recordset[0] as SubjectRow;

    const materialsResult = await withDbRetry(async () => {
      const dbPool = await getDbPool();
      return dbPool.request()
        .input('subjectCode', sql.NVarChar(50), subjectCode)
        .query(`
        SELECT
          sm.StudyMaterialID,
          sm.Provider,
          sm.Title,
          sm.Url,
          sm.ResourceType,
          sm.DifficultyLevel
        FROM StudyMaterials sm
        JOIN Subjects s ON s.SubjectID = sm.SubjectID
        WHERE s.SubjectCode = @subjectCode
        ORDER BY sm.DisplayOrder, sm.StudyMaterialID
      `);
    });

    const studyMaterials = (materialsResult.recordset as MaterialRow[]).map((row) => ({
      id: row.StudyMaterialID,
      provider: row.Provider,
      title: row.Title,
      url: row.Url,
      resourceType: row.ResourceType,
      difficultyLevel: row.DifficultyLevel,
    } satisfies StudyMaterial));

    return NextResponse.json({
      subjectCode: subject.SubjectCode,
      subjectName: subject.SubjectName,
      courseContent: subject.ContentSummary || 'Course content summary not added yet.',
      studyMaterials,
    } satisfies SubjectDetails);
  } catch (error) {
    console.error('Subject details API error:', error);

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
          : 'Failed to load subject details',
      },
      { status: isDbUnavailable ? 503 : 500 }
    );
  }
}
