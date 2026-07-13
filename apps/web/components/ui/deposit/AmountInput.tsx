"use client";

interface AmountInputProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

export function AmountInput({ value, onChange, error }: AmountInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="amount" className="text-sm font-medium text-gray-700">
        Amount (XLM)
      </label>
      <div className="relative">
        <input
          id="amount"
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-amber-500"
          }`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
          XLM
        </span>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
