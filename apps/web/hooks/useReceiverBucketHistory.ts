import { useState, useEffect, useCallback } from 'react';
import { fetchBucketBalances } from '@/lib/stellar/contract';
import { fetchReceivedDepositEvents } from '@/lib/stellar/contract/events';
import { EnrichedBucketEntry, BucketGoalStatus } from './useBucketHistory';

export const useReceiverBucketHistory = (receiverAddress: string | null) => {
  const [entries, setEntries] = useState<EnrichedBucketEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!receiverAddress) {
      setEntries([]);
      return;
    }

    if (!silent) setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch received deposit events from on-chain
      const incomingDeposits = await fetchReceivedDepositEvents(receiverAddress);

      // 2. Fetch on-chain live buckets for the receiver
      const liveBuckets = await fetchBucketBalances(receiverAddress).catch(() => []);

      // 3. Import address book contact names (localStorage)
      const storedContactsStr = typeof window !== 'undefined' ? localStorage.getItem('ingat_contacts') : null;
      const contacts: Array<{ name: string; address: string }> = storedContactsStr
        ? JSON.parse(storedContactsStr)
        : [];
      const contactMap = new Map(contacts.map((c) => [c.address, c.name]));

      const now = Math.floor(Date.now() / 1000);

      // 4. Enrich each deposit event
      const enrichedEntries: EnrichedBucketEntry[] = incomingDeposits.map((deposit) => {
        const sender = deposit.sender;

        const liveBucket = liveBuckets.find(
          (b) => b.unlockDate === deposit.unlockDate && b.sender === sender
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
          receiverAddress: sender,
          receiverName: contactMap.get(sender) || null,
          bucketIdOnChain: liveBucket ? liveBucket.id : null,

          depositTxHash: deposit.id,
          depositDate: deposit.timestamp,
          depositAmount: deposit.amount,
          spendingAmount: spendingAllocated,
          goalAmount: goalAllocated,
          splitRatio: deposit.splitRatio ?? 100,
          unlockDate: deposit.unlockDate ?? 0,

          liveSpendingBalance: liveBucket ? liveBucket.spendingBalance : null,
          liveGoalBalance: liveBucket ? liveBucket.goalBalance : null,

          goalWithdrawalTxHash: null,
          goalWithdrawalDate: null,
          spendingWithdrawalTxHash: null,
          spendingWithdrawalDate: null,

          status,
          goalLabel: deposit.goalLabel ?? null,
        };
      });

      setEntries(enrichedEntries);
    } catch (err) {
      console.error('Error fetching receiver bucket history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch received bucket history');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [receiverAddress]);

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
  }, [receiverAddress, fetchHistory]);

  return {
    entries,
    isLoading,
    error,
    refreshHistory: fetchHistory,
  };
};
