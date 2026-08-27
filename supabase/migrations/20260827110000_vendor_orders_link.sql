-- 1. Add vendor_id column to orders
ALTER TABLE public.orders 
ADD COLUMN vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE;

-- 2. Backfill vendor_id for existing orders (by joining with deals)
UPDATE public.orders o
SET vendor_id = d.vendor_id
FROM public.deals d
WHERE o.deal_id = d.id;

-- 3. Drop old orders RLS policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can update orders for their deals" ON public.orders;

-- 4. Recreate RLS policies using vendor_id directly

-- Users can view their own orders (and Vendors can view their own orders)
CREATE POLICY "Users and Vendors can view their own orders"
ON public.orders
FOR SELECT
USING (
    auth.uid() = user_id
    OR auth.uid() = vendor_id
);

-- Vendors can update their own orders (e.g. marking as collected)
CREATE POLICY "Vendors can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = vendor_id);

-- 5. Update the RPC create_order_after_payment to require and insert vendor_id
DROP FUNCTION IF EXISTS public.create_order_after_payment(uuid, uuid, text, text, numeric);

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

    -- Insert including vendor_id and the snapshot columns
    INSERT INTO public.orders (
        user_id, deal_id, vendor_id, order_date, order_time, status, total_paid, pickup_code,
        deal_title, deal_vendor, deal_image, deal_original_price, deal_price
    ) VALUES (
        p_user_id, 
        p_deal_id, 
        v_deal.vendor_id, 
        p_order_date, 
        p_order_time, 
        'Active', 
        p_total_paid, 
        v_pickup_code,
        v_deal.title,
        v_deal.vendor,
        v_deal.image,
        v_deal.original_price,
        v_deal.deal_price
    )
    RETURNING * INTO v_order;

    RETURN v_order;
END;
$$;
REVOKE ALL ON FUNCTION public.create_order_after_payment(uuid, uuid, text, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_after_payment(uuid, uuid, text, text, numeric) TO authenticated;
