-- DealPlate database schema for Supabase/PostgreSQL.
-- Run this before seed.sql or 01-seed-mock-data.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.vendors (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name text NOT NULL,
    contact_name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text NOT NULL,
    address text NOT NULL,
    campus_proximity text NOT NULL,
    status text NOT NULL DEFAULT 'approved',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT vendors_status_check
        CHECK (status IN ('pending_review', 'approved', 'suspended', 'revoked')),
    CONSTRAINT vendors_email_check
        CHECK (position('@' in email) > 1)
);

CREATE TABLE IF NOT EXISTS public.student_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone text NOT NULL,
    university text,
    reg_number text UNIQUE,
    is_verified boolean NOT NULL DEFAULT false,
    id_photo_url text,
    total_saved numeric(10, 2) NOT NULL DEFAULT 0,
    meals_enjoyed integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT student_profiles_total_saved_check
        CHECK (total_saved >= 0),
    CONSTRAINT student_profiles_meals_enjoyed_check
        CHECK (meals_enjoyed >= 0)
);

CREATE TABLE IF NOT EXISTS public.deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    title text NOT NULL,
    vendor text NOT NULL,
    campus text NOT NULL,
    original_price numeric(10, 2) NOT NULL,
    deal_price numeric(10, 2) NOT NULL,
    image text NOT NULL,
    discount_percentage integer NOT NULL,
    time_start time NOT NULL,
    time_end time NOT NULL,
    category text NOT NULL,
    tags text[] NOT NULL DEFAULT ARRAY[]::text[],
    description text,
    brief_description text,
    detailed_description text,
    stock_count integer NOT NULL DEFAULT 0,
    is_published boolean NOT NULL DEFAULT true,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT deals_prices_check
        CHECK (original_price > 0 AND deal_price > 0 AND deal_price <= original_price),
    CONSTRAINT deals_discount_percentage_check
        CHECK (discount_percentage BETWEEN 0 AND 100),
-- DealPlate database schema for Supabase/PostgreSQL.
-- Run this before seed.sql or 01-seed-mock-data.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.vendors (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name text NOT NULL,
    contact_name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text NOT NULL,
    address text NOT NULL,
    campus_proximity text NOT NULL,
    status text NOT NULL DEFAULT 'approved',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT vendors_status_check
        CHECK (status IN ('pending_review', 'approved', 'suspended', 'revoked')),
    CONSTRAINT vendors_email_check
        CHECK (position('@' in email) > 1)
);

CREATE TABLE IF NOT EXISTS public.student_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone text NOT NULL,
    university text,
    reg_number text UNIQUE,
    is_verified boolean NOT NULL DEFAULT false,
    id_photo_url text,
    total_saved numeric(10, 2) NOT NULL DEFAULT 0,
    meals_enjoyed integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT student_profiles_total_saved_check
        CHECK (total_saved >= 0),
    CONSTRAINT student_profiles_meals_enjoyed_check
        CHECK (meals_enjoyed >= 0)
);

CREATE TABLE IF NOT EXISTS public.deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    title text NOT NULL,
    vendor text NOT NULL,
    campus text NOT NULL,
    original_price numeric(10, 2) NOT NULL,
    deal_price numeric(10, 2) NOT NULL,
    image text NOT NULL,
    discount_percentage integer NOT NULL,
    time_start time NOT NULL,
    time_end time NOT NULL,
    category text NOT NULL,
    tags text[] NOT NULL DEFAULT ARRAY[]::text[],
    description text,
    brief_description text,
    detailed_description text,
    stock_count integer NOT NULL DEFAULT 0,
    is_published boolean NOT NULL DEFAULT true,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT deals_prices_check
        CHECK (original_price > 0 AND deal_price > 0 AND deal_price <= original_price),
    CONSTRAINT deals_discount_percentage_check
        CHECK (discount_percentage BETWEEN 0 AND 100),
    CONSTRAINT deals_stock_count_check
        CHECK (stock_count >= 0)
);

CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
    deal_title text NOT NULL DEFAULT 'Unavailable Deal',
    deal_vendor text NOT NULL DEFAULT 'Unknown',
    deal_image text NOT NULL DEFAULT '',
    deal_original_price numeric(10, 2) NOT NULL DEFAULT 0,
    deal_price numeric(10, 2) NOT NULL DEFAULT 0,
    order_date text NOT NULL,
    order_time text NOT NULL,
    status text NOT NULL DEFAULT 'Pending',
    total_paid numeric(10, 2) NOT NULL,
    pickup_code text,
    pickup_deadline timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT orders_status_check
        CHECK (status IN ('Pending', 'Active', 'Completed', 'Cancelled')),
    CONSTRAINT orders_total_paid_check
        CHECK (total_paid >= 0),
    CONSTRAINT orders_pickup_code_check
        CHECK (pickup_code IS NULL OR pickup_code ~ '^[0-9]{6}$')
);

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS vendors_status_idx ON public.vendors(status);
CREATE INDEX IF NOT EXISTS student_profiles_is_verified_idx ON public.student_profiles(is_verified);
CREATE INDEX IF NOT EXISTS deals_vendor_id_idx ON public.deals(vendor_id);
CREATE INDEX IF NOT EXISTS deals_campus_idx ON public.deals(campus);
CREATE INDEX IF NOT EXISTS deals_category_idx ON public.deals(category);
CREATE INDEX IF NOT EXISTS deals_created_at_idx ON public.deals(created_at DESC);
CREATE INDEX IF NOT EXISTS deals_is_published_idx ON public.deals(is_published);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_deal_id_idx ON public.orders(deal_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_pickup_code_idx ON public.orders(pickup_code);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);

DROP TRIGGER IF EXISTS vendors_set_updated_at ON public.vendors;
CREATE TRIGGER vendors_set_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS student_profiles_set_updated_at ON public.student_profiles;
CREATE TRIGGER student_profiles_set_updated_at
BEFORE UPDATE ON public.student_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS deals_set_updated_at ON public.deals;
CREATE TRIGGER deals_set_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.decrement_stock(p_deal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.deals
       SET stock_count = stock_count - 1
     WHERE id = p_deal_id
       AND stock_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid) TO authenticated;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors are viewable by everyone" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can update their own profile" ON public.vendors;
DROP POLICY IF EXISTS "Student profiles viewable by authenticated users" ON public.student_profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Deals are viewable by everyone" ON public.deals;
DROP POLICY IF EXISTS "Vendors can manage their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can update orders for their deals" ON public.orders;

CREATE POLICY "Vendors are viewable by everyone"
ON public.vendors
FOR SELECT
USING (true);

CREATE POLICY "Vendors can update their own profile"
ON public.vendors
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Student profiles viewable by authenticated users"
ON public.student_profiles
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own profile"
ON public.student_profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Deals are viewable by everyone"
ON public.deals
FOR SELECT
USING (true);

CREATE POLICY "Vendors can manage their own deals"
ON public.deals
FOR ALL
USING (vendor_id = auth.uid())
WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Users and Vendors can view their own orders"
ON public.orders
FOR SELECT
USING (
    auth.uid() = user_id
    OR auth.uid() = vendor_id
);

CREATE POLICY "Users can insert their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;
EXCEPTION
    WHEN duplicate_object OR undefined_object THEN NULL;
END;
$$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_profiles;
EXCEPTION
    WHEN duplicate_object OR undefined_object THEN NULL;
END;
$$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
EXCEPTION
    WHEN duplicate_object OR undefined_object THEN NULL;
END;
$$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
    WHEN duplicate_object OR undefined_object THEN NULL;
END;
$$;

-- ============================================================
-- 7. KYC APPLICATIONS & SUPERADMIN REVIEW
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_kyc_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text,
    phone text,
    university text NOT NULL,
    reg_number text NOT NULL,
    student_id_file_name text NOT NULL,
    university_doc_file_name text NOT NULL,
    university_doc_date date NOT NULL,
    document_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    ai_recommendation text NOT NULL DEFAULT 'needs_review',
    ai_confidence integer NOT NULL DEFAULT 0,
    ai_summary text,
    ai_flags text[] NOT NULL DEFAULT ARRAY[]::text[],
    status text NOT NULL DEFAULT 'pending_review',
    admin_notes text,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT student_kyc_status_check
        CHECK (status IN ('pending_review', 'approved', 'rejected', 'revoked')),
    CONSTRAINT student_kyc_ai_recommendation_check
        CHECK (ai_recommendation IN ('approve', 'needs_review', 'reject')),
    CONSTRAINT student_kyc_ai_confidence_check
        CHECK (ai_confidence BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS public.vendor_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    business_name text NOT NULL,
    contact_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    campus_proximity text NOT NULL,
    status text NOT NULL DEFAULT 'pending_review',
    admin_notes text,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT vendor_applications_status_check
        CHECK (status IN ('pending_review', 'approved', 'rejected', 'revoked')),
    CONSTRAINT vendor_applications_email_check
        CHECK (position('@' in email) > 1)
);

ALTER TABLE public.vendor_applications ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS student_kyc_applications_student_id_idx ON public.student_kyc_applications(student_id);
CREATE INDEX IF NOT EXISTS student_kyc_applications_status_idx ON public.student_kyc_applications(status);
CREATE INDEX IF NOT EXISTS vendor_applications_status_idx ON public.vendor_applications(status);
CREATE INDEX IF NOT EXISTS vendor_applications_email_idx ON public.vendor_applications(email);

DROP TRIGGER IF EXISTS student_kyc_applications_set_updated_at ON public.student_kyc_applications;
CREATE TRIGGER student_kyc_applications_set_updated_at
BEFORE UPDATE ON public.student_kyc_applications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS vendor_applications_set_updated_at ON public.vendor_applications;
CREATE TRIGGER vendor_applications_set_updated_at
BEFORE UPDATE ON public.vendor_applications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.student_kyc_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can create their own KYC applications" ON public.student_kyc_applications;
DROP POLICY IF EXISTS "Students can view their own KYC applications" ON public.student_kyc_applications;
DROP POLICY IF EXISTS "Superadmin dashboard can review student KYC" ON public.student_kyc_applications;
DROP POLICY IF EXISTS "Anyone can submit vendor applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Superadmin dashboard can review vendor applications" ON public.vendor_applications;

CREATE POLICY "Students can create their own KYC applications"
ON public.student_kyc_applications
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own KYC applications"
ON public.student_kyc_applications
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Superadmin dashboard can review student KYC"
ON public.student_kyc_applications
FOR ALL
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin');

CREATE POLICY "Anyone can submit vendor applications"
ON public.vendor_applications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Superadmin dashboard can review vendor applications"
ON public.vendor_applications
FOR ALL
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin');







-- ============================================================
-- ADDED FROM MIGRATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES auth.users(id),
    admin_email text NOT NULL,
    action_type text NOT NULL,
    target_type text NOT NULL CHECK (target_type IN ('student', 'vendor', 'deal')),
    target_id uuid NOT NULL,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can select and insert audit logs"
ON public.admin_actions
FOR ALL
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin');

REVOKE UPDATE, DELETE ON public.admin_actions FROM authenticated, anon, public;

CREATE OR REPLACE FUNCTION public.prevent_admin_actions_modification()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Modification of admin_actions is strictly prohibited. This is an append-only audit log.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_append_only_admin_actions
BEFORE UPDATE OR DELETE ON public.admin_actions
FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_actions_modification();


CREATE TABLE IF NOT EXISTS public.saved_deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT saved_deals_unique UNIQUE (user_id, deal_id)
);

CREATE INDEX IF NOT EXISTS saved_deals_user_id_idx ON public.saved_deals(user_id);

ALTER TABLE public.saved_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved deals"
ON public.saved_deals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save deals for themselves"
ON public.saved_deals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own saved deals"
ON public.saved_deals
FOR DELETE
USING (auth.uid() = user_id);


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

CREATE TRIGGER payments_set_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = user_id);


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
        user_id, deal_id, vendor_id, order_date, order_time, status, total_paid, pickup_code,
        deal_title, deal_vendor, deal_image, deal_original_price, deal_price
    ) VALUES (
        p_user_id, p_deal_id, v_deal.vendor_id, p_order_date, p_order_time, 'Active', p_total_paid, v_pickup_code,
        v_deal.title, v_deal.vendor, v_deal.image, v_deal.original_price, v_deal.deal_price
    )
    RETURNING * INTO v_order;

    RETURN v_order;
END;
$$;
REVOKE ALL ON FUNCTION public.create_order_after_payment(uuid, uuid, text, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_after_payment(uuid, uuid, text, text, numeric) TO authenticated;


CREATE OR REPLACE FUNCTION public.unpublish_expired_deals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.deals
       SET is_published = false
     WHERE is_published = true
       AND expires_at <= now();
END;
$$;
GRANT EXECUTE ON FUNCTION public.unpublish_expired_deals() TO authenticated, anon;


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Inject role: 'student' into app_metadata automatically
    NEW.raw_app_meta_data = coalesce(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "student"}'::jsonb;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


CREATE OR REPLACE FUNCTION public.review_student_kyc_application(
    p_application_id uuid,
    p_status text,
    p_admin_notes text DEFAULT NULL,
    p_admin_id uuid DEFAULT NULL,
    p_admin_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id uuid;
    v_actual_admin_id uuid;
    v_actual_admin_email text;
BEGIN
    IF auth.role() != 'service_role' AND (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'superadmin' THEN
        RAISE EXCEPTION 'Access denied: superadmin role required';
    END IF;

    IF p_status NOT IN ('approved', 'rejected', 'revoked') THEN
        RAISE EXCEPTION 'Invalid KYC review status: %', p_status;
    END IF;

    UPDATE public.student_kyc_applications
       SET status = p_status,
           admin_notes = p_admin_notes,
           reviewed_at = now()
     WHERE id = p_application_id
     RETURNING student_id INTO v_student_id;

    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Student KYC application not found.';
    END IF;

    IF p_status = 'approved' THEN
        UPDATE public.student_profiles
           SET is_verified = true
         WHERE id = v_student_id;
    ELSIF p_status = 'revoked' THEN
        UPDATE public.student_profiles
           SET is_verified = false
         WHERE id = v_student_id;
    END IF;
    
    v_actual_admin_id := COALESCE(auth.uid(), p_admin_id);
    v_actual_admin_email := COALESCE(auth.jwt() ->> 'email', p_admin_email);
    
    IF v_actual_admin_id IS NULL THEN
        RAISE EXCEPTION 'Audit logging requires an admin_id';
    END IF;

    INSERT INTO public.admin_actions (
        admin_id, admin_email, action_type, target_type, target_id, reason
    ) VALUES (
        v_actual_admin_id,
        COALESCE(v_actual_admin_email, 'unknown_admin_email'),
        p_status,
        'student',
        v_student_id,
        p_admin_notes
    );
END;
$$;


CREATE OR REPLACE FUNCTION public.review_vendor_application(
    p_application_id uuid,
    p_status text,
    p_admin_notes text DEFAULT NULL,
    p_admin_id uuid DEFAULT NULL,
    p_admin_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_app public.vendor_applications%ROWTYPE;
    v_user_id uuid;
    v_actual_admin_id uuid;
    v_actual_admin_email text;
BEGIN
    IF auth.role() != 'service_role' AND (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'superadmin' THEN
        RAISE EXCEPTION 'Access denied: superadmin role required';
    END IF;

    IF p_status NOT IN ('approved', 'rejected', 'revoked') THEN
        RAISE EXCEPTION 'Invalid vendor review status: %', p_status;
    END IF;

    SELECT * INTO v_app
      FROM public.vendor_applications
     WHERE id = p_application_id;

    IF v_app.id IS NULL THEN
        RAISE EXCEPTION 'Vendor application not found.';
    END IF;

    v_user_id := v_app.auth_user_id;

    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id
          FROM auth.users
         WHERE email = v_app.email
         LIMIT 1;
    END IF;

    IF v_user_id IS NOT NULL THEN
        UPDATE public.vendor_applications
           SET auth_user_id = v_user_id
         WHERE id = p_application_id;
         
        IF p_status = 'approved' THEN
            INSERT INTO public.vendors (
                id, business_name, contact_name, email, phone, address, campus_proximity, status
            )
            VALUES (
                v_user_id, v_app.business_name, v_app.contact_name, v_app.email, v_app.phone, v_app.address, v_app.campus_proximity, 'approved'
            )
            ON CONFLICT (id) DO UPDATE
            SET business_name = EXCLUDED.business_name,
                contact_name = EXCLUDED.contact_name,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                address = EXCLUDED.address,
                campus_proximity = EXCLUDED.campus_proximity,
                status = 'approved';
        ELSIF p_status = 'revoked' THEN
            UPDATE public.vendors
               SET status = 'revoked'
             WHERE id = v_user_id;
        END IF;
    END IF;

    UPDATE public.vendor_applications
       SET status = p_status,
           admin_notes = p_admin_notes,
           reviewed_at = now()
     WHERE id = p_application_id;
     
    v_actual_admin_id := COALESCE(auth.uid(), p_admin_id);
    v_actual_admin_email := COALESCE(auth.jwt() ->> 'email', p_admin_email);
    
    IF v_actual_admin_id IS NULL THEN
        RAISE EXCEPTION 'Audit logging requires an admin_id';
    END IF;

    INSERT INTO public.admin_actions (
        admin_id, admin_email, action_type, target_type, target_id, reason
    ) VALUES (
        v_actual_admin_id,
        COALESCE(v_actual_admin_email, 'unknown_admin_email'),
        p_status,
        'vendor',
        v_user_id,
        p_admin_notes
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_student_kyc_application(uuid, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_vendor_application(uuid, text, text, uuid, text) TO authenticated;

