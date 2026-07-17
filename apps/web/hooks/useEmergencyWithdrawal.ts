import { useState } from 'react';
import {
  buildRequestEmergencyWithdrawalTx,
  buildCancelEmergencyWithdrawalReceiverTx,
  buildExecuteEmergencyWithdrawalTx,
  submitTransaction
} from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';

export const useEmergencyWithdrawal = (
  receiverAddress: string | null,
  onSuccess?: (action: 'requested' | 'cancelled' | 'executed', hash: string) => void
) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const requestEmergency = async (bucketId: number, amount: number, _senderAddress: string) => {
    if (!receiverAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const unsignedXDR = await buildRequestEmergencyWithdrawalTx(receiverAddress, bucketId, amount);
      const signedXDR = await signTxWithFreighter(unsignedXDR, receiverAddress);
      const hash = await submitTransaction(signedXDR);
      setTxHash(hash);

      if (onSuccess) {
        onSuccess('requested', hash);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to request emergency withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEmergencyReceiver = async (bucketId: number, _amount?: number) => {
    if (!receiverAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const unsignedXDR = await buildCancelEmergencyWithdrawalReceiverTx(receiverAddress, bucketId);
      const signedXDR = await signTxWithFreighter(unsignedXDR, receiverAddress);
      const hash = await submitTransaction(signedXDR);
      setTxHash(hash);

      if (typeof window !== 'undefined') {
        localStorage.setItem(`cooldown_cancel_${receiverAddress}_${bucketId}`, Math.floor(Date.now() / 1000).toString());
      }

      if (onSuccess) {
        onSuccess('cancelled', hash);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to cancel emergency request');
    } finally {
      setIsLoading(false);
    }
  };

  const executeEmergency = async (bucketId: number, _amount: number) => {
    if (!receiverAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const unsignedXDR = await buildExecuteEmergencyWithdrawalTx(receiverAddress, bucketId);
      const signedXDR = await signTxWithFreighter(unsignedXDR, receiverAddress);
      const hash = await submitTransaction(signedXDR);
      setTxHash(hash);

      if (onSuccess) {
        onSuccess('executed', hash);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to execute emergency withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requestEmergency,
    cancelEmergencyReceiver,
    executeEmergency,
    isLoading,
    error,
    txHash
  };
};
