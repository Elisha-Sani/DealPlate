# M-Pesa (Daraja) Integration Guide

The current M-Pesa integration is a complete stub: `src/lib/mpesa/auth.ts`,
`config.ts`, and `stkPush.ts` are empty files, and the three API routes
(`/api/mpesa/callback`, `/api/mpesa/status`, `/api/mpesa/stk-push`) just echo
`{ ok: true }`. `MpesaSimulator.tsx` fakes a successful payment client-side
with a `setTimeout` and directly triggers order creation — there is currently
**no real payment verification anywhere in the app.**

This guide is the plan for replacing that with a real integration. It's
written so you can implement it yourself; the sections are ordered the way
you should build and test them.

---

## 1. Credentials & setup

1. Register at the [Safaricom Daraja developer portal](https://developer.safaricom.co.ke)
   and create an app.
2. From that app you get a **Consumer Key** and **Consumer Secret**.
3. For STK Push (the "Lipa na M-Pesa Online" API) you additionally need:
   - **Shortcode** — a Paybill or Till number. Safaricom provides a sandbox
     test shortcode (`174379`) for development.
   - **Passkey** — provided alongside the sandbox shortcode, or issued for
     your production shortcode once you're onboarded.
4. **Build and test entirely against sandbox first.** Do not touch
   production credentials until a full sandbox round trip (initiate →
   callback → order created) works.

### Environment variables

Add to `.env.local` (never commit these):

```
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=174379
MPESA_PASSKEY=
MPESA_ENV=sandbox            # "sandbox" | "production"
MPESA_CALLBACK_URL=https://<your-public-domain>/api/mpesa/callback
```

The callback URL **must be publicly reachable over HTTPS** — Safaricom's
servers cannot call `localhost`. For local development, tunnel your dev
server with `ngrok http 3000` (or similar) and use the generated HTTPS URL.

---

## 2. The architectural change this requires

Today, checkout creates the order **before** any payment happens — the
`create_order_with_stock_check` RPC (added in the security audit pass) is
called directly by the client at checkout time. That's fine for a flow with
no real money involved, but it is fundamentally incompatible with a real
payment: **you cannot create a paid order before the payment is confirmed.**

The new flow needs to be:

1. Student taps "Pay with M-Pesa" → client calls a new server action,
   e.g. `initiateMpesaPayment(dealId, phone)`.
2. That server action:
   - Gets an OAuth token from Safaricom (`auth.ts`).
   - Calls the STK Push endpoint (`stkPush.ts`) to trigger the prompt on
     the student's phone.
   - **Before returning to the client**, inserts a row into a new
     `payments` table with `status = 'pending'`, the returned
     `CheckoutRequestID` and `MerchantRequestID`, the `deal_id`, `user_id`,
     and a price computed **server-side** from `deals.deal_price` (never
     trust a client-supplied amount here, same principle as the checkout
     RPC fix).
3. The client shows a "waiting for payment" state and either:
   - polls `/api/mpesa/status?checkoutRequestId=...` (which just reads the
     `payments` row), or
   - subscribes to Supabase Realtime on that `payments` row — nicer UX,
     avoids polling.
4. Safaricom calls your `/api/mpesa/callback` webhook once the student
   completes or cancels the prompt.
5. **Only the callback handler** — using the service-role client — updates
   `payments.status`, and if the payment succeeded, calls the order-creation
   RPC server-side to actually create the order and decrement stock.

This means `create_order_with_stock_check` should be renamed/repurposed to
be called only from the callback handler, not from client code.

---

## 3. Database schema

```sql
CREATE TABLE public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    deal_id uuid NOT NULL REFERENCES public.deals(id),
    checkout_request_id text NOT NULL UNIQUE,
    merchant_request_id text NOT NULL,
    amount numeric(10,2) NOT NULL,
    phone text NOT NULL,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed')),
    mpesa_receipt text,
    result_code integer,
    result_description text,
    order_id uuid REFERENCES public.orders(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = user_id);

-- No INSERT/UPDATE policy for regular users — only the server action
-- (via the service-role client) and the callback handler ever write here.
```

`UNIQUE (checkout_request_id)` is load-bearing — see idempotency below.

---

## 4. The callback endpoint — read this section twice

This is the one endpoint in your app that can move real money, so it
deserves the most scrutiny.

### Daraja callbacks are not signed

Safaricom does not cryptographically sign callback payloads. Anyone who
guesses or observes your callback URL could POST a payload shaped like a
real one. Your defenses:

1. **The `CheckoutRequestID` is your real authentication.** Before acting
   on a callback, look up `Body.stkCallback.CheckoutRequestID` against your
   `payments` table. If there's no matching row, or it's not in `'pending'`
   status, ignore the request entirely (return 200 anyway — Safaricom
   retries on non-200 responses, don't give it a reason to). You generated
   that ID yourself when you called STK Push, so an attacker would have to
   already know a value tied to a real in-flight transaction — much harder
   than blindly POSTing to your callback endpoint.

2. **IP-restrict as defense-in-depth.** Safaricom publishes source IP
   ranges for sandbox/production callback traffic. Check the request's
   real IP (via your platform's forwarded-for header) against that list.
   This isn't foolproof (IP lists can change or be spoofed on some setups)
   but raises the bar meaningfully — treat it as a second layer, not your
   only defense.

3. **Never let the callback body alone determine the amount or the order.**
   Re-derive everything from your own `payments` row (which you wrote
   server-side, from the real `deals.deal_price`) — the callback should
   only tell you *whether* that specific pending transaction succeeded,
   not what it was for.

### Idempotency is mandatory, not optional

Safaricom **will** retry callbacks (network timeouts, your server being
briefly down, etc.). Your handler must be safe to call twice with the same
payload:

- The `UNIQUE (checkout_request_id)` constraint prevents duplicate rows.
- The status transition must be an atomic guarded update, the same pattern
  used for the pickup-confirmation fix in the security audit:

  ```sql
  UPDATE public.payments
     SET status = 'completed', mpesa_receipt = $1, result_code = 0
   WHERE checkout_request_id = $2
     AND status = 'pending'
   RETURNING id;
  ```

  If this returns zero rows, the payment was already processed — do
  nothing further (in particular, do **not** create a second order).

### Reading the callback payload

The callback body looks like:

```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "...",
      "CheckoutRequestID": "...",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 100 },
          { "Name": "MpesaReceiptNumber", "Value": "NLJ..." },
          { "Name": "TransactionDate", "Value": 20260819123456 },
          { "Name": "PhoneNumber", "Value": 254712345678 }
        ]
      }
    }
  }
}
```

`ResultCode === 0` means success — anything else (cancelled, insufficient
funds, timeout) means failure, and `ResultDesc` tells you why. On failure,
set `payments.status = 'failed'` with the result code/description logged;
do not create an order.

On success: run the guarded update above, then call the order-creation RPC
with the service-role client and link the resulting `order_id` back onto
the `payments` row.

---

## 5. Remove the fake-payment path

`MpesaSimulator.tsx` fires `createOrder` client-side after a fixed delay,
with no server involvement at all. Once the real flow lands:

- Delete it, **or**
- If you want to keep it for local development, gate it hard behind both
  `process.env.NODE_ENV === 'development'` **and** `MPESA_ENV === 'sandbox'`,
  so there's no code path by which it could run against a production build.

---

## 6. Build & test order

Build and test in this order — each step is testable independently before
moving to the next:

1. **`auth.ts`** — OAuth token fetch. `GET` to
   `https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`
   with HTTP Basic auth (`consumer_key:consumer_secret` base64-encoded).
   Cache the returned token for its ~3600s TTL to avoid hitting the
   endpoint on every request.
2. **`stkPush.ts`** — builds the STK Push request body. The `Password`
   field is `base64(Shortcode + Passkey + Timestamp)` where `Timestamp` is
   `YYYYMMDDHHmmss`. POST to
   `https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest`.
3. **The `initiateMpesaPayment` server action** — wires the above together
   with the `payments` table insert described in section 3.
4. **`callback/route.ts`** — implement the verification + idempotent
   status-update logic from section 4.
5. **`status/route.ts`** — simple read of the `payments` row by
   `checkout_request_id`, scoped to the requesting user via RLS.
6. Test the full loop against Safaricom's sandbox test MSISDN
   (`254708374149` is a commonly used sandbox test number — confirm current
   test numbers in Daraja's docs, they can change) before ever touching
   your production shortcode/passkey.

Once you've got a first pass working in sandbox, it's worth a second pair
of eyes specifically on the callback handler — that's the endpoint where a
verification gap turns directly into free orders or lost revenue.
