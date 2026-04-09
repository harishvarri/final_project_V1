-- Run this in the Supabase SQL Editor
-- Fixes direct browser reads/updates for the complaints table used by the frontend

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow public read access" ON public.complaints;
    DROP POLICY IF EXISTS "Allow public insert access" ON public.complaints;
    DROP POLICY IF EXISTS "Allow public update access" ON public.complaints;
    DROP POLICY IF EXISTS "complaints_insert" ON public.complaints;
    DROP POLICY IF EXISTS "complaints_read" ON public.complaints;
    DROP POLICY IF EXISTS "complaints_update" ON public.complaints;
END $$;

CREATE POLICY "complaints_insert"
ON public.complaints
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "complaints_read"
ON public.complaints
FOR SELECT
TO public
USING (true);

CREATE POLICY "complaints_update"
ON public.complaints
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
