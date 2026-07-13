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
}
