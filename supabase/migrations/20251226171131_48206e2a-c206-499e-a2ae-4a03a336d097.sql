-- Add muscles column to exercises table
ALTER TABLE public.exercises
ADD COLUMN muscles text[] DEFAULT '{}'::text[];