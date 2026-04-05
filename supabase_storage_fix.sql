-- Run this in Supabase SQL Editor
-- Fixes complaint storage uploads for the public "complaints" bucket

INSERT INTO storage.buckets (id, name, public)
VALUES ('complaints', 'complaints', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DO $$ BEGIN
    DROP POLICY IF EXISTS "complaints_storage_public_read" ON storage.objects;
    DROP POLICY IF EXISTS "complaints_storage_public_insert" ON storage.objects;
    DROP POLICY IF EXISTS "complaints_storage_public_update" ON storage.objects;
END $$;

CREATE POLICY "complaints_storage_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'complaints');

CREATE POLICY "complaints_storage_public_insert"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'complaints');

CREATE POLICY "complaints_storage_public_update"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'complaints')
WITH CHECK (bucket_id = 'complaints');
