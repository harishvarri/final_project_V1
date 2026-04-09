-- Run this in the Supabase SQL Editor
-- Adds the missing users table required by admin/worker role flows

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'citizen',
    department TEXT,
    office_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role IN ('citizen', 'officer', 'worker', 'admin'));

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'users'
          AND policyname = 'users_read_for_role_check'
    ) THEN
        CREATE POLICY "users_read_for_role_check"
        ON public.users
        FOR SELECT
        USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'users'
          AND policyname = 'users_insert_on_signup'
    ) THEN
        CREATE POLICY "users_insert_on_signup"
        ON public.users
        FOR INSERT
        WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'users'
          AND policyname = 'users_update_roles'
    ) THEN
        CREATE POLICY "users_update_roles"
        ON public.users
        FOR UPDATE
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

INSERT INTO public.users (email, role)
VALUES ('harishvarri0@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role;
