import React, { useState, useEffect } from 'react';
import { formatAmount, formatDate, formatDistanceToNow } from '@/lib/utils/format';
import { Lock, Unlock, Calendar } from 'lucide-react';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { formatXlmWithUsd } from '@/lib/utils/price';

interface GoalBucketCardProps {
  balance: number;
  unlockDate: number; // unix timestamp in seconds
  goalLabel?: string | null;
  onWithdraw: (amount: number) => void;
  isWithdrawing: boolean;
}

const GoalBucketCard: React.FC<GoalBucketCardProps> = ({
  balance,
  unlockDate,
  goalLabel,
  onWithdraw,
  isWithdrawing,
}) => {
  const [amount, setAmount] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const { priceUsd } = useXlmPrice();
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
          <div className={`p-3 rounded-full flex items-center justify-center ${isLocked ? 'bg-secondary/10 text-secondary' : 'bg-green-50 text-green-600'}`}>
            {isLocked ? <Lock size={24} /> : <Unlock size={24} />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface-variant">Goal Bucket</h3>
            <p className={`text-2xl font-black ${isLocked ? 'text-secondary' : 'text-green-600'}`}>
              {formatAmount(balance)} XLM
            </p>
            {priceUsd > 0 && balance > 0 && (
              <p className="text-xs text-on-surface-variant">{formatXlmWithUsd(balance, priceUsd)}</p>
            )}
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
        {goalLabel && (
          <p className="text-xs font-semibold text-secondary italic">
            &ldquo;{goalLabel}&rdquo;
          </p>
        )}
        <p className="text-xs text-on-surface-variant">
          Funds are protected from impulse spending and locked on-chain.
        </p>
        {unlockDate > 0 && (
          <div className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1">
            <Calendar size={14} />
            <span>Release Date: {formatDate(unlockDate)}</span>
          </div>
        )}
      </div>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-outline-variant animate-[fadeIn_150ms_ease-out]">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <input
                type="number"
                step="0.01"
                max={balance}
                placeholder="Amount to withdraw"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-outline-variant rounded-lg pl-3 pr-14 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 text-on-surface"
              />
              <button
                type="button"
                onClick={() => setAmount(balance.toFixed(2))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary hover:text-secondary/80 bg-transparent border-0 cursor-pointer"
              >
                MAX
              </button>
            </div>
            <button
              type="submit"
              disabled={isWithdrawing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
              className="bg-secondary text-white font-bold text-sm px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50 border-0 transition-opacity hover:opacity-90 w-full sm:w-auto flex items-center justify-center min-w-[90px]"
            >
              Withdraw
            </button>
          </div>

          {/* Interactive Hints */}
          <div className="space-y-1 min-h-[16px]">
            {amount && parseFloat(amount) > 0 && priceUsd > 0 && (
              <p className="text-[11px] text-on-surface-variant">
                USD Value: {formatXlmWithUsd(parseFloat(amount), priceUsd)}
              </p>
            )}
            {amount && parseFloat(amount) > 0 && parseFloat(amount) <= balance && (
              <p className="text-[11px] text-green-600 font-medium">
                Remaining: {formatAmount(balance - parseFloat(amount))} XLM
              </p>
            )}
            {amount && parseFloat(amount) > balance && (
              <p className="text-[11px] text-red-600 font-medium">
                Exceeds available balance of {formatAmount(balance)} XLM
              </p>
            )}
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setAmount('');
              }}
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border-0 bg-transparent py-1"
            >
              Cancel
            </button>
          </div>
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
