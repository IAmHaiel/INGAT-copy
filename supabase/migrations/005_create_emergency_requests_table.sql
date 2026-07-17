-- ============================================================================
-- INGAT — Emergency Requests Table Migration
-- Persists early withdrawal requests and their statuses.
-- ============================================================================

CREATE TABLE IF NOT EXISTS emergency_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash          TEXT UNIQUE NOT NULL,       -- on-chain tx that created the request
  receiver_address TEXT NOT NULL,
  sender_address   TEXT NOT NULL,
  bucket_id        INTEGER NOT NULL,
  amount           NUMERIC NOT NULL,
  requested_at     BIGINT NOT NULL,            -- unix seconds (from ledger event)
  cooldown_ends_at BIGINT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'executed', 'cancelled')),
  cancel_tx_hash   TEXT,                       -- set if cancelled
  execute_tx_hash  TEXT,                       -- set if executed
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for querying by receiver/sender
CREATE INDEX IF NOT EXISTS idx_er_receiver ON emergency_requests (receiver_address);
CREATE INDEX IF NOT EXISTS idx_er_sender   ON emergency_requests (sender_address);
CREATE INDEX IF NOT EXISTS idx_er_bucket   ON emergency_requests (receiver_address, bucket_id);

-- Enable RLS
ALTER TABLE emergency_requests ENABLE ROW LEVEL SECURITY;

-- Permissive select/insert/update policies for demo
CREATE POLICY "anyone_select" ON emergency_requests FOR SELECT USING (true);
CREATE POLICY "anyone_insert" ON emergency_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_update_status" ON emergency_requests FOR UPDATE USING (true) WITH CHECK (true);
