-- handle_new_user() unconditionally forced role='student' and
-- account_status='active' on every new auth.users row, via
-- `coalesce(NEW.raw_app_meta_data, '{}') || '{"role": "student", ...}'`.
-- In jsonb concatenation the right-hand side wins on key conflicts, so this
-- silently overwrote role='vendor' set moments earlier by
-- submitVendorApplication.ts's admin.createUser() call — vendors were
-- created correctly in intent, then immediately demoted to 'student' by
-- this trigger, causing middleware to bounce them out of /vendor/* routes
-- straight back to /student/explore after a successful sign-in.
--
-- Fix: only fill in role/account_status when the row doesn't already
-- specify them, so an explicitly-set role at creation time is preserved.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    NEW.raw_app_meta_data = coalesce(NEW.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
        'role', coalesce(NEW.raw_app_meta_data ->> 'role', 'student'),
        'account_status', coalesce(NEW.raw_app_meta_data ->> 'account_status', 'active')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- One-time repair: any vendor whose account was already clobbered back to
-- role='student' by the old trigger. Only touches rows that actually have
-- a vendor_status set (i.e. were genuinely created as vendors) but got
-- overwritten, so this can't accidentally promote a real student.
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "vendor"}'::jsonb
WHERE raw_app_meta_data ->> 'role' = 'student'
  AND raw_app_meta_data ->> 'vendor_status' IS NOT NULL;
