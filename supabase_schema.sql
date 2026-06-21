-- ==========================================
-- SUPABASE INITIALIZATION & SCHEMA SCRIPT
-- ==========================================

-- 1. Create Questions Table (for JEE Mains & Advanced Dataset)
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY,
    subject TEXT,
    chapter TEXT,
    topic TEXT,
    question TEXT,
    options JSONB,
    answer INTEGER,
    explanation TEXT,
    difficulty TEXT,
    exam TEXT,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;

-- 2. Create User Actions Table (Clerk-compatible user_id)
CREATE TABLE IF NOT EXISTS public.user_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, 
    action_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    category TEXT,
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_actions DISABLE ROW LEVEL SECURITY;

-- 3. Create User Profiles Table (Clerk-compatible id)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id TEXT PRIMARY KEY, -- Clerk User ID
    full_name TEXT,
    age INTEGER,
    academic_class TEXT,
    prep_level TEXT,
    domain TEXT,
    journey_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. Create AI Roadmaps Table (Clerk-compatible user_id)
CREATE TABLE IF NOT EXISTS public.ai_roadmaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    roadmap_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_roadmaps DISABLE ROW LEVEL SECURITY;
