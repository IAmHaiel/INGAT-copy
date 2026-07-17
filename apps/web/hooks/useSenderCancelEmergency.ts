import { useState } from 'react';
import {
  buildCancelEmergencyWithdrawalTx,
  submitTransaction,
  fetchBucketBalances,
} from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';

export const useSenderCancelEmergency = (
  senderAddress: string | null,
  onSuccess?: (hash: string) => void
) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const cancelEmergency = async (receiverAddress: string, bucketId: number) => {
    if (!senderAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Validate bucket exists on-chain before calling contract
      const buckets = await fetchBucketBalances(receiverAddress);
      const bucketExists = buckets.some((b) => b.id === bucketId);

      if (!bucketExists) {
        if (onSuccess) {
          onSuccess('stale_dismissed');
        }
        return;
      }

      const unsignedXDR = await buildCancelEmergencyWithdrawalTx(senderAddress, receiverAddress, bucketId);
      const signedXDR = await signTxWithFreighter(unsignedXDR, senderAddress);
      const hash = await submitTransaction(signedXDR);
      setTxHash(hash);

      if (typeof window !== 'undefined') {
        localStorage.setItem(`cooldown_cancel_${receiverAddress}_${bucketId}`, Math.floor(Date.now() / 1000).toString());
      }

      if (onSuccess) {
        onSuccess(hash);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to cancel receiver emergency request');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cancelEmergency,
    isLoading,
    error,
    txHash
  };
};
