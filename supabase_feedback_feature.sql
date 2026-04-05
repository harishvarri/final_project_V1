-- Run this in Supabase SQL Editor for existing projects
-- Adds citizen feedback fields used after officer marks a complaint as resolved

ALTER TABLE complaints ADD COLUMN IF NOT EXISTS citizen_feedback TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS feedback_comment TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMP WITH TIME ZONE;
