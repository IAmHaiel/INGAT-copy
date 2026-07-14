import React from 'react';
import { AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';
import { AddressSafetyState } from '@/lib/validation/addressSafety';

interface AddressSafetyWarningProps {
  safetyState: AddressSafetyState;
  similarAddress?: string;
  confirmed: boolean;
  onConfirmChange: (confirmed: boolean) => void;
  isChecking: boolean;
}

const AddressSafetyWarning: React.FC<AddressSafetyWarningProps> = ({
  safetyState,
  similarAddress,
  confirmed,
  onConfirmChange,
  isChecking,
}) => {
  if (isChecking) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
        <span className="text-xs text-on-surface-variant">Checking address safety...</span>
      </div>
    );
  }

  if (safetyState === 'malformed') {
    return (
      <div className="flex items-center gap-2 text-red-600 mt-1 bg-red-50 p-2.5 rounded-lg border border-red-200">
        <AlertOctagon size={16} className="shrink-0" />
        <span className="text-xs font-semibold">Invalid Stellar address format. Make sure it starts with &apos;G&apos; and is 56 characters long.</span>
      </div>
    );
  }

  if (safetyState === 'first-time') {
    return (
      <div className="flex items-start gap-2 text-amber-700 mt-1 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
        <HelpCircle size={16} className="shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold block">First-Time Recipient</span>
          <span>You haven&apos;t sent to this address before. Please double check that this is the correct recipient address.</span>
        </div>
      </div>
    );
  }

  if (safetyState === 'near-miss') {
    return (
      <div className="flex flex-col gap-2.5 text-red-700 mt-1 bg-red-50 p-3 rounded-lg border border-red-300">
        <div className="flex items-start gap-2">
          <AlertTriangle size={18} className="shrink-0 text-red-600 mt-0.5" />
          <div className="text-xs">
            <span className="font-black text-red-800 block mb-0.5">⚠️ WARNING: Potential Typo Detected</span>
            <span className="leading-relaxed">
              The address you entered is <strong>extremely similar</strong> to a recipient you transacted with previously, but has a slight difference. This could be a typo or a clipboard attack.
            </span>
            {similarAddress && (
              <div className="mt-2 p-1.5 bg-white border border-red-200 rounded text-[11px] font-mono break-all text-on-surface">
                <span className="font-bold text-red-700 block text-[9px] uppercase font-sans mb-0.5">Previously used address:</span>
                {similarAddress}
              </div>
            )}
          </div>
        </div>
        <label className="flex items-center gap-2 mt-1 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => onConfirmChange(e.target.checked)}
            className="w-4 h-4 text-red-600 bg-white border-red-300 rounded focus:ring-red-500 cursor-pointer"
          />
          <span className="text-xs font-bold text-red-800">
            I confirm this is the correct address and I want to proceed.
          </span>
        </label>
      </div>
    );
  }

  return null;
};

export default AddressSafetyWarning;
