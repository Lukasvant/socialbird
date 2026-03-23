-- Migration: 003_storage_policies
-- Run this AFTER creating the storage buckets in Supabase dashboard:
--   1. Go to Storage > New bucket > "avatars" (public: true, max size: 2097152, allowed MIME: image/*)
--   2. Go to Storage > New bucket > "sightings" (public: true, max size: 5242880, allowed MIME: image/*)

-- Storage RLS policies for avatars bucket
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS policies for sightings bucket
CREATE POLICY "Public read sightings"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'sightings' );

CREATE POLICY "Users can upload sightings"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'sightings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own sightings"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'sightings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
