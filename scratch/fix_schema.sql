-- Add missing error_type columns
ALTER TABLE public.question_options ADD COLUMN IF NOT EXISTS error_type TEXT;
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS error_type TEXT;
