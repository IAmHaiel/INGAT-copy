import React, { useState, useEffect } from 'react';
import { Hourglass, AlertTriangle, ShieldAlert } from 'lucide-react';
import { formatAmount } from '@/lib/utils/format';

interface CooldownBannerProps {
  cooldownEndsAt: number; // unix timestamp in seconds
  amount: number;
  onCancel?: () => void;
  onExecute?: () => void;
  role: 'sender' | 'receiver';
  isLoading?: boolean;
}

export const CooldownBanner: React.FC<CooldownBannerProps> = ({
  cooldownEndsAt,
  amount,
  onCancel,
  onExecute,
  role,
  isLoading = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      setTimeLeft(Math.max(0, cooldownEndsAt - now));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [cooldownEndsAt]);

  const isElapsed = timeLeft === 0;

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const bannerColor = role === 'sender'
    ? 'bg-amber-50 border-amber-300 text-amber-900'
    : isElapsed
      ? 'bg-green-50 border-green-300 text-green-950'
      : 'bg-secondary/5 border-secondary/20 text-secondary';

  return (
    <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${bannerColor}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {role === 'sender' ? (
            <AlertTriangle className="text-amber-600 animate-pulse" size={20} />
          ) : isElapsed ? (
            <ShieldAlert className="text-green-600 animate-bounce" size={20} />
          ) : (
            <Hourglass className="text-secondary animate-[spin_4s_linear_infinite]" size={20} />
          )}
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider opacity-90">
            {role === 'sender' ? 'Sender Warning: Early Access Request' : 'Early Access Request Status'}
          </h4>
          <p className="text-sm font-semibold mt-1">
            {role === 'sender' ? (
              <>
                The receiver requested early access to <span className="font-extrabold">{formatAmount(amount)} XLM</span>.
              </>
            ) : (
              <>
                You have requested early access to <span className="font-extrabold">{formatAmount(amount)} XLM</span>.
              </>
            )}
          </p>
          <div className="text-xs mt-1.5 font-medium flex items-center gap-1.5 opacity-90">
            {isElapsed ? (
              <span className="text-green-700 font-bold bg-green-100/50 px-2 py-0.5 rounded-full border border-green-200">
                Cooldown elapsed! Ready to withdraw.
              </span>
            ) : (
              <>
                <span>Cooldown Remaining:</span>
                <span className="font-extrabold font-mono text-sm bg-black/5 px-2 py-0.5 rounded border border-black/5">
                  {formatCountdown(timeLeft)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:flex-shrink-0">
        {role === 'receiver' && isElapsed && onExecute && (
          <button
            onClick={onExecute}
            disabled={isLoading}
            className="bg-green-700 hover:bg-green-800 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors border-0 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Execute Withdrawal'}
          </button>
        )}

        {onCancel && role !== 'receiver' && (
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors border ${
              role === 'sender'
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent'
                : 'bg-white hover:bg-black/5 text-on-surface border-outline'
            } disabled:opacity-50`}
          >
            {isLoading ? 'Processing...' : role === 'sender' ? 'Cancel Access Request' : 'Cancel Request'}
          </button>
        )}
      </div>
    </div>
  );
};
