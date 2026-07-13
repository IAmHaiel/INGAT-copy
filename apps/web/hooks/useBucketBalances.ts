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
      setBalances(res);
    } catch {
      setError('Error connecting to Stellar node');
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
