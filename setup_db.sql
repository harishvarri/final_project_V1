-- =============================================
-- CIVIC ISSUE MANAGEMENT SYSTEM - DATABASE SETUP
-- Run this ONCE in your Supabase SQL Editor
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================
-- 1. USERS TABLE (ROLE-BASED SYSTEM)
-- =========================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('citizen','officer','worker','admin')) DEFAULT 'citizen',
    department TEXT,
    office_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin (only once)
INSERT INTO users (email, role)
VALUES ('harishvarri0@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('citizen','officer','worker','admin'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Allow anyone to read users (needed for role check after login)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_read_for_role_check' AND tablename = 'users') THEN
        CREATE POLICY "users_read_for_role_check" ON users FOR SELECT USING (true);
    END IF;
END $$;

-- Allow inserts (for signup flow)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_insert_on_signup' AND tablename = 'users') THEN
        CREATE POLICY "users_insert_on_signup" ON users FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Allow updates (admin role assignment)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_update_roles' AND tablename = 'users') THEN
        CREATE POLICY "users_update_roles" ON users FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END $$;


-- =========================================
-- 2. COMPLAINTS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to user
    user_email TEXT,

    -- AI Classification
    image_url TEXT NOT NULL,
    category TEXT NOT NULL,
    confidence FLOAT NOT NULL,
    is_confident BOOLEAN DEFAULT true,

    -- Routing
    priority TEXT DEFAULT 'Medium',
    department TEXT NOT NULL,

    -- Location
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    location_name TEXT,

    -- Status & Workflow
    status TEXT NOT NULL DEFAULT 'submitted',
    worker_id TEXT,
    rejection_reason TEXT,

    -- Officer notes & proof
    notes TEXT,
    proof_url TEXT,

    -- Citizen feedback
    citizen_feedback TEXT,
    feedback_comment TEXT,
    feedback_submitted_at TIMESTAMP WITH TIME ZONE,

    -- Voice recordings
    citizen_voice_url TEXT,
    worker_voice_url TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE complaints ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS confidence FLOAT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_confident BOOLEAN DEFAULT true;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS latitude FLOAT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS longitude FLOAT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS worker_id TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS citizen_feedback TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS feedback_comment TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS citizen_voice_url TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS worker_voice_url TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Drop old conflicting policies if they exist, then recreate
DO $$ BEGIN
    -- Drop old-style policies if they exist
    DROP POLICY IF EXISTS "Allow public read access" ON complaints;
    DROP POLICY IF EXISTS "Allow public insert access" ON complaints;
    DROP POLICY IF EXISTS "Allow public update access" ON complaints;
    DROP POLICY IF EXISTS "complaints_insert" ON complaints;
    DROP POLICY IF EXISTS "complaints_read" ON complaints;
    DROP POLICY IF EXISTS "complaints_update" ON complaints;
END $$;

-- Create clean policies
CREATE POLICY "complaints_insert" ON complaints FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "complaints_read" ON complaints FOR SELECT USING (true);
CREATE POLICY "complaints_update" ON complaints FOR UPDATE USING (true) WITH CHECK (true);


-- =========================================
-- 3. STORAGE BUCKET (run separately if needed)
-- =========================================
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

-- Existing rows that still point to /static/uploads/... need file migration.
-- Run: python migrate_local_uploads_to_supabase.py


-- =========================================
-- DONE! Your database is ready.
-- =========================================
