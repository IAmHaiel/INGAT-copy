import { supabase } from './client';
import { TransactionRow, TransactionInsert } from './types';
import { SupabaseClient } from '@supabase/supabase-js';

const TABLE = 'transactions';

function getClient(client?: SupabaseClient | null): SupabaseClient | null {
  return client || supabase;
}

export async function insertTransaction(
  data: TransactionInsert,
  client?: SupabaseClient | null
): Promise<void> {
  const sb = getClient(client);
  if (!sb) {
    console.warn('[Supabase] Client not configured.');
    return;
  }

  const { error } = await sb.from(TABLE).insert(data);
  if (error) {
    if (error.code === '23505') {
      console.info('[Supabase] Transaction already persisted:', data.tx_hash);
      return;
    }
    console.error('[Supabase] Failed to insert transaction:', error.message);
  }
}

export async function fetchTransactionsByAddress(
  address: string,
  client?: SupabaseClient | null
): Promise<TransactionRow[]> {
  const sb = getClient(client);
  if (!sb) return [];

  const { data, error } = await sb
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

export async function fetchSentTransactions(
  address: string,
  client?: SupabaseClient | null
): Promise<TransactionRow[]> {
  const sb = getClient(client);
  if (!sb) return [];

  const { data, error } = await sb
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

export async function fetchReceivedTransactions(
  address: string,
  client?: SupabaseClient | null
): Promise<TransactionRow[]> {
  const sb = getClient(client);
  if (!sb) return [];

  const { data, error } = await sb
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
