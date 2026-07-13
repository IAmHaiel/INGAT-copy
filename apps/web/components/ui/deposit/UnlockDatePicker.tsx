import React from 'react';

interface UnlockDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const UnlockDatePicker: React.FC<UnlockDatePickerProps> = ({ value, onChange, error }) => {
  const setPreset = (minutes: number) => {
    const date = new Date(Date.now() + minutes * 60 * 1000);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    onChange(localDate.toISOString().slice(0, 16));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-on-surface">Goal Release Date & Time</label>
      
      <div className="grid grid-cols-4 gap-2 mb-2">
        <button
          type="button"
          onClick={() => setPreset(2)}
          className="text-xs bg-surface-container hover:bg-primary/10 hover:text-primary border border-outline-variant rounded py-1.5 transition-colors cursor-pointer border-0"
        >
          2 Mins (Demo)
        </button>
        <button
          type="button"
          onClick={() => setPreset(60)}
          className="text-xs bg-surface-container hover:bg-primary/10 hover:text-primary border border-outline-variant rounded py-1.5 transition-colors cursor-pointer border-0"
        >
          1 Hour
        </button>
        <button
          type="button"
          onClick={() => setPreset(60 * 24)}
          className="text-xs bg-surface-container hover:bg-primary/10 hover:text-primary border border-outline-variant rounded py-1.5 transition-colors cursor-pointer border-0"
        >
          1 Day
        </button>
        <button
          type="button"
          onClick={() => setPreset(60 * 24 * 7)}
          className="text-xs bg-surface-container hover:bg-primary/10 hover:text-primary border border-outline-variant rounded py-1.5 transition-colors cursor-pointer border-0"
        >
          1 Week
        </button>
      </div>

      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-outline-variant rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default UnlockDatePicker;
