'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Question,
  QuestionBank as QuestionBankType,
  SubjectDetails,
  Trimester,
} from '@/lib/types';
import { QuestionCard } from './QuestionCard';

const emptyCatalog: QuestionBankType = { trimesters: [] };

interface QuestionBankProps {
  defaultTrimesterId?: string;
  defaultSubjectId?: string;
  defaultTestId?: string;
}

export function QuestionBank({
  defaultTrimesterId = 'trimester-2',
  defaultSubjectId = 'da-105-linear-algebra',
  defaultTestId = 'pt-6',
}: QuestionBankProps) {
  const [catalog, setCatalog] = useState<QuestionBankType>(emptyCatalog);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [selectedTrimesterId, setSelectedTrimesterId] = useState(defaultTrimesterId);
  const [selectedSubjectId, setSelectedSubjectId] = useState(defaultSubjectId);
  const [selectedTestId, setSelectedTestId] = useState(defaultTestId);

  const [subjectDetails, setSubjectDetails] = useState<SubjectDetails | null>(null);
  const [subjectDetailsLoading, setSubjectDetailsLoading] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [sidebarHost, setSidebarHost] = useState<HTMLElement | null>(null);
  const [expandedTrimesterIds, setExpandedTrimesterIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSidebarHost(document.getElementById('trimester-sidebar-slot'));
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError(null);

      try {
        const response = await fetch('/api/catalog', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load catalog');
        }

        setCatalog((payload as QuestionBankType) || emptyCatalog);
      } catch (catalogFetchError) {
        if ((catalogFetchError as Error).name === 'AbortError') {
          return;
        }

        setCatalog(emptyCatalog);
        setCatalogError((catalogFetchError as Error).message || 'Failed to load catalog');
      } finally {
        setCatalogLoading(false);
      }
    };

    fetchCatalog();

    return () => {
      controller.abort();
    };
  }, [retryCount]);

  const selectedTrimester = useMemo(
    () => catalog.trimesters.find((trimester) => trimester.id === selectedTrimesterId),
    [catalog.trimesters, selectedTrimesterId]
  );

  const availableSubjects = useMemo(() => selectedTrimester?.subjects || [], [selectedTrimester]);

  const selectedSubject = useMemo(
    () => availableSubjects.find((subject) => subject.id === selectedSubjectId),
    [availableSubjects, selectedSubjectId]
  );

  const selectedSubjectApiCode = selectedSubject?.apiCode || selectedSubject?.id || '';

  const proctoredTests = useMemo(
    () => selectedSubject?.tests.proctored || [],
    [selectedSubject]
  );

  const nonProctoredTests = useMemo(
    () => selectedSubject?.tests.nonProctored || [],
    [selectedSubject]
  );

  const availableTests = useMemo(
    () => [...proctoredTests, ...nonProctoredTests],
    [proctoredTests, nonProctoredTests]
  );

  const selectedTestMeta = useMemo(() => {
    const proctoredMatch = proctoredTests.find((test) => test.id === selectedTestId);
    if (proctoredMatch) {
      return { test: proctoredMatch, type: 'proctored' as const };
    }

    const nonProctoredMatch = nonProctoredTests.find((test) => test.id === selectedTestId);
    if (nonProctoredMatch) {
      return { test: nonProctoredMatch, type: 'nonProctored' as const };
    }

    return null;
  }, [proctoredTests, nonProctoredTests, selectedTestId]);

  const selectedTest = selectedTestMeta?.test;
  const selectedTestType = selectedTestMeta?.type;

  useEffect(() => {
    if (!catalog.trimesters.length) {
      setSelectedTrimesterId('');
      return;
    }

    if (!catalog.trimesters.some((trimester) => trimester.id === selectedTrimesterId)) {
      setSelectedTrimesterId(catalog.trimesters[0].id);
      setSelectedSubjectId('');
      setSelectedTestId('');
    }
  }, [catalog.trimesters, selectedTrimesterId]);

  useEffect(() => {
    if (!availableSubjects.length) {
      setSelectedSubjectId('');
      setSubjectDetails(null);
      return;
    }

    if (!availableSubjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(availableSubjects[0].id);
      setSelectedTestId('');
    }
  }, [availableSubjects, selectedSubjectId]);

  useEffect(() => {
    if (!availableTests.length) {
      setSelectedTestId('');
      return;
    }

    if (!availableTests.some((test) => test.id === selectedTestId)) {
      setSelectedTestId('');
    }
  }, [availableTests, selectedTestId]);

  useEffect(() => {
    if (!selectedSubjectApiCode) {
      setSubjectDetails(null);
      return;
    }

    const controller = new AbortController();

    const fetchSubjectDetails = async () => {
      setSubjectDetailsLoading(true);

      try {
        const response = await fetch(
          `/api/subject-details?subjectCode=${encodeURIComponent(selectedSubjectApiCode)}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          }
        );

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load subject details');
        }

        setSubjectDetails(payload as SubjectDetails);
      } catch (detailsError) {
        if ((detailsError as Error).name === 'AbortError') {
          return;
        }

        setSubjectDetails({
          subjectCode: selectedSubjectApiCode,
          subjectName: selectedSubject?.name || selectedSubjectApiCode,
          courseContent: 'Course content summary not added yet.',
          studyMaterials: [],
        });
      } finally {
        setSubjectDetailsLoading(false);
      }
    };

    fetchSubjectDetails();

    return () => {
      controller.abort();
    };
  }, [selectedSubjectApiCode, selectedSubject?.name]);

  useEffect(() => {
    if (!selectedSubjectApiCode || !selectedTestId) {
      setQuestions([]);
      setAnswers({});
      return;
    }

    const controller = new AbortController();

    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      setSubmitMessage(null);

      try {
        const response = await fetch(
          `/api/questions?testCode=${encodeURIComponent(selectedTestId)}&subjectCode=${encodeURIComponent(selectedSubjectApiCode)}`,
          {
            method: 'GET',
            signal: controller.signal,
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || `Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const nextQuestions: Question[] = payload.questions || [];
        setQuestions(nextQuestions);
        setAnswers({});
      } catch (fetchError) {
        if ((fetchError as Error).name === 'AbortError') {
          return;
        }

        setQuestions([]);
        setError((fetchError as Error).message || 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();

    return () => {
      controller.abort();
    };
  }, [selectedSubjectApiCode, selectedTestId, retryCount]);

  const handleTrimesterChange = (trimesterId: string) => {
    setSelectedTrimesterId(trimesterId);
    setSelectedSubjectId('');
    setSelectedTestId('');
    setQuestions([]);
    setAnswers({});
    setSubmitMessage(null);
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedTestId('');
  };

  const handleTestChange = (testId: string) => {
    setSelectedTestId(testId);
    setSubmitMessage(null);
    setError(null);
  };

  const handleBackToTests = () => {
    setSelectedTestId('');
    setQuestions([]);
    setAnswers({});
    setSubmitMessage(null);
    setError(null);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionIndex,
    }));
    setSubmitMessage(null);
  };

  const handleRetry = () => {
    setRetryCount((current) => current + 1);
  };

  const toggleTrimester = (trimesterId: string) => {
    setExpandedTrimesterIds((current) => ({
      ...current,
      [trimesterId]: !current[trimesterId],
    }));
  };

  const handleSidebarSubjectSelect = (trimesterId: string, subjectId: string) => {
    setSelectedTrimesterId(trimesterId);
    setSelectedSubjectId(subjectId);
    setSelectedTestId('');
    setQuestions([]);
    setAnswers({});
    setSubmitMessage(null);
    setExpandedTrimesterIds((current) => ({
      ...current,
      [trimesterId]: true,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedSubjectApiCode || !selectedTestId || !questions.length) {
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testCode: selectedTestId,
          subjectCode: selectedSubjectApiCode,
          answers,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || `Submission failed with status ${response.status}`);
      }

      setSubmitMessage(payload.message || 'Answers submitted successfully.');
    } catch (submitError) {
      setSubmitMessage((submitError as Error).message || 'Failed to submit answers.');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const courseContentText = subjectDetails?.courseContent || 'Course content summary not added yet.';
  const courseContentItems = courseContentText
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);

  const totalSubjects = catalog.trimesters.reduce(
    (count, trimester: Trimester) => count + trimester.subjects.length,
    0
  );
  const totalTests = catalog.trimesters.reduce(
    (count, trimester) =>
      count +
      trimester.subjects.reduce(
        (subjectCount, subject) =>
          subjectCount +
          (subject.tests.proctored?.length || 0) +
          (subject.tests.nonProctored?.length || 0),
        0
      ),
    0
  );
  const headerTitle = selectedSubject?.name || 'Select a Subject';
  const isQuestionView = Boolean(selectedTest);
  const selectedTestNumber = selectedTest?.title.match(/\d+/)?.[0];
  const selectedTestHeading = selectedTestType
    ? `${selectedTestType === 'proctored' ? 'PT' : 'NPT'}${selectedTestNumber ? ` ${selectedTestNumber}` : ''}`
    : selectedTest?.title || 'Test';

  const formatTrimesterLabel = (trimester: Trimester) => {
    const numberFromId = trimester.id.replace('trimester-', '');
    return `Trimester - ${numberFromId}`;
  };

  const trimesterNav = (
    <>
      {catalogLoading ? (
        <li className="nav-item">
          <span className="nav-link text-white-50">Loading trimesters...</span>
        </li>
      ) : (
        catalog.trimesters.map((trimester) => (
          <li key={trimester.id} className="nav-item">
            <a
              className={`nav-link d-flex justify-content-between align-items-center ${selectedTrimesterId === trimester.id ? 'active' : ''}`}
              href="#"
              role="button"
              onClick={(event) => {
                event.preventDefault();
                handleTrimesterChange(trimester.id);
                setExpandedTrimesterIds((current) => ({
                  ...current,
                  [trimester.id]: true,
                }));
              }}
            >
              <span>
                <i className="fas fa-fw fa-book me-2" aria-hidden="true"></i>
                {formatTrimesterLabel(trimester)}
              </span>
              <span
                className="trimester-toggle-icon"
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  toggleTrimester(trimester.id);
                }}
                role="button"
                aria-label={expandedTrimesterIds[trimester.id] ? 'Collapse trimester' : 'Expand trimester'}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleTrimester(trimester.id);
                  }
                }}
              >
                <i className={`fas fa-chevron-${expandedTrimesterIds[trimester.id] ? 'down' : 'right'} small`}></i>
              </span>
            </a>

            {expandedTrimesterIds[trimester.id] ? (
              <div className="collapse show">
                <div className="bg-white py-2 collapse-inner rounded">
                <h6 className="collapse-header">Subjects:</h6>
                {trimester.subjects.map((subject) => (
                  <a
                    key={subject.id}
                    className={`collapse-item trimester-subject-item ${selectedSubjectId === subject.id ? 'active' : ''}`}
                    href="#"
                    role="button"
                    onClick={(event) => {
                      event.preventDefault();
                      handleSidebarSubjectSelect(trimester.id, subject.id);
                    }}
                  >
                    {subject.name}
                  </a>
                ))}
                </div>
              </div>
            ) : null}
          </li>
        ))
      )}
    </>
  );

  return (
    <div>
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 mb-1 text-gray-800 fw-bold">{headerTitle}</h1>
        </div>
      </div>

      {sidebarHost ? createPortal(trimesterNav, sidebarHost) : null}

      {catalogError ? (
        <div className="alert alert-danger d-flex flex-column gap-2">
          <span>{catalogError}</span>
          <div>
            <button type="button" onClick={handleRetry} className="btn btn-danger btn-sm">
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <div>
          {isQuestionView ? (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header py-3 d-flex justify-content-between align-items-center">
                <h6 className="m-0 fw-bold text-primary">{selectedTestHeading}</h6>
                <button type="button" onClick={handleBackToTests} className="btn btn-outline-secondary btn-sm">
                  Back
                </button>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="alert alert-primary mb-0">Loading questions...</div>
                ) : error ? (
                  <div className="alert alert-danger d-flex justify-content-between align-items-center flex-wrap gap-2 mb-0">
                    <span>{error}</span>
                    <button type="button" onClick={handleRetry} className="btn btn-danger btn-sm">
                      Retry
                    </button>
                  </div>
                ) : questions.length > 0 ? (
                  <div className="d-grid gap-3">
                    {questions.map((question, index) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        index={index}
                        selectedOptionIndex={answers[question.id] ?? null}
                        onSelectOption={handleSelectOption}
                        disabled={submitting}
                      />
                    ))}

                    <div className="card shadow-sm border-0">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                          <p className="mb-0 text-gray-700">
                            Answered {answeredCount} of {questions.length} questions
                          </p>
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting || answeredCount === 0}
                            className="btn btn-primary"
                          >
                            {submitting ? 'Submitting...' : 'Check Answers'}
                          </button>
                        </div>

                        {submitMessage ? <p className="text-gray-700 mb-0">{submitMessage}</p> : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-secondary d-flex justify-content-between align-items-center flex-wrap gap-2 mb-0">
                    <span>No questions available for this test.</span>
                    <button type="button" onClick={handleRetry} className="btn btn-dark btn-sm">
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : selectedSubject ? (
            <>
              <div className="row">
                <div className="col-lg-6 mb-4 d-flex">
                  <div className="card shadow w-100">
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">Course Content</h6>
                    </div>
                    <div className="card-body" style={{ color: 'rgb(133, 135, 150)' }}>
                      {subjectDetailsLoading ? (
                        <p className="text-muted mb-0">Loading course content...</p>
                      ) : courseContentItems.length > 1 ? (
                        <ul className="mb-0">
                          {courseContentItems.map((item, index) => (
                            <li key={`${selectedSubjectApiCode}-content-${index}`} className="mb-1 text-gray-800">{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mb-0 text-gray-800">{courseContentText}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-lg-6 mb-4 d-flex">
                  <div className="card shadow w-100">
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">Suggested Study Material</h6>
                    </div>
                    <div className="card-body" style={{ color: 'rgb(133, 135, 150)' }}>
                      {subjectDetailsLoading ? (
                        <p className="text-muted mb-0">Loading study materials...</p>
                      ) : subjectDetails?.studyMaterials.length ? (
                        <div className="row g-3 mt-1">
                          {subjectDetails.studyMaterials.map((material) => (
                            <div key={material.id} className="col-md-6">
                              <a
                                href={material.url}
                                target="_blank"
                                rel="noreferrer"
                                className="card h-100 text-decoration-none material-card"
                              >
                                <div className="card-body">
                                  <p className="fw-semibold text-gray-800 mb-1">{material.title}</p>
                                  <p className="text-muted small mb-0">
                                    {material.provider} • {material.resourceType} • {material.difficultyLevel}
                                  </p>
                                </div>
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted mb-0">No mapped study material yet for this subject.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-6 mb-4 d-flex">
                  <div className="card shadow mb-4 w-100">
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">Proctored Tests</h6>
                    </div>
                    <div className="card-body">
                      {proctoredTests.length ? (
                        <>
                          {proctoredTests.map((test, index) => {
                            const progressValue = Math.round(((index + 1) / proctoredTests.length) * 100);
                            const progressClasses = ['bg-danger', 'bg-warning', '', 'bg-info', 'bg-success'];
                            const progressBarClass = progressClasses[index % progressClasses.length];

                            return (
                              <button
                                key={test.id}
                                type="button"
                                onClick={() => handleTestChange(test.id)}
                                className="w-100 text-start border-0 bg-transparent p-0 mb-4"
                                style={{ color: 'rgb(133, 135, 150)' }}
                              >
                                <h4 className="small font-weight-bold mb-2">
                                  {test.title}
                                  <span className="float-end">{progressValue}%</span>
                                </h4>
                                <div className="progress">
                                  <div
                                    className={`progress-bar ${progressBarClass}`}
                                    role="progressbar"
                                    style={{ width: `${progressValue}%` }}
                                    aria-valuenow={progressValue}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                  ></div>
                                </div>
                              </button>
                            );
                          })}
                        </>
                      ) : (
                        <p className="text-muted mb-0">No proctored tests available.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-lg-6 mb-4 d-flex">
                  <div className="card shadow mb-4 w-100">
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">Non-Proctored Tests</h6>
                    </div>
                    <div className="card-body">
                      {nonProctoredTests.length ? (
                        <>
                          {nonProctoredTests.map((test, index) => {
                            const progressValue = Math.round(((index + 1) / nonProctoredTests.length) * 100);
                            const progressClasses = ['bg-danger', 'bg-warning', '', 'bg-info', 'bg-success'];
                            const progressBarClass = progressClasses[index % progressClasses.length];

                            return (
                              <button
                                key={test.id}
                                type="button"
                                onClick={() => handleTestChange(test.id)}
                                className="w-100 text-start border-0 bg-transparent p-0 mb-4"
                                style={{ color: 'rgb(133, 135, 150)' }}
                              >
                                <h4 className="small font-weight-bold mb-2">
                                  {test.title}
                                  <span className="float-end">{progressValue}%</span>
                                </h4>
                                <div className="progress">
                                  <div
                                    className={`progress-bar ${progressBarClass}`}
                                    role="progressbar"
                                    style={{ width: `${progressValue}%` }}
                                    aria-valuenow={progressValue}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                  ></div>
                                </div>
                              </button>
                            );
                          })}
                        </>
                      ) : (
                        <p className="text-muted mb-0">No non-proctored tests available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted mb-4">Select a subject from the left navigation to load assessments.</p>
          )}
      </div>

    </div>
  );
}
