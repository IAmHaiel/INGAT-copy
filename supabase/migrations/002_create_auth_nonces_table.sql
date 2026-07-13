-- INGAT - Auth Nonces Table Migration
-- Stores temporary nonces for wallet challenge-response authentication.
-- Nonces expire after 5 minutes and are single-use.

CREATE TABLE IF NOT EXISTS auth_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  nonce TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  used BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_auth_nonces_wallet ON auth_nonces (wallet_address, nonce);
CREATE INDEX idx_auth_nonces_expires ON auth_nonces (expires_at);

ALTER TABLE auth_nonces ENABLE ROW LEVEL SECURITY;
-- Only accessed by service_role (server-side API routes).
-- No permissive policies = anon/authenticated cannot access directly.
