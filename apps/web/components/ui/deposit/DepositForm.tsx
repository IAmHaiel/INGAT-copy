import React, { useState } from 'react';
import SplitRatioInput from './SplitRatioInput';
import UnlockDatePicker from './UnlockDatePicker';
import { DepositFormInputs } from '@/types/transaction';
import { ValidationError } from '@/lib/validation/deposit';
import { Send } from 'lucide-react';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { formatXlmWithUsd } from '@/lib/utils/price';

interface DepositFormProps {
  onDeposit: (inputs: DepositFormInputs) => void;
  isSubmitting: boolean;
  validationErrors: ValidationError[];
  txError: string | null;
}

const DepositForm: React.FC<DepositFormProps> = ({
  onDeposit,
  isSubmitting,
  validationErrors,
  txError,
}) => {
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [splitRatio, setSplitRatio] = useState(60); // default 60% spending
  const [unlockDate, setUnlockDate] = useState('');
  const { priceUsd } = useXlmPrice();
  const getErrorForField = (field: keyof DepositFormInputs) => {
    return validationErrors.find((e) => e.field === field)?.message;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDeposit({
      receiver,
      amount,
      splitRatio,
      unlockDate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl border border-outline-variant shadow-md">
      <div>
        <h2 className="text-lg font-bold text-primary mb-1">Send Protected Remittance</h2>
        <p className="text-xs text-on-surface-variant">Configure splits and secure locked funds instantly.</p>
      </div>

      {txError && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
          <strong>Transaction Error:</strong> {txError}
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-semibold text-on-surface">Receiver&apos;s Stellar Address</label>
        <input
          type="text"
          placeholder="G..."
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          className="w-full bg-white border border-outline-variant rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface"
        />
        {getErrorForField('receiver') && (
          <p className="text-xs text-red-600 mt-1">{getErrorForField('receiver')}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-semibold text-on-surface">Deposit Amount (XLM)</label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-white border border-outline-variant rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface"
          />
        </div>
        {amount && parseFloat(amount) > 0 && priceUsd > 0 && (
          <p className="text-xs text-on-surface-variant mt-1">
            {formatXlmWithUsd(parseFloat(amount), priceUsd)}
          </p>
        )}
        {getErrorForField('amount') && (
          <p className="text-xs text-red-600 mt-1">{getErrorForField('amount')}</p>
        )}
      </div>

      <SplitRatioInput
        value={splitRatio}
        onChange={setSplitRatio}
        amount={amount}
        error={getErrorForField('splitRatio')}
      />

      <UnlockDatePicker
        value={unlockDate}
        onChange={setUnlockDate}
        error={getErrorForField('unlockDate')}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-white py-3 rounded-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 border-0"
      >
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Processing On-Chain...
          </>
        ) : (
          <>
            <Send size={20} />
            Execute Remittance Split
          </>
        )}
      </button>
    </form>
  );
};

export default DepositForm;
