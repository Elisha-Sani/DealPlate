-- Lets vendors upload a profile/logo image on their Settings page.
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS logo_url text;
