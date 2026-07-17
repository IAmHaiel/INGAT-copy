-- ============================================================================
-- INGAT — Add goal_label column to transactions table
-- Allows senders to attach a short off-chain note/label to Goal bucket deposits.
-- ============================================================================

ALTER TABLE transactions
  ADD COLUMN goal_label TEXT DEFAULT NULL;

-- Add a check constraint to limit label length (max 100 chars)
ALTER TABLE transactions
  ADD CONSTRAINT chk_goal_label_length CHECK (goal_label IS NULL OR char_length(goal_label) <= 100);
