import { useState } from 'react';
import { buildWithdrawSpendingTx, buildWithdrawGoalTx, submitTransaction } from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';

export const useWithdraw = (receiverAddress: string | null, onSuccess?: (hash: string) => void) => {
  const [isWithdrawing, setIsWithdrawing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const withdraw = async (bucketId: number, type: 'spending' | 'goal', amount: number, _unlockDate?: number) => {
    if (!receiverAddress) {
      setError('Wallet not connected');
      return;
    }

    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    setIsWithdrawing(bucketId);
    setError(null);
    setTxHash(null);

    try {
      let unsignedXDR = '';
      if (type === 'spending') {
        unsignedXDR = await buildWithdrawSpendingTx(receiverAddress, bucketId, amount);
      } else {
        unsignedXDR = await buildWithdrawGoalTx(receiverAddress, bucketId, amount);
      }

      const signedXDR = await signTxWithFreighter(unsignedXDR, receiverAddress);
      const hash = await submitTransaction(signedXDR);
      setTxHash(hash);

      if (onSuccess) {
        onSuccess(hash);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed';
      setError(errorMessage);
    } finally {
      setIsWithdrawing(null);
    }
  };

  return {
    withdraw,
    isWithdrawing,
    error,
    txHash
  };
};
