import { useState, useEffect, useCallback } from 'react';
import { DepositAllocation } from '@/types/transaction';
import { fetchTransactionsByAddress } from '@/lib/supabase';
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

  const fetchTransactions = useCallback(async (silent = false) => {
    if (!supabaseClient || !address) {
      setSentTransactions([]);
      setReceivedTransactions([]);
      setAllTransactions([]);
      return;
    }
    if (!silent) setIsLoading(true);
    try {
      const allRows = await fetchTransactionsByAddress(address, supabaseClient);

      // Sent/Deposit Tab: Deposits sent by the user, OR withdrawals made by the user
      const sentRows = allRows.filter(r => 
        (r.type === 'deposit' && r.sender_address === address) || 
        (r.type.startsWith('withdraw') && r.sender_address === address)
      );

      // Received Tab: Only deposits where the user is strictly the receiver (not the sender)
      const receivedRows = allRows.filter(r => 
        r.type === 'deposit' && r.receiver_address === address && r.sender_address !== address
      );

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
      if (!silent) setIsLoading(false);
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
