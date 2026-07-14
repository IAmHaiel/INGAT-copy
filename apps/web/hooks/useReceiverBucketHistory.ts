import { useState, useEffect, useCallback } from 'react';
import { fetchTransactionsByAddress } from '@/lib/supabase';
import { fetchBucketBalances } from '@/lib/stellar/contract';
import { useWalletContext } from '@/context/WalletContext';
import { EnrichedBucketEntry, BucketGoalStatus } from './useBucketHistory';

export const useReceiverBucketHistory = (receiverAddress: string | null) => {
  const { supabaseClient } = useWalletContext();
  const [entries, setEntries] = useState<EnrichedBucketEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!receiverAddress || !supabaseClient) {
      setEntries([]);
      return;
    }

    if (!silent) setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch all transactions related to this address
      const allTxs = await fetchTransactionsByAddress(receiverAddress, supabaseClient);
      
      // Filter for deposits sent TO the user by others
      const incomingDeposits = allTxs.filter(
        (r) => r.type === 'deposit' && r.receiver_address === receiverAddress && r.sender_address !== receiverAddress
      );

      // 2. Fetch on-chain live buckets for the receiver
      const liveBuckets = await fetchBucketBalances(receiverAddress).catch(() => []);

      // 3. Import address book contact names (localStorage)
      const storedContactsStr = typeof window !== 'undefined' ? localStorage.getItem('ingat_contacts') : null;
      const contacts: Array<{ name: string; address: string }> = storedContactsStr
        ? JSON.parse(storedContactsStr)
        : [];
      const contactMap = new Map(contacts.map((c) => [c.address, c.name]));

      const now = Math.floor(Date.now() / 1000);

      // 4. Enrich each deposit row
      const enrichedEntries: EnrichedBucketEntry[] = incomingDeposits.map((deposit) => {
        const sender = deposit.sender_address;
        
        // Find matching on-chain bucket by unlockDate
        const liveBucket = liveBuckets.find(
          (b) => b.unlockDate === deposit.unlock_date && b.sender === sender
        );

        // Find matching withdrawals in the transaction log
        const goalWithdrawal = allTxs.find(
          (t) => t.type === 'withdraw_goal' && t.unlock_date === deposit.unlock_date && t.sender_address === receiverAddress
        );
        const spendingWithdrawal = allTxs.find(
          (t) => t.type === 'withdraw_spending' && t.unlock_date === deposit.unlock_date && t.sender_address === receiverAddress
        );

        const spendingAllocated = Number(deposit.amount) * ((deposit.split_ratio ?? 100) / 100);
        const goalAllocated = Number(deposit.amount) - spendingAllocated;

        // Compute status
        let status: BucketGoalStatus = 'spending_only';
        if (goalAllocated > 0) {
          if (liveBucket) {
            if (liveBucket.goalBalance === 0) {
              status = 'withdrawn';
            } else if (now < liveBucket.unlockDate) {
              status = 'locked';
            } else {
              status = 'unlocked';
            }
          } else {
            if (goalWithdrawal) {
              status = 'withdrawn';
            } else if (deposit.unlock_date && now < deposit.unlock_date) {
              status = 'locked';
            } else {
              status = 'unlocked';
            }
          }
        }

        return {
          id: deposit.tx_hash,
          // Reuse receiverAddress field to contain the Sender address for UI consistency
          receiverAddress: sender,
          receiverName: contactMap.get(sender) || null,
          bucketIdOnChain: liveBucket ? liveBucket.id : null,
          
          depositTxHash: deposit.tx_hash,
          depositDate: Math.floor(new Date(deposit.created_at).getTime() / 1000),
          depositAmount: Number(deposit.amount),
          spendingAmount: spendingAllocated,
          goalAmount: goalAllocated,
          splitRatio: deposit.split_ratio ?? 100,
          unlockDate: deposit.unlock_date ?? 0,

          liveSpendingBalance: liveBucket ? liveBucket.spendingBalance : null,
          liveGoalBalance: liveBucket ? liveBucket.goalBalance : null,

          goalWithdrawalTxHash: goalWithdrawal ? goalWithdrawal.tx_hash : null,
          goalWithdrawalDate: goalWithdrawal ? Math.floor(new Date(goalWithdrawal.created_at).getTime() / 1000) : null,
          spendingWithdrawalTxHash: spendingWithdrawal ? spendingWithdrawal.tx_hash : null,
          spendingWithdrawalDate: spendingWithdrawal ? Math.floor(new Date(spendingWithdrawal.created_at).getTime() / 1000) : null,

          status,
          goalLabel: deposit.goal_label ?? null,
        };
      });

      setEntries(enrichedEntries);
    } catch (err) {
      console.error('Error fetching receiver bucket history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch received bucket history');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [receiverAddress, supabaseClient]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchHistory();
      }
    });

    const interval = setInterval(() => {
      if (active) {
        fetchHistory(true);
      }
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [receiverAddress, fetchHistory]);

  return {
    entries,
    isLoading,
    error,
    refreshHistory: fetchHistory,
  };
};
