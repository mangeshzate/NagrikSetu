-- ==============================================================================
-- NagrikSetu Database Schema & Row-Level Security (PostgreSQL / Supabase)
-- Target: Maharashtra Student Opportunity & Civic Action Platform
-- Audited & Hardened for Production Readiness
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'ADMIN')),
    preferred_language TEXT NOT NULL DEFAULT 'mr' CHECK (preferred_language IN ('en', 'mr')),
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STUDENT PROFILES
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    education_level TEXT NOT NULL CHECK (education_level IN ('10th', '12th', 'Diploma', 'Undergraduate', 'Postgraduate')),
    current_year TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Maharashtra',
    district TEXT NOT NULL,
    income_range TEXT NOT NULL,
    income_min NUMERIC NOT NULL DEFAULT 0,
    income_max NUMERIC NOT NULL DEFAULT 9999999,
    academic_percentage NUMERIC(5, 2),
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_student_profile UNIQUE (user_id)
);

-- 3. INTERESTS
CREATE TABLE IF NOT EXISTS public.interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_mr TEXT NOT NULL
);

-- 4. USER INTERESTS
CREATE TABLE IF NOT EXISTS public.user_interests (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, interest_id)
);

-- 5. OPPORTUNITIES
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    title_mr TEXT,
    type TEXT NOT NULL CHECK (type IN ('SCHOLARSHIP', 'INTERNSHIP', 'GOVERNMENT_EXAM', 'COMPETITION', 'COURSE')),
    provider TEXT NOT NULL,
    provider_mr TEXT,
    short_description TEXT NOT NULL,
    short_description_mr TEXT,
    description TEXT NOT NULL,
    description_mr TEXT,
    official_url TEXT NOT NULL,
    application_url TEXT NOT NULL,
    deadline DATE NOT NULL,
    start_date DATE,
    state_applicability TEXT[] NOT NULL DEFAULT ARRAY['Maharashtra'],
    education_level_applicability TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    current_year_applicability TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    income_max NUMERIC DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    verification_status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW' CHECK (verification_status IN ('VERIFIED', 'NEEDS_REVIEW', 'EXPIRED', 'INACTIVE')),
    verified_at TIMESTAMPTZ,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    source_classification TEXT NOT NULL DEFAULT 'NEEDS_MANUAL_VERIFICATION' CHECK (source_classification IN ('VERIFIED_REAL_DATA', 'DEMO_DATA', 'NEEDS_MANUAL_VERIFICATION')),
    deadline_source TEXT,
    eligibility_source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ELIGIBILITY RULES
CREATE TABLE IF NOT EXISTS public.eligibility_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    operator TEXT NOT NULL CHECK (operator IN (
        'EQUALS', 'NOT_EQUALS', 'IN', 'NOT_IN', 
        'LESS_THAN', 'LESS_THAN_EQUAL', 'GREATER_THAN', 
        'GREATER_THAN_EQUAL', 'BETWEEN', 'CONTAINS', 'EXISTS'
    )),
    value JSONB NOT NULL,
    human_readable_label_en TEXT NOT NULL,
    human_readable_label_mr TEXT NOT NULL,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 1
);

-- 7. DOCUMENTS CATALOG
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_mr TEXT NOT NULL,
    description_en TEXT,
    description_mr TEXT
);

-- 8. OPPORTUNITY DOCUMENTS
CREATE TABLE IF NOT EXISTS public.opportunity_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 1,
    CONSTRAINT unique_opp_document UNIQUE (opportunity_id, document_id)
);

-- 9. JOURNEYS
CREATE TABLE IF NOT EXISTS public.journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_opportunity_journey UNIQUE (user_id, opportunity_id)
);

-- 10. JOURNEY STEPS
CREATE TABLE IF NOT EXISTS public.journey_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    title_mr TEXT,
    description TEXT NOT NULL,
    description_mr TEXT,
    position INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
    completed_at TIMESTAMPTZ,
    external_url TEXT
);

-- 11. USER DOCUMENT STATUS
CREATE TABLE IF NOT EXISTS public.user_document_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'MISSING' CHECK (status IN ('AVAILABLE', 'MISSING', 'NOT_APPLICABLE')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_document_status UNIQUE (user_id, document_id)
);

-- 12. ADDITIONAL PROFILE ANSWERS
CREATE TABLE IF NOT EXISTS public.additional_profile_answers (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, field_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON public.opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON public.opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(verification_status, active);
CREATE INDEX IF NOT EXISTS idx_eligibility_rules_opp ON public.eligibility_rules(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_journeys_user ON public.journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_steps_journey ON public.journey_steps(journey_id);

-- Helper Security Definer function to check if the current user is an Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'ADMIN'
    );
$$;

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligibility_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_document_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_profile_answers ENABLE ROW LEVEL SECURITY;

-- 1. Opportunities & Rules
CREATE POLICY "Public opportunities view" ON public.opportunities
    FOR SELECT USING (active = TRUE OR public.is_admin());

CREATE POLICY "Admin opportunities manage" ON public.opportunities
    FOR ALL USING (public.is_admin());

CREATE POLICY "Public eligibility rules view" ON public.eligibility_rules
    FOR SELECT USING (TRUE);

CREATE POLICY "Admin rules manage" ON public.eligibility_rules
    FOR ALL USING (public.is_admin());

-- 2. Documents Catalog
CREATE POLICY "Public documents view" ON public.documents
    FOR SELECT USING (TRUE);

CREATE POLICY "Admin docs manage" ON public.documents
    FOR ALL USING (public.is_admin());

CREATE POLICY "Public opp docs view" ON public.opportunity_documents
    FOR SELECT USING (TRUE);

CREATE POLICY "Admin opp docs manage" ON public.opportunity_documents
    FOR ALL USING (public.is_admin());

-- 3. Profiles: Strict Anti-Privilege Escalation
CREATE POLICY "Profiles view" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Profiles insert" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id AND (role = 'STUDENT' OR public.is_admin()));

CREATE POLICY "Profiles update" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (public.is_admin() OR role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 4. Student Profiles: Isolation per user
CREATE POLICY "Student profile select" ON public.student_profiles
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Student profile insert" ON public.student_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Student profile update" ON public.student_profiles
    FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Student profile delete" ON public.student_profiles
    FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- 5. Action Journeys: Complete Cross-Student Isolation
CREATE POLICY "Journeys select" ON public.journeys
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Journeys insert" ON public.journeys
    FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Journeys update" ON public.journeys
    FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Journeys delete" ON public.journeys
    FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- 6. Journey Steps: Scoped to Journey Owner
CREATE POLICY "Journey steps select" ON public.journey_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.journeys j 
            WHERE j.id = journey_steps.journey_id AND (j.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Journey steps update" ON public.journey_steps
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.journeys j 
            WHERE j.id = journey_steps.journey_id AND (j.user_id = auth.uid() OR public.is_admin())
        )
    );

-- 7. Document Status & Questionnaire Answers Isolation
CREATE POLICY "User doc status select" ON public.user_document_status
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "User doc status insert" ON public.user_document_status
    FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "User doc status update" ON public.user_document_status
    FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "User doc status delete" ON public.user_document_status
    FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "User answers select" ON public.additional_profile_answers
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "User answers insert" ON public.additional_profile_answers
    FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "User answers update" ON public.additional_profile_answers
    FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "User answers delete" ON public.additional_profile_answers
    FOR DELETE USING (user_id = auth.uid() OR public.is_admin());
