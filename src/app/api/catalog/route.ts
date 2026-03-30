import { NextResponse } from 'next/server';
import { getDbPool, withDbRetry } from '@/lib/db';
import { QuestionBank, Trimester, Subject, Test } from '@/lib/types';

type CatalogRow = {
  TrimesterCode: string;
  TrimesterName: string;
  TrimesterOrder: number;
  SubjectCode: string;
  SubjectName: string;
  SubjectOrder: number;
  TestCode: string | null;
  TestTitle: string | null;
  TestType: 'Proctored' | 'NonProctored' | null;
};

const emptyCatalog: QuestionBank = { trimesters: [] };

export async function GET() {
  try {
    const result = await withDbRetry(async () => {
      const dbPool = await getDbPool();
      return dbPool.request().query(`
      SELECT
        tr.TrimesterCode,
        tr.TrimesterName,
        tr.TrimesterOrder,
        s.SubjectCode,
        s.SubjectName,
        ts.SubjectOrder,
        t.TestCode,
        t.TestTitle,
        t.TestType
      FROM Trimesters tr
      JOIN TrimesterSubjects ts ON tr.TrimesterID = ts.TrimesterID
      JOIN Subjects s ON ts.SubjectID = s.SubjectID
      LEFT JOIN Tests t ON t.SubjectID = s.SubjectID
      ORDER BY tr.TrimesterOrder, ts.SubjectOrder,
        CASE WHEN t.TestType = 'Proctored' THEN 1 ELSE 2 END,
        t.TestCode
    `);
    });

    const rows = result.recordset as CatalogRow[];
    if (rows.length === 0) {
      return NextResponse.json(emptyCatalog);
    }

    const trimesterMap = new Map<string, Trimester>();

    for (const row of rows) {
      if (!trimesterMap.has(row.TrimesterCode)) {
        trimesterMap.set(row.TrimesterCode, {
          id: row.TrimesterCode,
          name: row.TrimesterName,
          subjects: [],
        });
      }

      const trimester = trimesterMap.get(row.TrimesterCode)!;

      let subject = trimester.subjects.find((item) => item.id === row.SubjectCode);
      if (!subject) {
        subject = {
          id: row.SubjectCode,
          apiCode: row.SubjectCode,
          name: row.SubjectName,
          tests: {
            proctored: [],
            nonProctored: [],
          },
        } satisfies Subject;
        trimester.subjects.push(subject);
      }

      if (row.TestCode && row.TestTitle && row.TestType) {
        const target = row.TestType === 'Proctored' ? subject.tests.proctored : subject.tests.nonProctored;

        if (!target.some((test) => test.id === row.TestCode)) {
          target.push({
            id: row.TestCode,
            title: row.TestTitle,
            questions: [],
          } satisfies Test);
        }
      }
    }

    return NextResponse.json({
      trimesters: Array.from(trimesterMap.values()),
    } satisfies QuestionBank);
  } catch (error) {
    console.error('Catalog API error:', error);

    if (error instanceof Error && error.message.includes("Invalid object name 'Trimesters'")) {
      return NextResponse.json(
        {
          error: 'Catalog tables are missing. Run scripts/01-create-database.sql and scripts/03-seed-catalog.sql.',
          ...emptyCatalog,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to load catalog',
        ...emptyCatalog,
      },
      { status: 500 }
    );
  }
}
