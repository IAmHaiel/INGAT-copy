import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { formatAmount } from '@/lib/utils/format';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { formatXlmWithUsd } from '@/lib/utils/price';

interface RequestEarlyAccessModalProps {
  bucket: {
    id: number;
    goalBalance: number;
  };
  onConfirm: (amount: number) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const RequestEarlyAccessModal: React.FC<RequestEarlyAccessModalProps> = ({
  bucket,
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  const [amount, setAmount] = useState<string>(bucket.goalBalance.toFixed(2));
  const { priceUsd } = useXlmPrice();

  const parsedAmount = parseFloat(amount);
  const isValid = !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= bucket.goalBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onConfirm(parsedAmount);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_200ms_ease-out]">
      <div className="bg-white border border-outline-variant w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-[scaleIn_200ms_ease-out]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-secondary/10 text-secondary">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-on-surface">Request Early Access</h3>
            <p className="text-xs text-on-surface-variant">Initiates an emergency withdrawal cooldown</p>
          </div>
        </div>

        <div className="p-3.5 bg-amber-50 border border-amber-200/50 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
            <AlertTriangle size={16} />
            <span>Smart Contract Rule Notice</span>
          </div>
          <p className="text-xs text-amber-950/80 leading-relaxed font-medium">
            Requesting early access will initiate a mandatory <span className="font-bold">48-hour cooldown</span> on-chain. Your sender will be notified immediately and holds the right to cancel your request at any point before the cooldown ends.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant">Amount to Request (XLM)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={bucket.goalBalance}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white border border-outline rounded-xl pl-3 pr-16 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 text-on-surface font-semibold"
              />
              <button
                type="button"
                onClick={() => setAmount(bucket.goalBalance.toFixed(2))}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary hover:text-secondary/80 bg-transparent border-0 cursor-pointer"
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between items-center px-1 text-[11px] min-h-[16px]">
              {isValid && priceUsd > 0 ? (
                <span className="text-on-surface-variant font-medium">
                  USD Value: {formatXlmWithUsd(parsedAmount, priceUsd)}
                </span>
              ) : (
                <span />
              )}
              <span className="text-on-surface-variant font-medium">
                Goal Balance: {formatAmount(bucket.goalBalance)} XLM
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-grow bg-transparent hover:bg-black/5 text-on-surface border border-outline font-bold text-sm py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="flex-grow bg-secondary text-white font-bold text-sm py-2.5 rounded-xl cursor-pointer transition-colors border-0 disabled:opacity-50 hover:opacity-90 flex items-center justify-center"
            >
              {isLoading ? 'Requesting...' : 'Request Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
