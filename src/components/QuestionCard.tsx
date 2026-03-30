'use client';

import { Question } from '@/lib/types';
import dynamic from 'next/dynamic';

const MathRenderer = dynamic(() => import('./MathRenderer'), {
  ssr: false,
});

interface QuestionCardProps {
  question: Question;
  index: number;
  selectedOptionIndex: number | null;
  onSelectOption: (questionId: string, optionIndex: number) => void;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  index,
  selectedOptionIndex,
  onSelectOption,
  disabled = false,
}: QuestionCardProps) {
  const groupName = `question-${question.id}`;

  return (
    <article className="card shadow-sm border-0 question-card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis px-3 py-2">
            Question {index + 1}
          </span>
          <span className="badge rounded-pill bg-primary px-3 py-2">
            {question.points} {question.points > 1 ? 'points' : 'point'}
          </span>
        </div>

        <div className="text-gray-800 mb-4">
          <MathRenderer content={question.prompt} />
        </div>

        <div className="d-grid gap-2">
          {question.options.map((option, optIndex) => (
            <label
              key={optIndex}
              className={`answer-option border rounded p-3 ${selectedOptionIndex === optIndex ? 'answer-option-active border-primary bg-primary-subtle' : 'bg-white'} ${disabled ? 'opacity-75' : ''}`}
            >
              <div className="form-check m-0 d-flex gap-2 align-items-start">
                <input
                  className="form-check-input mt-1"
                  type="radio"
                  name={groupName}
                  checked={selectedOptionIndex === optIndex}
                  onChange={() => onSelectOption(question.id, optIndex)}
                  disabled={disabled}
                />
                <div className="form-check-label w-100 text-gray-800">
                  <MathRenderer content={option} />
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </article>
  );
}
