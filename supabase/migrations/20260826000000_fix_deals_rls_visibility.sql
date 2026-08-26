-- Phase 2 RLS Fixes:
-- The initial schema included a policy "Deals are viewable by everyone" USING (true).
-- This inadvertently bypassed later restrictive policies because Postgres RLS policies 
-- for the same action (SELECT) are combined with OR.
-- We drop the open policies and create a single, restrictive public SELECT policy.

DROP POLICY IF EXISTS "Deals are viewable by everyone" ON public.deals;
DROP POLICY IF EXISTS "Deals are viewable when vendor is active" ON public.deals;

-- Public read access: Deals must be published, not expired, and belong to an approved vendor.
-- Note: Vendors can still see their own unpublished deals due to the separate 
-- "Vendors can manage their own deals" policy.
CREATE POLICY "Deals are publicly viewable if published and active"
ON public.deals
FOR SELECT
USING (
    is_published = true 
    AND expires_at > now()
    AND EXISTS (
        SELECT 1 FROM public.vendors
        WHERE vendors.id = deals.vendor_id
          AND vendors.status = 'approved'
    )
);
