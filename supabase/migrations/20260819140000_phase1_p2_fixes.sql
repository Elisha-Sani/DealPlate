-- Phase 1 P2 Fixes
-- handle_new_user() is SECURITY DEFINER but never pinned search_path,
-- unlike the other privileged functions in this schema — a classic
-- search-path-hijack vector if an attacker-controlled schema is ever
-- earlier in a caller's search_path. Pin it like the rest.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    NEW.raw_app_meta_data = coalesce(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "student", "account_status": "active"}'::jsonb;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
