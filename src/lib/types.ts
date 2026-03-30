export interface Question {
  id: string;
  points: number;
  prompt: string;
  options: string[];
}

export interface Test {
  id: string;
  title: string;
  questions: Question[];
}

export interface TestsByType {
  proctored: Test[];
  nonProctored: Test[];
}

export interface Subject {
  id: string;
  name: string;
  apiCode?: string;
  tests: TestsByType;
}

export interface StudyMaterial {
  id: number;
  provider: 'YouTube' | 'Coursera' | 'Other';
  title: string;
  url: string;
  resourceType: string;
  difficultyLevel: string;
}

export interface SubjectDetails {
  subjectCode: string;
  subjectName: string;
  courseContent: string;
  studyMaterials: StudyMaterial[];
}

export interface Trimester {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface QuestionBank {
  trimesters: Trimester[];
}
