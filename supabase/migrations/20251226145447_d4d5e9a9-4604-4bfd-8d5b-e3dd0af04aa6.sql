-- Add storage policies for routine-audio bucket

-- Allow authenticated users to upload audio files to their routine folders
CREATE POLICY "Users can upload routine audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'routine-audio');

-- Allow authenticated users to update their audio files
CREATE POLICY "Users can update routine audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'routine-audio');

-- Allow authenticated users to delete their audio files
CREATE POLICY "Users can delete routine audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'routine-audio');

-- Allow anyone to read audio files (bucket is public)
CREATE POLICY "Anyone can read routine audio"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'routine-audio');