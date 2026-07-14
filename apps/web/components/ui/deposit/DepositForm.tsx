import React, { useState, useEffect } from 'react';
import SplitRatioInput from './SplitRatioInput';
import UnlockDatePicker from './UnlockDatePicker';
import AddressSafetyWarning from './AddressSafetyWarning';
import ContactAutocomplete from './ContactAutocomplete';
import DepositConfirmModal from './DepositConfirmModal';
import { DepositFormInputs } from '@/types/transaction';
import { ValidationError, validateDeposit } from '@/lib/validation/deposit';
import { Send } from 'lucide-react';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { formatXlmWithUsd } from '@/lib/utils/price';
import { checkAddressSafety, AddressSafetyState } from '@/lib/validation/addressSafety';
import { getContacts, Contact } from '@/lib/utils/contacts';

interface DepositFormProps {
  onDeposit: (inputs: DepositFormInputs) => Promise<boolean>;
  isSubmitting: boolean;
  validationErrors: ValidationError[];
  txError: string | null;
  knownAddresses: string[];
  isAddressesLoading: boolean;
}

const DepositForm: React.FC<DepositFormProps> = ({
  onDeposit,
  isSubmitting,
  validationErrors,
  txError,
  knownAddresses,
  isAddressesLoading,
}) => {
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [splitRatio, setSplitRatio] = useState(60); // default 60% spending
  const [unlockDate, setUnlockDate] = useState('');
  const [safetyState, setSafetyState] = useState<AddressSafetyState>('unknown');
  const [similarAddress, setSimilarAddress] = useState<string | undefined>(undefined);
  const [isNearMissConfirmed, setIsNearMissConfirmed] = useState(false);
  const [localErrors, setLocalErrors] = useState<ValidationError[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Autocomplete states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const { priceUsd } = useXlmPrice();

  useEffect(() => {
    setContacts(getContacts());
  }, []);

  const getErrorForField = (field: keyof DepositFormInputs) => {
    return (
      localErrors.find((e) => e.field === field)?.message ||
      validationErrors.find((e) => e.field === field)?.message
    );
  };

  const handleAddressBlur = () => {
    const result = checkAddressSafety(receiver, knownAddresses);
    setSafetyState(result.state);
    setSimilarAddress(result.similarAddress);
    setIsNearMissConfirmed(false); // Reset confirmation whenever the address is re-evaluated
  };

  const handleAddressChange = (val: string) => {
    setReceiver(val);
    setSafetyState('unknown');
    setSimilarAddress(undefined);
    setIsNearMissConfirmed(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (safetyState === 'near-miss' && !isNearMissConfirmed) {
      return;
    }

    const errors = validateDeposit({
      receiver,
      amount,
      splitRatio,
      unlockDate,
    });

    setLocalErrors(errors);

    if (errors.length === 0) {
      setIsConfirmOpen(true);
    }
  };

  const handleConfirm = async () => {
    const success = await onDeposit({
      receiver,
      amount,
      splitRatio,
      unlockDate,
    });
    if (success) {
      setReceiver('');
      setAmount('');
      setSplitRatio(60);
      setUnlockDate('');
      setSafetyState('unknown');
      setSimilarAddress(undefined);
      setIsNearMissConfirmed(false);
      setLocalErrors([]);
      setIsConfirmOpen(false);
    }
  };

  const getContactName = (addr: string) => {
    return contacts.find((c) => c.address === addr)?.name || null;
  };

  const isSubmitDisabled = 
    isSubmitting || 
    safetyState === 'malformed' || 
    (safetyState === 'near-miss' && !isNearMissConfirmed);

  return (
    <>
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

        <div className="space-y-1 relative">
          <label className="block text-sm font-semibold text-on-surface">Receiver&apos;s Account Address</label>
          <input
            type="text"
            placeholder="G..."
            value={receiver}
            onChange={(e) => handleAddressChange(e.target.value)}
            onFocus={() => setShowAutocomplete(true)}
            onBlur={() => {
              handleAddressBlur();
              setTimeout(() => setShowAutocomplete(false), 150);
            }}
            className="w-full bg-white border border-outline-variant rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface"
          />
          <ContactAutocomplete
            contacts={contacts}
            query={receiver}
            onSelect={(address) => {
              handleAddressChange(address);
              const result = checkAddressSafety(address, knownAddresses);
              setSafetyState(result.state);
              setSimilarAddress(result.similarAddress);
              setIsNearMissConfirmed(false);
              setShowAutocomplete(false);
            }}
            visible={showAutocomplete}
          />
          <AddressSafetyWarning
            safetyState={safetyState}
            similarAddress={similarAddress}
            confirmed={isNearMissConfirmed}
            onConfirmChange={setIsNearMissConfirmed}
            isChecking={isAddressesLoading}
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
          disabled={isSubmitDisabled}
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

      <DepositConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        receiver={receiver}
        receiverName={getContactName(receiver)}
        amount={amount}
        splitRatio={splitRatio}
        unlockDate={unlockDate}
        priceUsd={priceUsd}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default DepositForm;
