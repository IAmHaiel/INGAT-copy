import { useState, useEffect, useCallback } from 'react';
import { fetchSentTransactions, fetchTransactionsByAddress } from '@/lib/supabase';
import { fetchBucketBalances } from '@/lib/stellar/contract';
import { useWalletContext } from '@/context/WalletContext';
import { TransactionRow } from '@/lib/supabase/types';
import { BucketState } from '@/types/bucket';

export type BucketGoalStatus = 'locked' | 'unlocked' | 'withdrawn' | 'emergency_pending' | 'emergency_executed' | 'spending_only';

export interface EnrichedBucketEntry {
  id: string; // original deposit tx hash
  receiverAddress: string;
  receiverName: string | null;
  bucketIdOnChain: number | null;
  
  // Deposit details
  depositTxHash: string;
  depositDate: number; // unix timestamp
  depositAmount: number;
  spendingAmount: number;
  goalAmount: number;
  splitRatio: number;
  unlockDate: number; // unix timestamp

  // Live on-chain balances
  liveSpendingBalance: number | null;
  liveGoalBalance: number | null;
  
  // Withdrawal details (from Supabase correlation)
  goalWithdrawalTxHash: string | null;
  goalWithdrawalDate: number | null;
  spendingWithdrawalTxHash: string | null;
  spendingWithdrawalDate: number | null;

  // Computed status
  status: BucketGoalStatus;
}

export const useBucketHistory = (senderAddress: string | null) => {
  const { supabaseClient } = useWalletContext();
  const [entries, setEntries] = useState<EnrichedBucketEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!senderAddress || !supabaseClient) {
      setEntries([]);
      return;
    }

    if (!silent) setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch all transactions sent by the sender
      const allSent = await fetchSentTransactions(senderAddress, supabaseClient);
      const deposits = allSent.filter((r) => r.type === 'deposit');
      const uniqueReceivers = Array.from(new Set(deposits.map((d) => d.receiver_address)));

      // 2. Fetch in parallel for each receiver: on-chain buckets and transaction history
      const receiverDataMap: Record<
        string,
        { buckets: BucketState[]; txs: TransactionRow[] }
      > = {};

      await Promise.all(
        uniqueReceivers.map(async (receiver) => {
          try {
            const [buckets, txs] = await Promise.all([
              fetchBucketBalances(receiver).catch(() => [] as BucketState[]),
              fetchTransactionsByAddress(receiver, supabaseClient).catch(() => [] as TransactionRow[]),
            ]);
            receiverDataMap[receiver] = { buckets, txs };
          } catch (err) {
            console.error(`Error loading data for receiver ${receiver}:`, err);
            receiverDataMap[receiver] = { buckets: [], txs: [] };
          }
        })
      );

      // 3. Import address book contact names (localStorage)
      const storedContactsStr = typeof window !== 'undefined' ? localStorage.getItem('ingat_contacts') : null;
      const contacts: Array<{ name: string; address: string }> = storedContactsStr
        ? JSON.parse(storedContactsStr)
        : [];
      const contactMap = new Map(contacts.map((c) => [c.address, c.name]));

      const now = Math.floor(Date.now() / 1000);

      // 4. Enrich each deposit row
      const enrichedEntries: EnrichedBucketEntry[] = deposits.map((deposit) => {
        const receiver = deposit.receiver_address;
        const data = receiverDataMap[receiver] || { buckets: [], txs: [] };
        
        // Find matching on-chain bucket by unlockDate
        const liveBucket = data.buckets.find(
          (b) => b.unlockDate === deposit.unlock_date && b.sender === senderAddress
        );

        // Find matching withdrawals in Supabase by unlock_date correlation
        const goalWithdrawal = data.txs.find(
          (t) => t.type === 'withdraw_goal' && t.unlock_date === deposit.unlock_date
        );
        const spendingWithdrawal = data.txs.find(
          (t) => t.type === 'withdraw_spending' && t.unlock_date === deposit.unlock_date
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
            // Fallback to Supabase data if blockchain simulation failed or key expired
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
          receiverAddress: receiver,
          receiverName: contactMap.get(receiver) || null,
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
        };
      });

      setEntries(enrichedEntries);
    } catch (err) {
      console.error('Error fetching bucket history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bucket history');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [senderAddress, supabaseClient]);

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
  }, [senderAddress, fetchHistory]);

  return {
    entries,
    isLoading,
    error,
    refreshHistory: fetchHistory,
  };
};
