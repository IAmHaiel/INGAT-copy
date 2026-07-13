import React, { useState } from 'react';
import { formatAmount } from '@/lib/utils/format';

interface SpendingBucketCardProps {
  balance: number;
  onWithdraw: (amount: number) => void;
  isWithdrawing: boolean;
}

const SpendingBucketCard: React.FC<SpendingBucketCardProps> = ({
  balance,
  onWithdraw,
  isWithdrawing,
}) => {
  const [amount, setAmount] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!isNaN(parsed) && parsed > 0 && parsed <= balance) {
      onWithdraw(parsed);
      setAmount('');
      setIsOpen(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-outline-variant shadow-md space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-full text-primary">
          <span className="material-symbols-outlined text-[24px]">payments</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-on-surface-variant">Spending Bucket</h3>
          <p className="text-2xl font-black text-primary">${formatAmount(balance)}</p>
        </div>
      </div>

      <p className="text-xs text-on-surface-variant">
        These funds are fully unlocked and withdrawable for daily living, education, or utility expenses.
      </p>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-outline-variant">
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              max={balance}
              placeholder="Amount to withdraw"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-grow bg-white border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
            />
            <button
              type="submit"
              disabled={isWithdrawing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
              className="bg-primary text-white font-bold text-sm px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50 border-0"
            >
              Withdraw
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border-0 bg-transparent"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          disabled={balance <= 0 || isWithdrawing}
          className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-50 border-0"
        >
          {isWithdrawing ? 'Processing...' : 'Withdraw Funds'}
        </button>
      )}
    </div>
  );
};

export default SpendingBucketCard;
