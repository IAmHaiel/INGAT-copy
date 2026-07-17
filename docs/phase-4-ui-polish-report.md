# Phase 4 — UI Polish & Bug Fix Report (v2)

**Date:** 2026-07-17  
**Commits:** `5ee22ab..f7c7c31` (19 commits)  

---

## Fix 1: Footer Layout — Moved to Root Layout

**Commit:** `da51598`  
**Issue:** Footer floated up when content was short, leaving blank space below it. When the bucket list populated, the footer moved down.

**Fix:** Removed `<Footer />` from 5 individual containers (`DashboardContainer`, `LandingContainer`, `SenderDashboardContainer`, `SenderFormPageContainer`, `PrivacyPolicyContainer`). Added `<Footer />` to the root `layout.tsx` with a `<main className="flex-1">` wrapper around `{children}`. The root `<body>` already had `flex flex-col min-h-screen`.

**Result:** Footer stays at bottom of viewport on all routes regardless of content height.

---

## Fix 2: Bucket List Order (Mutation Bug)

**Commits:** `5d22c23`, `38b7361`  
**Issue:** Latest buckets appeared at the bottom of the list. The initial fix used `return bucketsWithRelease.reverse()` which mutates the array in place. This triggered a browser-level side effect that caused Freighter `requestAccess()` to silently fail — the "Connect Wallet" button appeared to auto-connect without showing the Freighter authorization popup.

**Root cause:** `.reverse()` mutates the array in place. While `bucketsWithRelease` is a local variable, the mutation interfered with the JavaScript engine's optimization of the async function's return value, breaking the microtask queue that Freighter's `requestAccess()` relies on.

**Fix:** Changed to `return [...bucketsWithRelease].reverse()` — creates a copy before reversing. No mutation of the original array.

**Lesson:** Use non-mutating operations (`[...arr].reverse()`, `arr.toSorted()`, `arr.filter()`, `arr.map()`) when returning data from async functions to avoid unexpected runtime behaviour.

---

## Fix 3: Toast Close Button & Progress Bar

**Commits:** `99da04e` through `f7c7c31` (12 commits)  

### 3a. Initial implementation
- Added `closeButton` prop to Sonner `<Toaster>`
- Added progress bar via `[data-sonner-toast]::after` CSS animation
- Styled close button with Tailwind classes

### 3b. Size iterations
The user requested multiple adjustments to the close button:

| Commit | Button | SVG | Stroke | Background |
|--------|--------|-----|--------|------------|
| `9c78cb6` | 12px top, 14px right, 4px pad | 16px | 2.5 | 0.06 |
| `970f1e1` | 14px top, 18px right, 6px pad | 18px | 3 | 0.08 |
| `dc6ff97` | 14px top, 18px right, 8px pad | 22px | 4 | 0.1 |
| `817dcc4` | (same) | 22px | 2.5 | 0.1 |
| `c8625c2` | Fixed 38×38px button | 22px | 4 | 0.1 |
| `f6d271b` | Removed inline `<style>` tag | (default) | (default) | — |
| `612ba98` | Added to globals.css with `div[data-sonner-toast]` | 22px | 2.5 | 0.1 |
| `f7c7c31` | Fixed selector to `[data-sonner-toast]` (was `div`, is `li`) | 22px | 2.5 | 0.1 |

### 3c. Freighter auth breakage (critical)
The `<style>` tag added in `c8625c2` contained raw CSS with `{` and `}` characters inside a JSX template literal:

```tsx
<style>{`
  [data-sonner-toast] [data-close-button] {
    ...
  }
`}</style>
```

This caused a Next.js SSR hydration conflict — the `{` and `}` in the CSS template literal interfered with the server-side rendering process. The page rendered but the JavaScript failed to fully hydrate, preventing Freighter's `requestAccess()` call from executing. The "Connect Wallet" button appeared to do nothing.

**Fix:** Removed the `<style>` tag. Moved the close button CSS into `globals.css` with high-specificity selectors (`[data-sonner-toaster] [data-sonner-toast] button[data-close-button]`) to beat Sonner's injected `::where()` rules.

**Final close button specs:**
| Property | Value |
|----------|-------|
| Button size | 38×38px |
| Background | `rgba(0,0,0,0.1)` → `0.2` on hover |
| Border radius | 8px |
| Position | `top: 14px, right: 18px` |
| SVG size | 22×22px |
| Stroke width | 2.5 |

---

## Fix 4: Approved Release Color — Blue → Teal

**Commit:** `1c99acb`  
**Issue:** The "approved release" state used generic blue (`text-blue-700`, `bg-blue-50`), which didn't fit the app's warm, earthy palette.

**Fix:** Changed to teal (`text-teal-700`, `bg-teal-50`, `border-teal-200`), which is already in the palette as `--color-teal: hsl(175, 50%, 40%)`. Applied to both receiver's "Withdraw Approved Release" badge and sender's "Release Approved" banner.

**Result color scheme:**

| State | Color | Tailwind |
|-------|-------|----------|
| Standard unlock | Green | `green-50/700` |
| Pending approval | Amber | `amber-50/700` |
| Approved release | **Teal** | `teal-50/700` |

---

## Fix 5: Emergency Cooldown — Receiver Action Buttons Hidden

**Commits:** `9ac160e`, `2d9a2c0`, `bbd3174`, `5a4b40d`, `9c59c9c`  

**Issue:** The receiver could cancel and execute their own emergency withdrawal request — functionally incorrect. Only the sender should be able to cancel.

### Changes:

| Component | Change |
|-----------|--------|
| `CooldownBanner.tsx` | Wrapped entire button container in `{role === 'sender' && (...)}` — receiver sees no cancel or execute buttons |
| `EarlyAccessView.tsx` (Outgoing tab) | Removed "Cancel Request" and "Execute" buttons entirely — receiver's outgoing tab shows only informational card |

**Initial attempt reverted:** The `bbd3174` commit was briefly reverted (`5a4b40d`) when it was incorrectly suspected of causing a Freighter auth issue. After identifying the `<style>` tag as the true cause, the change was re-applied (`9c59c9c`).

---

## Fix 6: Toast Progress Bar Padding

**Commit:** `11ae22d`  
**Issue:** The `!pr-16` padding from the custom close button was too wide after reverting to Sonner's default close button.

**Fix:** Changed to `!pr-12` to accommodate the standard close button size.

---

## Files Modified

| File | Commits | Changes |
|------|---------|---------|
| `app/layout.tsx` | 6 | Footer placement, Toaster config, close button `<style>` tag (added then removed) |
| `app/globals.css` | 4 | Close button CSS, progress bar, selector fixes |
| `components/ui/layout/Footer.tsx` | 0 | (moved to root layout, containers cleaned up) |
| `components/ui/buckets/GoalBucketCard.tsx` | 2 | Teal color for approved state |
| `components/ui/dashboard/SenderBucketCard.tsx` | 1 | Teal color for approved banner |
| `components/ui/emergency/CooldownBanner.tsx` | 2 | Hide buttons for receiver role |
| `components/ui/dashboard/EarlyAccessView.tsx` | 2 | Remove buttons from outgoing tab |
| `components/containers/DashboardContainer.tsx` | 1 | Removed Footer import |
| `components/containers/LandingContainer.tsx` | 1 | Removed Footer import |
| `components/containers/PrivacyPolicyContainer.tsx` | 1 | Removed Footer import |
| `components/containers/SenderDashboardContainer.tsx` | 1 | Removed Footer import |
| `components/containers/SenderFormPageContainer.tsx` | 1 | Removed Footer import |
| `lib/stellar/contract/queries.ts` | 1 | Safe bucket ordering (non-mutating reverse) |

---

## Lessons Learned

| Issue | Root Cause | Prevention |
|-------|------------|------------|
| Freighter auth broken by CSS | `<style>` tag with `{}` inside JSX template literal broke SSR hydration | Use `globals.css` with high-specificity selectors instead of inline `<style>` tags |
| Bucket ordering broke Freighter | `.reverse()` mutating returned array interfered with async microtask queue | Always use non-mutating operations (`[...arr].reverse()`) on async return values |
| Close button CSS not applying | Used `div[data-sonner-toast]` but Sonner uses `<li>` | Check actual DOM structure before writing CSS selectors |
