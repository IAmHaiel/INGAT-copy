import { useState, useEffect, useCallback } from 'react';
import { fetchBucketBalances } from '@/lib/stellar/contract';
import { fetchDepositEvents } from '@/lib/stellar/contract/events';
import { BucketState } from '@/types/bucket';

export type BucketGoalStatus = 'locked' | 'unlocked' | 'withdrawn' | 'emergency_pending' | 'emergency_executed' | 'spending_only';

export interface EnrichedBucketEntry {
  id: string;
  receiverAddress: string;
  receiverName: string | null;
  bucketIdOnChain: number | null;

  // Deposit details
  depositTxHash: string;
  depositDate: number;
  depositAmount: number;
  spendingAmount: number;
  goalAmount: number;
  splitRatio: number;
  unlockDate: number;

  // Live on-chain balances
  liveSpendingBalance: number | null;
  liveGoalBalance: number | null;

  // Withdrawal details
  goalWithdrawalTxHash: string | null;
  goalWithdrawalDate: number | null;
  spendingWithdrawalTxHash: string | null;
  spendingWithdrawalDate: number | null;

  // Computed status
  status: BucketGoalStatus;
  goalLabel?: string | null;
}

export const useBucketHistory = (senderAddress: string | null) => {
  const [entries, setEntries] = useState<EnrichedBucketEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!senderAddress) {
      setEntries([]);
      return;
    }

    if (!silent) setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch deposit events from on-chain
      const deposits = await fetchDepositEvents(senderAddress);
      const uniqueReceivers = Array.from(new Set(deposits.map((d) => d.receiver)));

      // 2. Fetch on-chain buckets for each receiver
      const receiverBucketsMap: Record<string, BucketState[]> = {};

      await Promise.all(
        uniqueReceivers.map(async (receiver) => {
          try {
            const buckets = await fetchBucketBalances(receiver).catch(() => [] as BucketState[]);
            receiverBucketsMap[receiver] = buckets;
          } catch {
            receiverBucketsMap[receiver] = [];
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

      // 4. Enrich each deposit event
      const enrichedEntries: EnrichedBucketEntry[] = deposits.map((deposit) => {
        const receiver = deposit.receiver;
        const data = receiverBucketsMap[receiver] || [];

        const liveBucket = data.find(
          (b) => b.unlockDate === deposit.unlockDate && b.sender === senderAddress
        );

        const spendingAllocated = deposit.amount * (deposit.splitRatio / 100);
        const goalAllocated = deposit.amount - spendingAllocated;

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
            if (liveBucket.emergencyRequest) {
              if (liveBucket.emergencyRequest.status === 'Pending') {
                status = 'emergency_pending';
              } else if (liveBucket.emergencyRequest.status === 'Executed') {
                status = 'emergency_executed';
              }
            }
          } else {
            if (deposit.unlockDate && now < deposit.unlockDate) {
              status = 'locked';
            } else {
              status = 'unlocked';
            }
          }
        }

        return {
          id: deposit.id,
          receiverAddress: receiver,
          receiverName: contactMap.get(receiver) || null,
          bucketIdOnChain: liveBucket ? liveBucket.id : null,

          depositTxHash: deposit.id,
          depositDate: deposit.timestamp,
          depositAmount: deposit.amount,
          spendingAmount: spendingAllocated,
          goalAmount: goalAllocated,
          splitRatio: deposit.splitRatio,
          unlockDate: deposit.unlockDate ?? 0,

          liveSpendingBalance: liveBucket ? liveBucket.spendingBalance : null,
          liveGoalBalance: liveBucket ? liveBucket.goalBalance : null,

          goalWithdrawalTxHash: liveBucket && liveBucket.goalBalance === 0 ? deposit.id : null,
          goalWithdrawalDate: null,
          spendingWithdrawalTxHash: null,
          spendingWithdrawalDate: null,

          status,
          goalLabel: deposit.goalLabel ?? null,
        };
      });

      setEntries(enrichedEntries);
    } catch (err) {
      console.error('Error fetching bucket history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bucket history');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [senderAddress]);

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
    }, 15000);

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
