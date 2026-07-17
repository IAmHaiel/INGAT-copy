import { useState, useEffect, useCallback } from 'react';
import { fetchBucketBalances, buildWithdrawGoalSenderTx, submitTransaction } from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';
import { fetchDepositEvents } from '@/lib/stellar/contract/events';
import { BucketState } from '@/types/bucket';

export interface SenderBucketState extends BucketState {
  receiverAddress: string;
  goalLabel: string | null;
}

export const useSenderBuckets = (senderAddress: string | null) => {
  const [buckets, setBuckets] = useState<SenderBucketState[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isWithdrawing, setIsWithdrawing] = useState<number | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const fetchBuckets = useCallback(async (silent = false) => {
    if (!senderAddress) {
      setBuckets([]);
      return;
    }

    if (!silent) setIsLoading(true);
    if (!silent) setError(null);

    try {
      // Get receiver addresses from on-chain deposit events
      const events = await fetchDepositEvents(senderAddress);
      const uniqueReceivers = Array.from(new Set(events.map((e) => e.receiver)));

      // Build a map of deposits keyed by receiver+unlockDate for goalLabel lookup
      const depositMap = new Map<string, string | null>();
      for (const event of events) {
        depositMap.set(`${event.receiver}_${event.unlockDate}`, event.goalLabel);
      }

      const allSenderBuckets: SenderBucketState[] = [];

      await Promise.all(
        uniqueReceivers.map(async (receiver) => {
          try {
            const receiverBuckets = await fetchBucketBalances(receiver);
            const senderMatches = receiverBuckets
              .filter((b) => b.sender === senderAddress && (b.spendingBalance > 0 || b.goalBalance > 0))
              .map((b) => {
                const goalLabel = depositMap.get(`${receiver}_${b.unlockDate}`) ?? null;
                return {
                  ...b,
                  receiverAddress: receiver,
                  goalLabel,
                };
              });
            allSenderBuckets.push(...senderMatches);
          } catch (err) {
            console.error(`Failed to fetch bucket balances for receiver ${receiver}:`, err);
          }
        })
      );

      allSenderBuckets.sort((a, b) => b.unlockDate - a.unlockDate);
      setBuckets(allSenderBuckets);
    } catch (err) {
      console.error('Error in fetchBuckets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sender buckets');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [senderAddress]);

  const withdrawSenderGoal = async (receiverAddress: string, bucketId: number, amount: number, _unlockDate?: number): Promise<boolean> => {
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

    const interval = setInterval(() => {
      if (active) {
        fetchBuckets(true);
      }
    }, 15000);

    return () => {
      active = false;
      clearInterval(interval);
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
