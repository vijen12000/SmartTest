'use client';

import { useEffect, useMemo, useState } from 'react';

type TestType = 'PT' | 'NPT';

type GradeEntry = {
  id: string;
  subject: string;
  type: TestType;
  number: number;
  maxMarks: number;
  obtainedMarks: number;
};

type GradeComputation = {
  ptAverage: number;
  nptAverage: number;
  total: number;
  ptBestFive: number[];
  nptBestFive: number[];
};

type TrimesterSnapshot = {
  trimester: string;
  subject: string;
  total: number;
  ptAverage: number;
  nptAverage: number;
};

const STORAGE_KEY = 'smartstudy-grade-module-v1';
const HISTORY_KEY = 'smartstudy-grade-history-v1';
const TEMPLATE_KEY_PREFIX = 'smartstudy-grade-template';
const DEFAULT_SUBJECTS = [
  'DA101 Basic English',
  'DA103 Statistics',
  'DA105 Linear Algebra',
  'DA106 Data Science',
  'DA111 Algorithm Design',
  'DA201 RDBMS',
  'DA202 Java',
];

const sanitizeKeyPart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'student';

const getTemplateKey = (trimester: string, subject: string) =>
  `${TEMPLATE_KEY_PREFIX}-${sanitizeKeyPart(trimester)}-${sanitizeKeyPart(subject)}`;
const getStudentKey = (trimester: string, studentName: string, subject: string) =>
  `smartstudy-grade-student-${sanitizeKeyPart(trimester)}-${sanitizeKeyPart(studentName)}-${sanitizeKeyPart(subject)}`;
const getStudentMaxMarksKey = (trimester: string, studentName: string, subject: string) =>
  `smartstudy-grade-max-${sanitizeKeyPart(trimester)}-${sanitizeKeyPart(studentName)}-${sanitizeKeyPart(subject)}`;
const getStudentObtainedMarksKey = (trimester: string, studentName: string, subject: string) =>
  `smartstudy-grade-obtained-${sanitizeKeyPart(trimester)}-${sanitizeKeyPart(studentName)}-${sanitizeKeyPart(subject)}`;

const createDefaultEntries = (
  subjectName = 'DA101',
  maxMarksTemplate?: { pt: number[]; npt: number[] },
  obtainedMarksTemplate?: { pt: number[]; npt: number[] }
): GradeEntry[] => {
  const ptMarks = maxMarksTemplate?.pt ?? Array.from({ length: 6 }, () => 100);
  const nptMarks = maxMarksTemplate?.npt ?? Array.from({ length: 6 }, () => 100);
  const ptObtainedMarks = obtainedMarksTemplate?.pt ?? Array.from({ length: 6 }, () => 0);
  const nptObtainedMarks = obtainedMarksTemplate?.npt ?? Array.from({ length: 6 }, () => 0);

  const ptEntries = Array.from({ length: 6 }, (_, index) => ({
    id: `pt-${index + 1}`,
    subject: subjectName,
    type: 'PT' as const,
    number: index + 1,
    maxMarks: clampNumber(ptMarks[index] ?? 100),
    obtainedMarks: clampNumber(ptObtainedMarks[index] ?? 0),
  }));

  const nptEntries = Array.from({ length: 6 }, (_, index) => ({
    id: `npt-${index + 1}`,
    subject: subjectName,
    type: 'NPT' as const,
    number: index + 1,
    maxMarks: clampNumber(nptMarks[index] ?? 100),
    obtainedMarks: clampNumber(nptObtainedMarks[index] ?? 0),
  }));

  return [...ptEntries, ...nptEntries];
};

const clampNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
};

const percentForEntry = (entry: GradeEntry) => {
  const maxMarks = clampNumber(entry.maxMarks);
  const obtainedMarks = clampNumber(entry.obtainedMarks);

  if (maxMarks <= 0) {
    return 0;
  }

  return (obtainedMarks / maxMarks) * 100;
};

const calculateGrade = (entries: GradeEntry[]): GradeComputation => {
  const ptScores = entries
    .filter((entry) => entry.type === 'PT')
    .map(percentForEntry)
    .sort((left, right) => right - left)
    .slice(0, 5);

  const nptScores = entries
    .filter((entry) => entry.type === 'NPT')
    .map(percentForEntry)
    .sort((left, right) => right - left)
    .slice(0, 5);

  const ptAverage = ptScores.length ? ptScores.reduce((sum, value) => sum + value, 0) / ptScores.length : 0;
  const nptAverage = nptScores.length ? nptScores.reduce((sum, value) => sum + value, 0) / nptScores.length : 0;
  const total = ptAverage * 0.9 + nptAverage * 0.1;

  return {
    ptAverage,
    nptAverage,
    total,
    ptBestFive: ptScores,
    nptBestFive: nptScores,
  };
};

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

type GradeModuleProps = {
  initialTrimester?: string;
  initialSubject?: string;
  onSubjectChange?: (subject: string) => void;
  onTrimesterChange?: (trimester: string) => void;
};

export function GradeModule({
  initialTrimester = 'Trimester 1',
  initialSubject = DEFAULT_SUBJECTS[0],
  onSubjectChange,
  onTrimesterChange,
}: GradeModuleProps) {
  const [entries, setEntries] = useState<GradeEntry[]>(() => createDefaultEntries(initialSubject));
  const [studentName, setStudentName] = useState('Student');
  const [trimester, setTrimester] = useState(initialTrimester);
  const [subject, setSubject] = useState(initialSubject);
  const [status, setStatus] = useState<string | null>(null);
  const [history, setHistory] = useState<TrimesterSnapshot[]>([]);

  useEffect(() => {
    setTrimester(initialTrimester);
  }, [initialTrimester]);

  useEffect(() => {
    setSubject(initialSubject);
  }, [initialSubject]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { studentName?: string; trimester?: string; subject?: string; entries?: GradeEntry[] };
        if (parsed.entries?.length) {
          setEntries(parsed.entries);
        }
        if (parsed.studentName) {
          setStudentName(parsed.studentName);
        }
        if (parsed.trimester) {
          setTrimester(parsed.trimester);
        }
        if (parsed.subject && DEFAULT_SUBJECTS.includes(parsed.subject)) {
          setSubject(parsed.subject);
        }
      } catch {
        // Ignore invalid local storage state.
      }
    }

    const savedHistory = window.localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory) as TrimesterSnapshot[];
        if (Array.isArray(parsedHistory)) {
          setHistory(parsedHistory);
        }
      } catch {
        // Ignore invalid history state.
      }
    }
  }, []);

  useEffect(() => {
    const trimmedStudent = studentName.trim() || 'Student';
    const templateKey = getTemplateKey(trimester, subject);
    const studentKey = getStudentKey(trimester, trimmedStudent, subject);
    const maxMarksKey = getStudentMaxMarksKey(trimester, trimmedStudent, subject);
    const obtainedMarksKey = getStudentObtainedMarksKey(trimester, trimmedStudent, subject);
    const savedStudentData = window.localStorage.getItem(studentKey);
    const savedTemplate = window.localStorage.getItem(templateKey);
    const savedMaxMarks = window.localStorage.getItem(maxMarksKey);
    const savedObtainedMarks = window.localStorage.getItem(obtainedMarksKey);

    let nextEntries = createDefaultEntries(subject);

    try {
      if (savedStudentData) {
        const parsedStudent = JSON.parse(savedStudentData) as GradeEntry[];
        if (Array.isArray(parsedStudent) && parsedStudent.length) {
          nextEntries = parsedStudent.map((entry) => ({
            ...entry,
            subject,
          }));
        }
      } else if (savedMaxMarks || savedObtainedMarks) {
        const maxMarks = savedMaxMarks ? (JSON.parse(savedMaxMarks) as { pt?: number[]; npt?: number[] }) : null;
        const obtainedMarks = savedObtainedMarks ? (JSON.parse(savedObtainedMarks) as { pt?: number[]; npt?: number[] }) : null;
        nextEntries = createDefaultEntries(subject, {
          pt: maxMarks?.pt ?? Array.from({ length: 6 }, () => 100),
          npt: maxMarks?.npt ?? Array.from({ length: 6 }, () => 100),
        }, {
          pt: obtainedMarks?.pt ?? Array.from({ length: 6 }, () => 0),
          npt: obtainedMarks?.npt ?? Array.from({ length: 6 }, () => 0),
        });
      } else if (savedTemplate) {
        const template = JSON.parse(savedTemplate) as { pt?: number[]; npt?: number[] };
        nextEntries = createDefaultEntries(subject, {
          pt: template.pt ?? Array.from({ length: 6 }, () => 100),
          npt: template.npt ?? Array.from({ length: 6 }, () => 100),
        });
      }
    } catch {
      nextEntries = createDefaultEntries(subject);
    }

    setEntries(nextEntries);
    setStatus(null);
  }, [subject, studentName, trimester]);

  useEffect(() => {
    const trimmedStudent = studentName.trim() || 'Student';
    const templateKey = getTemplateKey(trimester, subject);
    const studentKey = getStudentKey(trimester, trimmedStudent, subject);
    const maxMarksKey = getStudentMaxMarksKey(trimester, trimmedStudent, subject);
    const obtainedMarksKey = getStudentObtainedMarksKey(trimester, trimmedStudent, subject);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ studentName: trimmedStudent, trimester, subject, entries }));
    window.localStorage.setItem(studentKey, JSON.stringify(entries));

    const template = {
      pt: entries.filter((entry) => entry.type === 'PT').map((entry) => clampNumber(entry.maxMarks)),
      npt: entries.filter((entry) => entry.type === 'NPT').map((entry) => clampNumber(entry.maxMarks)),
    };

    const obtainedMarks = {
      pt: entries.filter((entry) => entry.type === 'PT').map((entry) => clampNumber(entry.obtainedMarks)),
      npt: entries.filter((entry) => entry.type === 'NPT').map((entry) => clampNumber(entry.obtainedMarks)),
    };

    window.localStorage.setItem(templateKey, JSON.stringify(template));
    window.localStorage.setItem(maxMarksKey, JSON.stringify(template));
    window.localStorage.setItem(obtainedMarksKey, JSON.stringify(obtainedMarks));
  }, [entries, studentName, subject, trimester]);

  useEffect(() => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const result = useMemo(() => calculateGrade(entries), [entries]);

  const dashboardData = useMemo(() => {
    const currentTrimester = {
      trimester,
      subject,
      total: result.total,
      ptAverage: result.ptAverage,
      nptAverage: result.nptAverage,
    };

    const merged = [...history.filter((item) => !(item.trimester === trimester && item.subject === subject)), currentTrimester]
      .sort((left, right) => left.trimester.localeCompare(right.trimester, undefined, { numeric: true }));

    return merged.length ? merged : [currentTrimester];
  }, [history, result.nptAverage, result.ptAverage, result.total, subject, trimester]);

  const markChartData = useMemo(
    () =>
      entries
        .map((entry) => ({
          label: `${entry.type} ${entry.number}`,
          type: entry.type,
          obtained: clampNumber(entry.obtainedMarks),
          max: clampNumber(entry.maxMarks),
          percent: percentForEntry(entry),
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [entries]
  );

  const updateEntry = (id: string, field: 'maxMarks' | 'obtainedMarks', value: string) => {
    const parsed = Number(value);
    const nextValue = Number.isFinite(parsed) ? parsed : 0;

    setEntries((current) =>
      current.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              [field]: clampNumber(nextValue),
            }
          : entry
      )
    );
  };

  const handleTrimesterSelection = (nextTrimester: string) => {
    setTrimester(nextTrimester);
    onTrimesterChange?.(nextTrimester);
  };

  const handleSubjectSelection = (nextSubject: string) => {
    setSubject(nextSubject);
    onSubjectChange?.(nextSubject);
  };

  const resetEntries = () => {
    const templateKey = getTemplateKey(trimester, subject);
    const savedTemplate = window.localStorage.getItem(templateKey);
    const parsedTemplate = savedTemplate ? JSON.parse(savedTemplate) as { pt?: number[]; npt?: number[] } : null;
    const nextEntries = createDefaultEntries(
      subject,
      {
        pt: parsedTemplate?.pt ?? Array.from({ length: 6 }, () => 100),
        npt: parsedTemplate?.npt ?? Array.from({ length: 6 }, () => 100),
      },
      {
        pt: Array.from({ length: 6 }, () => 0),
        npt: Array.from({ length: 6 }, () => 0),
      }
    );

    setEntries(nextEntries);
    setStatus('Grade form reset.');
  };

  const handleSave = async () => {
    setStatus('Saving grade calculation...');

    const snapshot: TrimesterSnapshot = {
      trimester,
      subject,
      total: result.total,
      ptAverage: result.ptAverage,
      nptAverage: result.nptAverage,
    };

    const trimmedStudent = studentName.trim() || 'Student';
    const studentKey = getStudentKey(trimester, trimmedStudent, subject);
    const maxMarksKey = getStudentMaxMarksKey(trimester, trimmedStudent, subject);
    const obtainedMarksKey = getStudentObtainedMarksKey(trimester, trimmedStudent, subject);

    window.localStorage.setItem(studentKey, JSON.stringify(entries));
    window.localStorage.setItem(maxMarksKey, JSON.stringify({
      pt: entries.filter((entry) => entry.type === 'PT').map((entry) => clampNumber(entry.maxMarks)),
      npt: entries.filter((entry) => entry.type === 'NPT').map((entry) => clampNumber(entry.maxMarks)),
    }));
    window.localStorage.setItem(obtainedMarksKey, JSON.stringify({
      pt: entries.filter((entry) => entry.type === 'PT').map((entry) => clampNumber(entry.obtainedMarks)),
      npt: entries.filter((entry) => entry.type === 'NPT').map((entry) => clampNumber(entry.obtainedMarks)),
    }));

    setHistory((current) => {
      const filtered = current.filter((item) => !(item.trimester === trimester && item.subject === subject));
      return [...filtered, snapshot].sort((left, right) => left.trimester.localeCompare(right.trimester, undefined, { numeric: true }));
    });

    try {
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentName,
          trimester,
          entries,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save grade data.');
      }

      setStatus(`Saved. Final score: ${formatPercent(payload.total ?? result.total)}.`);
    } catch (error) {
      setStatus((error as Error).message || 'Unable to save grade data.');
    }
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h5 className="mb-0 fw-bold text-primary">Trimester Grade Calculator</h5>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetEntries}>
          Reset
        </button>
      </div>

      <div className="card-body">
        <div className="border rounded p-3 bg-light mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h6 className="mb-0 fw-bold text-primary">Trimester Score Dashboard</h6>
            <span className="small text-muted">Aggregated by trimester</span>
          </div>

          <div className="d-flex align-items-end gap-2" style={{ minHeight: '180px' }}>
            {dashboardData.map((item) => (
              <div key={item.trimester} className="flex-grow-1 text-center">
                <div className="d-flex align-items-end justify-content-center" style={{ height: '140px' }}>
                  <div
                    className="w-100 rounded-top bg-gradient"
                    style={{
                      height: `${Math.max(12, item.total)}%`,
                      minHeight: '12px',
                      background: 'linear-gradient(180deg, #0d6efd 0%, #198754 100%)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)',
                    }}
                    title={`${item.trimester}: ${formatPercent(item.total)}`}
                  />
                </div>
                <div className="small fw-semibold mt-2">{item.trimester.replace('Trimester ', 'T')}</div>
                <div className="small text-muted">{formatPercent(item.total)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label fw-semibold">Student</label>
            <input
              className="form-control"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value || 'Student')}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Trimester</label>
            <select className="form-select" value={trimester} onChange={(event) => handleTrimesterSelection(event.target.value)}>
              <option>Trimester 1</option>
              <option>Trimester 2</option>
              <option>Trimester 3</option>
              <option>Trimester 4</option>
              <option>Trimester 5</option>
              <option>Trimester 6</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Subject</label>
            <select className="form-select" value={subject} onChange={(event) => handleSubjectSelection(event.target.value)}>
              {DEFAULT_SUBJECTS.map((subjectName) => (
                <option key={subjectName} value={subjectName}>
                  {subjectName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border rounded p-3 bg-light mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h6 className="mb-0 fw-bold text-primary">Obtained marks by PT and NPT</h6>
            <span className="small text-muted">{subject}</span>
          </div>

          <div className="d-grid gap-3">
            {markChartData.map((item) => (
              <div key={item.label}>
                <div className="d-flex justify-content-between align-items-center small fw-semibold mb-1">
                  <span>{item.label}</span>
                  <span>
                    {item.obtained}/{item.max} ({formatPercent(item.percent)})
                  </span>
                </div>
                <div className="progress" style={{ height: '12px' }}>
                  <div
                    className={`progress-bar ${item.type === 'PT' ? 'bg-danger' : 'bg-warning'}`}
                    role="progressbar"
                    aria-label={`${item.label} obtained marks`}
                    aria-valuemin={0}
                    aria-valuemax={item.max}
                    aria-valuenow={item.obtained}
                    style={{ width: `${Math.min(100, item.percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="border rounded p-3 bg-light h-100">
              <div className="text-muted small text-uppercase fw-bold">Top 5 PT Average</div>
              <div className="display-6 fw-bold text-danger">{formatPercent(result.ptAverage)}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="border rounded p-3 bg-light h-100">
              <div className="text-muted small text-uppercase fw-bold">Top 5 NPT Average</div>
              <div className="display-6 fw-bold text-warning">{formatPercent(result.nptAverage)}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="border rounded p-3 bg-light h-100">
              <div className="text-muted small text-uppercase fw-bold">Weighted Final</div>
              <div className="display-6 fw-bold text-success">{formatPercent(result.total)}</div>
            </div>
          </div>
        </div>

        <div className="alert alert-light border mb-4">
          <strong>{subject}</strong> marks are tracked separately for this trimester. Max marks and obtained marks are stored per subject and can be reused for each student.
        </div>

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="border rounded p-3">
              <h6 className="fw-bold text-danger mb-3">Proctored Tests (PT) - 90% weight</h6>
              <div className="d-grid gap-3">
                {entries
                  .filter((entry) => entry.type === 'PT')
                  .map((entry) => (
                    <div key={entry.id} className="row g-2 align-items-center">
                      <div className="col-3">
                        <label className="form-label small mb-0">PT {entry.number}</label>
                      </div>
                      <div className="col-4">
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm"
                          value={entry.maxMarks}
                          onChange={(event) => updateEntry(entry.id, 'maxMarks', event.target.value)}
                          placeholder="Max"
                        />
                      </div>
                      <div className="col-5">
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm"
                          value={entry.obtainedMarks}
                          onChange={(event) => updateEntry(entry.id, 'obtainedMarks', event.target.value)}
                          placeholder="Marks"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="border rounded p-3">
              <h6 className="fw-bold text-warning mb-3">Non-Proctored Tests (NPT) - 10% weight</h6>
              <div className="d-grid gap-3">
                {entries
                  .filter((entry) => entry.type === 'NPT')
                  .map((entry) => (
                    <div key={entry.id} className="row g-2 align-items-center">
                      <div className="col-3">
                        <label className="form-label small mb-0">NPT {entry.number}</label>
                      </div>
                      <div className="col-4">
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm"
                          value={entry.maxMarks}
                          onChange={(event) => updateEntry(entry.id, 'maxMarks', event.target.value)}
                          placeholder="Max"
                        />
                      </div>
                      <div className="col-5">
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm"
                          value={entry.obtainedMarks}
                          onChange={(event) => updateEntry(entry.id, 'obtainedMarks', event.target.value)}
                          placeholder="Marks"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="small text-muted">
            Best 5 PT scores for {subject}: {result.ptBestFive.length ? result.ptBestFive.map((score) => formatPercent(score)).join(' • ') : 'N/A'}
            <br />
            Best 5 NPT scores for {subject}: {result.nptBestFive.length ? result.nptBestFive.map((score) => formatPercent(score)).join(' • ') : 'N/A'}
          </div>

          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save grade
          </button>
        </div>

        {status ? <div className="alert alert-info mt-3 mb-0">{status}</div> : null}
      </div>
    </div>
  );
}
