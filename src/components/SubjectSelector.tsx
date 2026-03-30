'use client';

import { Subject } from '@/lib/types';

interface SubjectSelectorProps {
  subjects: Subject[];
  selectedSubjectId: string;
  onSubjectChange: (subjectId: string) => void;
}

export function SubjectSelector({
  subjects,
  selectedSubjectId,
  onSubjectChange,
}: SubjectSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="subject" className="text-sm font-semibold">
        Subject
      </label>
      <select
        id="subject"
        value={selectedSubjectId}
        onChange={(e) => onSubjectChange(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
      >
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>
    </div>
  );
}
