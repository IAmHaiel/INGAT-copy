import React from 'react';
import { ShieldAlert, X, Calendar, ArrowRight, User } from 'lucide-react';
import { formatXlmWithUsd } from '@/lib/utils/price';

interface DepositConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  receiver: string;
  receiverName: string | null;
  amount: string;
  splitRatio: number;
  unlockDate: string;
  priceUsd: number;
  isSubmitting: boolean;
}

const DepositConfirmModal: React.FC<DepositConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  receiver,
  receiverName,
  amount,
  splitRatio,
  unlockDate,
  priceUsd,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  const amountNum = parseFloat(amount) || 0;
  const spendingAmount = amountNum * (splitRatio / 100);
  const goalAmount = amountNum - spendingAmount;

  const truncateAddress = (addr: string) => 
    addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : addr;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity animate-fade-in"
        onClick={isSubmitting ? undefined : onClose}
      />

      {/* Modal Card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl border border-outline-variant shadow-2xl z-50 w-full max-w-md p-6 overflow-hidden animate-[scaleIn_200ms_ease-out] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2 text-primary">
            <h3 className="font-bold text-base text-primary">Review Split Remittance</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 hover:bg-surface-container rounded-lg transition-colors cursor-pointer text-on-surface-variant disabled:opacity-50 border-0 bg-transparent"
          >
            <X size={18} />
          </button>
        </div>

        {/* Details Content */}
        <div className="py-4 space-y-4 text-xs">
          {/* Recipient Details */}
          <div className="bg-surface-container/30 p-3 rounded-xl border border-outline-variant/50 space-y-1.5">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Recipient</span>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-primary/10 rounded-full text-primary shrink-0">
                <User size={14} />
              </div>
              <div>
                <p className="font-bold text-on-surface text-xs">
                  {receiverName || 'Unnamed Contact'}
                </p>
                <p className="font-mono text-[10px] text-on-surface-variant break-all" title={receiver}>
                  {receiver}
                </p>
              </div>
            </div>
          </div>

          {/* Allocation Breakdown */}
          <div className="space-y-2">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Split Breakdown</span>
            
            <div className="grid grid-cols-2 gap-2">
              {/* Spending */}
              <div className="p-3 bg-surface-container-lowest border border-outline-variant/60 rounded-xl">
                <span className="text-[10px] text-primary font-semibold block">Spending Split ({splitRatio}%)</span>
                <span className="text-sm font-black text-primary block mt-0.5">{spendingAmount.toFixed(2)} XLM</span>
                {priceUsd > 0 && spendingAmount > 0 && (
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    {formatXlmWithUsd(spendingAmount, priceUsd)}
                  </span>
                )}
              </div>

              {/* Goal */}
              <div className="p-3 bg-surface-container-lowest border border-outline-variant/60 rounded-xl">
                <span className="text-[10px] text-secondary font-semibold block">Goal Split ({100 - splitRatio}%)</span>
                <span className="text-sm font-black text-secondary block mt-0.5">{goalAmount.toFixed(2)} XLM</span>
                {priceUsd > 0 && goalAmount > 0 && (
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    {formatXlmWithUsd(goalAmount, priceUsd)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center bg-surface-container/10 p-2.5 rounded-lg border border-outline-variant/40 mt-1">
              <span className="font-bold text-on-surface">Total Amount</span>
              <div className="text-right">
                <span className="font-black text-on-surface block text-sm">{amountNum.toFixed(2)} XLM</span>
                {priceUsd > 0 && amountNum > 0 && (
                  <span className="text-[10px] text-on-surface-variant block">
                    {formatXlmWithUsd(amountNum, priceUsd)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Timelock Info */}
          {goalAmount > 0 && (
            <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-200/50 space-y-1.5">
              <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Timelock Release</span>
              <div className="flex items-center gap-1.5 text-xs text-on-surface font-semibold">
                <Calendar size={14} className="text-secondary shrink-0" />
                <span>{new Date(unlockDate).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className="bg-red-50 text-red-800 p-3.5 rounded-xl border border-red-200 flex items-start gap-2.5">
            <ShieldAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-xs text-red-900">Irreversible Action</p>
              <p className="text-[11px] leading-relaxed">
                Once approved, funds are transferred to the smart contract immediately. The Goal bucket cannot be accessed by either sender or receiver until the release date.
              </p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-2 border-t border-outline-variant pt-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold py-2.5 rounded-xl cursor-pointer text-xs transition-colors border-0 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs transition-all active:scale-95 flex items-center justify-center gap-1 border-0 shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </>
            ) : (
              <>
                Confirm & Send
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default DepositConfirmModal;
