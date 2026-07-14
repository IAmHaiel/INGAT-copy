import { useState, useEffect, useCallback } from 'react';
import { fetchSentTransactions } from '@/lib/supabase';
import { fetchBucketBalances, buildWithdrawGoalSenderTx, submitTransaction } from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';
import { insertTransaction } from '@/lib/supabase';
import { useWalletContext } from '@/context/WalletContext';
import { BucketState } from '@/types/bucket';

export interface SenderBucketState extends BucketState {
  receiverAddress: string;
}

export const useSenderBuckets = (senderAddress: string | null) => {
  const { supabaseClient } = useWalletContext();
  const [buckets, setBuckets] = useState<SenderBucketState[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isWithdrawing, setIsWithdrawing] = useState<number | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const fetchBuckets = useCallback(async (silent = false) => {
    if (!supabaseClient || !senderAddress) {
      setBuckets([]);
      return;
    }

    if (!silent) setIsLoading(true);
    if (!silent) setError(null);

    try {
      // 1. Fetch transaction history to get all unique receiver addresses
      const rows = await fetchSentTransactions(senderAddress, supabaseClient);
      const deposits = rows.filter((r) => r.type === 'deposit');
      const uniqueReceivers = Array.from(new Set(deposits.map((d) => d.receiver_address)));

      // 2. Fetch bucket balances on-chain for each receiver address
      const allSenderBuckets: SenderBucketState[] = [];
      
      await Promise.all(
        uniqueReceivers.map(async (receiver) => {
          try {
            const receiverBuckets = await fetchBucketBalances(receiver);
            // 3. Filter for buckets created by this sender with positive balance
            const senderMatches = receiverBuckets
              .filter((b) => b.sender === senderAddress && (b.spendingBalance > 0 || b.goalBalance > 0))
              .map((b) => ({
                ...b,
                receiverAddress: receiver,
              }));
            allSenderBuckets.push(...senderMatches);
          } catch (err) {
            console.error(`Failed to fetch bucket balances for receiver ${receiver}:`, err);
          }
        })
      );

      // Sort by unlockDate
      allSenderBuckets.sort((a, b) => b.unlockDate - a.unlockDate);
      setBuckets(allSenderBuckets);
    } catch (err) {
      console.error('Error in fetchBuckets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sender buckets');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [senderAddress, supabaseClient]);

  const withdrawSenderGoal = async (receiverAddress: string, bucketId: number, amount: number, unlockDate?: number): Promise<boolean> => {
    if (!senderAddress) {
      setWithdrawError('Wallet not connected');
      return false;
    }

    if (amount <= 0) {
      setWithdrawError('Amount must be greater than zero');
      return false;
    }

    setIsWithdrawing(bucketId);
    setWithdrawError(null);
    setTxHash(null);

    try {
      const unsignedXDR = await buildWithdrawGoalSenderTx(senderAddress, receiverAddress, bucketId, amount);
      const signedXDR = await signTxWithFreighter(unsignedXDR, senderAddress);
      const hash = await submitTransaction(signedXDR);
      setTxHash(hash);

      // Persist to Supabase
      await insertTransaction({
        tx_hash: hash,
        type: 'withdraw_goal',
        sender_address: senderAddress,
        receiver_address: receiverAddress,
        amount,
        spending_amount: null,
        goal_amount: amount,
        split_ratio: null,
        unlock_date: unlockDate || null,
      }, supabaseClient);

      // Refresh buckets
      await fetchBuckets(true);
      return true;
    } catch (err) {
      console.error('Sender withdrawal failed:', err);
      setWithdrawError(err instanceof Error ? err.message : 'Withdrawal failed');
      return false;
    } finally {
      setIsWithdrawing(null);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchBuckets();
      }
    });
    return () => {
      active = false;
    };
  }, [senderAddress, fetchBuckets]);

  return {
    buckets,
    isLoading,
    error,
    refreshBuckets: fetchBuckets,
    withdrawSenderGoal,
    isWithdrawing,
    withdrawError,
    txHash,
  };
};
