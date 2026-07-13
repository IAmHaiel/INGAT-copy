import { useState } from 'react';
import { buildWithdrawSpendingTx, buildWithdrawGoalTx, submitTransaction } from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';

export const useWithdraw = (receiverAddress: string | null, onSuccess?: () => void) => {
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const withdraw = async (type: 'spending' | 'goal', amount: number) => {
    if (!receiverAddress) {
      setError('Wallet not connected');
      return;
    }

    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    setIsWithdrawing(true);
    setError(null);
    setTxHash(null);

    try {
      let unsignedXDR = '';
      if (type === 'spending') {
        unsignedXDR = await buildWithdrawSpendingTx(receiverAddress, amount);
      } else {
        unsignedXDR = await buildWithdrawGoalTx(receiverAddress, amount);
      }

      const signedXDR = await signTxWithFreighter(unsignedXDR);
      const hash = await submitTransaction(signedXDR);
      setTxHash(hash);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed';
      setError(errorMessage);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return {
    withdraw,
    isWithdrawing,
    error,
    txHash
  };
};
