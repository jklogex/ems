-- Script to add password_hash column and update password for admin@example.com
-- Run this in your Supabase SQL Editor

-- Step 1: Add password_hash column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Step 2: Update the password for admin@example.com
-- IMPORTANT: Replace 'YOUR_NEW_PASSWORD_HASH' with a bcrypt hash of your desired password
-- You can generate a bcrypt hash using:
-- - Online tool: https://bcrypt-generator.com/
-- - Node.js: const bcrypt = require('bcryptjs'); bcrypt.hashSync('yourpassword', 10)
-- - Or use the change-password.ts script which handles hashing automatically

-- Example: If your new password is "admin123", the hash would be something like:
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

UPDATE users 
SET password_hash = 'YOUR_NEW_PASSWORD_HASH'
WHERE email = 'admin@example.com';

-- Verify the update
SELECT id, email, name, role, 
       CASE WHEN password_hash IS NOT NULL THEN 'Password set' ELSE 'No password' END as password_status
FROM users 
WHERE email = 'admin@example.com';
