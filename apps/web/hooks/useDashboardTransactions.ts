import { useState, useEffect, useCallback } from 'react';
import { DepositAllocation } from '@/types/transaction';
import { fetchTransactionsByAddress, fetchSentTransactions, fetchReceivedTransactions } from '@/lib/supabase';
import { TransactionRow } from '@/lib/supabase/types';
import { useWalletContext } from '@/context/WalletContext';

/**
 * Map a Supabase TransactionRow to the frontend DepositAllocation shape.
 * This keeps all downstream components (DashboardHistoryList, etc.) unchanged.
 */
function toDepositAllocation(row: TransactionRow): DepositAllocation {
  return {
    id: row.tx_hash,
    sender: row.sender_address,
    receiver: row.receiver_address,
    amount: Number(row.amount),
    splitRatio: row.split_ratio ?? 0,
    unlockDate: row.unlock_date ?? 0,
    timestamp: Math.floor(new Date(row.created_at).getTime() / 1000),
  };
}

export const useDashboardTransactions = (address: string | null) => {
  const { supabaseClient } = useWalletContext();
  const [sentTransactions, setSentTransactions] = useState<DepositAllocation[]>([]);
  const [receivedTransactions, setReceivedTransactions] = useState<DepositAllocation[]>([]);
  const [allTransactions, setAllTransactions] = useState<DepositAllocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchTransactions = useCallback(async () => {
    if (!address) {
      setSentTransactions([]);
      setReceivedTransactions([]);
      setAllTransactions([]);
      return;
    }
    setIsLoading(true);
    try {
      const [allRows, sentRows, receivedRows] = await Promise.all([
        fetchTransactionsByAddress(address, supabaseClient),
        fetchSentTransactions(address, supabaseClient),
        fetchReceivedTransactions(address, supabaseClient),
      ]);

      const all = allRows.map(toDepositAllocation);
      const sent = sentRows.map(toDepositAllocation);
      const received = receivedRows.map(toDepositAllocation);

      setAllTransactions(all);
      setSentTransactions(sent);
      setReceivedTransactions(received);
    } catch (err) {
      console.error('Failed to fetch dashboard transactions from Supabase:', err);
      setAllTransactions([]);
      setSentTransactions([]);
      setReceivedTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, supabaseClient]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchTransactions();
      }
    });
    return () => {
      active = false;
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
