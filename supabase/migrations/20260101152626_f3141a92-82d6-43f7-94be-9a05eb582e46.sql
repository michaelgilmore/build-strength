-- Add username column to profiles (required, unique)
ALTER TABLE public.profiles ADD COLUMN username text;

-- Set username for existing users
UPDATE public.profiles SET username = 'Mike' WHERE user_id = 'f9aae2a8-40aa-43e5-921c-0dce09556cd0';
UPDATE public.profiles SET username = 'david@goggins.com' WHERE user_id = 'c012d4ec-9701-4867-8de8-536689156149';

-- Make username required and unique
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON public.profiles (username);

-- Update the handle_new_user function to include username from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'username'
  );
  RETURN new;
END;
$$;