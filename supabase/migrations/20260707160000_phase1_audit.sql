-- ============================================================
-- Phase 1: Audit Logging and Revoke Functionality
-- ============================================================

-- 1. Create admin_actions table
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES auth.users(id),
    admin_email text NOT NULL,
    action_type text NOT NULL,
    target_type text NOT NULL CHECK (target_type IN ('student', 'vendor')),
    target_id uuid NOT NULL,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enforce strict Append-Only
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin can select and insert audit logs" ON public.admin_actions;
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

DROP TRIGGER IF EXISTS enforce_append_only_admin_actions ON public.admin_actions;
CREATE TRIGGER enforce_append_only_admin_actions
BEFORE UPDATE OR DELETE ON public.admin_actions
FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_actions_modification();

-- 3. Modify existing constraints to allow 'revoked'
ALTER TABLE public.vendors DROP CONSTRAINT IF EXISTS vendors_status_check;
ALTER TABLE public.vendors ADD CONSTRAINT vendors_status_check CHECK (status IN ('pending_review', 'approved', 'suspended', 'revoked'));

ALTER TABLE public.vendor_applications DROP CONSTRAINT IF EXISTS vendor_applications_status_check;
ALTER TABLE public.vendor_applications ADD CONSTRAINT vendor_applications_status_check CHECK (status IN ('pending_review', 'approved', 'rejected', 'revoked'));

ALTER TABLE public.student_kyc_applications DROP CONSTRAINT IF EXISTS student_kyc_status_check;
ALTER TABLE public.student_kyc_applications ADD CONSTRAINT student_kyc_status_check CHECK (status IN ('pending_review', 'approved', 'rejected', 'revoked'));

-- 4. Update the handle_new_user trigger to inject role: 'student'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Inject role: 'student' into app_metadata automatically
    NEW.raw_app_meta_data = coalesce(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "student"}'::jsonb;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists, drop it if it does, then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Update review_student_kyc_application RPC
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
    -- Authorization check (service_role or superadmin)
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
    
    -- Audit Logging
    -- Prefer auth.uid() if called by authenticated client, otherwise use provided params (for server actions using service_role)
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

-- 6. Update review_vendor_application RPC
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
    -- Authorization check (service_role or superadmin)
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

    -- For vendors, the auth mapping is tricky if they applied without an account yet
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
     
    -- Audit Logging
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
