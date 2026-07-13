import React, { useState } from 'react';
import { formatAmount } from '@/lib/utils/format';
import { Coins } from 'lucide-react';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { formatXlmWithUsd } from '@/lib/utils/price';

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
  const { priceUsd } = useXlmPrice();

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
        <div className="bg-primary/10 p-3 rounded-full text-primary flex items-center justify-center">
          <Coins size={24} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-on-surface-variant">Spending Bucket</h3>
          <p className="text-2xl font-black text-primary">{formatAmount(balance)} XLM</p>
          {priceUsd > 0 && balance > 0 && (
            <p className="text-xs text-on-surface-variant">{formatXlmWithUsd(balance, priceUsd)}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-on-surface-variant">
        These funds are fully unlocked and withdrawable for daily living, education, or utility expenses.
      </p>

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
                className="w-full bg-white border border-outline-variant rounded-lg pl-3 pr-14 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
              />
              <button
                type="button"
                onClick={() => setAmount(balance.toFixed(2))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-primary hover:text-primary/80 bg-transparent border-0 cursor-pointer"
              >
                MAX
              </button>
            </div>
            <button
              type="submit"
              disabled={isWithdrawing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
              className="bg-primary text-white font-bold text-sm px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50 border-0 transition-opacity hover:opacity-90 w-full sm:w-auto flex items-center justify-center min-w-[90px]"
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
