import { useState } from 'react';
import { buildDepositTx, submitTransaction } from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';
import { validateDeposit, ValidationError } from '@/lib/validation/deposit';
import { insertTransaction } from '@/lib/supabase';
import { DepositFormInputs } from '@/types/transaction';
import { useWalletContext } from '@/context/WalletContext';

export const useDeposit = (senderAddress: string | null, onSuccess?: (txHash: string) => void) => {
  const { supabaseClient } = useWalletContext();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const deposit = async (inputs: DepositFormInputs): Promise<boolean> => {
    if (!senderAddress) {
      setTxError('Wallet not connected');
      return false;
    }

    const validationErrors = validateDeposit(inputs);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return false;
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

      const signedXDR = await signTxWithFreighter(unsignedXDR, senderAddress);

      const hash = await submitTransaction(signedXDR);
      setTxHash(hash);

      // Compute split amounts
      const spendingAmount = amountNum * (inputs.splitRatio / 100);
      const goalAmount = amountNum - spendingAmount;

      // Persist to Supabase (fire-and-forget — tx is already confirmed on-chain)
      insertTransaction({
        tx_hash: hash,
        type: 'deposit',
        sender_address: senderAddress,
        receiver_address: inputs.receiver,
        amount: amountNum,
        spending_amount: spendingAmount,
        goal_amount: goalAmount,
        split_ratio: inputs.splitRatio,
        unlock_date: unlockDateEpoch,
        goal_label: inputs.goalLabel?.trim() || null,
      }, supabaseClient).catch((err) => {
        console.error('[useDeposit] Supabase persistence failed:', err);
      });

      if (onSuccess) {
        onSuccess(hash);
      }
      return true;
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setTxError(errorMessage);
      return false;
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
