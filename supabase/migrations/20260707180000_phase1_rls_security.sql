-- Phase 1 RLS Security: Global Account Status Enforcement
-- Closes the 1-hour JWT vulnerability window for revoked users

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean AS $$
BEGIN
    -- Read the account_status from JWT. 
    -- If no JWT (anonymous) or not present, defaults to 'active'.
    -- Revoked users will have 'revoked' explicitly set.
    RETURN COALESCE(current_setting('request.jwt.claim.app_metadata', true)::jsonb->>'account_status', 'active') = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Vendors
DROP POLICY IF EXISTS "Vendors can update their own profile" ON public.vendors;
CREATE POLICY "Vendors can update their own profile"
ON public.vendors
FOR ALL
USING (auth.uid() = id AND public.is_active_user())
WITH CHECK (auth.uid() = id AND public.is_active_user());

-- 2. Student Profiles
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.student_profiles;
CREATE POLICY "Users can manage their own profile"
ON public.student_profiles
FOR ALL
USING (auth.uid() = id AND public.is_active_user())
WITH CHECK (auth.uid() = id AND public.is_active_user());

-- 3. Deals
DROP POLICY IF EXISTS "Vendors can manage their own deals" ON public.deals;
CREATE POLICY "Vendors can manage their own deals"
ON public.deals
FOR ALL
USING (vendor_id = auth.uid() AND public.is_active_user())
WITH CHECK (vendor_id = auth.uid() AND public.is_active_user());

-- 4. Orders
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.is_active_user());

DROP POLICY IF EXISTS "Vendors can update orders for their deals" ON public.orders;
CREATE POLICY "Vendors can update orders for their deals"
ON public.orders
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.deals
        WHERE deals.id = orders.deal_id
          AND deals.vendor_id = auth.uid()
    ) AND public.is_active_user()
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.deals
        WHERE deals.id = orders.deal_id
          AND deals.vendor_id = auth.uid()
    ) AND public.is_active_user()
);

-- 5. Student KYC Applications
DROP POLICY IF EXISTS "Students can create their own KYC applications" ON public.student_kyc_applications;
CREATE POLICY "Students can create their own KYC applications"
ON public.student_kyc_applications
FOR INSERT
WITH CHECK (auth.uid() = student_id AND public.is_active_user());

-- 6. Vendor Applications
DROP POLICY IF EXISTS "Anyone can submit vendor applications" ON public.vendor_applications;
CREATE POLICY "Anyone can submit vendor applications"
ON public.vendor_applications
FOR INSERT
WITH CHECK (public.is_active_user());
