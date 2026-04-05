-- Run this in Supabase SQL Editor
-- Fixes older users.role constraints that do not allow the "worker" role

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('citizen', 'officer', 'worker', 'admin'));
