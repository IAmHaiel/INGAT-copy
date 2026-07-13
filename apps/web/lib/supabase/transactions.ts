import { supabase } from './client';
import { TransactionRow, TransactionInsert } from './types';

const TABLE = 'transactions';

/**
 * Insert a transaction record into Supabase.
 * Called after a blockchain transaction is confirmed on-chain.
 * Failures are logged but do not throw — the on-chain tx is already confirmed.
 */
export async function insertTransaction(data: TransactionInsert): Promise<void> {
  if (!supabase) {
    console.warn('[Supabase] Client not configured. Skipping transaction persistence.');
    return;
  }

  const { error } = await supabase.from(TABLE).insert(data);

  if (error) {
    // Duplicate tx_hash is expected if the same tx was already persisted (e.g. page refresh)
    if (error.code === '23505') {
      console.info('[Supabase] Transaction already persisted:', data.tx_hash);
      return;
    }
    console.error('[Supabase] Failed to insert transaction:', error.message);
  }
}

/**
 * Fetch all transactions where the given address is the sender OR receiver.
 * Returns most recent first.
 */
export async function fetchTransactionsByAddress(address: string): Promise<TransactionRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .or(`sender_address.eq.${address},receiver_address.eq.${address}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Failed to fetch transactions:', error.message);
    return [];
  }

  return (data as TransactionRow[]) || [];
}

/**
 * Fetch transactions sent by the given address (deposits initiated by this user).
 * Returns most recent first.
 */
export async function fetchSentTransactions(address: string): Promise<TransactionRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('sender_address', address)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Failed to fetch sent transactions:', error.message);
    return [];
  }

  return (data as TransactionRow[]) || [];
}

/**
 * Fetch transactions received by the given address.
 * Includes deposits where this user is the receiver, and any withdrawals they performed.
 * Returns most recent first.
 */
export async function fetchReceivedTransactions(address: string): Promise<TransactionRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('receiver_address', address)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Failed to fetch received transactions:', error.message);
    return [];
  }

  return (data as TransactionRow[]) || [];
}
