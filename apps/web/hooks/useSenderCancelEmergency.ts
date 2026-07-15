import { useState } from 'react';
import {
  buildCancelEmergencyWithdrawalTx,
  submitTransaction
} from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';
import { updateEmergencyRequestStatus } from '@/lib/supabase';
import { useWalletContext } from '@/context/WalletContext';

export const useSenderCancelEmergency = (
  senderAddress: string | null,
  onSuccess?: (hash: string) => void
) => {
  const { supabaseClient } = useWalletContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const cancelEmergency = async (receiverAddress: string, bucketId: number, activeTxHash: string) => {
    if (!senderAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const unsignedXDR = await buildCancelEmergencyWithdrawalTx(senderAddress, receiverAddress, bucketId);
      const signedXDR = await signTxWithFreighter(unsignedXDR, senderAddress);
      const hash = await submitTransaction(signedXDR);
      setTxHash(hash);

      await updateEmergencyRequestStatus(activeTxHash, 'cancelled', hash, supabaseClient);

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
