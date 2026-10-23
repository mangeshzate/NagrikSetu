-- ==============================================================================
-- NagrikSetu Database Migration: Production Auth, Phone Verification & Role Security
-- Ensures Supabase Auth as single source of truth, mandatory student phone verification,
-- and strict server-side anti-privilege escalation.
-- ==============================================================================

-- 1. Extend profiles to support phone verification and mobile-first authentication
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- 2. Anti-Privilege Escalation Trigger Function
-- Ensures that clients cannot update their own role to ADMIN or mark phone_verified = true without auth proof
CREATE OR REPLACE FUNCTION public.protect_profile_security()
RETURNS TRIGGER AS $$
BEGIN
    -- Only existing administrators can change roles
    IF NEW.role <> OLD.role AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Security Violation: Cannot escalate user role.';
    END IF;

    -- Non-admins cannot forge phone_verified = TRUE unless verified in auth.users
    IF NEW.phone_verified = TRUE AND OLD.phone_verified = FALSE AND NOT public.is_admin() THEN
        IF NOT EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = NEW.user_id AND phone_confirmed_at IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'Security Violation: Phone number is not confirmed by Supabase Auth.';
        END IF;
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_security ON public.profiles;
CREATE TRIGGER trg_protect_profile_security
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_security();

-- 3. Automatic Profile Provisioning & Sync from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
BEGIN
    -- Extract full name from user metadata or fallback
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        SPLIT_PART(NEW.email, '@', 1),
        'Student'
    );

    INSERT INTO public.profiles (
        user_id,
        name,
        email,
        phone,
        phone_verified,
        role,
        preferred_language,
        onboarding_completed
    )
    VALUES (
        NEW.id,
        user_name,
        NEW.email,
        NEW.phone,
        (NEW.phone_confirmed_at IS NOT NULL),
        'STUDENT', -- All self-service authentications are strictly STUDENT. ADMINs are designated server-side.
        'mr',
        FALSE
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        phone_verified = (NEW.phone_confirmed_at IS NOT NULL OR public.profiles.phone_verified),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert/update to guarantee authoritative sync
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();
