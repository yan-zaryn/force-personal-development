-- Add Google OAuth fields to users table
ALTER TABLE users 
ADD COLUMN google_id TEXT UNIQUE,
ADD COLUMN picture TEXT;

-- Create index for Google ID lookups
CREATE INDEX idx_users_google_id ON users(google_id);

-- Make email field optional since we'll get it from Google
ALTER TABLE users 
ALTER COLUMN email DROP NOT NULL;

-- Add constraint to ensure either email or google_id is present
ALTER TABLE users 
ADD CONSTRAINT users_identity_check 
CHECK (email IS NOT NULL OR google_id IS NOT NULL);
