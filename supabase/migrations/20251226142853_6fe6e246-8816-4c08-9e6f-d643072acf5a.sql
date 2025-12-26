-- Add audio_url column to routine_days table
ALTER TABLE public.routine_days ADD COLUMN audio_url text;

-- Create storage bucket for routine audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('routine-audio', 'routine-audio', true);

-- Create storage policies for audio uploads
CREATE POLICY "Users can upload audio for their routines"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'routine-audio' AND
  EXISTS (
    SELECT 1 FROM routines
    WHERE routines.user_id = auth.uid()
    AND routines.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can update audio for their routines"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'routine-audio' AND
  EXISTS (
    SELECT 1 FROM routines
    WHERE routines.user_id = auth.uid()
    AND routines.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete audio for their routines"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'routine-audio' AND
  EXISTS (
    SELECT 1 FROM routines
    WHERE routines.user_id = auth.uid()
    AND routines.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Anyone can view routine audio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'routine-audio');