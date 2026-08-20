-- Saved deals (favorites) — a basic marketplace feature that was missing
-- despite the deal detail page already having a decorative, non-functional
-- heart/favorite button.

CREATE TABLE IF NOT EXISTS public.saved_deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT saved_deals_unique UNIQUE (user_id, deal_id)
);

CREATE INDEX IF NOT EXISTS saved_deals_user_id_idx ON public.saved_deals(user_id);

ALTER TABLE public.saved_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved deals" ON public.saved_deals;
CREATE POLICY "Users can view their own saved deals"
ON public.saved_deals
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save deals for themselves" ON public.saved_deals;
CREATE POLICY "Users can save deals for themselves"
ON public.saved_deals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own saved deals" ON public.saved_deals;
CREATE POLICY "Users can remove their own saved deals"
ON public.saved_deals
FOR DELETE
USING (auth.uid() = user_id);
