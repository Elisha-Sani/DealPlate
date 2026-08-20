-- Phase 1 P1 Fixes
-- 1. is_active_user() previously trusted the caller's JWT claims, which stay
--    stale until the access token naturally refreshes (up to its TTL) after a
--    revoke. Switch to a live lookup against auth.users so a revoke takes
--    effect on the very next request, not just after token refresh.
-- 2. Deals from a revoked/suspended vendor were still publicly visible and
--    orderable. Scope "Deals are viewable by everyone" to active vendors only
--    (superadmin/service-role callers still see everything via admin client).
-- 3. Avatar uploads only checked bucket + authenticated role, not that the
--    object path belongs to the uploader — anyone could overwrite anyone
--    else's avatar. Require the first path segment to equal auth.uid().
-- 4. Order creation + stock decrement were two separate, non-atomic calls
--    with a client-trusted total_paid. Add a single atomic RPC that locks
--    the deal row, checks stock under lock, recomputes price server-side,
--    decrements stock, and inserts the order.

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean AS $$
DECLARE
    v_status text;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN true;
    END IF;

    SELECT raw_app_meta_data ->> 'account_status' INTO v_status
    FROM auth.users
    WHERE id = auth.uid();

    RETURN COALESCE(v_status, 'active') = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP POLICY IF EXISTS "Deals are viewable by everyone" ON public.deals;
CREATE POLICY "Deals are viewable when vendor is active"
ON public.deals
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.vendors
        WHERE vendors.id = deals.vendor_id
          AND vendors.status = 'approved'
    )
);

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Users can upload their own avatar."
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE OR REPLACE FUNCTION public.create_order_with_stock_check(
    p_deal_id uuid,
    p_order_date text,
    p_order_time text
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deal public.deals%ROWTYPE;
    v_order public.orders%ROWTYPE;
    v_service_fee numeric := 20;
    v_pickup_code text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Must be signed in to place an order';
    END IF;

    IF NOT public.is_active_user() THEN
        RAISE EXCEPTION 'Account is not active';
    END IF;

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
        auth.uid(), p_deal_id, p_order_date, p_order_time, 'Active',
        v_deal.deal_price + v_service_fee, v_pickup_code
    )
    RETURNING * INTO v_order;

    RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_with_stock_check(uuid, text, text) TO authenticated;
