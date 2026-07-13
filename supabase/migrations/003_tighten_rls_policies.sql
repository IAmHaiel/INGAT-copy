-- Drop old permissive policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Anyone can insert transactions" ON transactions;

-- SELECT: enforce wallet_address from JWT
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  USING (
    sender_address = coalesce(
      current_setting('request.jwt.claims', true)::json->>'wallet_address',
      current_setting('request.jwt.claims', true)::json->>'sub'
    )
    OR receiver_address = coalesce(
      current_setting('request.jwt.claims', true)::json->>'wallet_address',
      current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- INSERT: only your own transactions
CREATE POLICY "Authenticated users can insert their own transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (
    sender_address = coalesce(
      current_setting('request.jwt.claims', true)::json->>'wallet_address',
      current_setting('request.jwt.claims', true)::json->>'sub'
    )
    OR receiver_address = coalesce(
      current_setting('request.jwt.claims', true)::json->>'wallet_address',
      current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );
