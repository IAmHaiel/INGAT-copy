/**
 * Supabase database types for the transactions table.
 */

export type TransactionType = 'deposit' | 'withdraw_spending' | 'withdraw_goal';

/** Row shape returned from Supabase SELECT queries */
export interface TransactionRow {
  id: string;
  tx_hash: string;
  type: TransactionType;
  sender_address: string;
  receiver_address: string;
  amount: number;
  spending_amount: number | null;
  goal_amount: number | null;
  split_ratio: number | null;
  unlock_date: number | null;
  goal_label: string | null;
  created_at: string;
}

/** Shape for INSERT operations (id and created_at are auto-generated) */
export interface TransactionInsert {
  tx_hash: string;
  type: TransactionType;
  sender_address: string;
  receiver_address: string;
  amount: number;
  spending_amount?: number | null;
  goal_amount?: number | null;
  split_ratio?: number | null;
  unlock_date?: number | null;
  goal_label?: string | null;
}

export type EmergencyRequestStatus = 'pending' | 'executed' | 'cancelled';

export interface EmergencyRequestRow {
  id: string;
  tx_hash: string;
  receiver_address: string;
  sender_address: string;
  bucket_id: number;
  amount: number;
  requested_at: number;
  cooldown_ends_at: number;
  status: EmergencyRequestStatus;
  cancel_tx_hash: string | null;
  execute_tx_hash: string | null;
  created_at: string;
}

export interface EmergencyRequestInsert {
  tx_hash: string;
  receiver_address: string;
  sender_address: string;
  bucket_id: number;
  amount: number;
  requested_at: number;
  cooldown_ends_at: number;
  status?: EmergencyRequestStatus;
}

