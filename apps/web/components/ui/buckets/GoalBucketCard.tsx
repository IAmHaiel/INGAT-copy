import React, { useState, useEffect } from 'react';
import { formatAmount, formatDate, formatDistanceToNow } from '@/lib/utils/format';

interface GoalBucketCardProps {
  balance: number;
  unlockDate: number; // unix timestamp in seconds
  onWithdraw: (amount: number) => void;
  isWithdrawing: boolean;
}

const GoalBucketCard: React.FC<GoalBucketCardProps> = ({
  balance,
  unlockDate,
  onWithdraw,
  isWithdrawing,
}) => {
  const [amount, setAmount] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    const checkLock = () => {
      const now = Math.floor(Date.now() / 1000);
      setIsLocked(now < unlockDate);
      setTimeLeftStr(formatDistanceToNow(unlockDate));
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [unlockDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!isNaN(parsed) && parsed > 0 && parsed <= balance) {
      onWithdraw(parsed);
      setAmount('');
      setIsOpen(false);
    }
  };

  const hasBalance = balance > 0;

  return (
    <div className={`p-5 rounded-xl border shadow-md space-y-4 transition-all ${isLocked ? 'bg-amber-50/40 border-amber-200/50' : 'bg-white border-outline-variant'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${isLocked ? 'bg-secondary/10 text-secondary' : 'bg-green-50 text-green-600'}`}>
            <span className="material-symbols-outlined text-[24px]">
              {isLocked ? 'lock' : 'lock_open'}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface-variant">Goal Bucket</h3>
            <p className={`text-2xl font-black ${isLocked ? 'text-secondary' : 'text-green-600'}`}>
              ${formatAmount(balance)}
            </p>
          </div>
        </div>

        {hasBalance && (
          <div className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${isLocked ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
            <span>{isLocked ? timeLeftStr : 'Unlocked'}</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-on-surface-variant">
          Funds are protected from impulse spending and locked on-chain.
        </p>
        {unlockDate > 0 && (
          <div className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            <span>Release Date: {formatDate(unlockDate)}</span>
          </div>
        )}
      </div>

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
              className="flex-grow bg-white border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 text-on-surface"
            />
            <button
              type="submit"
              disabled={isWithdrawing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
              className="bg-secondary text-white font-bold text-sm px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50 border-0"
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
          disabled={!hasBalance || isLocked || isWithdrawing}
          className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-50 border-0 ${isLocked ? 'bg-secondary-container/10 text-secondary border border-secondary-container/20 hover:bg-secondary-container/20' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}
        >
          {isWithdrawing ? 'Processing...' : isLocked ? 'Locked (Cannot Withdraw)' : 'Withdraw Unlocked Savings'}
        </button>
      )}
    </div>
  );
};

export default GoalBucketCard;
