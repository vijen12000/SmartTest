'use client';

import { Test } from '@/lib/types';

interface TestSelectorProps {
  tests: Test[];
  selectedTestId: string;
  onTestChange: (testId: string) => void;
}

export function TestSelector({
  tests,
  selectedTestId,
  onTestChange,
}: TestSelectorProps) {
  return (
    <div>
      <label htmlFor="test" className="form-label fw-semibold text-gray-800 small text-uppercase">
        Test
      </label>
      <select
        id="test"
        value={selectedTestId}
        onChange={(e) => onTestChange(e.target.value)}
        className="form-select"
      >
        {tests.length === 0 ? (
          <option value="">No tests available</option>
        ) : (
          tests.map((test) => (
            <option key={test.id} value={test.id}>
              {test.title}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
