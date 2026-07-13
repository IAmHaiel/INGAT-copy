# Bug Fix: Freighter signMessage Type Mismatch in Browser

- **Date:** 2026-07-13
- **File affected:** `apps/web/lib/stellar/freighter.ts`

### What Broke
The Next.js production build failed with a TypeScript type checking error:
`Type error: Type 'string | Buffer<ArrayBufferLike>' is not assignable to type 'string'. Type 'Buffer<ArrayBufferLike>' is not assignable to type 'string'.`

### Root Cause
The Freighter SDK `signMessage` function returns a signature value of type `string | Buffer<ArrayBufferLike>`. Our new `signMessageWithFreighter` wrapper had a return type annotation of `Promise<string>`, which triggered a compiler error when returning `result.signedMessage` directly.

### The Fix
Updated `signMessageWithFreighter` to inspect the returned signature value. If it is a string, it returns it directly. If it is a `Buffer` or `ArrayBufferLike` object, it converts it safely to a base64 encoded string using the standard browser `btoa()` API. This resolves the type error and ensures compatability with both browser execution environments and the server-side verify endpoint.
