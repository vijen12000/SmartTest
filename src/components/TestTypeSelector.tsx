'use client';

interface TestTypeSelectorProps {
  selectedType: 'proctored' | 'nonProctored';
  onTypeChange: (type: 'proctored' | 'nonProctored') => void;
}

export function TestTypeSelector({
  selectedType,
  onTypeChange,
}: TestTypeSelectorProps) {
  return (
    <div>
      <label htmlFor="testType" className="form-label fw-semibold text-gray-800 small text-uppercase">
        Test Type
      </label>
      <select
        id="testType"
        value={selectedType}
        onChange={(e) =>
          onTypeChange(e.target.value as 'proctored' | 'nonProctored')
        }
        className="form-select"
      >
        <option value="proctored">Proctored</option>
        <option value="nonProctored">Non-Proctored</option>
      </select>
    </div>
  );
}
