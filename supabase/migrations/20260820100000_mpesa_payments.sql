-- M-Pesa payments: decouples order creation from payment. An order is only
-- ever created by the callback handler (service role) after Safaricom
-- confirms the STK push succeeded — never by the client directly.

CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deal_id uuid NOT NULL REFERENCES public.deals(id),
    checkout_request_id text NOT NULL UNIQUE,
    merchant_request_id text NOT NULL,
    amount numeric(10, 2) NOT NULL,
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

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_checkout_request_id_idx ON public.payments(checkout_request_id);

DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;
CREATE TRIGGER payments_set_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can only read their own payment rows (for polling status) — all
-- writes happen exclusively through the service-role client (the
-- initiate-payment server action and the webhook callback), never from a
-- user's own session.
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = user_id);
