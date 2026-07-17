import { useState, useEffect, useCallback } from 'react';
import { DepositAllocation } from '@/types/transaction';
import { fetchDepositEvents, fetchReceivedDepositEvents } from '@/lib/stellar/contract/events';

export const useDashboardTransactions = (address: string | null) => {
  const [sentTransactions, setSentTransactions] = useState<DepositAllocation[]>([]);
  const [receivedTransactions, setReceivedTransactions] = useState<DepositAllocation[]>([]);
  const [allTransactions, setAllTransactions] = useState<DepositAllocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchTransactions = useCallback(async (silent = false) => {
    if (!address) {
      setSentTransactions([]);
      setReceivedTransactions([]);
      setAllTransactions([]);
      return;
    }
    if (!silent) setIsLoading(true);
    try {
      const [sent, received] = await Promise.all([
        fetchDepositEvents(address),
        fetchReceivedDepositEvents(address),
      ]);

      setSentTransactions(sent);
      setReceivedTransactions(received);
      setAllTransactions([...sent, ...received]);
    } catch (err) {
      console.error('Failed to fetch transaction events:', err);
      setAllTransactions([]);
      setSentTransactions([]);
      setReceivedTransactions([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchTransactions();
      }
    });

    const interval = setInterval(() => {
      if (active) {
        fetchTransactions(true);
      }
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [address, fetchTransactions]);

  return {
    allTransactions,
    sentTransactions,
    receivedTransactions,
    isLoading,
    refreshTransactions: fetchTransactions,
  };
};
