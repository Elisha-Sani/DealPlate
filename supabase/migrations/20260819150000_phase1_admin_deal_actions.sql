-- Allow the audit log to record superadmin deal moderation actions
-- (publish/unpublish/delete), used by the new "Deals" tab in superadmin.

ALTER TABLE public.admin_actions DROP CONSTRAINT IF EXISTS admin_actions_target_type_check;
ALTER TABLE public.admin_actions ADD CONSTRAINT admin_actions_target_type_check
  CHECK (target_type IN ('student', 'vendor', 'deal'));
