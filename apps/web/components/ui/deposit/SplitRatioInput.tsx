import React from 'react';

interface SplitRatioInputProps {
  value: number; // percentage of spending
  onChange: (value: number) => void;
  amount: string;
  error?: string;
}

const SplitRatioInput: React.FC<SplitRatioInputProps> = ({ value, onChange, amount, error }) => {
  const amountNum = parseFloat(amount) || 0;
  const spendingSplit = (amountNum * value) / 100;
  const goalSplit = amountNum - spendingSplit;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-on-surface">Allocation Split Ratio</label>
        <span className="text-sm font-bold text-primary">{value}% Spending / {100 - value}% Goal</span>
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
        />

        <div className="grid grid-cols-2 gap-4 text-xs font-medium">
          <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
            <span className="text-on-surface-variant block">Spending Bucket (Receiver)</span>
            <span className="text-lg font-bold text-primary">{spendingSplit.toFixed(2)} XLM</span>
            <span className="text-[10px] text-on-surface-variant block">Withdrawable anytime</span>
          </div>
          <div className="bg-secondary/5 p-3 rounded-lg border border-secondary/10">
            <span className="text-on-surface-variant block">Goal Bucket (Savings)</span>
            <span className="text-lg font-bold text-secondary">{goalSplit.toFixed(2)} XLM</span>
            <span className="text-[10px] text-on-surface-variant block">Locked until release date</span>
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default SplitRatioInput;
