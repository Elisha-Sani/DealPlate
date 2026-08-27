-- 1. Add snapshot columns to orders table
ALTER TABLE public.orders ADD COLUMN deal_title text NOT NULL DEFAULT 'Unavailable Deal';
ALTER TABLE public.orders ADD COLUMN deal_vendor text NOT NULL DEFAULT 'Unknown';
ALTER TABLE public.orders ADD COLUMN deal_image text NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN deal_original_price numeric(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN deal_price numeric(10, 2) NOT NULL DEFAULT 0;

-- 2. Modify deal_id foreign key to be nullable and ON DELETE SET NULL
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_deal_id_fkey;
ALTER TABLE public.orders ALTER COLUMN deal_id DROP NOT NULL;
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_deal_id_fkey 
  FOREIGN KEY (deal_id) 
  REFERENCES public.deals(id) 
  ON DELETE SET NULL;

-- 3. Backfill existing orders with deal data (if possible)
UPDATE public.orders o
SET deal_title = d.title,
    deal_vendor = d.vendor,
    deal_image = d.image,
    deal_original_price = d.original_price,
    deal_price = d.deal_price
FROM public.deals d
WHERE o.deal_id = d.id;

-- 4. Update the create_order_after_payment RPC to include snapshot columns
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
        user_id, deal_id, order_date, order_time, status, total_paid, pickup_code,
        deal_title, deal_vendor, deal_image, deal_original_price, deal_price
    ) VALUES (
        p_user_id, p_deal_id, p_order_date, p_order_time, 'Active', p_total_paid, v_pickup_code,
        v_deal.title, v_deal.vendor, v_deal.image, v_deal.original_price, v_deal.deal_price
    )
    RETURNING * INTO v_order;

    RETURN v_order;
END;
$$;
REVOKE ALL ON FUNCTION public.create_order_after_payment(uuid, uuid, text, text, numeric) FROM PUBLIC;
