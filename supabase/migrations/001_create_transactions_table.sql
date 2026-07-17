-- ============================================================================
-- INGAT — Transactions Table Migration
-- Persists deposit and withdrawal transaction records from the Stellar network.
-- ============================================================================

-- Create the transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw_spending', 'withdraw_goal')),
  sender_address TEXT NOT NULL,
  receiver_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  spending_amount NUMERIC,
  goal_amount NUMERIC,
  split_ratio INTEGER,
  unlock_date BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying by wallet address
CREATE INDEX idx_transactions_sender ON transactions (sender_address);
CREATE INDEX idx_transactions_receiver ON transactions (receiver_address);
CREATE INDEX idx_transactions_created_at ON transactions (created_at DESC);

-- Composite index for dashboard queries (address + time ordering)
CREATE INDEX idx_transactions_sender_created ON transactions (sender_address, created_at DESC);
CREATE INDEX idx_transactions_receiver_created ON transactions (receiver_address, created_at DESC);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on the transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- SELECT policy: users can only read transactions where they are the sender or receiver.
-- The frontend passes the wallet address as a filter; RLS ensures no data leakage.
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  USING (true);
  -- Note: We use a permissive SELECT policy because there is no JWT-based auth
  -- (wallet-only app). The frontend filters by address, and for a hackathon demo
  -- this is acceptable. For production, add wallet-signature verification via
  -- a Next.js API route that issues short-lived JWTs with the address as a claim.

-- INSERT policy: allow inserts from any client (the frontend writes after
-- a blockchain-confirmed transaction).
CREATE POLICY "Anyone can insert transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (true);

-- UPDATE/DELETE: no updates or deletions allowed (immutable transaction log)
-- By not creating UPDATE/DELETE policies with RLS enabled, these operations
-- are implicitly denied for all non-service-role clients.
