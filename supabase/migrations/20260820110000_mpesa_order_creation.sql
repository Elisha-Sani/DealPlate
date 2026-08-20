-- Order creation for the real M-Pesa flow. Separate from
-- create_order_with_stock_check (which reads auth.uid() from the caller's
-- own JWT) because the M-Pesa callback has no end-user session at all — it's
-- an unauthenticated webhook from Safaricom's servers, verified only via the
-- service-role key and a matching pending `payments` row.

CREATE OR REPLACE FUNCTION public.create_order_after_payment(
    p_user_id uuid,
    p_deal_id uuid,
    p_order_date text,
    p_order_time text,
    p_total_paid numeric
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deal public.deals%ROWTYPE;
    v_order public.orders%ROWTYPE;
    v_pickup_code text;
BEGIN
    SELECT * INTO v_deal
    FROM public.deals
    WHERE id = p_deal_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deal not found';
    END IF;

    IF v_deal.stock_count <= 0 THEN
        RAISE EXCEPTION 'SOLD_OUT';
    END IF;

    UPDATE public.deals
       SET stock_count = stock_count - 1
     WHERE id = p_deal_id;

    v_pickup_code := lpad(floor(random() * 1000000)::text, 6, '0');

    INSERT INTO public.orders (
        user_id, deal_id, order_date, order_time, status, total_paid, pickup_code
    ) VALUES (
        p_user_id, p_deal_id, p_order_date, p_order_time, 'Active', p_total_paid, v_pickup_code
    )
    RETURNING * INTO v_order;

    RETURN v_order;
END;
$$;

-- Deliberately no grant to anon/authenticated — this must only ever be
-- callable by the service-role client used in the callback handler. Postgres
-- grants EXECUTE to PUBLIC by default on function creation, so this REVOKE
-- is load-bearing, not decorative.
REVOKE ALL ON FUNCTION public.create_order_after_payment(uuid, uuid, text, text, numeric) FROM PUBLIC;
