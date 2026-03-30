'use client';

import { Trimester } from '@/lib/types';

interface TrimesterSelectorProps {
  trimesters: Trimester[];
  selectedTrimesterId: string;
  onTrimesterChange: (trimesterId: string) => void;
}

export function TrimesterSelector({
  trimesters,
  selectedTrimesterId,
  onTrimesterChange,
}: TrimesterSelectorProps) {
  return (
    <div>
      <label htmlFor="trimester" className="form-label fw-semibold text-gray-800 small text-uppercase">
        Trimester
      </label>
      <select
        id="trimester"
        value={selectedTrimesterId}
        onChange={(e) => onTrimesterChange(e.target.value)}
        className="form-select"
      >
        {trimesters.map((trimester) => (
          <option key={trimester.id} value={trimester.id}>
            {trimester.name}
          </option>
        ))}
      </select>
    </div>
  );
}
