import { useState } from 'react';
import {
  buildRequestEmergencyWithdrawalTx,
  buildCancelEmergencyWithdrawalReceiverTx,
  buildExecuteEmergencyWithdrawalTx,
  submitTransaction
} from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';
import {
  insertEmergencyRequest,
  updateEmergencyRequestStatus,
  insertTransaction,
  getActiveEmergencyRequest
} from '@/lib/supabase';
import { useWalletContext } from '@/context/WalletContext';

export const useEmergencyWithdrawal = (
  receiverAddress: string | null,
  onSuccess?: (action: 'requested' | 'cancelled' | 'executed', hash: string) => void
) => {
  const { supabaseClient } = useWalletContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const requestEmergency = async (bucketId: number, amount: number, senderAddress: string) => {
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

      const now = Math.floor(Date.now() / 1000);
      await insertEmergencyRequest({
        tx_hash: hash,
        receiver_address: receiverAddress,
        sender_address: senderAddress,
        bucket_id: bucketId,
        amount,
        requested_at: now,
        cooldown_ends_at: now + 172800,
        status: 'pending'
      }, supabaseClient);

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

  const cancelEmergencyReceiver = async (bucketId: number) => {
    if (!receiverAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const activeRequest = await getActiveEmergencyRequest(receiverAddress, bucketId, supabaseClient);
      if (!activeRequest) {
        throw new Error('No active emergency request found in database.');
      }
      const activeTxHash = activeRequest.tx_hash;

      const unsignedXDR = await buildCancelEmergencyWithdrawalReceiverTx(receiverAddress, bucketId);
      const signedXDR = await signTxWithFreighter(unsignedXDR, receiverAddress);
      const hash = await submitTransaction(signedXDR);
      setTxHash(hash);

      await updateEmergencyRequestStatus(activeTxHash, 'cancelled', hash, supabaseClient);

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

  const executeEmergency = async (bucketId: number, amount: number) => {
    if (!receiverAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const activeRequest = await getActiveEmergencyRequest(receiverAddress, bucketId, supabaseClient);
      if (!activeRequest) {
        throw new Error('No active emergency request found in database.');
      }
      const activeTxHash = activeRequest.tx_hash;

      const unsignedXDR = await buildExecuteEmergencyWithdrawalTx(receiverAddress, bucketId);
      const signedXDR = await signTxWithFreighter(unsignedXDR, receiverAddress);
      const hash = await submitTransaction(signedXDR);
      setTxHash(hash);

      // Update emergency request status to executed
      await updateEmergencyRequestStatus(activeTxHash, 'executed', hash, supabaseClient);

      // Also persist to transactions log so it shows on history
      await insertTransaction({
        tx_hash: hash,
        type: 'withdraw_goal',
        sender_address: receiverAddress,
        receiver_address: receiverAddress,
        amount,
        spending_amount: null,
        goal_amount: amount,
        split_ratio: null,
        unlock_date: null,
      }, supabaseClient);

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
