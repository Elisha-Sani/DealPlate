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
        CHECK (status IN ('pending_review', 'approved', 'suspended')),
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
    duration_remaining text NOT NULL DEFAULT '00:00:00',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT deals_prices_check
        CHECK (original_price > 0 AND deal_price > 0 AND deal_price <= original_price),
    CONSTRAINT deals_discount_percentage_check
        CHECK (discount_percentage BETWEEN 0 AND 100),
    CONSTRAINT deals_stock_count_check
        CHECK (stock_count >= 0),
    CONSTRAINT deals_duration_remaining_check
        CHECK (duration_remaining ~ '^[0-9]{2}:[0-9]{2}:[0-9]{2}$')
);

CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
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

CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1
        FROM public.deals
        WHERE deals.id = orders.deal_id
          AND deals.vendor_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors can update orders for their deals"
ON public.orders
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.deals
        WHERE deals.id = orders.deal_id
          AND deals.vendor_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.deals
        WHERE deals.id = orders.deal_id
          AND deals.vendor_id = auth.uid()
    )
);

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
        CHECK (status IN ('pending_review', 'approved', 'rejected')),
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
        CHECK (status IN ('pending_review', 'approved', 'rejected')),
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

CREATE OR REPLACE FUNCTION public.review_student_kyc_application(
    p_application_id uuid,
    p_status text,
    p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id uuid;
BEGIN
    IF auth.role() != 'service_role' AND (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'superadmin' THEN
        RAISE EXCEPTION 'Access denied: superadmin role required';
    END IF;

    IF p_status NOT IN ('approved', 'rejected') THEN
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
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_vendor_application(
    p_application_id uuid,
    p_status text,
    p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_app public.vendor_applications%ROWTYPE;
    v_user_id uuid;
BEGIN
    IF auth.role() != 'service_role' AND (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'superadmin' THEN
        RAISE EXCEPTION 'Access denied: superadmin role required';
    END IF;

    IF p_status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid vendor review status: %', p_status;
    END IF;

    SELECT * INTO v_app
      FROM public.vendor_applications
     WHERE id = p_application_id;

    IF v_app.id IS NULL THEN
        RAISE EXCEPTION 'Vendor application not found.';
    END IF;

    IF p_status = 'approved' THEN
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
            INSERT INTO public.vendors (
                id,
                business_name,
                contact_name,
                email,
                phone,
                address,
                campus_proximity,
                status
            )
            VALUES (
                v_user_id,
                v_app.business_name,
                v_app.contact_name,
                v_app.email,
                v_app.phone,
                v_app.address,
                v_app.campus_proximity,
                'approved'
            )
            ON CONFLICT (id) DO UPDATE
            SET business_name = EXCLUDED.business_name,
                contact_name = EXCLUDED.contact_name,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                address = EXCLUDED.address,
                campus_proximity = EXCLUDED.campus_proximity,
                status = 'approved';
        END IF;
    END IF;

    UPDATE public.vendor_applications
       SET status = p_status,
           admin_notes = p_admin_notes,
           reviewed_at = now()
     WHERE id = p_application_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_student_kyc_application(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_vendor_application(uuid, text, text) TO authenticated;



