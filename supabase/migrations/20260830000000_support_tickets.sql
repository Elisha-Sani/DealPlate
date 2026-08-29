-- Migration: Support Tickets Table & RLS Policies

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role text NOT NULL,
    user_name text NOT NULL,
    user_email text NOT NULL,
    subject text NOT NULL,
    category text NOT NULL DEFAULT 'general',
    message text NOT NULL,
    status text NOT NULL DEFAULT 'open',
    admin_notes text,
    resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT support_tickets_user_role_check
        CHECK (user_role IN ('student', 'vendor')),
    CONSTRAINT support_tickets_status_check
        CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    CONSTRAINT support_tickets_category_check
        CHECK (category IN ('general', 'order_issue', 'payment_mpesa', 'account_verification', 'listing_inventory', 'technical_bug', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_role ON public.support_tickets(user_role);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own support tickets
DROP POLICY IF EXISTS "support_tickets_insert_authenticated" ON public.support_tickets;
CREATE POLICY "support_tickets_insert_authenticated"
    ON public.support_tickets
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can select their own support tickets
DROP POLICY IF EXISTS "support_tickets_select_own" ON public.support_tickets;
CREATE POLICY "support_tickets_select_own"
    ON public.support_tickets
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin')
    );

-- Policy: Superadmin can update all support tickets
DROP POLICY IF EXISTS "support_tickets_update_superadmin" ON public.support_tickets;
CREATE POLICY "support_tickets_update_superadmin"
    ON public.support_tickets
    FOR UPDATE
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin');

-- Policy: Superadmin can delete support tickets
DROP POLICY IF EXISTS "support_tickets_delete_superadmin" ON public.support_tickets;
CREATE POLICY "support_tickets_delete_superadmin"
    ON public.support_tickets
    FOR DELETE
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin');
