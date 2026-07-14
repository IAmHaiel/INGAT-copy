import { useState, useEffect, useCallback } from 'react';
import { fetchBucketBalances } from '@/lib/stellar/contract';
import { BucketState } from '@/types/bucket';

export const useBucketBalances = (receiverAddress: string | null) => {
  const [balances, setBalances] = useState<BucketState[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalances = useCallback(async (silent = false) => {
    if (!receiverAddress) return;
    if (!silent) setIsLoading(true);
    if (!silent) setError(null);
    try {
      const res = await fetchBucketBalances(receiverAddress);
      const activeBuckets = res.filter(b => b.spendingBalance > 0 || b.goalBalance > 0);
      setBalances(activeBuckets);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error connecting to Stellar node';
      setError(msg);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [receiverAddress]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        refreshBalances();
      }
    });
    return () => {
      active = false;
    };
  }, [receiverAddress, refreshBalances]);

  return {
    balances,
    isLoading,
    error,
    refreshBalances
  };
};
