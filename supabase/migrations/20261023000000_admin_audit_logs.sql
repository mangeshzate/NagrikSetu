-- ==============================================================================
-- NagrikSetu Database Migration: Admin Audit Logging & Safe Deletion
-- Ensures privacy-conscious tracking of destructive admin operations
-- ==============================================================================

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN (
        'OPPORTUNITY_CREATED', 
        'OPPORTUNITY_UPDATED', 
        'OPPORTUNITY_ARCHIVED', 
        'OPPORTUNITY_DELETED', 
        'STUDENT_DELETED'
    )),
    target_resource_type TEXT NOT NULL CHECK (target_resource_type IN ('OPPORTUNITY', 'STUDENT_USER', 'DOCUMENT')),
    target_resource_id TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_resource_type, target_resource_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Admins can view audit logs
CREATE POLICY "Admins can select audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

-- Only Admins can insert audit logs
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (public.is_admin());

-- Nobody can update or delete audit logs (immutable security audit trail)
-- No UPDATE or DELETE policies are granted.

-- Safe student deletion procedure (PostgreSQL level)
-- Ensures an admin account cannot be deleted via the student deletion procedure
CREATE OR REPLACE FUNCTION public.delete_student_account(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_role TEXT;
BEGIN
    -- 1. Ensure the calling user is an Administrator
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can execute student deletion.';
    END IF;

    -- 2. Fetch the role of the target user
    SELECT role INTO target_role FROM public.profiles WHERE id = target_user_id;

    IF target_role IS NULL THEN
        RAISE EXCEPTION 'Target user not found.';
    END IF;

    -- 3. Reject attempts to delete admin accounts
    IF target_role = 'ADMIN' THEN
        RAISE EXCEPTION 'Security Violation: Administrator accounts cannot be deleted through student management.';
    END IF;

    -- 4. Cascade delete associated records
    DELETE FROM public.additional_profile_answers WHERE user_id = target_user_id;
    DELETE FROM public.user_document_status WHERE user_id = target_user_id;
    DELETE FROM public.user_interests WHERE user_id = target_user_id;
    DELETE FROM public.student_profiles WHERE user_id = target_user_id;
    DELETE FROM public.journeys WHERE user_id = target_user_id;
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- 5. Record audit event
    INSERT INTO public.audit_logs (admin_id, action, target_resource_type, target_resource_id, details)
    VALUES (auth.uid(), 'STUDENT_DELETED', 'STUDENT_USER', target_user_id::TEXT, jsonb_build_object('deleted_role', target_role));

    RETURN TRUE;
END;
$$;
