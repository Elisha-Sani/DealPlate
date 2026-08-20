-- Phase 1 RLS Fixes:
-- 1. is_active_user() previously read a JWT claim path that Supabase/PostgREST
--    never populates (request.jwt.claim.app_metadata), so it always fell back
--    to 'active' and revoked users were never blocked at the database layer.
-- 2. student_profiles was readable by ANY authenticated user, exposing PII
--    (full name, phone, reg number, ID document URLs) to every other student
--    and vendor. Restrict SELECT to the owner and superadmins only.

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean AS $$
BEGIN
    RETURN COALESCE((auth.jwt() -> 'app_metadata' ->> 'account_status'), 'active') = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP POLICY IF EXISTS "Student profiles viewable by authenticated users" ON public.student_profiles;

CREATE POLICY "Student profiles viewable by owner or superadmin"
ON public.student_profiles
FOR SELECT
USING (
    auth.uid() = id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
);
