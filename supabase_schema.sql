-- ==========================================
-- SUPERBASE INITIALIZATION SCRIPT
-- ==========================================

-- 1. Create User Actions Table
CREATE TABLE IF NOT EXISTS public.user_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, 
    action_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    category TEXT,
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_actions DISABLE ROW LEVEL SECURITY;

-- 2. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    age INTEGER,
    academic_class TEXT,
    prep_level TEXT,
    domain TEXT,
    journey_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies for Profiles
DROP POLICY IF EXISTS "Users can view own profile." ON public.user_profiles;
CREATE POLICY "Users can view own profile." ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.user_profiles;
CREATE POLICY "Users can update own profile." ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile." ON public.user_profiles;
CREATE POLICY "Users can insert own profile." ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Trigger to Auto-Create Profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to auth.users safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- AI GENERATION STORAGE
-- ==========================================

-- 4. Create AI Roadmaps Table
CREATE TABLE IF NOT EXISTS public.ai_roadmaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    domain TEXT NOT NULL,
    roadmap_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_roadmaps ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies for AI Roadmaps
DROP POLICY IF EXISTS "Users can view own roadmaps." ON public.ai_roadmaps;
CREATE POLICY "Users can view own roadmaps." ON public.ai_roadmaps
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own roadmaps." ON public.ai_roadmaps;
CREATE POLICY "Users can insert own roadmaps." ON public.ai_roadmaps
    FOR INSERT WITH CHECK (auth.uid() = user_id);
