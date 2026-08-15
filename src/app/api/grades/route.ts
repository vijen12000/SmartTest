import { NextResponse } from 'next/server';

type GradeEntryInput = {
  id?: string;
  type?: 'PT' | 'NPT';
  number?: number;
  maxMarks?: number;
  obtainedMarks?: number;
};

type GradeRequest = {
  studentName?: string;
  trimester?: string;
  entries?: GradeEntryInput[];
};

const clampNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
};

const calculatePercent = (maxMarks: number, obtainedMarks: number) => {
  const safeMax = clampNumber(maxMarks);
  const safeObtained = clampNumber(obtainedMarks);

  if (safeMax <= 0) {
    return 0;
  }

  return (safeObtained / safeMax) * 100;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GradeRequest;
    const entries = Array.isArray(body.entries) ? body.entries : [];

    if (!entries.length) {
      return NextResponse.json({ error: 'No grade entries provided.' }, { status: 400 });
    }

    const ptScores = entries
      .filter((entry) => entry.type === 'PT')
      .map((entry) => calculatePercent(Number(entry.maxMarks || 0), Number(entry.obtainedMarks || 0)))
      .sort((left, right) => right - left)
      .slice(0, 5);

    const nptScores = entries
      .filter((entry) => entry.type === 'NPT')
      .map((entry) => calculatePercent(Number(entry.maxMarks || 0), Number(entry.obtainedMarks || 0)))
      .sort((left, right) => right - left)
      .slice(0, 5);

    const ptAverage = ptScores.length ? ptScores.reduce((sum, value) => sum + value, 0) / ptScores.length : 0;
    const nptAverage = nptScores.length ? nptScores.reduce((sum, value) => sum + value, 0) / nptScores.length : 0;
    const total = ptAverage * 0.9 + nptAverage * 0.1;

    return NextResponse.json({
      studentName: body.studentName || 'Student',
      trimester: body.trimester || 'Trimester 1',
      ptAverage,
      nptAverage,
      total,
      ptBestFive: ptScores,
      nptBestFive: nptScores,
      entryCount: entries.length,
    });
  } catch (error) {
    console.error('Grade API error:', error);
    return NextResponse.json({ error: 'Unable to calculate grade.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Grade calculation endpoint is ready.',
    weight: {
      proctored: 90,
      nonProctored: 10,
    },
    bestScores: {
      proctored: 5,
      nonProctored: 5,
    },
  });
}
