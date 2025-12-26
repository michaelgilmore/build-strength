-- Add reps column to exercises table (default reps per set)
ALTER TABLE public.exercises ADD COLUMN reps integer NOT NULL DEFAULT 10;

-- Add reps column to workout_logs table (actual reps performed)
ALTER TABLE public.workout_logs ADD COLUMN reps integer NOT NULL DEFAULT 10;