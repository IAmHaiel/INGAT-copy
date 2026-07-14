# Fix: Jest Unit Test Timeouts due to Infinite Re-renders

## What Broke
The unit tests `useBucketHistory.test.ts` and `useSenderBuckets.test.ts` timed out (exceeded 5000ms limit) during execution.

## Root Cause
Both hooks invoke asynchronous data fetching inside a `useEffect` loop triggered by changes to memoized callback functions:
- `useBucketHistory` depends on `fetchHistory`.
- `useSenderBuckets` depends on `fetchBuckets`.

These callback hooks list `supabaseClient` (retrieved from `useWalletContext`) in their dependencies. The test files mocked `useWalletContext` using an inline function that returned a new object literal (`{}`) or `null` on each call. Consequently, on every render, the hook received a new object reference for `supabaseClient`, triggering a dependency change, scheduling a re-fetch, updating the React state, and initiating an infinite rendering loop.

## Fix
Declared a static `mockSupabaseClient` reference at the file scope in the test files:
```typescript
const mockSupabaseClient = {};
jest.mock('@/context/WalletContext', () => ({
  useWalletContext: () => ({ supabaseClient: mockSupabaseClient }),
}));
```
This guarantees the hook receives a stable object reference on every render, resolving the loop.
