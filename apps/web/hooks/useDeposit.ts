import { useState } from 'react';
import { buildDepositTx, submitTransaction } from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';
import { validateDeposit, ValidationError } from '@/lib/validation/deposit';
import { DepositFormInputs } from '@/types/transaction';

export const useDeposit = (senderAddress: string | null, onSuccess?: (txHash: string) => void) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const deposit = async (inputs: DepositFormInputs) => {
    if (!senderAddress) {
      setTxError('Wallet not connected');
      return;
    }

    const validationErrors = validateDeposit(inputs);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setTxError(null);
    setTxHash(null);
    setIsSubmitting(true);

    try {
      const unlockDateEpoch = Math.floor(new Date(inputs.unlockDate).getTime() / 1000);
      const amountNum = parseFloat(inputs.amount);

      const unsignedXDR = await buildDepositTx(
        senderAddress,
        inputs.receiver,
        amountNum,
        inputs.splitRatio,
        unlockDateEpoch
      );

      const signedXDR = await signTxWithFreighter(unsignedXDR);

      const hash = await submitTransaction(signedXDR);
      setTxHash(hash);

      if (onSuccess) {
        onSuccess(hash);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setTxError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    deposit,
    isSubmitting,
    errors,
    txError,
    txHash
  };
};
