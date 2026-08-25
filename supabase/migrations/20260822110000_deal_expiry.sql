-- Replaces the fake `duration_remaining` text field (hardcoded to "02:00:00"
-- at creation, never updated afterward — every reload just re-read the same
-- frozen string and restarted a fresh client-side countdown from it) with a
-- real absolute `expires_at` timestamp. Remaining time is now always
-- computed as `expires_at - now()`, which is precise and survives reloads
-- since it's anchored to wall-clock time instead of client-side state.

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Backfill existing rows with a reasonable default so the column can be
-- made NOT NULL safely.
UPDATE public.deals SET expires_at = now() + interval '2 hours' WHERE expires_at IS NULL;

ALTER TABLE public.deals ALTER COLUMN expires_at SET NOT NULL;
ALTER TABLE public.deals ALTER COLUMN expires_at SET DEFAULT (now() + interval '2 hours');

-- The old field this replaces — a static "hh:mm:ss" string hardcoded at
-- creation and never updated, which is exactly why the countdown used to
-- reset on every reload instead of reflecting real elapsed time.
ALTER TABLE public.deals DROP COLUMN IF EXISTS duration_remaining;

-- Auto-unpublish: flips is_published to false for any deal past its
-- expiry. Called opportunistically from the app (student explore load,
-- vendor dashboard/inventory load, and when a client-side countdown hits
-- zero) rather than depending solely on a scheduled job, so it takes effect
-- immediately under real traffic regardless of hosting/plan constraints.
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

-- Enforce expiry at the read layer too, so an expired deal is never visible
-- to students even in the seconds before the sweep above actually runs.
-- (Owners still see their own expired/unpublished deals via the separate
-- "Vendors can manage their own deals" policy — permissive RLS policies for
-- the same command are OR'ed together.)
DROP POLICY IF EXISTS "Deals are viewable when vendor is active" ON public.deals;
CREATE POLICY "Deals are viewable when vendor is active"
ON public.deals
FOR SELECT
USING (
    expires_at > now()
    AND EXISTS (
        SELECT 1 FROM public.vendors
        WHERE vendors.id = deals.vendor_id
          AND vendors.status = 'approved'
    )
);

-- Best-effort: schedule the sweep every minute via pg_cron if the extension
-- is available on this project's plan. If it isn't (permission denied,
-- extension not installed), this quietly no-ops instead of failing the
-- whole migration — the opportunistic application-triggered sweeps above
-- are the guaranteed mechanism regardless of plan.
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    PERFORM cron.schedule('unpublish-expired-deals', '* * * * *', 'SELECT public.unpublish_expired_deals();');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron unavailable on this project — relying on application-triggered sweeps instead.';
END $$;
