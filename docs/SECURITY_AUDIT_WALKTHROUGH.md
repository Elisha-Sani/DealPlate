# DealPlate Security & UX Audit — Walkthrough

This document summarizes the full audit pass across the codebase (August 2026):
what was found, what was fixed, and what's still outstanding. Findings were
ranked by criticality (P0 = fix immediately, P1 = fix before real launch,
P2 = fix soon, P3 = cleanup) and fixed in that order.

## Scope

- Authentication, password recovery, and session/role handling
- The revoke/unrevoke ("forgot and recover pass") admin workflow for
  students and vendors, and the KYC review flow
- Supabase RLS policies and migrations
- The M-Pesa payment path and general order/checkout flow
- General app pages, hooks, and UI/UX polish

---

## P0 — Critical (fixed)

1. **Leaked Supabase service-role key.** Several debug scripts at the repo
   root (`check_admin_actions.js`, `test_get_user.js`, `test_hard_revoke.js`,
   `test_immutability.js`, `test_revoke.js`, `test_revoke.ts`) hardcoded a
   live `sb_secret_...` key as a fallback default. **Deleted.**
   **Action still required from you:** rotate that key in the Supabase
   dashboard — deleting the files does not invalidate it.

2. **No server-side authorization on admin actions.** `revokeStudent.ts`,
   `revokeVendor.ts`, `unrevokeStudent.ts`, `unrevokeVendor.ts`, and
   `reviewVendorApplicationSecure` all took `adminId`/`adminEmail` as plain
   client-supplied arguments used only for audit-log text — nothing verified
   the caller was actually a superadmin. Anyone who could call these could
   revoke or reinstate any account.
   **Fix:** added `src/lib/supabase/authz.ts` with `requireSuperadmin()`,
   which independently re-derives the caller's identity from their
   server-side cookie session and checks `app_metadata.role === 'superadmin'`.
   Wired into all five actions; client-supplied admin id/email are no longer
   trusted anywhere.

3. **Bypassed RPC-level authorization.** The `review_vendor_application` /
   `review_student_kyc_application` Postgres RPCs had a check like
   `IF auth.role() != 'service_role' AND role != 'superadmin' THEN RAISE...`,
   which always short-circuits true (skips the exception) whenever the
   caller uses the service-role key — which `reviewVendorApplication.ts`
   always does. This is now safe *because* item 2 gates the caller before
   the RPC is ever invoked.

4. **Client-trusted student ID in KYC submission.** `submitStudentKyc.ts`
   read `studentId` straight from the submitted `FormData`, so any caller
   could overwrite another student's KYC record. **Fix:** the ID is now
   derived from the authenticated session server-side. This also surfaced
   and fixed two latent runtime bugs: a missing `@/lib/supabase/admin`
   module (created) and a `uuid` package that was imported but never
   installed (replaced with `crypto.randomUUID()`).

5. **`is_active_user()` was a permanent no-op.** It read
   `current_setting('request.jwt.claim.app_metadata', true)`, a Postgres GUC
   that Supabase/PostgREST never actually populates — so it silently always
   fell back to `'active'`. Revoked users were never blocked at the database
   layer, despite that being the entire point of the migration that added
   it. Fixed in `20260819120000_phase1_rls_fixes.sql` (later hardened again
   in the P1 migration — see below).

6. **`student_profiles` was world-readable.** Its SELECT policy was
   `USING (auth.role() = 'authenticated')` — any signed-in student or vendor
   could read every other student's full name, phone, registration number,
   and ID document URLs. Restricted to the row owner and superadmins.

7. **M-Pesa payment flow was entirely fake.** Stub API routes, empty
   `src/lib/mpesa/*` files, and a client-side `setTimeout` "payment success"
   directly triggering order creation with zero server verification — every
   "purchase" was free. **Not fixed as part of this pass** (needs real
   Daraja credentials); see `DARAJA_INTEGRATION_GUIDE.md` for the plan.

8. **No account recovery / forgot-password flow existed.** The "Forgot?"
   buttons on both sign-in pages had no handler at all. **Fix:** wired both
   buttons to `supabase.auth.resetPasswordForEmail`, added a
   `/auth/reset-password` page, and hardened `auth/callback/route.ts`
   against open-redirect and host-header spoofing while touching it (the
   `next` redirect param is now validated as a same-origin relative path,
   and the forwarded host is checked against `NEXT_PUBLIC_SITE_URL`).

**Bonus finding:** the "recover pass" (unrevoke) actions existed in code but
had **no UI to trigger them anywhere** — a revoked student or vendor was
stuck forever with no admin-facing path back. Added "Reinstate Access"
buttons to the superadmin dashboard for both.

---

## P1 — High priority (fixed)

9. **Stale JWT window on revoke.** Even after fixing #5, a revoked user's
   still-valid JWT kept passing `is_active_user()` until the access token
   naturally refreshed (up to its TTL). **Fix:** `is_active_user()` now does
   a *live* lookup against `auth.users.raw_app_meta_data` instead of
   trusting the caller's JWT claims — a revoke takes effect on the very
   next request, not after token refresh.

10. **Revoked vendors' deals stayed live.** The `deals` SELECT policy never
    checked vendor status. **Fix:** deals are now only visible when their
    vendor's `status = 'approved'`.

11. **Non-atomic order creation + stock decrement.** The client inserted an
    order, then separately called a `decrement_stock` RPC whose failure
    (0 rows updated when stock was already 0) was silently ignored — this
    meant orders could be created after stock hit zero. Client-supplied
    price was also trusted directly. **Fix:** replaced both steps with a
    single `create_order_with_stock_check` RPC that locks the deal row,
    checks stock under lock, recomputes the price server-side from
    `deals.deal_price`, decrements stock, and inserts the order — all in
    one transaction.

12. **Vendor inventory page leaked data to logged-out visitors.** With no
    session, it fell back to `.limit(1)` on the vendors table and displayed
    *some* vendor's inventory rather than redirecting. Fixed to show a
    sign-in prompt instead.

13. **Avatar bucket had no per-user path scoping.** Any authenticated user
    could overwrite any other user's avatar file. Fixed the storage policy
    to require the object path's first segment to equal `auth.uid()`.

14. **Silent partial failures reported as success.** `revokeStudent/Vendor`
    and `unrevokeStudent/Vendor` logged secondary DB/audit-log failures with
    `console.error` only, while still returning `{ success: true }` to the
    admin UI. Now returns `{ success: false, error: 'PARTIAL_FAILURE' }` if
    any secondary write fails, so desynced state is surfaced instead of
    hidden.

---

## P2 — Medium priority (fixed)

15. **Pickup confirmation race.** `vendor/pickup/page.tsx` did a
    fetch-then-update — two vendor terminals could both read the code as
    valid before either wrote `'Completed'`. Replaced with a single atomic
    `UPDATE ... WHERE pickup_code = ? AND status = 'Active'`, checked by row
    count.

16. **`UserProvider.tsx` used `getSession()` for its trust-sensitive
    bootstrap check.** `getSession()` only reads the locally stored session
    without revalidating it. Switched to `getUser()`, which round-trips to
    the Supabase Auth server.

17. **Duplicate email signup was silently "successful."** Supabase returns
    a 200 with a user whose `identities` array is empty (rather than an
    error) when the email is already registered, to avoid leaking account
    existence via error messages. The sign-up page didn't check for this
    and sent the user on to `/student/verify` as if a new account had been
    created. Fixed to detect the empty-identities case and show a proper
    "account already exists" message.

18. **`handle_new_user()` missing `SET search_path`.** This `SECURITY
    DEFINER` trigger function was the only privileged function in the
    schema without a pinned search path — a classic search-path-hijack
    vector. Fixed to match the convention used everywhere else.

---

## P3 — Cleanup (fixed)

- **`useCountdown.ts`** recreated its `setInterval` every single tick
  instead of running one interval for the countdown's lifetime, which
  drifts under tab throttling. Rewritten to use one ref-tracked interval.
- **Middleware revoked-superadmin edge case** redirected to
  `/student/sign-in` instead of `/superadmin`. Fixed.
- **Dead code removed:** an unreachable `status === 'revoked'` branch in
  `superadmin/page.tsx`'s `reviewVendor` (that function is only ever called
  with `'approved'`/`'rejected'`), and a status-badge branch checking for
  `vendor_applications.status === 'suspended'`, which that column's CHECK
  constraint can never actually produce.

---

## UI/UX pass

Kept intentionally scoped — the app's visual language (colors, spacing,
card patterns) was already consistent, so the fixes targeted *legibility*
and *accessibility* gaps rather than a redesign:

- **Color-coded status badges** in the superadmin dashboard (amber =
  pending, green = approved, red = rejected, dark red = revoked). Every
  status previously rendered as an identical gray pill, making it hard to
  scan a queue at a glance.
- **Success/error-aware status banner.** The admin action feedback banner
  used the same orange "info" style for both successes and failures (e.g.
  "Revoke failed." looked identical to "Revoke successful."). Now green on
  success, red on error.
- **Confirmation modal accessibility.** Added backdrop-click-to-close,
  Escape-to-close, and `role="dialog"` / `aria-modal` / `aria-labelledby`
  attributes — previously the only way out was clicking the Cancel button.

---

## What's still outstanding

- **Real M-Pesa/Daraja integration** — see `DARAJA_INTEGRATION_GUIDE.md`.
  This is the single largest remaining gap; the current checkout flow has
  no real payment verification.
- **Rotate the Supabase service-role key** in the dashboard (see P0 #1) —
  this is on you, it can't be done from the codebase.
- Minor items intentionally deferred as low-value: orphaned KYC/ID file
  cleanup on resubmission (storage growth, not a correctness bug), and
  retroactively staging already-applied migrations with `NOT VALID` (not
  useful after the fact — just a pattern to use in future migrations).

## New files added during this pass

- `src/lib/supabase/authz.ts` — `requireSuperadmin()` helper
- `src/lib/supabase/admin.ts` — service-role Supabase client (was imported
  but never existed)
- `src/app/auth/reset-password/page.tsx` — password reset UI
- `supabase/migrations/20260819120000_phase1_rls_fixes.sql`
- `supabase/migrations/20260819130000_phase1_p1_fixes.sql`
- `supabase/migrations/20260819140000_phase1_p2_fixes.sql`

Run these migrations against your Supabase project (via the Supabase CLI or
dashboard SQL editor) before deploying — they haven't been applied to any
live database yet, only written to the `supabase/migrations/` folder.
